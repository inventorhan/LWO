import { useMemo, useCallback, useState, useEffect } from 'react'
import ExcelJS from 'exceljs'
import { n, fmtN } from '../shared/utils/common'
import { saveBlob } from '../shared/utils/saveAndShare'
import HelpHint, { HintFormula, HintNote } from '../shared/components/HelpHint'
import normalCurveImg from '../assets/normal_distribution.png'

/* 통계 함수 */
const avg = (arr) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0
const stdev = (arr) => {
  if (arr.length < 2) return 0
  const m = avg(arr)
  const s = arr.reduce((a, v) => a + (v - m) ** 2, 0) / (arr.length - 1)
  return Math.sqrt(s)
}

const excelCellText = (value) => {
  if (value == null) return ''
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  if (typeof value === 'object') {
    if (value.text) return value.text
    if (value.result != null) return String(value.result)
    if (value.richText) return value.richText.map(t => t.text).join('')
  }
  return String(value)
}

const excelDateText = (value) => {
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  const text = excelCellText(value).replace(/^"|"$/g, '').trim()
  if (!text) return ''
  const date = new Date(text)
  if (!Number.isNaN(date.getTime())) return date.toISOString().slice(0, 10)
  return text.slice(0, 10)
}

async function downloadStatsTemplate() {
  const workbook = new ExcelJS.Workbook()
  const ws = workbook.addWorksheet('Data')
  ws.getRow(4).values = ['', '순서', '일자', '생산량', '출하량', '재고량']
  ws.getRow(4).font = { bold: true }
  ws.addRow(['', 1, '2026-04-01', 1111, 2222, 3333])
  ws.addRow(['', 2, '2026-04-02', 1111, 2222, 3333])
  ws.addRow(['', 3, '2026-04-03', 1111, 2222, 3333])
  ws.columns = [
    { width: 4 }, { width: 10 }, { width: 16 },
    { width: 14 }, { width: 14 }, { width: 14 }
  ]
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  return saveBlob('실적 기준 작성 재고_양식.xlsx', blob, {
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    title: '실적 기준 작성 재고 양식'
  })
}

async function readStatsWorkbook(file) {
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(await file.arrayBuffer())
  const ws = workbook.worksheets[0]
  if (!ws) return []

  let headerRowNo = 0
  const colMap = {}
  ws.eachRow((row, rowNo) => {
    if (headerRowNo) return
    row.eachCell((cell, colNo) => {
      const text = excelCellText(cell.value).replace(/\s+/g, '')
      if (text === '일자') colMap.date = colNo
      if (text === '생산량') colMap.production = colNo
      if (text === '출하량') colMap.shipment = colNo
      if (text === '재고량') colMap.stock = colNo
    })
    if (colMap.date && colMap.production && colMap.shipment && colMap.stock) headerRowNo = rowNo
  })
  if (!headerRowNo) return []

  const rows = []
  for (let r = headerRowNo + 1; r <= ws.rowCount; r++) {
    const row = ws.getRow(r)
    const record = {
      date: excelDateText(row.getCell(colMap.date).value),
      production: excelCellText(row.getCell(colMap.production).value).trim(),
      shipment: excelCellText(row.getCell(colMap.shipment).value).trim(),
      stock: excelCellText(row.getCell(colMap.stock).value).trim()
    }
    if ([record.date, record.production, record.shipment, record.stock].every(v => !v)) continue
    rows.push({
      id: `inv-${Date.now()}-${r}-${Math.random().toString(36).slice(2, 6)}`,
      ...record
    })
  }
  return rows
}

/* 정규분포 + Z표 이미지 */
const NormalCurveImage = () => (
  <img src={normalCurveImg}
    alt="통계적 방법: 적정재고 = 입고량평균(μ) + 안전재고(Zσ)"
    style={{ width: '100%', maxWidth: 520, height: 'auto', display: 'block', margin: '0 auto', borderRadius: 6, userSelect: 'none' }}
    draggable={false} />
)

/* ── 관리 모달 (제품/모델 공용) ── */
function ManagerModal({ open, onClose, title, items, onAdd, onRemove, onRename, minItems = 1 }) {
  const [newName, setNewName] = useState('')
  const [editId, setEditId] = useState(null)
  const [editValue, setEditValue] = useState('')

  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [open, onClose])

  if (!open) return null

  const handleAdd = () => {
    const v = newName.trim()
    if (!v) return
    onAdd(v)
    setNewName('')
  }

  const startEdit = (name) => { setEditId(name); setEditValue(name) }
  const commitEdit = () => {
    const v = editValue.trim()
    if (v && v !== editId) onRename(editId, v)
    setEditId(null); setEditValue('')
  }

  return (
    <div className="modal-overlay" onClick={onClose} style={{ padding: 12 }}>
      <div onClick={e => e.stopPropagation()}
        style={{ background: 'white', width: '100%', maxWidth: 440, borderRadius: 12, overflow: 'hidden', boxShadow: '0 16px 48px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', maxHeight: 'calc(100vh - 24px)' }}>
        <div style={{ padding: '12px 16px', background: 'linear-gradient(135deg, var(--color-primary-dark), var(--color-primary))', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 800, fontSize: '0.98rem' }}>⚙ {title}</div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.3)', color: 'white', width: 30, height: 30, borderRadius: 7, fontWeight: 800, cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ padding: 16, overflowY: 'auto', flex: 1 }}>
          <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
            <input className="input-field" type="text" value={newName} placeholder="새 이름"
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAdd() }} />
            <button className="btn" onClick={handleAdd}
              style={{ height: 40, padding: '0 16px', background: '#A50034', color: 'white', fontSize: '0.85rem' }}>+ 추가</button>
          </div>

          {items.length === 0 && (
            <div style={{ textAlign: 'center', color: '#7C6E74', padding: '20px 0', fontSize: '0.88rem' }}>등록된 항목이 없습니다.</div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {items.map(name => (
              <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 10px', background: '#FBF8F9', border: '1px solid #E5DCDF', borderRadius: 6 }}>
                {editId === name ? (
                  <>
                    <input type="text" value={editValue} autoFocus
                      onChange={e => setEditValue(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') { setEditId(null); setEditValue('') } }}
                      style={{ flex: 1, padding: '6px 8px', border: '1px solid #A50034', borderRadius: 4, fontSize: '0.88rem' }} />
                    <button onClick={commitEdit} style={btnIcon('#047857')}>✓</button>
                    <button onClick={() => { setEditId(null); setEditValue('') }} style={btnIcon('#7C6E74')}>✕</button>
                  </>
                ) : (
                  <>
                    <span style={{ flex: 1, fontSize: '0.9rem', fontWeight: 600, color: '#1F1218' }}>{name}</span>
                    <button onClick={() => startEdit(name)} style={btnIcon('#A50034')} title="이름 변경">✏️</button>
                    <button
                      onClick={() => { if (items.length <= minItems) return alert(`최소 ${minItems}개는 유지해야 합니다.`); if (window.confirm(`"${name}"을(를) 삭제하시겠습니까?\n관련 데이터도 함께 삭제됩니다.`)) onRemove(name) }}
                      style={btnIcon('#B45309')} title="삭제">🗑️</button>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
const btnIcon = (color) => ({ border: 'none', background: 'transparent', color, fontSize: '1rem', cursor: 'pointer', padding: '4px 8px', borderRadius: 4 })

/* ── 일자별 라인 차트 (생산/출하/재고) ── */
function TrendChart({ records }) {
  const data = records
    .map(r => ({
      date: r.date,
      production: n(r.production),
      shipment: n(r.shipment),
      stock: n(r.stock)
    }))
    .filter(d => d.date || d.production || d.shipment || d.stock)

  if (data.length < 2) {
    return (
      <div style={{ padding: '20px 12px', textAlign: 'center', color: '#7C6E74', fontSize: '0.85rem', background: '#FAEFF2', borderRadius: 8 }}>
        📈 차트는 데이터가 2일 이상일 때 표시됩니다.
      </div>
    )
  }

  const W = 600, H = 240, PAD_L = 44, PAD_R = 14, PAD_T = 16, PAD_B = 42
  const innerW = W - PAD_L - PAD_R, innerH = H - PAD_T - PAD_B

  const allVals = data.flatMap(d => [d.production, d.shipment, d.stock]).filter(v => v > 0)
  const maxY = Math.max(1, ...allVals)
  const niceMax = Math.ceil(maxY * 1.1 / 100) * 100 || maxY * 1.1

  const x = (i) => PAD_L + (data.length === 1 ? innerW / 2 : (innerW * i) / (data.length - 1))
  const y = (v) => PAD_T + innerH - (Math.max(0, v) / niceMax) * innerH

  const pathFor = (key) => data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${x(i)},${y(d[key])}`).join(' ')

  const series = [
    { key: 'production', label: '생산량', color: '#1E40AF' },
    { key: 'shipment',   label: '출하량', color: '#A50034' },
    { key: 'stock',      label: '재고량', color: '#047857' }
  ]

  /* y축 4구간 그리드 */
  const grid = [0, 0.25, 0.5, 0.75, 1].map(t => Math.round(niceMax * t))
  /* x축 라벨: 첫·중간·마지막만 (밀집 방지) */
  const xTicks = data.length <= 8 ? data.map((_, i) => i) : [0, Math.floor(data.length / 2), data.length - 1]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 8, flexWrap: 'wrap' }}>
        {series.map(s => (
          <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.78rem', fontWeight: 700, color: '#4A4045' }}>
            <span style={{ width: 14, height: 3, background: s.color, borderRadius: 1 }} />
            {s.label}
          </div>
        ))}
      </div>
      <div style={{ overflowX: 'auto' }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', minWidth: 480, height: 'auto', display: 'block' }}>
          {/* 그리드 */}
          {grid.map((v, i) => (
            <g key={i}>
              <line x1={PAD_L} y1={y(v)} x2={W - PAD_R} y2={y(v)} stroke="#E5DCDF" strokeWidth="1" strokeDasharray={i === 0 ? '0' : '3,3'} />
              <text x={PAD_L - 6} y={y(v) + 4} textAnchor="end" fontSize="10" fill="#7C6E74">{v.toLocaleString()}</text>
            </g>
          ))}
          {/* 라인 */}
          {series.map(s => (
            <g key={s.key}>
              <path d={pathFor(s.key)} fill="none" stroke={s.color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
              {data.map((d, i) => (
                <circle key={i} cx={x(i)} cy={y(d[s.key])} r="3" fill="white" stroke={s.color} strokeWidth="1.5" />
              ))}
            </g>
          ))}
          {/* x축 */}
          <line x1={PAD_L} y1={H - PAD_B} x2={W - PAD_R} y2={H - PAD_B} stroke="#7C6E74" strokeWidth="1" />
          {xTicks.map(i => (
            <text key={i} x={x(i)} y={H - PAD_B + 16} textAnchor="middle" fontSize="10" fill="#7C6E74">
              {data[i].date || `${i + 1}일`}
            </text>
          ))}
        </svg>
      </div>
    </div>
  )
}

export default function InventoryStatistics({
  data, updateData,
  addProduct, removeProduct, renameProduct,
  addModel, removeModel, renameModel,
  setActiveProduct, setActiveModel,
  addRecord, updateRecord, removeRecord, clearRecords
}) {
  const f = data || {}
  const productList = f.productList || []
  const modelsByProduct = f.modelsByProduct || {}
  const activeProduct = f.activeProduct || ''
  const activeModel = f.activeModel || ''
  const currentModels = modelsByProduct[activeProduct] || []
  const currentKey = `${activeProduct}::${activeModel}`
  const records = (f.dataByKey?.[currentKey]?.records) || []

  const [productMgrOpen, setProductMgrOpen] = useState(false)
  const [modelMgrOpen, setModelMgrOpen] = useState(false)

  /* 통계 산출 */
  const shipArr = records.map(r => n(r.shipment)).filter(v => v > 0)
  const stockArr = records.map(r => n(r.stock)).filter(v => v > 0)

  const stats = useMemo(() => ({
    stockAvg: avg(stockArr),  stockStd: stdev(stockArr),
    stockMin: stockArr.length ? Math.min(...stockArr) : 0,
    stockMax: stockArr.length ? Math.max(...stockArr) : 0,
    shipAvg: avg(shipArr),  shipStd: stdev(shipArr),
    shipMin: shipArr.length ? Math.min(...shipArr) : 0,
    shipMax: shipArr.length ? Math.max(...shipArr) : 0
  }), [stockArr.join(','), shipArr.join(',')])  // eslint-disable-line

  const stock999 = stats.shipAvg + stats.shipStd * 3.09
  const stock995 = stats.shipAvg + stats.shipStd * 2.575
  const days999 = stats.shipAvg > 0 ? stock999 / stats.shipAvg : 0
  const days995 = stats.shipAvg > 0 ? stock995 / stats.shipAvg : 0
  const compareText = stats.stockMax === 0 ? '—'
    : stats.stockMax > stock999 ? '과잉'
      : stats.stockMax >= stock995 ? '적절'
        : '부족'

  const handleAdd = useCallback(() => addRecord(), [addRecord])
  const handleUpdate = useCallback((id, field, value) => updateRecord(id, { [field]: value }), [updateRecord])
  const handleRemove = useCallback((id) => {
    if (window.confirm('이 일자 데이터를 삭제하시겠습니까?')) removeRecord(id)
  }, [removeRecord])
  const handleImport = useCallback(async (file) => {
    if (!file || !activeProduct || !activeModel) return
    try {
      const imported = await readStatsWorkbook(file)
      if (imported.length === 0) {
        window.alert('엑셀에서 일자/생산량/출하량/재고량 컬럼을 찾지 못했습니다.')
        return
      }
      updateData({
        dataByKey: {
          ...(f.dataByKey || {}),
          [currentKey]: { records: imported }
        }
      })
    } catch (err) {
      console.error(err)
      window.alert('엑셀 파일을 읽는 중 오류가 발생했습니다.')
    }
  }, [activeProduct, activeModel, currentKey, f.dataByKey, updateData])

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <div className="module-title">실적 기준 적정 재고 산출</div>

      {/* ── 1. 통계적 방법 안내 ── */}
      <div className="section-card">
        <div className="section-title">
          통계적 방법 안내
          <HelpHint title="통계적 방법">
            <p>실제 운영 데이터(일별 생산·출하·재고)를 입력해 <b>통계적으로</b> 적정 재고를 산출합니다.</p>
            <HintFormula>{`적정 재고 = 평균 소요량 + (안전계수 × 소요량 편차)
         = 평균 출하량 + Z × 출하량 표준편차`}</HintFormula>
            <p>안전계수 Z는 목표 서비스율(품절 없이 충족할 확률)에 따라 결정됩니다.</p>
            <HintNote type="ok">데이터가 많을수록 (최소 7일, 권장 30일 이상) 결과가 더 정확해집니다.</HintNote>
          </HelpHint>
        </div>
        <div style={{ background: 'white', border: '1px solid #E5DCDF', borderRadius: 10, padding: 14, marginBottom: 12 }}>
          <NormalCurveImage />
        </div>
        <div style={{ fontSize: '0.78rem', color: '#7C6E74' }}>
          ※ 본 모듈은 <b>99.9% (Z=3.09)</b> 및 <b>99.5% (Z=2.575)</b>를 자동 산출합니다.
        </div>
      </div>

      {/* ── 2. 기초 정보 (제품/모델 선택 + 관리) ── */}
      <div className="section-card">
        <div className="section-title">
          기초 정보 — 제품 / 모델 선택
          <HelpHint title="기초 정보">
            <p>분석 대상 <b>생산 제품</b>과 <b>모델</b>을 선택합니다.</p>
            <ul style={{ paddingLeft: 18, margin: '6px 0' }}>
              <li>제품/모델별로 일자 데이터가 <b>독립 저장</b>됩니다 (다른 제품 선택해도 기존 데이터 유지)</li>
              <li>각 옆의 <b>관리</b> 버튼으로 추가/이름변경/삭제</li>
              <li>모델 목록은 선택된 제품에 따라 자동으로 변경됩니다</li>
            </ul>
            <HintNote type="warn">제품 또는 모델 삭제 시 해당 항목의 모든 일자 데이터가 함께 삭제됩니다.</HintNote>
          </HelpHint>
        </div>
        <div className="input-grid">
          <div className="input-group">
            <div className="input-label-row">
              <span className="input-label">생산 제품</span>
              <button className="mini-btn" onClick={() => setProductMgrOpen(true)}
                style={{ height: 26, padding: '0 10px', fontSize: '0.72rem', background: '#FDF2F4', color: '#A50034', border: '1px solid #E8C5CC', borderRadius: 4, fontWeight: 700, cursor: 'pointer' }}>
                ⚙ 관리
              </button>
            </div>
            <select className="input-field" value={activeProduct}
              onChange={e => setActiveProduct(e.target.value)}>
              {productList.length === 0 && <option value="">(등록된 제품 없음)</option>}
              {productList.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="input-group">
            <div className="input-label-row">
              <span className="input-label">모델</span>
              <button className="mini-btn" onClick={() => setModelMgrOpen(true)}
                disabled={!activeProduct}
                style={{ height: 26, padding: '0 10px', fontSize: '0.72rem', background: '#FDF2F4', color: '#A50034', border: '1px solid #E8C5CC', borderRadius: 4, fontWeight: 700, cursor: activeProduct ? 'pointer' : 'not-allowed', opacity: activeProduct ? 1 : 0.5 }}>
                ⚙ 관리
              </button>
            </div>
            <select className="input-field" value={activeModel}
              onChange={e => setActiveModel(e.target.value)}>
              {currentModels.length === 0 && <option value="">(등록된 모델 없음)</option>}
              {currentModels.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>
      </div>

      <ManagerModal open={productMgrOpen} onClose={() => setProductMgrOpen(false)}
        title="생산 제품 관리" items={productList}
        onAdd={addProduct} onRemove={removeProduct} onRename={renameProduct} minItems={0} />
      <ManagerModal open={modelMgrOpen} onClose={() => setModelMgrOpen(false)}
        title={`모델 관리 — ${activeProduct || ''}`} items={currentModels}
        onAdd={addModel} onRemove={removeModel} onRename={renameModel} minItems={0} />

      {/* ── 3. 일자별 입력 ── */}
      <div className="section-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
          <div className="section-title" style={{ marginBottom: 0, border: 'none', paddingBottom: 0 }}>
            일자별 실적 입력 <span className="sub-title">| 총 {records.length}일</span>
            <HelpHint title="일자별 실적 입력">
              <p>매일의 <b>생산량 · 출하량 · 재고량</b>을 기록합니다.</p>
              <ul style={{ paddingLeft: 18, margin: '6px 0' }}>
                <li><b>일자</b>: 날짜 선택 (캘린더 입력)</li>
                <li><b>생산량</b>: 그날 생산된 수량</li>
                <li><b>출하량</b>: 그날 출하된 수량 → 통계의 핵심 변수</li>
                <li><b>재고량</b>: 그날 종료 시점의 재고 수량</li>
              </ul>
              <HintNote>최소 7일, 권장 30일 이상 데이터가 모이면 산출 신뢰도가 높습니다.</HintNote>
              <HintNote type="warn">빈 값은 통계에서 자동 제외됩니다.</HintNote>
            </HelpHint>
          </div>
          <div className="action-row">
            <label className="btn btn-soft"
              style={{ height: 34, padding: '0 14px', fontSize: '0.82rem', opacity: (activeProduct && activeModel) ? 1 : 0.5, cursor: (activeProduct && activeModel) ? 'pointer' : 'not-allowed' }}>
              엑셀 일괄 입력
              <input type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                disabled={!activeProduct || !activeModel}
                style={{ display: 'none' }}
                onChange={e => { if (e.target.files?.[0]) handleImport(e.target.files[0]); e.target.value = '' }} />
            </label>
            <button className="btn btn-soft" onClick={downloadStatsTemplate}
              style={{ height: 34, padding: '0 14px', fontSize: '0.82rem' }}>엑셀 다운로드</button>
            <button className="btn" onClick={handleAdd}
              disabled={!activeProduct || !activeModel}
              style={{ height: 34, padding: '0 14px', background: '#FDF2F4', color: '#A50034', border: '1px solid #E8C5CC', fontSize: '0.82rem', opacity: (activeProduct && activeModel) ? 1 : 0.5, cursor: (activeProduct && activeModel) ? 'pointer' : 'not-allowed' }}>
              + 일자 추가
            </button>
          </div>
        </div>

        {(!activeProduct || !activeModel) && (
          <div style={{ padding: '16px 12px', textAlign: 'center', color: '#B45309', fontSize: '0.85rem', background: '#FEF3C7', borderRadius: 8 }}>
            ⚠ 제품과 모델을 먼저 선택하거나 추가해 주세요.
          </div>
        )}

        {activeProduct && activeModel && records.length === 0 && (
          <div style={{ padding: '24px 12px', textAlign: 'center', color: '#7C6E74', fontSize: '0.88rem', background: '#FAEFF2', borderRadius: 8 }}>
            <p style={{ marginBottom: 6 }}>"<b>{activeProduct}</b> / <b>{activeModel}</b>"의 데이터가 없습니다.</p>
            <p>위 <b>+ 일자 추가</b> 버튼을 눌러 시작하세요.</p>
          </div>
        )}

        {records.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', minWidth: 540 }}>
              <thead>
                <tr style={{ background: '#F4E1E7' }}>
                  <th style={thStyle}>#</th>
                  <th style={thStyle}>일자</th>
                  <th style={thStyle}>생산량</th>
                  <th style={thStyle}>출하량</th>
                  <th style={thStyle}>재고량</th>
                  <th style={thStyle}></th>
                </tr>
              </thead>
              <tbody>
                {records.map((r, idx) => (
                  <tr key={r.id} style={{ borderBottom: '1px solid #E5DCDF' }}>
                    <td style={tdStyle}>{idx + 1}</td>
                    <td style={tdStyle}><input type="date" value={r.date || ''} onChange={e => handleUpdate(r.id, 'date', e.target.value)} style={inputCell} /></td>
                    <td style={tdStyle}><input type="number" min={0} value={r.production || ''} onChange={e => handleUpdate(r.id, 'production', e.target.value)} style={inputCell} placeholder="0" /></td>
                    <td style={tdStyle}><input type="number" min={0} value={r.shipment || ''} onChange={e => handleUpdate(r.id, 'shipment', e.target.value)} style={inputCell} placeholder="0" /></td>
                    <td style={tdStyle}><input type="number" min={0} value={r.stock || ''} onChange={e => handleUpdate(r.id, 'stock', e.target.value)} style={inputCell} placeholder="0" /></td>
                    <td style={{ ...tdStyle, width: 38, textAlign: 'center' }}>
                      <button onClick={() => handleRemove(r.id)}
                        style={{ border: 'none', background: 'none', color: '#7C6E74', fontSize: '1rem', cursor: 'pointer', padding: 4 }}>🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {records.length > 0 && (
          <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
            <button className="btn" onClick={handleAdd}
              style={{ flex: 1, minWidth: 130, height: 36, background: '#FDF2F4', color: '#A50034', border: '1px solid #E8C5CC', fontSize: '0.82rem' }}>+ 일자 추가</button>
            <button className="btn"
              onClick={() => { if (window.confirm(`"${activeProduct} / ${activeModel}"의 모든 일자 데이터를 삭제하시겠습니까?`)) clearRecords() }}
              style={{ flex: 1, minWidth: 130, height: 36, background: '#FEF3C7', color: '#B45309', border: '1px solid #FCD34D', fontSize: '0.82rem' }}>🗑️ 전체 삭제</button>
          </div>
        )}
      </div>

      {/* ── 4. 차트 ── */}
      {records.length > 0 && (
        <div className="section-card">
          <div className="section-title">
            📈 일자별 추이 차트
            <HelpHint title="추이 차트">
              <p>입력된 일자 데이터를 <b>꺾은선 그래프</b>로 표시합니다.</p>
              <ul style={{ paddingLeft: 18, margin: '6px 0' }}>
                <li><b>파란선</b>: 생산량</li>
                <li><b>빨간선</b>: 출하량</li>
                <li><b>초록선</b>: 재고량</li>
              </ul>
              <HintNote>데이터가 2일 이상일 때 표시됩니다.</HintNote>
            </HelpHint>
          </div>
          <TrendChart records={records} />
        </div>
      )}

      {/* ── 5. 자동 산출 ── */}
      <div className="section-card">
        <div className="section-title">
          자동 산출 — 통계
          <HelpHint title="자동 산출">
            <p>입력된 데이터로부터 자동 계산되는 <b>통계 값</b>입니다.</p>
            <HintFormula>{`평균    = AVERAGE(값)
표준편차 = STDEV(값)  ※ 표본 표준편차

99.9% 적정재고 = 평균 출하량 + 출하량 표편 × 3.09
99.5% 적정재고 = 평균 출하량 + 출하량 표편 × 2.575
재고 일수      = 적정 재고 ÷ 평균 출하량      [일]`}</HintFormula>
            <HintNote>빈 값은 자동 제외 — 데이터가 부족하면 일부 통계가 0으로 표시됩니다.</HintNote>
          </HelpHint>
        </div>

        <div className="inv-section-label">📦 재고량 통계</div>
        <div className="input-grid">
          <div className="result-box tone-slate"><span className="result-box__label">평균 재고</span><span className="result-box__value">{fmtN(stats.stockAvg, '대', 0)}</span></div>
          <div className="result-box tone-slate"><span className="result-box__label">표준편차</span><span className="result-box__value">{fmtN(stats.stockStd, '', 1)}</span></div>
          <div className="result-box tone-slate"><span className="result-box__label">Min</span><span className="result-box__value">{fmtN(stats.stockMin, '대', 0)}</span></div>
          <div className="result-box tone-slate"><span className="result-box__label">Max</span><span className="result-box__value">{fmtN(stats.stockMax, '대', 0)}</span></div>
        </div>

        <div className="inv-section-label" style={{ marginTop: 14 }}>🚚 출하량 통계</div>
        <div className="input-grid">
          <div className="result-box tone-slate"><span className="result-box__label">평균 출하량</span><span className="result-box__value">{fmtN(stats.shipAvg, '대/일', 0)}</span></div>
          <div className="result-box tone-slate"><span className="result-box__label">표준편차</span><span className="result-box__value">{fmtN(stats.shipStd, '', 1)}</span></div>
          <div className="result-box tone-slate"><span className="result-box__label">Min</span><span className="result-box__value">{fmtN(stats.shipMin, '대', 0)}</span></div>
          <div className="result-box tone-slate"><span className="result-box__label">Max</span><span className="result-box__value">{fmtN(stats.shipMax, '대', 0)}</span></div>

          <div className="result-box full-width tone-final" style={{ padding: '14px 16px' }}>
            <span className="result-box__label" style={{ fontSize: '0.85rem' }}>⭐ 99.9% 적정 재고 = 평균 + 표편 × 3.09</span>
            <span className="result-box__value" style={{ fontSize: '1.4rem' }}>
              {fmtN(stock999, '대', 0)}
              <span style={{ fontSize: '0.85rem', fontWeight: 600, marginLeft: 12, opacity: 0.85 }}>· 재고 일수 {days999.toFixed(1)}일</span>
            </span>
          </div>
          <div className="result-box full-width tone-final" style={{ padding: '14px 16px' }}>
            <span className="result-box__label" style={{ fontSize: '0.85rem' }}>⭐ 99.5% 적정 재고 = 평균 + 표편 × 2.575</span>
            <span className="result-box__value" style={{ fontSize: '1.4rem' }}>
              {fmtN(stock995, '대', 0)}
              <span style={{ fontSize: '0.85rem', fontWeight: 600, marginLeft: 12, opacity: 0.85 }}>· 재고 일수 {days995.toFixed(1)}일</span>
            </span>
          </div>
        </div>

        <div className="input-grid" style={{ marginTop: 12 }}>
          <div className="result-box tone-final">
            <span className="result-box__label">비교 분석</span>
            <span className="result-box__value">{compareText}</span>
          </div>
          <div className="result-box tone-slate full-width">
            <span className="result-box__label">실적 Max 재고 - 99.9% 적정 재고 비교</span>
            <span className="result-box__value">{stats.stockMax ? `${Math.round(stats.stockMax - stock999).toLocaleString()}대` : '—'}</span>
          </div>
        </div>

        <div style={{ marginTop: 12, padding: 12, background: '#FAEFF2', borderRadius: 8, fontSize: '0.78rem', color: '#4A4045', lineHeight: 1.7 }}>
          <div><strong>① 평균 소요량</strong> : 일평균 출하량 (조달기간 동안 필요한 수량의 통계적 기댓값)</div>
          <div><strong>② 안전계수 Z</strong> : 회사 서비스 수준에 따라 결정 (99.5% Z=2.575, 99.9% Z=3.09)</div>
          <div><strong>③ 소요량 편차</strong> : 출하량의 표준편차 — 들쭉날쭉한 정도를 나타냄</div>
        </div>
      </div>
    </div>
  )
}

const thStyle = { padding: '8px 10px', textAlign: 'left', color: '#6F0023', borderBottom: '2px solid #A50034', fontWeight: 800, fontSize: '0.82rem' }
const tdStyle = { padding: '4px 6px', verticalAlign: 'middle' }
const inputCell = { width: '100%', padding: '6px 8px', border: '1px solid #E5DCDF', borderRadius: 6, fontSize: '0.85rem', fontFamily: 'inherit', background: 'white', minWidth: 0 }
