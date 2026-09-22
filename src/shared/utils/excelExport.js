import ExcelJS from 'exceljs'
import { saveBlob } from './saveAndShare'
import { getGap, calcArea, n, nOr } from './common'

const headerStyle = {
  font: { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 },
  fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1565C0' } },
  alignment: { horizontal: 'center', vertical: 'middle' },
  border: {
    top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
  }
}
const subHeaderStyle = {
  font: { bold: true, color: { argb: 'FF0D47A1' }, size: 10 },
  fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFBBDEFB' } },
  alignment: { horizontal: 'left', vertical: 'middle' }
}
const labelStyle = {
  font: { bold: true, size: 10 },
  fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE3F2FD' } }
}

function styleHeaderRow(row) {
  row.eachCell(c => { c.style = headerStyle })
  row.height = 22
}
function applySubHeader(row) {
  row.eachCell(c => { c.style = subHeaderStyle })
  row.height = 20
}

const TRANSPORT_LABELS_FALLBACK = {
  worker: '작업자', cart: '대차', handcart: '손수레',
  pallet: '파렛트', agv: 'AGV', other: '기타'
}

const CARD_LABELS = {
  pick: '피킹', move: '이동', load: '로딩', unload: '언로딩', recovery: '회수'
}

export async function exportToExcel(state) {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'LWO 물류 분석 Tool'
  workbook.created = new Date()

  const transportTypes = (state.worker && state.worker.transportTypes) || {}
  const labelOf = (id) => transportTypes[id]?.label || TRANSPORT_LABELS_FALLBACK[id] || id

  /* ─── 1. 작업자 부하율 ─── */
  const ws1 = workbook.addWorksheet('1.작업자 부하율')
  ws1.columns = [
    { header: '항목', key: 'k', width: 28 },
    { header: '내용', key: 'v', width: 28 },
    { header: '비고', key: 'n', width: 28 }
  ]
  styleHeaderRow(ws1.getRow(1))

  const personnelList = state.worker?.personnelList || []
  personnelList.forEach((name) => {
    const wd = state.worker.dataByPersonnel?.[name]
    if (!wd) return
    const b = wd.basicInfo || {}
    const ms = wd.measurements || []

    ws1.addRow([])
    applySubHeader(ws1.addRow([`[ ${name} ] 기초 정보`]))
    ws1.addRows([
      ['물류 인원', b.personnel || name],
      ['운반 종류', labelOf(b.transportType)],
      ['운반 수량', b.transportQty],
      ['운반 속도(m/s)', (b.speed !== undefined && b.speed !== '' && b.speed !== null) ? b.speed : (transportTypes[b.transportType]?.speed ?? '')],
      ['부하 가중치', b.weight],
      ['총 측정 횟수', ms.length]
    ])

    let totalT = 0, moveT = 0
    ms.forEach((cy, ci) => {
      ws1.addRow([])
      applySubHeader(ws1.addRow([`[ ${name} ] ${ci + 1}회차 측정`]))
      ws1.addRow(['#', '구분', 'Start', 'End', 'Gap(초)', '추가정보']).eachCell(c => c.style = labelStyle)
      ;(cy.cards || []).forEach((card, idx) => {
        const gap = parseFloat(getGap(card.start, card.end)) || 0
        const startStr = card.start ? new Date(card.start).toLocaleTimeString('ko-KR', { hour12: false }) : ''
        const endStr   = card.end   ? new Date(card.end  ).toLocaleTimeString('ko-KR', { hour12: false }) : ''
        const extra = card.type === 'pick' ? `자재 종수: ${card.materialCount ?? ''}`
                    : card.type === 'move' ? `경유지: ${card.waypointNo ?? ''}번`
                    : card.type === 'load' ? `공정: ${card.processNo ?? ''}번` : ''
        ws1.addRow([idx + 1, CARD_LABELS[card.type] || card.type, startStr, endStr, gap, extra])
        totalT += gap
        if (card.type === 'move' || card.type === 'recovery') moveT += gap
      })
    })

    const speed = (b.speed !== undefined && b.speed !== '' && b.speed !== null)
      ? n(b.speed) : n(transportTypes[b.transportType]?.speed)
    const dist = moveT * speed
    const wTime = 3600 * (n(b.weight) || 0.8)
    /* 부하율 = 평균 1회 운반시간 × 시간당 공급횟수 ÷ 부하 가중 시간 */
    const cycleCount = ms.length || 0
    const avgCycleSec = cycleCount > 0 ? totalT / cycleCount : 0
    const supplyPerHour = nOr(b.supplyPerHour, 1)
    const hourlyBusySec = avgCycleSec * supplyPerHour
    const rate = wTime > 0 ? (hourlyBusySec / wTime) * 100 : 0

    ws1.addRow([])
    applySubHeader(ws1.addRow([`[ ${name} ] 결과`]))
    ws1.addRows([
      ['평균 1회 운반 시간(초)', avgCycleSec.toFixed(1)],
      ['시간당 공급횟수(회/h)', supplyPerHour],
      ['시간당 점유 시간(초)', hourlyBusySec.toFixed(1)],
      ['총 이동 거리(m)', dist.toFixed(1)],
      ['물류 부하율(%)', rate.toFixed(1)]
    ])

    /* 사진 삽입 */
    const photos = wd.photos || { transport: [], part: [] }
    const all = [...(photos.transport || []), ...(photos.part || [])]
    if (all.length > 0) {
      ws1.addRow([])
      applySubHeader(ws1.addRow([`[ ${name} ] 사진`]))
      const startRow = ws1.lastRow.number
      all.forEach((b64, i) => {
        try {
          const ext = b64.startsWith('data:image/jpeg') ? 'jpeg' : 'png'
          const id = workbook.addImage({ base64: b64, extension: ext })
          ws1.addImage(id, {
            tl: { col: 0, row: startRow + i * 14 + 1 },
            ext: { width: 320, height: 240 }
          })
        } catch {/* skip */}
      })
      for (let j = 0; j < all.length * 14 + 2; j++) ws1.addRow([])
    }
  })

  /* ─── 2. E/V 부하율 (호기별) ─── */
  const ws2 = workbook.addWorksheet('2.E_V 부하율')
  ws2.columns = [
    { header: '항목 / 회차', key: 'c1', width: 18 },
    { header: '내용 / #', key: 'c2', width: 12 },
    { header: '구분 / 종류', key: 'c3', width: 16 },
    { header: 'Start / 수량', key: 'c4', width: 16 },
    { header: 'End / 가로', key: 'c5', width: 16 },
    { header: 'Gap(초) / 세로', key: 'c6', width: 14 },
    { header: '추가정보 / 면적', key: 'c7', width: 22 }
  ]
  styleHeaderRow(ws2.getRow(1))
  const e = state.elevator || {}
  const dataByHogi = e.dataByHogi || {}

  Object.entries(dataByHogi).forEach(([hogiKey, h]) => {
    const eb = h.basicInfo || {}
    applySubHeader(ws2.addRow([`${hogiKey}호기 — 기초 정보`]))
    ws2.addRows([
      ['E/V 가로(m)', eb.evWidth, '', '', '', '', ''],
      ['E/V 세로(m)', eb.evDepth, '', '', '', '', ''],
      ['적재 단수', eb.stackLevel ?? 4, '', '', '', '', ''],
      ['E/V 부하 가중치', eb.weight, '', '', '', '', '']
    ])

    /* 적재 항목 목록 */
    if ((h.loadItems || []).length > 0) {
      ws2.addRow([])
      applySubHeader(ws2.addRow([`${hogiKey}호기 — 적재 항목 목록`]))
      ws2.addRow(['#', '적재 종류', '수량', '가로(m)', '세로(m)', '단위 면적(m²)', '합계 면적(m²)']).eachCell(c => c.style = labelStyle)
      h.loadItems.forEach((it, idx) => {
        const itemA = (parseFloat(it.width) || 0) * (parseFloat(it.depth) || 0)
        const qty = parseInt(it.qty) || 1
        ws2.addRow([idx + 1, it.type, qty, it.width, it.depth, itemA.toFixed(2), (itemA * qty).toFixed(2)])
      })
    }

    let evTotal = 0, evMove = 0, cycleCount = 0
    ws2.addRow([])
    applySubHeader(ws2.addRow([`${hogiKey}호기 — 측정 내역`]))
    ;(h.measurements || []).forEach((m, mi) => {
      cycleCount++
      ws2.addRow([`${mi + 1}회차`, '#', '구분', 'Start', 'End', 'Gap(초)', '추가정보']).eachCell(c => c.style = labelStyle)
      ;(m.cards || []).forEach((card, idx) => {
        const gap = parseFloat(getGap(card.start, card.end)) || 0
        const startStr = card.start ? new Date(card.start).toLocaleTimeString('ko-KR', { hour12: false }) : ''
        const endStr   = card.end   ? new Date(card.end  ).toLocaleTimeString('ko-KR', { hour12: false }) : ''
        const extra = card.type === 'load' ? `자재 종수: ${card.materialCount ?? ''}`
                    : card.type === 'move' ? `${card.floorNo ?? ''}층`
                    : card.type === 'unload' ? `공정: ${card.processNo ?? ''}공정` : ''
        ws2.addRow(['', idx + 1, CARD_LABELS[card.type] || card.type, startStr, endStr, gap, extra])
        evTotal += gap
        if (card.type === 'move') evMove += gap
      })
    })

    const evWeight = n(eb.weight) || 0.8
    /* 부하율 = 평균 1회 운반시간 × 시간당 공급횟수 ÷ 부하 가중 시간 */
    const evAvgCycle = cycleCount > 0 ? evTotal / cycleCount : 0
    const evSupply = nOr(eb.supplyPerHour, 1)
    const evHourlyBusy = evAvgCycle * evSupply
    const evRate = (3600 * evWeight) > 0 ? (evHourlyBusy / (3600 * evWeight)) * 100 : 0
    /* 적재율 */
    const evArea = (parseFloat(eb.evWidth) || 0) * (parseFloat(eb.evDepth) || 0)  // m²
    const evStackLevel = parseFloat(eb.stackLevel) || 4
    const usedArea = (h.loadItems || []).reduce((acc, it) =>
      acc + ((parseFloat(it.width) || 0) * (parseFloat(it.depth) || 0) * (parseInt(it.qty) || 0)) / evStackLevel, 0)  // m²
    const loadingRate = evArea > 0 ? (usedArea / evArea) * 100 : 0

    ws2.addRow([])
    applySubHeader(ws2.addRow([`${hogiKey}호기 — 결과`]))
    ws2.addRows([
      ['측정 회수', cycleCount, '', '', '', '', ''],
      ['총 운반 시간(초)', evTotal.toFixed(1), '', '', '', '', ''],
      ['평균 1회 운반 시간(초)', evAvgCycle.toFixed(1), '', '', '', '', ''],
      ['시간당 공급횟수(회/h)', evSupply, '', '', '', '', ''],
      ['시간당 점유 시간(초)', evHourlyBusy.toFixed(1), '', '', '', '', ''],
      ['이동 시간(초)', evMove.toFixed(1), '', '', '', '', ''],
      ['E/V 부하율(%)', evRate.toFixed(1), '', '', '', '', ''],
      ['E/V 면적(m²)', evArea.toFixed(1), '', '', '', '', ''],
      ['실 적재 면적(m²)', usedArea.toFixed(1), '', '', '', '', ''],
      ['E/V 적재율(%)', loadingRate.toFixed(1), '', '', '', '', '']
    ])

    if ((h.photos || []).length > 0) {
      ws2.addRow([])
      applySubHeader(ws2.addRow([`${hogiKey}호기 — 사진`]))
      const start = ws2.lastRow.number
      h.photos.forEach((b64, i) => {
        try {
          const ext = b64.startsWith('data:image/jpeg') ? 'jpeg' : 'png'
          const id = workbook.addImage({ base64: b64, extension: ext })
          ws2.addImage(id, { tl: { col: 0, row: start + i * 14 + 1 }, ext: { width: 320, height: 240 } })
        } catch {/* skip */}
      })
      for (let j = 0; j < h.photos.length * 14 + 2; j++) ws2.addRow([])
    }
    ws2.addRow([])
    ws2.addRow([])
  })

  /* ─── 3. 면적 효율 ─── */
  const ws3 = workbook.addWorksheet('3.면적 효율')
  ws3.columns = [
    { header: '적재종류 / 구분', key: 'c1', width: 18 },
    { header: '개수 / 가로(m)', key: 'c2', width: 14 },
    { header: '가로(m) / 세로(m)', key: 'c3', width: 14 },
    { header: '세로(m)', key: 'c4', width: 14 },
    { header: '최저높이(m)', key: 'c5', width: 14 },
    { header: '최고높이(m)', key: 'c6', width: 14 },
    { header: '최고 높이 점유율', key: 'c7', width: 16 },
    { header: '체적 손실율(%)', key: 'c8', width: 16 }
  ]
  styleHeaderRow(ws3.getRow(1))
  const ar = state.area || {}
  applySubHeader(ws3.addRow(['공장 (단위: m)']))
  const fA = calcArea(ar.factory?.width, ar.factory?.height)  /* m × m = m² */
  ws3.addRow(['공장', ar.factory?.width, ar.factory?.height, '', '', '', '', fA ? `${fA.toFixed(1)} m²` : ''])

  ;(ar.zones || []).forEach((z, i) => {
    ws3.addRow([])
    applySubHeader(ws3.addRow([`${i + 1}구역 (단위: m)`]))
    const zA = calcArea(z.width, z.height)
    ws3.addRow(['구역', z.width, z.height, '', '', '', '', zA ? `${zA.toFixed(1)} m²` : ''])
    ws3.addRow(['적재종류', '개수', '가로(m)', '세로(m)', '최저높이(m)', '최고높이(m)', '최고 높이 점유율', '체적 손실율']).eachCell(c => c.style = labelStyle)
    let usedArea = 0
    const volStats = []
    ;(z.items || []).forEach(item => {
      const ia = calcArea(item.width, item.depth)
      usedArea += (ia || 0) * (parseInt(item.qty) || 1)
      const lo = parseFloat(item.minHeight)
      const hi = parseFloat(item.maxHeight)
      const w  = parseFloat(item.volWeight) || 0.8
      let lossStr = ''
      if (!isNaN(lo) && !isNaN(hi) && hi > 0) {
        const drop = (hi - lo) * w
        const lossPct = (drop / hi) * 100
        const usedPct = ((hi - drop) / hi) * 100
        volStats.push({ lossPct, usedPct })
        lossStr = `${lossPct.toFixed(1)}%`
      }
      ws3.addRow([item.type, item.qty, item.width, item.depth, item.minHeight ?? '', item.maxHeight ?? item.height ?? '', item.volWeight ?? '', lossStr])
    })
    const eff = (zA && usedArea) ? ((usedArea / zA) * 100).toFixed(1) : '—'
    const avgVol = volStats.length > 0 ? (volStats.reduce((acc, v) => acc + v.usedPct, 0) / volStats.length).toFixed(1) : '—'
    ws3.addRow(['실사용 면적 합계(m²)', usedArea.toFixed(1), '', '', '', '', '', ''])
    ws3.addRow(['면적 효율(%)', eff !== '—' ? `${eff}%` : '—', '', '', '', '', '', ''])
    ws3.addRow(['평균 체적 사용율(%)', avgVol !== '—' ? `${avgVol}%` : '—', '', '', '', '', '', ''])
  })

  /* 면적 사진 */
  const photoStart = ws3.lastRow.number + 2
  let imgRow = photoStart
  const allAreaPhotos = []
  const factoryPhotos = Array.isArray(ar.factory?.photos) ? ar.factory.photos : (ar.factory?.photo ? [ar.factory.photo] : [])
  factoryPhotos.forEach((photo, idx) => allAreaPhotos.push({ b64: photo, label: `공장${idx + 1}` }))
  ;(ar.zones || []).forEach((z, i) => {
    if (z.photo) allAreaPhotos.push({ b64: z.photo, label: `${i + 1}구역` })
    ;(z.items || []).forEach((it, j) => {
      if (it.photo) allAreaPhotos.push({ b64: it.photo, label: `${i + 1}구역-적재${j + 1}` })
    })
  })
  if (allAreaPhotos.length > 0) {
    ws3.getRow(imgRow).values = ['사진']
    ws3.getRow(imgRow).getCell(1).style = subHeaderStyle
    allAreaPhotos.forEach((p, idx) => {
      try {
        const ext = p.b64.startsWith('data:image/jpeg') ? 'jpeg' : 'png'
        const id = workbook.addImage({ base64: p.b64, extension: ext })
        ws3.addImage(id, { tl: { col: 0, row: imgRow + idx * 14 + 1 }, ext: { width: 320, height: 240 } })
      } catch {/* skip */}
    })
  }

  /* ─── 4. 재고 보관량 ─── */
  const ws4 = workbook.addWorksheet('4.재고 보관량')
  ws4.columns = [
    { header: '항목', key: 'k', width: 32 },
    { header: '값', key: 'v', width: 18 }
  ]
  styleHeaderRow(ws4.getRow(1))
  const inv = state.inventory || {}
  const custDayProd   = n(inv.customerDayUph)   * n(inv.customerDayTime)
  const custNightProd = n(inv.customerNightUph) * n(inv.customerNightTime)
  const custDailyProd = custDayProd + custNightProd
  const selfDayProd   = n(inv.selfDayUph)       * n(inv.selfDayTime)
  const selfNightProd = n(inv.selfNightUph)     * n(inv.selfNightTime)
  const selfDailyProd = selfDayProd + selfNightProd
  const shortageRaw   = custDailyProd - selfDailyProd
  const shortageQty   = Math.abs(shortageRaw)
  const refUph = n(inv.customerDayUph)

  applySubHeader(ws4.addRow(['자사 기초 재고 — 고객 라인']))
  ws4.addRows([
    ['고객 주간 UPH', inv.customerDayUph],
    ['고객 주간 작업 시간(시간)', inv.customerDayTime],
    ['고객 야간 UPH', inv.customerNightUph],
    ['고객 야간 작업 시간(시간)', inv.customerNightTime],
    ['고객 주간 생산량(대)', custDayProd.toFixed(0)],
    ['고객 야간 생산량(대)', custNightProd.toFixed(0)],
    ['고객 일일 생산 수량(대)', custDailyProd.toFixed(0)]
  ])
  ws4.addRow([])
  applySubHeader(ws4.addRow(['자사 기초 재고 — 자사 라인']))
  ws4.addRows([
    ['자사 주간 UPH', inv.selfDayUph],
    ['자사 주간 작업 시간(시간)', inv.selfDayTime],
    ['자사 야간 UPH', inv.selfNightUph],
    ['자사 야간 작업 시간(시간)', inv.selfNightTime],
    ['자사 주간 생산량(대)', selfDayProd.toFixed(0)],
    ['자사 야간 생산량(대)', selfNightProd.toFixed(0)],
    ['자사 일일 생산 수량(대)', selfDailyProd.toFixed(0)],
    ['일일 부족/잉여 차이(대)', shortageRaw.toFixed(0)],
    ['일일 부족/잉여 절대값(대)', shortageQty.toFixed(0)]
  ])
  ws4.addRow([])
  applySubHeader(ws4.addRow(['운반 리드타임 → 수량 환산 (고객 UPH 기준)']))
  const ageingQ = (n(inv.ageingTime)         / 3600) * refUph
  const safetyQ = (n(inv.safetyStockTime)    / 3600) * refUph
  const loadQ   = (n(inv.depotLoadTime)      / 3600) * refUph
  const moveQ   = (n(inv.selfToCustomerTime) / 3600) * refUph
  const leadTimeStock = ageingQ + safetyQ + loadQ + moveQ
  ws4.addRows([
    ['숙성 시간(초)', inv.ageingTime],
    ['숙성 수량(대)', ageingQ.toFixed(0)],
    ['안심 재고 시간(초, 정책성)', inv.safetyStockTime],
    ['안심 수량(대)', safetyQ.toFixed(0)],
    ['Depot~상차 시간(초)', inv.depotLoadTime],
    ['상차 수량(대)', loadQ.toFixed(0)],
    ['자사~고객 이동 시간(초)', inv.selfToCustomerTime],
    ['이동 수량(대)', moveQ.toFixed(0)],
    ['리드타임 재고(대) = 숙성+안심+상차+이동', leadTimeStock.toFixed(0)]
  ])
  ws4.addRow([])
  applySubHeader(ws4.addRow(['고객사 운영 재고 (고객 UPH 기준)']))
  const unloadQ = (n(inv.customerDockTime)   / 3600) * refUph
  const waitQ   = (n(inv.waitTime)           / 3600) * refUph
  const safeQ   = (n(inv.customerSafetyTime) / 3600) * refUph
  const opsStock = unloadQ + waitQ + safeQ
  ws4.addRows([
    ['고객 Dock~Depot 하차 시간(초)', inv.customerDockTime],
    ['하차 수량(대)', unloadQ.toFixed(0)],
    ['대기 시간(초)', inv.waitTime],
    ['대기 수량(대)', waitQ.toFixed(0)],
    ['고객사 안전 재고 시간(초)', inv.customerSafetyTime],
    ['안전 재고 수량(대)', safeQ.toFixed(0)],
    ['고객사 운영 재고(대) = 하차+대기+안전', opsStock.toFixed(0)]
  ])
  ws4.addRow([])
  applySubHeader(ws4.addRow(['Total 적정 재고']))
  const finalStock = shortageQty + leadTimeStock + opsStock
  ws4.addRows([
    ['① 일일 부족/잉여 절대값(대)', shortageQty.toFixed(0)],
    ['② 리드타임 재고(대)', leadTimeStock.toFixed(0)],
    ['③ 고객사 운영 재고(대)', opsStock.toFixed(0)],
    ['⭐ Total 적정 재고(대) = ① 절대값+②+③', finalStock.toFixed(0)]
  ])

  /* ─── 5. AMR 산출 ─── */
  const ws5 = workbook.addWorksheet('5.AMR 대수')
  ws5.columns = [
    { header: '항목', key: 'k', width: 32 },
    { header: '값', key: 'v', width: 18 }
  ]
  styleHeaderRow(ws5.getRow(1))
  const am = state.amr || {}
  const amrItems = am.items?.length ? am.items : [{
    itemName: '',
    tactTime: am.tactTime, recycleRate: am.recycleRate, loadQty: am.loadQty,
    amrtSpeed: am.amrtSpeed, distance: am.distance,
    loadCount: am.loadCount, loadTime: am.loadTime, unloadCount: am.unloadCount, unloadTime: am.unloadTime
  }]
  const calcAmrItem = (it) => {
    const uph = n(it.tactTime) > 0 ? (3600 / n(it.tactTime)) * (n(it.recycleRate) / 100) : 0
    const runCount = n(it.loadQty) > 0 ? uph / n(it.loadQty) : 0
    const cycle = runCount > 0 ? 3600 / runCount : 0
    const round = n(it.distance) * 2
    const lSec = n(it.loadCount) * n(it.loadTime)
    const uSec = n(it.unloadCount) * n(it.unloadTime)
    const trip = n(it.amrtSpeed) > 0 ? (round / n(it.amrtSpeed)) + lSec + uSec : 0
    const baseRaw = cycle > 0 ? trip / cycle : 0
    return { uph, runCount, cycle, round, lSec, uSec, trip, baseRaw }
  }
  const amrCalcs = amrItems.map(calcAmrItem)
  const totalBaseRaw = amrCalcs.reduce((s, c) => s + c.baseRaw, 0)
  const amrMargin = n(am.operationRate) || 1.2
  const amrAdjustedRaw = totalBaseRaw * amrMargin
  const amrAdjusted = amrAdjustedRaw > 0 ? Math.ceil(amrAdjustedRaw) : 0
  const amrNeed = amrAdjusted + n(am.spare)

  amrItems.forEach((it, idx) => {
    const c = amrCalcs[idx]
    if (idx > 0) ws5.addRow([])
    applySubHeader(ws5.addRow([`[ ${it.itemName || `아이템-${idx + 1}`} ] 생산·운행`]))
    ws5.addRows([
      ['Tact Time(초)', it.tactTime],
      ['회수율(%)', it.recycleRate],
      ['장입 수량(개/회)', it.loadQty],
      ['UPH (자동)', c.uph.toFixed(1)],
      ['AMR 운행 횟수', c.runCount.toFixed(2)],
      ['AMR Cycle Time(초)', c.cycle.toFixed(1)],
      ['AMR Speed(m/s)', it.amrtSpeed],
      ['AMR 이동거리(m)', it.distance],
      ['왕복 이동거리(m)', c.round.toFixed(1)],
      ['Total 로딩 시간(초)', c.lSec.toFixed(1)],
      ['Total 언로딩 시간(초)', c.uSec.toFixed(1)],
      ['왕복 시간(초)', c.trip.toFixed(1)],
      ['AMR 원단위(대)', c.baseRaw.toFixed(2)]
    ])
  })
  ws5.addRow([])
  applySubHeader(ws5.addRow(['필요 대수 (전체 합산)']))
  ws5.addRows([
    ['총 원단위(대)', totalBaseRaw.toFixed(2)],
    ['AMR 여유율', amrMargin],
    ['Spare(대)', am.spare],
    ['여유율 적용 AMR 수량(대)', `${amrAdjustedRaw.toFixed(2)} → ${amrAdjusted}`],
    ['⭐ AMR 필요 대수(대)', amrNeed]
  ])

  /* ─── 6. 실적 기준 적정 재고 (통계 분석) ─── */
  const ws6 = workbook.addWorksheet('6.실적기준 재고')
  ws6.columns = [
    { header: '항목', key: 'k', width: 22 },
    { header: '값',   key: 'v', width: 14 },
    { header: '',     key: 'v2', width: 14 },
    { header: '',     key: 'v3', width: 14 },
    { header: '',     key: 'v4', width: 14 }
  ]
  styleHeaderRow(ws6.getRow(1))
  const ivs = state.inventoryStats || {}
  const productList = ivs.productList || []
  const modelsByProduct = ivs.modelsByProduct || {}
  const dataByKey = ivs.dataByKey || {}

  /* 통계 헬퍼 */
  const _avg = (arr) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0
  const _std = (arr) => {
    if (arr.length < 2) return 0
    const m = _avg(arr)
    return Math.sqrt(arr.reduce((a, v) => a + (v - m) ** 2, 0) / (arr.length - 1))
  }

  if (productList.length === 0) {
    ws6.addRow(['(등록된 제품/모델 없음)'])
  } else {
    productList.forEach((p, pi) => {
      const models = modelsByProduct[p] || []
      if (pi > 0) ws6.addRow([])
      applySubHeader(ws6.addRow([`■ 생산 제품: ${p}`]))

      if (models.length === 0) {
        ws6.addRow(['(등록된 모델 없음)'])
        return
      }

      models.forEach((m) => {
        const key = `${p}::${m}`
        const records = (dataByKey[key]?.records) || []
        ws6.addRow([])
        applySubHeader(ws6.addRow([`▷ 모델: ${m}`]))

        if (records.length === 0) {
          ws6.addRow(['(데이터 없음)'])
          return
        }

        /* 데이터 헤더 */
        const hdr = ws6.addRow(['일자', '생산량', '출하량', '재고량', ''])
        hdr.eachCell(c => c.style = labelStyle)

        /* 일자별 행 */
        records.forEach((r, idx) => {
          ws6.addRow([
            r.date || `${idx + 1}일`,
            n(r.production),
            n(r.shipment),
            n(r.stock),
            ''
          ])
        })

        /* 통계 */
        const prodA = records.map(r => n(r.production)).filter(v => v > 0)
        const shipA = records.map(r => n(r.shipment)).filter(v => v > 0)
        const stockA = records.map(r => n(r.stock)).filter(v => v > 0)

        const stats = {
          stockAvg: _avg(stockA), stockStd: _std(stockA),
          stockMin: stockA.length ? Math.min(...stockA) : 0,
          stockMax: stockA.length ? Math.max(...stockA) : 0,
          shipAvg: _avg(shipA), shipStd: _std(shipA),
          shipMin: shipA.length ? Math.min(...shipA) : 0,
          shipMax: shipA.length ? Math.max(...shipA) : 0,
          prodAvg: _avg(prodA)
        }
        const s999 = stats.shipAvg + stats.shipStd * 3.09
        const s995 = stats.shipAvg + stats.shipStd * 2.575
        const d999 = stats.shipAvg > 0 ? s999 / stats.shipAvg : 0
        const d995 = stats.shipAvg > 0 ? s995 / stats.shipAvg : 0

        ws6.addRow([])
        ws6.addRow(['[통계]', '재고량', '출하량', '생산량', ''])
        ws6.addRow(['평균', stats.stockAvg.toFixed(1), stats.shipAvg.toFixed(1), stats.prodAvg.toFixed(1), ''])
        ws6.addRow(['표준편차', stats.stockStd.toFixed(1), stats.shipStd.toFixed(1), '', ''])
        ws6.addRow(['Min', stats.stockMin, stats.shipMin, '', ''])
        ws6.addRow(['Max', stats.stockMax, stats.shipMax, '', ''])
        ws6.addRow([])
        ws6.addRow(['[적정 재고]', '수량(대)', '재고 일수(일)', '', ''])
        ws6.addRow(['99.9% 서비스율 (Z=3.09)', s999.toFixed(0), d999.toFixed(1), '', ''])
        ws6.addRow(['99.5% 서비스율 (Z=2.575)', s995.toFixed(0), d995.toFixed(1), '', ''])
      })
    })
  }

  /* ─── 7. 물류 적정 인원 ─── */
  const ws7 = workbook.addWorksheet('7.물류적정인원')
  ws7.columns = [
    { header: '적재 Item', key: 'itemName', width: 22 },
    { header: '적재 종류', key: 'loadType', width: 14 },
    { header: '1회 피킹(초)', key: 'pickTime', width: 14 },
    { header: '1회 언로딩(초)', key: 'unloadTime', width: 14 },
    { header: '1회 이동(초)', key: 'moveTime', width: 14 },
    { header: '1회 운반 시간(초)', key: 'transport', width: 18 },
    { header: '일 운반 횟수(회)', key: 'dailyTrips', width: 16 },
    { header: '일 운반 시간(초)', key: 'dailyTime', width: 18 },
    { header: '표준 운반 작업 시간(초)', key: 'standardTime', width: 22 },
    { header: '물류 적정 인원(명)', key: 'personnel', width: 18 }
  ]
  styleHeaderRow(ws7.getRow(1))
  const lp = state.logisticsPersonnel || {}
  const lpItems = lp.items?.length ? lp.items : [{
    itemName: 'Item-1',
    loadType: '',
    pickTime: lp.pickTime,
    unloadTime: lp.loadTime,
    distance: lp.distance,
    speed: lp.speed,
    tripsPerHour: lp.tripsPerHour,
    hoursPerDay: lp.hoursPerDay || 8,
    allowance: lp.allowance || 0.8
  }]
  let lpTotal = 0
  lpItems.forEach(item => {
    const move = n(item.speed) > 0 ? n(item.distance) / n(item.speed) : 0
    const transport = n(item.pickTime) + n(item.unloadTime) + move
    const dailyTrips = n(item.tripsPerHour) * (n(item.hoursPerDay) || 8)
    const dailyTime = transport * dailyTrips
    const standardTime = (n(item.hoursPerDay) || 8) * 3600 * (n(item.allowance) || 0.8)
    const personnel = standardTime > 0 ? dailyTime / standardTime : 0
    lpTotal += personnel
    ws7.addRow([
      item.itemName,
      item.loadType,
      n(item.pickTime),
      n(item.unloadTime),
      move.toFixed(1),
      transport.toFixed(1),
      dailyTrips.toFixed(0),
      dailyTime.toFixed(0),
      standardTime.toFixed(0),
      personnel.toFixed(2)
    ])
  })
  ws7.addRow([])
  applySubHeader(ws7.addRow(['전체 물류 적정 인원 합계']))
  ws7.addRow(['전체 물류 적정 인원(명)', lpTotal.toFixed(2)])

  /* ─── 8. 물류 창고 면적 ─── */
  const ws8 = workbook.addWorksheet('8.물류창고면적')
  const wh = state.warehouseArea || {}
  const uphItems = wh.uphItems || []
  const containerItems = wh.containerItems || []
  let whM2 = 0
  if (uphItems.length || containerItems.length) {
    ws8.columns = [
      { header: '적재 Item', key: 'c1', width: 20 },
      { header: '적재 종류', key: 'c2', width: 14 },
      { header: 'UPH', key: 'c3', width: 12 },
      { header: '작업 시간 / 일생산량', key: 'c4', width: 18 },
      { header: '수용수 / 가로개수', key: 'c5', width: 16 },
      { header: '용기 가로 / 세로개수', key: 'c6', width: 18 },
      { header: '용기 세로 / 적재단수', key: 'c7', width: 18 },
      { header: '공급포함 수량 / 용기 가로', key: 'c8', width: 22 },
      { header: '면적 여유율 / 용기 세로', key: 'c9', width: 22 },
      { header: '최종 적정 면적(m²)', key: 'c10', width: 20 }
    ]
    styleHeaderRow(ws8.getRow(1))

    if (uphItems.length) {
      applySubHeader(ws8.addRow(['[ UPH 기준 필요 면적 ]']))
      ws8.addRow(['적재 Item', '적재 종류', 'UPH', '작업 시간(h)', '수용수(개)', '용기 가로(m)', '용기 세로(m)', '공급 포함 적재수량', '면적 여유율', '최종 적정 면적(m²)']).eachCell(c => c.style = labelStyle)
      uphItems.forEach(item => {
        const dailyQty = n(item.uph) * n(item.hours)
        const dailyLoadQty = n(item.capacity) > 0 ? dailyQty / n(item.capacity) : 0
        const effectiveQty = dailyLoadQty * 1.3
        const unitArea = n(item.length) * n(item.width)
        const finalArea = effectiveQty * (unitArea * (n(item.margin) || 1))
        whM2 += finalArea
        ws8.addRow([item.itemName, item.warehouseType, n(item.uph), n(item.hours), n(item.capacity), n(item.length), n(item.width), effectiveQty.toFixed(1), n(item.margin) || 1, finalArea.toFixed(1)])
      })
    }
    if (containerItems.length) {
      if (uphItems.length) ws8.addRow([])
      applySubHeader(ws8.addRow(['[ 용기 사이즈 기준 필요 면적 ]']))
      ws8.addRow(['적재 Item', '적재 종류', 'UPH', '일 생산수량', '가로 개수', '세로 개수', '적재 단수', '용기 가로(m)', '용기 세로(m)', '필요 면적(m²)']).eachCell(c => c.style = labelStyle)
      containerItems.forEach(item => {
        const floorQty = n(item.countX) * n(item.countY)
        const unitArea = n(item.length) * n(item.width)
        const finalArea = floorQty * unitArea * (n(item.margin) || 1)
        whM2 += finalArea
        ws8.addRow([item.itemName, item.warehouseType, n(item.uph), n(item.dailyQty), n(item.countX), n(item.countY), n(item.stackLevel) || 1, n(item.length), n(item.width), finalArea.toFixed(1)])
      })
    }
    ws8.addRow([])
    applySubHeader(ws8.addRow(['Sub Total']))
    ws8.addRow(['물류 필요 면적 합계(m²)', whM2.toFixed(1)])
    ws8.addRow(['물류 필요 면적 합계(평)', (whM2 / 3.3).toFixed(1)])
  } else {
    ws8.columns = [
      { header: '제품군', key: 'category', width: 16 },
      { header: 'CMDT', key: 'cmdt', width: 16 },
      { header: '창고 유형', key: 'warehouseType', width: 14 },
      { header: '일 생산 수량', key: 'dailyQty', width: 14 },
      { header: '용기', key: 'container', width: 12 },
      { header: 'L', key: 'length', width: 10 },
      { header: 'W', key: 'width', width: 10 },
      { header: 'H', key: 'height', width: 10 },
      { header: '용기 면적(m²)', key: 'occupiedArea', width: 14 },
      { header: '적재 수량', key: 'loadQty', width: 12 },
      { header: '적재 단수', key: 'stackLevel', width: 12 },
      { header: 'Total 수량', key: 'totalLoadQty', width: 12 },
      { header: '일일 Pallet 수', key: 'dailyPallets', width: 14 },
      { header: '일일 면적(m²)', key: 'dailyArea', width: 14 },
      { header: 'DIO', key: 'dio', width: 10 },
      { header: '창고 여유율', key: 'margin', width: 12 },
      { header: '창고 면적(m²)', key: 'warehouseM2', width: 16 },
      { header: '창고 면적(평)', key: 'warehousePyeong', width: 16 }
    ]
    styleHeaderRow(ws8.getRow(1))
    const whItems = wh.items || []
    let whDailyPallets = 0, whDailyArea = 0, whPyeong = 0
    whItems.forEach(item => {
      const occupiedArea = n(item.length) * n(item.width)
      const totalLoadQty = n(item.loadQty) * (n(item.stackLevel) || 1)
      const dailyPallets = totalLoadQty > 0 ? n(item.dailyQty) / totalLoadQty : 0
      const dailyArea = occupiedArea * dailyPallets
      const warehouseM2 = dailyArea * n(item.dio) * (n(item.margin) || 1)
      const warehousePyeong = warehouseM2 / 3.3
      whDailyPallets += dailyPallets
      whDailyArea += dailyArea
      whM2 += warehouseM2
      whPyeong += warehousePyeong
      ws8.addRow([
        item.category, item.cmdt, item.warehouseType, n(item.dailyQty), item.container,
        n(item.length), n(item.width), n(item.height), occupiedArea.toFixed(2),
        n(item.loadQty), n(item.stackLevel) || 1, totalLoadQty.toFixed(0),
        dailyPallets.toFixed(0), dailyArea.toFixed(1), n(item.dio), n(item.margin) || 1,
        warehouseM2.toFixed(0), warehousePyeong.toFixed(0)
      ])
    })
    ws8.addRow([])
    applySubHeader(ws8.addRow(['Sub Total']))
    ws8.addRow(['', '', '', '', '', '', '', '', '', '', '', '', whDailyPallets.toFixed(0), whDailyArea.toFixed(0), '', '', whM2.toFixed(0), whPyeong.toFixed(0)])
  }

  /* ─── 9. 물류 자동화율 ─── */
  const ws9 = workbook.addWorksheet('9.물류자동화율')
  ws9.columns = [
    { header: '항목', key: 'k', width: 36 },
    { header: '값', key: 'v', width: 18 }
  ]
  styleHeaderRow(ws9.getRow(1))
  const auto = state.automationRate || {}
  const arTotal = n(auto.totalItems)
  const arAutomated = n(auto.automatedItems)
  const arRate = arTotal > 0 ? (arAutomated / arTotal) * 100 : 0
  const rhTotal = n(auto.rehandlingTotalItems) || arTotal
  const rhItems = n(auto.rehandlingItems)
  const rhRate = rhTotal > 0 ? (rhItems / rhTotal) * 100 : 0
  ws9.addRows([
    ['회사명', auto.companyName],
    ['측정자', auto.inspector],
    ['총 입고 Item 수', auto.totalItems],
    ['자동화 적용 Item 수', auto.automatedItems],
    ['물류 자동화율(%)', arRate.toFixed(1)],
    ['총 입고 Item 수(Re-Handling)', auto.rehandlingTotalItems || auto.totalItems],
    ['Re-Handling Item 수', auto.rehandlingItems],
    ['Re-Handling율(%)', rhRate.toFixed(1)]
  ])

  const buffer = await workbook.xlsx.writeBuffer()
  const ts = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const filename = `LWO_분석리포트_${ts}.xlsx`
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  })
  return saveBlob(filename, blob, {
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    title: 'LWO 분석 리포트'
  })
}
