import { useState } from 'react'
import ExcelJS from 'exceljs'
import { n, fmtN } from '../shared/utils/common'
import { saveBlob } from '../shared/utils/saveAndShare'
import HelpHint, { HintFormula, HintNote } from '../shared/components/HelpHint'

const LOAD_TYPES = ['RACK', '대차', '박스', 'Pallet', '기타']

const newItem = () => ({
  id: `lp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  itemName: '',
  loadType: 'RACK',
  pickTime: '',
  unloadTime: '',
  distance: '',
  speed: 1.2,
  tripsPerHour: '',
  hoursPerDay: 8,
  allowance: 0.8
})

const defaultLogisticsItem = {
  id: 'lp-default',
  itemName: '',
  loadType: 'RACK',
  pickTime: '',
  unloadTime: '',
  distance: '',
  speed: 1.2,
  tripsPerHour: '',
  hoursPerDay: 8,
  allowance: 0.8
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

const calcItem = (item) => {
  const moveTime = n(item.speed) > 0 ? n(item.distance) / n(item.speed) : 0
  const transportTime = n(item.pickTime) + n(item.unloadTime) + moveTime
  const dailyTrips = n(item.tripsPerHour) * (n(item.hoursPerDay) || 8)
  const dailyTransportTime = transportTime * dailyTrips
  const standardWorkTime = (n(item.hoursPerDay) || 8) * 3600 * (n(item.allowance) || 0.8)
  const personnel = standardWorkTime > 0 ? dailyTransportTime / standardWorkTime : 0
  return { moveTime, transportTime, dailyTrips, dailyTransportTime, standardWorkTime, personnel }
}

async function downloadTemplate() {
  const workbook = new ExcelJS.Workbook()
  const ws = workbook.addWorksheet('필요인원산출')
  ws.getRow(3).values = [
    '', '순서', '적재 Item', '적재 종류',
    '1회 피킹 시간', '1회언로딩 시간', '1회 이동거리', '1회 이동 속도',
    '1회이동 시간', '1회 운반 시간',
    '시간당 운반 횟수', '일 작업시간', '일 운반 횟수', '일 운반 시간',
    '표준작업 여유율', '표준 운반 작업 시간', '물류 적정 인원'
  ]
  ws.getRow(3).font = { bold: true }
  ws.addRow(['', 1, 'Lotte(BW)', 'RACK', 240, 180, 40, 0.6, '', '', 10, 8, '', '', 0.8, '', ''])
  ws.addRow(['', 2, 'LG chem(BW)', '대차', 240, 180, 80, 0.9, '', '', 20, 8, '', '', 0.7, '', ''])
  ws.columns = [
    { width: 4 }, { width: 8 }, { width: 20 }, { width: 12 },
    { width: 16 }, { width: 16 }, { width: 16 }, { width: 16 },
    { width: 16 }, { width: 16 }, { width: 16 }, { width: 12 },
    { width: 14 }, { width: 14 }, { width: 14 }, { width: 18 },
    { width: 14 }
  ]
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  return saveBlob('물류 필요 인원_양식.xlsx', blob, {
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    title: '물류 필요 인원 양식'
  })
}

async function readWorkbook(file) {
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
      if (text === '적재Item') colMap.itemName = colNo
      if (text === '적재종류') colMap.loadType = colNo
      if (text === '1회피킹시간') colMap.pickTime = colNo
      if (text === '1회언로딩시간' || text === '1회로딩시간') colMap.unloadTime = colNo
      if (text === '1회이동거리') colMap.distance = colNo
      if (text === '1회이동속도') colMap.speed = colNo
      if (text === '시간당운반횟수') colMap.tripsPerHour = colNo
      if (text === '일작업시간') colMap.hoursPerDay = colNo
      if (text === '표준작업여유율') colMap.allowance = colNo
    })
    if (colMap.itemName && colMap.pickTime && colMap.tripsPerHour) headerRowNo = rowNo
  })
  if (!headerRowNo) return []

  const rows = []
  for (let r = headerRowNo + 1; r <= ws.rowCount; r++) {
    const row = ws.getRow(r)
    const itemName = excelCellText(row.getCell(colMap.itemName).value).trim()
    const pickTime = excelCellText(row.getCell(colMap.pickTime).value).trim()
    if (!itemName && !pickTime) continue
    rows.push({
      id: `lp-${Date.now()}-${r}-${Math.random().toString(36).slice(2, 6)}`,
      itemName,
      loadType: excelCellText(row.getCell(colMap.loadType).value).trim() || 'RACK',
      pickTime,
      unloadTime: excelCellText(row.getCell(colMap.unloadTime).value).trim(),
      distance: excelCellText(row.getCell(colMap.distance).value).trim(),
      speed: excelCellText(row.getCell(colMap.speed).value).trim() || 1.2,
      tripsPerHour: excelCellText(row.getCell(colMap.tripsPerHour).value).trim(),
      hoursPerDay: excelCellText(row.getCell(colMap.hoursPerDay).value).trim() || 8,
      allowance: excelCellText(row.getCell(colMap.allowance).value).trim() || 0.8
    })
  }
  return rows
}

function LogisticsField({ label, children }) {
  return (
    <div className="input-group">
      <div className="input-label-row"><span className="input-label">{label}</span></div>
      {children}
    </div>
  )
}

function Result({ label, value, tone = 'slate' }) {
  return (
    <div className={`result-box full-width tone-${tone}`}>
      <span className="result-box__label">{label}</span>
      <span className="result-box__value">{value}</span>
    </div>
  )
}

export default function LogisticsPersonnel({ data, updateData }) {
  const legacy = data || {}
  const legacyItem = {
    ...defaultLogisticsItem,
    itemName: 'Item-1',
    pickTime: legacy.pickTime || '',
    unloadTime: legacy.loadTime || '',
    distance: legacy.distance || '',
    speed: legacy.speed || 1.2,
    tripsPerHour: legacy.tripsPerHour || '',
    hoursPerDay: legacy.hoursPerDay || 8,
    allowance: legacy.allowance || 0.8
  }
  const items = data?.items?.length ? data.items : [legacyItem]
  const [activeIdx, setActiveIdx] = useState(0)
  const safeIdx = Math.min(activeIdx, Math.max(0, items.length - 1))
  const active = items[safeIdx]

  const setItems = (next) => updateData({ items: typeof next === 'function' ? next(items) : next })
  const updateItem = (id, upd) => setItems(list => list.map(item => item.id === id ? { ...item, ...upd } : item))
  const addItem = () => {
    const next = [...items, { ...newItem(), itemName: `Item-${items.length + 1}` }]
    setItems(next)
    setActiveIdx(next.length - 1)
  }
  const removeItem = (id) => {
    if (window.confirm('이 Item을 삭제하시겠습니까?')) {
      if (items.length <= 1) {
        setItems([{ ...newItem(), itemName: 'Item-1' }])
        setActiveIdx(0)
      } else {
        setItems(items.filter(item => item.id !== id))
        setActiveIdx(Math.max(0, safeIdx - 1))
      }
    }
  }
  const importExcel = async (file) => {
    try {
      const imported = await readWorkbook(file)
      if (imported.length === 0) {
        window.alert('엑셀에서 물류 필요 인원 입력 컬럼을 찾지 못했습니다.')
        return
      }
      setItems(imported)
      setActiveIdx(0)
    } catch (err) {
      console.error(err)
      window.alert('엑셀 파일을 읽는 중 오류가 발생했습니다.')
    }
  }

  const calc = calcItem(active)
  const totalPersonnel = items.reduce((sum, item) => sum + calcItem(item).personnel, 0)

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <div className="module-title">물류 적정 인원 선정</div>

      <div className="section-card">
        <div className="module-action-bar">
          <div className="section-title" style={{ marginBottom: 0, border: 'none', padding: 0 }}>
            Item별 필요 인원 산출
            <HelpHint title="물류 적정 인원">
              <HintFormula>{`1회 이동 시간 = 1회 이동거리 ÷ 1회 이동속도
1회 운반 시간 = 피킹 시간 + 언로딩 시간 + 이동 시간
일 운반 시간 = 1회 운반 시간 × 시간당 운반 횟수 × 일 작업시간
표준 운반 작업 시간 = 일 작업시간 × 3600 × 표준작업 여유율
물류 적정 인원 = 일 운반 시간 ÷ 표준 운반 작업 시간`}</HintFormula>
              <HintNote>참조 엑셀의 필요인원산출 시트와 같은 컬럼 구조를 사용합니다.</HintNote>
            </HelpHint>
          </div>
          <div className="action-row">
            <label className="btn btn-soft">
              엑셀 일괄 입력
              <input type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                style={{ display: 'none' }}
                onChange={e => { if (e.target.files?.[0]) importExcel(e.target.files[0]); e.target.value = '' }} />
            </label>
            <button className="btn btn-soft" onClick={downloadTemplate}>엑셀 다운로드</button>
          </div>
        </div>

        <div className="item-tabs">
          {items.map((item, idx) => (
            <button key={item.id} className={`mini-tab ${idx === safeIdx ? 'active' : ''}`} onClick={() => setActiveIdx(idx)}>
              {item.itemName || `Item-${idx + 1}`}
            </button>
          ))}
          <button className="mini-tab add" onClick={addItem}>+ Item 추가</button>
        </div>

        {active && (
          <div className="warehouse-item">
            <div className="warehouse-item__head">
              <strong>{active.itemName || `Item-${safeIdx + 1}`}</strong>
              <button className="mini-btn" onClick={() => removeItem(active.id)}>삭제</button>
            </div>
            <div className="warehouse-flow">
              <div className="warehouse-group">
                <div className="warehouse-group__title">기초 정보</div>
                <div className="warehouse-row warehouse-row--compact">
                  <LogisticsField label="적재 Item">
                    <input className="input-field" value={active.itemName}
                      onChange={e => updateItem(active.id, { itemName: e.target.value })} placeholder="예: Lotte(BW)" />
                  </LogisticsField>
                  <LogisticsField label="적재 종류">
                    <select className="input-field" value={active.loadType}
                      onChange={e => updateItem(active.id, { loadType: e.target.value })}>
                      {LOAD_TYPES.map(v => <option key={v}>{v}</option>)}
                    </select>
                  </LogisticsField>
                </div>
              </div>

              <div className="warehouse-group">
                <div className="warehouse-group__title">1회 운반 시간 산출</div>
                <div className="warehouse-row">
                  <LogisticsField label="1회 피킹 시간(sec)">
                    <input className="input-field" type="number" min={0} value={active.pickTime}
                      onChange={e => updateItem(active.id, { pickTime: e.target.value })} />
                  </LogisticsField>
                  <LogisticsField label="1회 언로딩 시간(sec)">
                    <input className="input-field" type="number" min={0} value={active.unloadTime}
                      onChange={e => updateItem(active.id, { unloadTime: e.target.value })} />
                  </LogisticsField>
                </div>
                <div className="warehouse-row">
                  <LogisticsField label="1회 이동거리(m)">
                    <input className="input-field" type="number" min={0} value={active.distance}
                      onChange={e => updateItem(active.id, { distance: e.target.value })} />
                  </LogisticsField>
                  <LogisticsField label="1회 이동 속도(m/sec)">
                    <input className="input-field" type="number" min={0} step="0.1" value={active.speed}
                      onChange={e => updateItem(active.id, { speed: e.target.value })} />
                  </LogisticsField>
                </div>
                <Result label="1회 이동 시간 = 이동거리 ÷ 이동속도" value={fmtN(calc.moveTime, '초', 1)} tone="blue" />
                <Result label="1회 운반 시간 = 피킹 + 언로딩 + 이동" value={fmtN(calc.transportTime, '초', 1)} tone="final" />
              </div>

              <div className="warehouse-group">
                <div className="warehouse-group__title">일 운반 시간 산출</div>
                <div className="warehouse-row">
                  <LogisticsField label="시간당 운반 횟수">
                    <input className="input-field" type="number" min={0} value={active.tripsPerHour}
                      onChange={e => updateItem(active.id, { tripsPerHour: e.target.value })} />
                  </LogisticsField>
                  <LogisticsField label="일 작업 시간(h)">
                    <input className="input-field" type="number" min={0} step="0.5" value={active.hoursPerDay}
                      onChange={e => updateItem(active.id, { hoursPerDay: e.target.value })} />
                  </LogisticsField>
                </div>
                <Result label="일 운반 횟수 = 시간당 운반 횟수 × 일 작업 시간" value={fmtN(calc.dailyTrips, '회', 0)} tone="blue" />
                <Result label="일 운반 시간 = 1회 운반 시간 × 일 운반 횟수" value={fmtN(calc.dailyTransportTime, '초', 0)} tone="final" />
              </div>

              <div className="warehouse-group">
                <div className="warehouse-group__title">표준 작업 시간 산출</div>
                <LogisticsField label="표준 작업 여유율">
                  <input className="input-field" type="number" min={0} step="0.1" value={active.allowance}
                    onChange={e => updateItem(active.id, { allowance: e.target.value })} />
                </LogisticsField>
                <Result label="표준 운반 작업 시간 = 일 작업 시간 × 3600 × 표준작업 여유율" value={fmtN(calc.standardWorkTime, '초', 0)} tone="blue" />
                <Result label="최종 적정 인원 = 일 운반 시간 ÷ 표준 작업 시간" value={fmtN(calc.personnel, '명', 2)} tone="final" />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="section-card" style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', borderColor: '#334155', color: 'white' }}>
        <div className="section-title" style={{ color: 'white', borderBottomColor: 'rgba(255,255,255,0.15)' }}>Sub Total</div>
        <div className="result-box full-width tone-final">
          <span className="result-box__label">전체 물류 적정 인원</span>
          <span className="result-box__value">{fmtN(totalPersonnel, '명', 2)}</span>
        </div>
      </div>
    </div>
  )
}
