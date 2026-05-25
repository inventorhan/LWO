import { useState } from 'react'
import ExcelJS from 'exceljs'
import { n, fmtN } from '../shared/utils/common'
import { saveBlob } from '../shared/utils/saveAndShare'
import HelpHint, { HintFormula, HintNote } from '../shared/components/HelpHint'

const WAREHOUSE_TYPES = ['Rack', 'Pallet', '대차', 'BOX', '기타']

const newUphItem = () => ({
  id: `whu-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  itemName: '',
  warehouseType: 'Rack',
  uph: '',
  hours: 8,
  capacity: '',
  length: '',
  width: '',
  stackLevel: 1,
  margin: 1.2
})

const newContainerItem = () => ({
  id: `whc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  itemName: '',
  warehouseType: 'Rack',
  uph: '',
  dailyQty: '',
  countX: '',
  countY: '',
  stackLevel: 1,
  length: '',
  width: '',
  margin: 1.2
})

const defaultUphItem = {
  id: 'whu-default',
  itemName: '',
  warehouseType: 'Rack',
  uph: '',
  hours: 8,
  capacity: '',
  length: '',
  width: '',
  stackLevel: 1,
  margin: 1.2
}

const defaultContainerItem = {
  id: 'whc-default',
  itemName: '',
  warehouseType: 'Rack',
  uph: '',
  dailyQty: '',
  countX: '',
  countY: '',
  stackLevel: 1,
  length: '',
  width: '',
  margin: 1.2
}

const excelCellText = (value) => {
  if (value == null) return ''
  if (typeof value === 'object') {
    if (value.text) return value.text
    if (value.result != null) return String(value.result)
    if (value.richText) return value.richText.map(t => t.text).join('')
  }
  return String(value)
}

const calcUph = (item) => {
  const dailyQty = n(item.uph) * n(item.hours)
  const dailyLoadQty = n(item.capacity) > 0 ? dailyQty / n(item.capacity) : 0
  const unitArea = n(item.length) * n(item.width)
  const totalArea = dailyLoadQty * unitArea
  const finalArea = (n(item.stackLevel) || 1) > 0 ? (totalArea / (n(item.stackLevel) || 1)) * (n(item.margin) || 1) : 0
  return { dailyQty, dailyLoadQty, unitArea, totalArea, finalArea }
}

const calcContainer = (item) => {
  const dailyQty = n(item.dailyQty) || (n(item.uph) * 8)
  const floorQty = n(item.countX) * n(item.countY)
  const unitArea = n(item.length) * n(item.width)
  const finalArea = floorQty * unitArea * (n(item.margin) || 1)
  return { dailyQty, floorQty, unitArea, finalArea }
}

function WarehouseField({ label, children }) {
  return (
    <div className="input-group">
      <div className="input-label-row"><span className="input-label">{label}</span></div>
      {children}
    </div>
  )
}

function WarehouseResult({ label, value, tone = 'slate' }) {
  return (
    <div className={`result-box full-width tone-${tone}`}>
      <span className="result-box__label">{label}</span>
      <span className="result-box__value">{value}</span>
    </div>
  )
}

function findHeader(ws, required) {
  let headerRowNo = 0
  const colMap = {}
  ws.eachRow((row, rowNo) => {
    if (headerRowNo) return
    row.eachCell((cell, colNo) => {
      const text = excelCellText(cell.value).replace(/\s+/g, '')
      required.forEach(({ key, labels }) => {
        if (!colMap[key] && labels.includes(text)) colMap[key] = colNo
      })
    })
    if (required.every(({ key }) => colMap[key])) headerRowNo = rowNo
  })
  return { headerRowNo, colMap }
}

async function downloadTemplate(mode) {
  const workbook = new ExcelJS.Workbook()
  const ws = workbook.addWorksheet(mode === 'uph' ? '사용면적(UPH 기준)' : '사용면적(개선단계)')
  if (mode === 'uph') {
    ws.getRow(3).values = ['', '순서', '적재 Item', '적재 종류', 'UPH', '작업 시간', '일 생산수량', '수용수', '일 적재 수량', '가로', '세로', '면적', '총면적', '높이(단)', '물류 여유율', '최종 적정 면적']
    ws.addRow(['', 1, 'Lotte(BW)', 'RACK', 300, 8, '', 50, '', 1.2, 1.5, '', '', 3, 1.2, ''])
  } else {
    ws.getRow(4).values = ['', '순서', '적재 ITEM', '적재 종류', 'UPH', '일 생산수량', '가로 개수', '세로 개수', '높이', '바닥 적재 수량', '가로 길이', '세로 길이', '단위 면적', '여유율', '필요 면적(㎡)']
    ws.addRow(['', 1, 'Lotte(BW)', 'RACK', 300, 2400, 4, 4, 3, '', 1.2, 1.5, '', 1.2, ''])
  }
  ws.eachRow(row => { row.getCell(1).font = { bold: true } })
  ws.columns = Array.from({ length: 16 }, () => ({ width: 15 }))
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  return saveBlob(mode === 'uph' ? '필요면적_UPH기준_양식.xlsx' : '필요면적_용기사이즈기준_양식.xlsx', blob, {
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    title: '물류 창고 면적 양식'
  })
}

async function readWorkbook(file, mode) {
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(await file.arrayBuffer())
  const ws = workbook.worksheets.find(s => s.name.includes('사용면적')) || workbook.worksheets[0]
  if (!ws) return []

  if (mode === 'uph') {
    const required = [
      { key: 'itemName', labels: ['적재Item', '적재ITEM'] },
      { key: 'warehouseType', labels: ['적재종류'] },
      { key: 'uph', labels: ['UPH'] },
      { key: 'hours', labels: ['작업시간'] },
      { key: 'capacity', labels: ['수용수'] },
      { key: 'length', labels: ['가로'] },
      { key: 'width', labels: ['세로'] },
      { key: 'stackLevel', labels: ['높이(단)', '높이'] },
      { key: 'margin', labels: ['물류여유율', '여유율'] }
    ]
    const { headerRowNo, colMap } = findHeader(ws, required.slice(0, 5))
    if (!headerRowNo) return []
    const rows = []
    for (let r = headerRowNo + 1; r <= ws.rowCount; r++) {
      const row = ws.getRow(r)
      const itemName = excelCellText(row.getCell(colMap.itemName).value).trim()
      if (!itemName) continue
      rows.push({
        ...newUphItem(),
        id: `whu-${Date.now()}-${r}-${Math.random().toString(36).slice(2, 6)}`,
        itemName,
        warehouseType: excelCellText(row.getCell(colMap.warehouseType).value).trim() || 'Rack',
        uph: excelCellText(row.getCell(colMap.uph).value).trim(),
        hours: excelCellText(row.getCell(colMap.hours).value).trim() || 8,
        capacity: excelCellText(row.getCell(colMap.capacity).value).trim(),
        length: excelCellText(row.getCell(colMap.length || 10).value).trim(),
        width: excelCellText(row.getCell(colMap.width || 11).value).trim(),
        stackLevel: excelCellText(row.getCell(colMap.stackLevel || 14).value).trim() || 1,
        margin: excelCellText(row.getCell(colMap.margin || 15).value).trim() || 1.2
      })
    }
    return rows
  }

  const required = [
    { key: 'itemName', labels: ['적재ITEM', '적재Item'] },
    { key: 'warehouseType', labels: ['적재종류'] },
    { key: 'uph', labels: ['UPH'] },
    { key: 'dailyQty', labels: ['일생산수량'] },
    { key: 'countX', labels: ['가로개수'] },
    { key: 'countY', labels: ['세로개수'] },
    { key: 'stackLevel', labels: ['높이', '높이(단)'] },
    { key: 'length', labels: ['가로길이'] },
    { key: 'width', labels: ['세로길이'] },
    { key: 'margin', labels: ['여유율'] }
  ]
  const { headerRowNo, colMap } = findHeader(ws, required.slice(0, 5))
  if (!headerRowNo) return []
  const rows = []
  for (let r = headerRowNo + 1; r <= ws.rowCount; r++) {
    const row = ws.getRow(r)
    const itemName = excelCellText(row.getCell(colMap.itemName).value).trim()
    if (!itemName) continue
    rows.push({
      ...newContainerItem(),
      id: `whc-${Date.now()}-${r}-${Math.random().toString(36).slice(2, 6)}`,
      itemName,
      warehouseType: excelCellText(row.getCell(colMap.warehouseType).value).trim() || 'Rack',
      uph: excelCellText(row.getCell(colMap.uph).value).trim(),
      dailyQty: excelCellText(row.getCell(colMap.dailyQty).value).trim(),
      countX: excelCellText(row.getCell(colMap.countX).value).trim(),
      countY: excelCellText(row.getCell(colMap.countY || 8).value).trim(),
      stackLevel: excelCellText(row.getCell(colMap.stackLevel || 9).value).trim() || 1,
      length: excelCellText(row.getCell(colMap.length || 11).value).trim(),
      width: excelCellText(row.getCell(colMap.width || 12).value).trim(),
      margin: excelCellText(row.getCell(colMap.margin || 14).value).trim() || 1.2
    })
  }
  return rows
}

export default function WarehouseArea({ data, updateData }) {
  const mode = data?.mode || 'uph'
  const legacyItems = (data?.items || []).map((item, idx) => ({
    ...defaultUphItem,
    id: item.id || `legacy-${idx}`,
    itemName: item.cmdt || item.category || '',
    warehouseType: item.warehouseType || 'Rack',
    uph: '',
    hours: '',
    capacity: item.loadQty || '',
    length: item.length || '',
    width: item.width || '',
    stackLevel: item.stackLevel || 1,
    margin: item.margin || 1.2
  }))
  const key = mode === 'uph' ? 'uphItems' : 'containerItems'
  const fallback = mode === 'uph' ? (legacyItems.length ? legacyItems : [defaultUphItem]) : [defaultContainerItem]
  const items = data?.[key]?.length ? data[key] : fallback
  const [activeIdx, setActiveIdx] = useState(0)
  const safeIdx = Math.min(activeIdx, Math.max(0, items.length - 1))
  const active = items[safeIdx]

  const setMode = (nextMode) => {
    updateData({ mode: nextMode })
    setActiveIdx(0)
  }
  const setItems = (next) => updateData({ [key]: typeof next === 'function' ? next(items) : next })
  const updateItem = (id, upd) => setItems(list => list.map(item => item.id === id ? { ...item, ...upd } : item))
  const addItem = () => {
    const next = [...items, mode === 'uph' ? newUphItem() : newContainerItem()]
    setItems(next)
    setActiveIdx(next.length - 1)
  }
  const removeItem = (id) => {
    if (window.confirm('이 Item을 삭제하시겠습니까?')) {
      if (items.length <= 1) {
        setItems([mode === 'uph' ? newUphItem() : newContainerItem()])
        setActiveIdx(0)
      } else {
        setItems(items.filter(item => item.id !== id))
        setActiveIdx(Math.max(0, safeIdx - 1))
      }
    }
  }
  const importExcel = async (file) => {
    try {
      const imported = await readWorkbook(file, mode)
      if (imported.length === 0) {
        window.alert('엑셀에서 물류 창고 면적 입력 컬럼을 찾지 못했습니다.')
        return
      }
      setItems(imported)
      setActiveIdx(0)
    } catch (err) {
      console.error(err)
      window.alert('엑셀 파일을 읽는 중 오류가 발생했습니다.')
    }
  }

  const totals = items.reduce((sum, item) => sum + (mode === 'uph' ? calcUph(item).finalArea : calcContainer(item).finalArea), 0)
  const calc = active ? (mode === 'uph' ? calcUph(active) : calcContainer(active)) : null

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <div className="module-title">물류 창고 면적 산출</div>

      <div className="section-card">
        <div className="module-action-bar">
          <div className="section-title" style={{ marginBottom: 0, border: 'none', padding: 0 }}>
            물류 필요 면적 합계
            <HelpHint title="물류 창고 면적">
              <p>상단 기준 선택에 따라 입력 항목이 바뀌며, Item별 필요 면적을 합산합니다.</p>
              <HintFormula>{`[UPH 기준]
일 생산수량 = UPH × 작업 시간
일 적재 수량 = 일 생산수량 ÷ 수용수
단위 면적 = 가로 × 세로
최종 적정 면적 = (일 적재 수량 × 단위 면적 ÷ 높이) × 물류 여유율

[용기 사이즈 기준]
바닥 적재 수량 = 가로 개수 × 세로 개수
단위 면적 = 가로 길이 × 세로 길이
필요 면적 = 바닥 적재 수량 × 단위 면적 × 여유율`}</HintFormula>
              <HintNote>상단에서 기준을 바꾸면 입력 화면과 엑셀 양식이 함께 바뀝니다.</HintNote>
            </HelpHint>
          </div>
          <div className="action-row">
            <label className="btn btn-soft">
              엑셀 일괄 입력
              <input type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                style={{ display: 'none' }}
                onChange={e => { if (e.target.files?.[0]) importExcel(e.target.files[0]); e.target.value = '' }} />
            </label>
            <button className="btn btn-soft" onClick={() => downloadTemplate(mode)}>엑셀 다운로드</button>
          </div>
        </div>

        <div className="segmented-control" style={{ marginBottom: 12 }}>
          <button className={`segmented-btn ${mode === 'uph' ? 'active' : ''}`} onClick={() => setMode('uph')}>필요면적(UPH 기준)</button>
          <button className={`segmented-btn ${mode === 'container' ? 'active' : ''}`} onClick={() => setMode('container')}>필요면적(용기 사이즈 기준)</button>
        </div>

        <div className="result-box full-width tone-final" style={{ marginBottom: 14 }}>
          <span className="result-box__label">물류 필요 면적 합계</span>
          <span className="result-box__value">
            {fmtN(totals, ' m²', 1)}
            <span style={{ fontSize: '0.78rem', fontWeight: 600, marginLeft: 10, opacity: 0.9 }}>
              Item별 필요 면적 합산
            </span>
          </span>
        </div>

        <div className="item-tabs">
          {items.map((item, idx) => (
            <button key={item.id} className={`mini-tab ${idx === safeIdx ? 'active' : ''}`} onClick={() => setActiveIdx(idx)}>
              {item.itemName || `Item-${idx + 1}`}
            </button>
          ))}
          <button className="mini-tab add" onClick={addItem}>+ Item 추가</button>
        </div>

        {active && mode === 'uph' && (
          <div className="warehouse-item">
            <div className="warehouse-item__head">
              <strong>{active.itemName || `Item ${safeIdx + 1}`}</strong>
              <button className="mini-btn" onClick={() => removeItem(active.id)}>삭제</button>
            </div>
            <div className="warehouse-flow">
              <div className="warehouse-group">
                <div className="warehouse-group__title">일 적재 수량</div>
                <div className="warehouse-row">
                  <WarehouseField label="적재 Item">
                    <input className="input-field" value={active.itemName}
                      onChange={e => updateItem(active.id, { itemName: e.target.value })} placeholder="예: Lotte(BW)" />
                  </WarehouseField>
                  <WarehouseField label="적재 종류">
                    <select className="input-field" value={active.warehouseType}
                      onChange={e => updateItem(active.id, { warehouseType: e.target.value })}>
                      {WAREHOUSE_TYPES.map(v => <option key={v}>{v}</option>)}
                    </select>
                  </WarehouseField>
                  <WarehouseField label="UPH">
                    <input className="input-field" type="number" min={0} value={active.uph}
                      onChange={e => updateItem(active.id, { uph: e.target.value })} />
                  </WarehouseField>
                  <WarehouseField label="작업 시간">
                    <input className="input-field" type="number" min={0} value={active.hours}
                      onChange={e => updateItem(active.id, { hours: e.target.value })} />
                  </WarehouseField>
                  <WarehouseField label="수용수">
                    <input className="input-field" type="number" min={0} value={active.capacity}
                      onChange={e => updateItem(active.id, { capacity: e.target.value })} />
                  </WarehouseField>
                </div>
                <WarehouseResult label="일 생산수량 = UPH × 작업 시간" value={fmtN(calc.dailyQty, '', 0)} tone="blue" />
                <WarehouseResult label="일 적재 수량 = 일 생산수량 ÷ 수용수" value={fmtN(calc.dailyLoadQty, '', 1)} tone="final" />
              </div>
              <div className="warehouse-group">
                <div className="warehouse-group__title">최종 적정 면적</div>
                <div className="warehouse-row">
                  <WarehouseField label="가로">
                    <input className="input-field" type="number" min={0} step="0.01" value={active.length}
                      onChange={e => updateItem(active.id, { length: e.target.value })} />
                  </WarehouseField>
                  <WarehouseField label="세로">
                    <input className="input-field" type="number" min={0} step="0.01" value={active.width}
                      onChange={e => updateItem(active.id, { width: e.target.value })} />
                  </WarehouseField>
                  <WarehouseField label="높이(단)">
                    <input className="input-field" type="number" min={1} value={active.stackLevel}
                      onChange={e => updateItem(active.id, { stackLevel: e.target.value })} />
                  </WarehouseField>
                  <WarehouseField label="면적 여유율">
                    <input className="input-field" type="number" min={0} step="0.1" value={active.margin}
                      onChange={e => updateItem(active.id, { margin: e.target.value })} />
                  </WarehouseField>
                </div>
                <WarehouseResult label="단위 면적 = 가로 × 세로" value={fmtN(calc.unitArea, ' m²', 2)} tone="blue" />
                <WarehouseResult label="최종 적정 면적" value={fmtN(calc.finalArea, ' m²', 1)} tone="final" />
              </div>
            </div>
          </div>
        )}

        {active && mode === 'container' && (
          <div className="warehouse-item">
            <div className="warehouse-item__head">
              <strong>{active.itemName || `Item ${safeIdx + 1}`}</strong>
              <button className="mini-btn" onClick={() => removeItem(active.id)}>삭제</button>
            </div>
            <div className="warehouse-flow">
              <div className="warehouse-group">
                <div className="warehouse-group__title">기초 정보</div>
                <div className="warehouse-row">
                  <WarehouseField label="적재 Item">
                    <input className="input-field" value={active.itemName}
                      onChange={e => updateItem(active.id, { itemName: e.target.value })} placeholder="예: Lotte(BW)" />
                  </WarehouseField>
                  <WarehouseField label="적재 종류">
                    <select className="input-field" value={active.warehouseType}
                      onChange={e => updateItem(active.id, { warehouseType: e.target.value })}>
                      {WAREHOUSE_TYPES.map(v => <option key={v}>{v}</option>)}
                    </select>
                  </WarehouseField>
                  <WarehouseField label="UPH">
                    <input className="input-field" type="number" min={0} value={active.uph}
                      onChange={e => updateItem(active.id, { uph: e.target.value })} />
                  </WarehouseField>
                  <WarehouseField label="일 생산수량">
                    <input className="input-field" type="number" min={0} value={active.dailyQty}
                      onChange={e => updateItem(active.id, { dailyQty: e.target.value })} />
                  </WarehouseField>
                </div>
              </div>
              <div className="warehouse-group">
                <div className="warehouse-group__title">바닥 적재 수량</div>
                <div className="warehouse-row">
                  <WarehouseField label="가로 개수">
                    <input className="input-field" type="number" min={0} value={active.countX}
                      onChange={e => updateItem(active.id, { countX: e.target.value })} />
                  </WarehouseField>
                  <WarehouseField label="세로 개수">
                    <input className="input-field" type="number" min={0} value={active.countY}
                      onChange={e => updateItem(active.id, { countY: e.target.value })} />
                  </WarehouseField>
                  <WarehouseField label="높이(단)">
                    <input className="input-field" type="number" min={1} value={active.stackLevel}
                      onChange={e => updateItem(active.id, { stackLevel: e.target.value })} />
                  </WarehouseField>
                </div>
                <WarehouseResult label="바닥 적재 수량 = 가로 개수 × 세로 개수" value={fmtN(calc.floorQty, '', 0)} tone="final" />
              </div>
              <div className="warehouse-group">
                <div className="warehouse-group__title">필요 면적</div>
                <div className="warehouse-row">
                  <WarehouseField label="가로 길이">
                    <input className="input-field" type="number" min={0} step="0.01" value={active.length}
                      onChange={e => updateItem(active.id, { length: e.target.value })} />
                  </WarehouseField>
                  <WarehouseField label="세로 길이">
                    <input className="input-field" type="number" min={0} step="0.01" value={active.width}
                      onChange={e => updateItem(active.id, { width: e.target.value })} />
                  </WarehouseField>
                  <WarehouseField label="여유율">
                    <input className="input-field" type="number" min={0} step="0.1" value={active.margin}
                      onChange={e => updateItem(active.id, { margin: e.target.value })} />
                  </WarehouseField>
                </div>
                <WarehouseResult label="단위 면적 = 가로 길이 × 세로 길이" value={fmtN(calc.unitArea, ' m²', 2)} tone="blue" />
                <WarehouseResult label="필요 면적 = 바닥 적재 수량 × 단위 면적 × 여유율" value={fmtN(calc.finalArea, ' m²', 1)} tone="final" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
