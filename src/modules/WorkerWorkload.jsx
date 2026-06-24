import { useState } from 'react'
import { getGap, nOr } from '../shared/utils/common'
import TimerSection from '../shared/components/TimerSection'
import PhotoSection from '../shared/components/PhotoSection'
import HelpHint, { HintFormula, HintNote } from '../shared/components/HelpHint'

const CARD_TITLES = {
  pick:     '자재 피킹',
  move:     '이동 시간',
  load:     '로딩/언로딩',
  recovery: '회수 시간'
}

/* 회수는 PPT 요청대로 '똥색' (brown/khaki) */
const COLORS = {
  pick: '#10b981',
  move: '#3b82f6',
  load: '#f59e0b',
  recovery: '#8b6914'  /* dark khaki */
}

/* 부하 가중치 select 옵션 */
const WEIGHT_OPTIONS = [0.5, 0.6, 0.7, 0.8, 0.9, 1.0]

const METRIC_DEFS = [
  { type: 'pick', label: '피킹 시간', color: COLORS.pick },
  { type: 'move', label: '이동 시간', color: COLORS.move },
  { type: 'load', label: '로딩/언로딩 시간', color: COLORS.load },
  { type: 'recovery', label: '회수 시간', color: COLORS.recovery }
]

function avg(values) {
  const list = values.filter(v => Number.isFinite(v))
  return list.length ? list.reduce((sum, v) => sum + v, 0) / list.length : 0
}

function quartiles(values) {
  const list = values.filter(v => Number.isFinite(v)).sort((a, b) => a - b)
  if (!list.length) return { min: 0, q1: 0, med: 0, q3: 0, max: 0 }
  const pick = (p) => {
    const idx = (list.length - 1) * p
    const lo = Math.floor(idx)
    const hi = Math.ceil(idx)
    return lo === hi ? list[lo] : list[lo] + (list[hi] - list[lo]) * (idx - lo)
  }
  return { min: list[0], q1: pick(0.25), med: pick(0.5), q3: pick(0.75), max: list[list.length - 1] }
}

function MiniLineChart({ labels, values, color }) {
  const width = 300
  const height = 120
  const max = Math.max(1, ...values)
  const points = values.map((v, i) => {
    const x = labels.length <= 1 ? width / 2 : 16 + (i * (width - 32)) / (labels.length - 1)
    const y = height - 18 - ((v / max) * (height - 34))
    return { x, y, v }
  })
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
  return (
    <div>
      <svg className="detail-chart-svg" viewBox={`0 0 ${width} ${height}`} role="img">
        <line x1="16" y1={height - 18} x2={width - 16} y2={height - 18} stroke="#D4C8CD" strokeWidth="1" />
        <path d={path} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="5" fill="white" stroke={color} strokeWidth="3">
            <title>{`${labels[i]}: ${p.v.toFixed(1)}초`}</title>
          </circle>
        ))}
      </svg>
      <div className="detail-chart-labels">
        {labels.map(label => <span key={label}>{label}</span>)}
      </div>
    </div>
  )
}

function MiniBoxChart({ labels, samples, color }) {
  const stats = samples.map(quartiles)
  const max = Math.max(1, ...stats.map(s => s.max))
  const y = (v) => 88 - ((v / max) * 72)
  return (
    <div className="detail-box-chart">
      {stats.map((s, i) => {
        const boxTop = y(s.q3)
        const boxBottom = y(s.q1)
        return (
          <div className="detail-box-chart__cell" key={labels[i]}>
            <svg viewBox="0 0 48 100" className="detail-box-svg" role="img">
              <line x1="24" y1={y(s.min)} x2="24" y2={y(s.max)} stroke="#1F1218" strokeWidth="1" />
              <line x1="17" y1={y(s.min)} x2="31" y2={y(s.min)} stroke="#1F1218" strokeWidth="1" />
              <line x1="17" y1={y(s.max)} x2="31" y2={y(s.max)} stroke="#1F1218" strokeWidth="1" />
              <rect x="11" y={boxTop} width="26" height={Math.max(4, boxBottom - boxTop)} fill="#F8FAFC" stroke={color} strokeWidth="2" />
              <line x1="11" y1={y(s.med)} x2="37" y2={y(s.med)} stroke="#1F1218" strokeWidth="1.5" />
              <title>{`${labels[i]}: 중앙 ${s.med.toFixed(1)}초`}</title>
            </svg>
            <span>{labels[i]}</span>
          </div>
        )
      })}
    </div>
  )
}

export default function WorkerWorkload({
  data, updateData, addPhoto, removePhoto,
  addPersonnel, removePersonnel, updatePersonnel,
  addCycle, removeCycle, updateCycleCard, addCardInCycle, removeCardInCycle,
  switchPersonnel,
  addTransportType, updateTransportType, removeTransportType
}) {
  const { activePersonnel, dataByPersonnel, personnelList, transportTypes } = data
  const currentData = dataByPersonnel[activePersonnel] || {
    basicInfo: { transportType: 'worker', transportQty: 1, weight: 0.8, measureCount: 1 },
    measurements: [],
    photos: { transport: [], part: [] }
  }
  const basicInfo = currentData.basicInfo || {}
  const measurements = currentData.measurements || []
  const photos = currentData.photos || { transport: [], part: [] }

  const [userSelectedCycleId, setUserSelectedCycleId] = useState(null)
  const activeCycleId = userSelectedCycleId && measurements.find(m => m.id === userSelectedCycleId)
    ? userSelectedCycleId
    : (measurements[measurements.length - 1]?.id || null)
  const activeCycle = measurements.find(m => m.id === activeCycleId)
  const activeIndex = activeCycle ? measurements.findIndex(m => m.id === activeCycleId) + 1 : 0

  const [chartMode, setChartMode] = useState('total')   // 'total' | 'avg'
  const [detailChartBasis, setDetailChartBasis] = useState('cycle')
  const [detailChartType, setDetailChartType] = useState('line')
  const [isManagerOpen, setIsManagerOpen] = useState(false)
  const [newPersonName, setNewPersonName] = useState('')
  const [editingName, setEditingName] = useState(null)
  const [editValue, setEditValue] = useState('')

  const [isTransportManagerOpen, setIsTransportManagerOpen] = useState(false)
  const [newTransportLabel, setNewTransportLabel] = useState('')
  const [newTransportSpeed, setNewTransportSpeed] = useState('')
  const [editingTransportId, setEditingTransportId] = useState(null)
  const [editTransportLabel, setEditTransportLabel] = useState('')
  const [editTransportSpeed, setEditTransportSpeed] = useState('')

  const setBasicInfo = (upd) => {
    updateData({ basicInfo: { ...basicInfo, ...upd } })
  }

  const handleAddCycle = () => {
    addCycle()
    setUserSelectedCycleId(null)
  }

  const handleDeleteCycle = (id) => {
    if (measurements.length <= 1) return
    if (window.confirm(`${activeIndex}회차의 모든 측정 데이터가 삭제됩니다. 계속하시겠습니까?`)) {
      removeCycle(id)
      setUserSelectedCycleId(null)
    }
  }

  /* 합계 계산 */
  const totalTransportSec = measurements.reduce((sum, cycle) =>
    sum + (cycle.cards?.reduce((cs, c) => cs + (parseFloat(getGap(c.start, c.end)) || 0), 0) || 0), 0)

  const totalMovingSec = measurements.reduce((sum, cycle) =>
    sum + (cycle.cards?.reduce((cs, c) => {
      const g = parseFloat(getGap(c.start, c.end)) || 0
      return (c.type === 'move' || c.type === 'recovery') ? cs + g : cs
    }, 0) || 0), 0)

  const selectedTransport = transportTypes[basicInfo.transportType] || { speed: 0 }
  const defaultSpeed = parseFloat(selectedTransport.speed) || 0
  /* 운반 속도는 모든 운반 종류에서 직접 수정 가능 — 입력값이 있으면 우선, 없으면 종류 기본속도 */
  const speed = (basicInfo.speed !== undefined && basicInfo.speed !== '' && basicInfo.speed !== null)
    ? (parseFloat(basicInfo.speed) || 0)
    : defaultSpeed

  const totalDistance = speed > 0 ? (totalMovingSec * speed) : 0
  const weight = parseFloat(basicInfo.weight) || 0.8
  const weightedTime = 3600 * weight

  /* 부하율 = 평균 1회 운반시간 × 시간당 공급횟수 ÷ 부하 가중 시간 */
  const cycleCount = measurements.length || 0
  const avgCycleSec = cycleCount > 0 ? totalTransportSec / cycleCount : 0
  const supplyPerHour = nOr(basicInfo.supplyPerHour, 1)   /* 미입력 시 기본 1회/h */
  const hourlyBusySec = avgCycleSec * supplyPerHour
  const workloadRate = weightedTime > 0 ? ((hourlyBusySec / weightedTime) * 100) : 0

  /* 다른 인원 통계 (대시보드) — chartMode에 따라 누적/평균 */
  const workerStats = (personnelList || []).map(name => {
    const pData = dataByPersonnel[name] || {}
    const bInfo = pData.basicInfo || {}
    const meas = pData.measurements || []
    const cycleCnt = meas.length || 1
    let pickSum = 0, moveSum = 0, loadSum = 0, recoverSum = 0
    meas.forEach(m => m.cards?.forEach(c => {
      const g = parseFloat(getGap(c.start, c.end)) || 0
      if (c.type === 'pick') pickSum += g
      else if (c.type === 'move') moveSum += g
      else if (c.type === 'load') loadSum += g
      else if (c.type === 'recovery') recoverSum += g
    }))
    /* 표시용 시간/거리: chartMode total=누적 / avg=회당 평균 */
    const div = chartMode === 'avg' ? cycleCnt : 1
    const pickT = pickSum / div, moveT = moveSum / div, loadT = loadSum / div, recoverT = recoverSum / div
    const totalT = pickT + moveT + loadT + recoverT
    const tType = bInfo.transportType || 'worker'
    const defSpd = parseFloat(transportTypes[tType]?.speed) || 0
    const uSpeed = (bInfo.speed !== undefined && bInfo.speed !== '' && bInfo.speed !== null)
      ? (parseFloat(bInfo.speed) || 0) : defSpd
    const dist = (moveT + recoverT) * uSpeed
    const wght = parseFloat(bInfo.weight) || 0.8
    const capacityT = 3600 * wght
    /* 부하율: chartMode 무관 — 평균 1회 시간 × 시간당 공급횟수 기준 */
    const supply = nOr(bInfo.supplyPerHour, 1)   /* 미입력 시 기본 1회/h */
    const avgPick = pickSum / cycleCnt, avgMove = moveSum / cycleCnt, avgLoad = loadSum / cycleCnt, avgRecover = recoverSum / cycleCnt
    const avgTotal = avgPick + avgMove + avgLoad + avgRecover
    const wlRate = capacityT > 0 ? (avgTotal * supply / capacityT) * 100 : 0
    return {
      name, totalT, dist, wlRate: Math.round(wlRate * 10) / 10,
      details: {
        pickT, moveT, loadT, recoverT,
        moveDist: moveT * uSpeed,
        recoverDist: recoverT * uSpeed,
        pickRate: capacityT > 0 ? (avgPick * supply / capacityT) * 100 : 0,
        moveRate: capacityT > 0 ? (avgMove * supply / capacityT) * 100 : 0,
        loadRate: capacityT > 0 ? (avgLoad * supply / capacityT) * 100 : 0,
        recoverRate: capacityT > 0 ? (avgRecover * supply / capacityT) * 100 : 0
      }
    }
  }).filter(w => w.name)

  const measuredWorkerStats = workerStats.filter(w => w.totalT > 0 || w.dist > 0 || w.wlRate > 0)
  const averageSource = measuredWorkerStats.length ? measuredWorkerStats : workerStats
  const avgOf = (selector) => avg(averageSource.map(selector))
  const averageWorkerStat = {
    name: '평균',
    isAverage: true,
    totalT: avgOf(w => w.totalT),
    dist: avgOf(w => w.dist),
    wlRate: Math.round(avgOf(w => w.wlRate) * 10) / 10,
    details: {
      pickT: avgOf(w => w.details.pickT),
      moveT: avgOf(w => w.details.moveT),
      loadT: avgOf(w => w.details.loadT),
      recoverT: avgOf(w => w.details.recoverT),
      moveDist: avgOf(w => w.details.moveDist),
      recoverDist: avgOf(w => w.details.recoverDist),
      pickRate: avgOf(w => w.details.pickRate),
      moveRate: avgOf(w => w.details.moveRate),
      loadRate: avgOf(w => w.details.loadRate),
      recoverRate: avgOf(w => w.details.recoverRate)
    }
  }
  const dashboardStats = workerStats.length ? [averageWorkerStat, ...workerStats] : []

  const maxT = Math.max(1, ...dashboardStats.map(w => w.totalT))
  const maxDist = Math.max(1, ...dashboardStats.map(w => w.dist))
  const maxWl = Math.max(100, ...dashboardStats.map(w => w.wlRate))

  const teamTotal = workerStats.reduce((acc, w) => ({
    pickT: acc.pickT + w.details.pickT,
    moveT: acc.moveT + w.details.moveT,
    loadT: acc.loadT + w.details.loadT,
    recoverT: acc.recoverT + w.details.recoverT,
    totalT: acc.totalT + w.totalT,
    dist: acc.dist + w.dist
  }), { pickT: 0, moveT: 0, loadT: 0, recoverT: 0, totalT: 0, dist: 0 })

  const cycleMetric = (cycle, type) => cycle?.cards?.reduce((sum, c) => {
    const g = parseFloat(getGap(c.start, c.end)) || 0
    return c.type === type ? sum + g : sum
  }, 0) || 0

  const workerMetricSamples = (name, type) => {
    const pData = dataByPersonnel[name] || {}
    return (pData.measurements || []).map(cycle => cycleMetric(cycle, type))
  }

  const detailedCharts = METRIC_DEFS.map(metric => {
    if (detailChartBasis === 'personnel') {
      const rows = (personnelList || []).map(name => ({
        label: name,
        samples: workerMetricSamples(name, metric.type)
      })).filter(row => row.label)
      const allSamples = rows.flatMap(row => row.samples)
      return {
        ...metric,
        labels: ['평균', ...rows.map(row => row.label)],
        samples: [allSamples, ...rows.map(row => row.samples)]
      }
    }

    const cycleSamples = measurements.map(cycle => cycleMetric(cycle, metric.type))
    return {
      ...metric,
      labels: ['평균', ...measurements.map((_, i) => `${i + 1}회`)],
      samples: [cycleSamples, ...cycleSamples.map(v => [v])]
    }
  })

  const renderSegment = (val, total, color, label, unit = '') => {
    if (val <= 0 || total <= 0) return null
    const pct = (val / total) * 100
    return (
      <div style={{
        height: `${pct}%`, width: '100%', background: color,
        display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
      }} title={`${label}: ${val.toFixed(1)}${unit}`}>
        {pct > 12 && (
          <span style={{
            fontSize: '0.62rem', fontWeight: 800, color: 'white',
            textShadow: '0 1px 2px rgba(0,0,0,0.5)', whiteSpace: 'nowrap'
          }}>{val.toFixed(0)}{unit}</span>
        )}
      </div>
    )
  }

  const renderHorizontalSegment = (val, total, color, label, unit = '') => {
    if (val <= 0 || total <= 0) return null
    const pct = (val / total) * 100
    return (
      <div style={{
        width: `${pct}%`, height: '100%', background: color,
        display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
      }} title={`${label}: ${val.toFixed(1)}${unit}`}>
        {pct > 6 && (
          <span style={{
            fontSize: '0.65rem', fontWeight: 800, color: 'white',
            textShadow: '0 1px 2px rgba(0,0,0,0.5)'
          }}>{val.toFixed(0)}{unit}</span>
        )}
      </div>
    )
  }

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <div className="module-title">물류작업자 업무 부하율 산출</div>

      {/* 기초 정보 */}
      <div className="section-card">
        <div className="section-title">
          기초 정보 입력
          <HelpHint title="기초 정보 입력">
            <p>측정할 작업자의 <b>기본 조건</b>을 설정하는 곳입니다.</p>
            <ul style={{ paddingLeft: 18, margin: '6px 0' }}>
              <li><b>운반 종류</b>: 도보·대차·파렛트·AGV 등. 종류별 표준 속도가 자동 입력됩니다.</li>
              <li><b>운반 수량</b>: 1회 이동 시 운반하는 자재 수</li>
              <li><b>운반 속도</b>: 자동 입력. '기타' 선택 시 직접 입력 가능</li>
              <li><b>부하 가중치 (0~1)</b>: 1시간 중 실제 작업 비율. 보통 0.8 (= 80% 가동)</li>
            </ul>
            <HintNote>측정 전에 반드시 가중치를 정해두세요. 결과의 부하율 계산 기준입니다.</HintNote>
          </HelpHint>
        </div>
        <div className="input-grid">
          <div className="input-group">
            <div className="input-label-row">
              <span className="input-label">물류 인원</span>
              <button className="mini-btn" onClick={() => setIsManagerOpen(true)}>명단관리</button>
            </div>
            <select className="input-field" value={activePersonnel || ''}
              onChange={e => switchPersonnel(e.target.value)}>
              {personnelList?.length === 0 && <option value="">인원을 추가하세요</option>}
              {personnelList?.map(name => <option key={name} value={name}>{name}</option>)}
            </select>
          </div>

          <div className="input-group">
            <div className="input-label-row"><span className="input-label">측정 횟수</span></div>
            <input className="input-field" type="number" value={measurements.length || 0} readOnly />
          </div>

          <div className="input-group">
            <div className="input-label-row">
              <span className="input-label">운반 종류</span>
              <button className="mini-btn" onClick={() => setIsTransportManagerOpen(true)}>운반관리</button>
            </div>
            <select className="input-field" value={basicInfo.transportType || 'worker'}
              onChange={e => {
                const newType = e.target.value
                const def = parseFloat(transportTypes[newType]?.speed) || 0
                setBasicInfo({ transportType: newType, speed: def })
              }}>
              {Object.entries(transportTypes).map(([id, t]) => (
                <option key={id} value={id}>{t.label} ({t.speed} m/s)</option>
              ))}
            </select>
          </div>

          <div className="input-group">
            <div className="input-label-row"><span className="input-label">운반 수량</span></div>
            <input className="input-field" type="number" min={1} value={basicInfo.transportQty ?? 1}
              onChange={e => setBasicInfo({ transportQty: e.target.value })} />
          </div>

          <div className="input-group">
            <div className="input-label-row"><span className="input-label">운반 속도 (m/s)</span></div>
            <input className="input-field" type="number" step="0.1" min={0}
              value={basicInfo.speed ?? defaultSpeed}
              onChange={e => setBasicInfo({ speed: e.target.value })} />
          </div>

          <div className="input-group">
            <div className="input-label-row"><span className="input-label">부하 가중치 (0~1)</span></div>
            <select className="input-field" value={basicInfo.weight ?? 0.8}
              onChange={e => setBasicInfo({ weight: parseFloat(e.target.value) })}>
              {WEIGHT_OPTIONS.map(w => <option key={w} value={w}>{w.toFixed(1)}</option>)}
            </select>
          </div>

          <PhotoSection title="운반 사진" photos={photos.transport}
            onAdd={(f) => addPhoto('transport', f)} onRemove={(i) => removePhoto('transport', i)} />
          <PhotoSection title="운반 부품 사진" photos={photos.part}
            onAdd={(f) => addPhoto('part', f)} onRemove={(i) => removePhoto('part', i)} />
        </div>
      </div>

      {/* 측정 결과 (평균 1회 × 시간당 공급횟수) */}
      <div className="section-card">
        <div className="section-title">
          측정 결과 <span className="sub-title">| 평균 1회 측정 × 시간당 공급횟수</span>
          <HelpHint title="측정 결과">
            <p>1시간 내내 측정하기 어렵기 때문에, <b>몇 회 측정한 평균 1회 운반 시간</b>에
              <b> 시간당 공급횟수</b>를 곱해 1시간 부하율을 환산합니다.</p>
            <HintFormula>{`평균 1회 운반 시간 = Σ(피킹+이동+로딩/언로딩+회수) ÷ 측정 횟수
시간당 점유 시간 = 평균 1회 운반 시간 × 시간당 공급횟수
부하 가중 시간 = 3600초 × 가중치
물류 부하율(%) = 시간당 점유 시간 ÷ 가중 시간 × 100`}</HintFormula>
            <p><b>판정 기준</b>:</p>
            <ul style={{ paddingLeft: 18, margin: '4px 0' }}>
              <li>~70% (녹색): 여유</li>
              <li>70~90% (앰버): 적정</li>
              <li>90% 초과 (짙은 앰버): 과부하 → 인원 추가 / 동선 단축 검토</li>
            </ul>
            <HintNote type="ok">원단위 기준 시간당 공급횟수를 입력해야 부하율이 계산됩니다.</HintNote>
          </HelpHint>
        </div>
        <div className="input-grid">
          <div className="input-group full-width">
            <div className="input-label-row"><span className="input-label">시간당 공급횟수 (회/h)</span></div>
            <input className="input-field" type="number" step="0.1" min={0} value={basicInfo.supplyPerHour ?? 1}
              onChange={e => setBasicInfo({ supplyPerHour: e.target.value })} placeholder="원단위 기준 1시간당 공급 횟수 (기본 1)" />
          </div>
          <div className="result-box tone-final">
            <span className="result-box__label">평균 1회 운반 시간 (피킹+이동+로딩/언로딩+회수)</span>
            <span className="result-box__value">{avgCycleSec.toFixed(1)}초</span>
          </div>
          <div className="result-box tone-blue">
            <span className="result-box__label">시간당 점유 시간 = 평균 1회 × 공급횟수</span>
            <span className="result-box__value">{hourlyBusySec.toFixed(1)}초</span>
          </div>
          <div className="result-box tone-blue">
            <span className="result-box__label">총 이동거리 (이동+회수)</span>
            <span className="result-box__value">{totalDistance.toFixed(1)} m</span>
          </div>
          <div className="result-box tone-slate">
            <span className="result-box__label">부하 가중 시간 = 3600 × {weight}</span>
            <span className="result-box__value">{weightedTime.toFixed(0)} 초</span>
          </div>
          <div className="result-box tone-final">
            <span className="result-box__label">물류 부하율</span>
            <span className="result-box__value">{workloadRate.toFixed(1)}%</span>
          </div>
        </div>
      </div>

      {/* 측정 내역 */}
      <div className="section-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
          <div className="section-title" style={{ marginBottom: 0, border: 'none', paddingBottom: 0 }}>
            측정 내역 <span className="sub-title">| {measurements.length}회 중 {activeIndex || 0}회차</span>
            <HelpHint title="측정 내역">
              <p>한 사이클을 <b>4단계</b>로 나눠 측정하는 스톱워치 영역입니다.</p>
              <ul style={{ paddingLeft: 18, margin: '6px 0' }}>
                <li><b>① 피킹</b>: 자재를 집어 운반구에 싣는 시간 + 자재 종수</li>
                <li><b>② 이동</b>: 목적지까지의 이동 시간 (공정 번호 선택)</li>
                <li><b>③ 로딩/언로딩</b>: 도착 후 짐을 내리거나 다시 싣는 시간</li>
                <li><b>④ 회수</b>: 빈 운반구로 출발지점 복귀</li>
              </ul>
              <p>각 카드에서 <b>▶ 시작</b> → 작업 → <b>⏹ 종료</b> 순서로 누르면 Gap 시간이 자동 기록됩니다.</p>
              <HintNote>같은 사이클을 3~5회 반복 측정하려면 상단 <b>+</b> 탭을 눌러 회차를 추가하세요.</HintNote>
              <HintNote type="warn">회차 삭제 시 해당 회차의 모든 카드 데이터가 함께 삭제됩니다.</HintNote>
            </HelpHint>
          </div>
          {measurements.length > 1 && (
            <button className="btn" onClick={() => handleDeleteCycle(activeCycleId)}
              style={{ height: 32, padding: '0 12px', background: '#FEF3C7', color: '#B45309', fontSize: '0.78rem' }}>
              🗑️ 회차삭제
            </button>
          )}
        </div>

        <div className="cycle-tabs-container">
          {measurements.map((m, idx) => (
            <button
              key={m.id}
              onClick={() => setUserSelectedCycleId(m.id)}
              className={`cycle-tab-btn ${activeCycleId === m.id ? 'active' : ''}`}
              title={`${idx + 1}회차`}
            >{idx + 1}</button>
          ))}
          <button onClick={handleAddCycle} className="cycle-tab-btn"
            style={{ background: '#FDF2F4', color: '#A50034', borderColor: '#E8C5CC' }}
            title="회차 추가">+</button>
        </div>

        {activeCycle?.cards?.map((card, idx) => (
          <TimerSection
            key={card.id}
            title={`${CARD_TITLES[card.type] || card.type} (${idx + 1})`}
            start={card.start}
            end={card.end}
            onStart={() => updateCycleCard(activeCycleId, card.id, { start: Date.now(), end: null })}
            onEnd={() => updateCycleCard(activeCycleId, card.id, { end: Date.now() })}
            onDelete={() => {
              if (window.confirm('이 카드를 삭제하시겠습니까?')) {
                removeCardInCycle(activeCycleId, card.id)
              }
            }}
            extraInputs={
              card.type === 'pick' ? (
                <div className="input-group">
                  <span className="input-label">자재 종수</span>
                  <input className="input-field" type="number" min={0} value={card.materialCount ?? ''}
                    onChange={e => updateCycleCard(activeCycleId, card.id, { materialCount: e.target.value })} />
                </div>
              ) : (card.type === 'move' || card.type === 'load') ? (
                <div className="input-group">
                  <span className="input-label">공정 번호 (1~10)</span>
                  <select className="input-field" value={card.processNo ?? card.waypointNo ?? 1}
                    onChange={e => updateCycleCard(activeCycleId, card.id, { processNo: parseInt(e.target.value), waypointNo: parseInt(e.target.value) })}>
                    {Array.from({ length: 10 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}공정</option>)}
                  </select>
                </div>
              ) : null
            }
          />
        ))}

        <div className="input-grid" style={{ marginTop: 12, gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 6 }}>
          {[
            { type: 'pick',     label: '+ 피킹',       bg: COLORS.pick     },
            { type: 'move',     label: '+ 이동',       bg: COLORS.move     },
            { type: 'load',     label: '+ 로딩/언로딩', bg: COLORS.load     },
            { type: 'recovery', label: '+ 회수',       bg: COLORS.recovery }
          ].map(b => (
            <button key={b.type} className="btn" style={{
              background: b.bg, color: 'white',
              fontSize: '0.72rem', fontWeight: 700,
              lineHeight: 1.15, whiteSpace: 'normal', wordBreak: 'keep-all',
              padding: '4px 4px', height: 'auto', minHeight: 44, textAlign: 'center'
            }}
              onClick={() => activeCycleId && addCardInCycle(activeCycleId, b.type)}>
              {b.label}
            </button>
          ))}
        </div>
      </div>

      {/* 상세 그래프 */}
      <div className="section-card">
        <div className="section-title">
          상세 시간 그래프
          <HelpHint title="상세 시간 그래프">
            <p>피킹, 이동, 로딩/언로딩, 회수 시간을 회차별 또는 작업자별로 비교합니다.</p>
            <HintNote>그래프 종류는 라인형과 박스형 중 선택할 수 있습니다.</HintNote>
          </HelpHint>
        </div>

        <div className="chart-control-row">
          <label>
            <span>그래프 기준</span>
            <select className="input-field" value={detailChartBasis}
              onChange={e => setDetailChartBasis(e.target.value)}>
              <option value="cycle">회차별</option>
              <option value="personnel">작업자별</option>
            </select>
          </label>
          <label>
            <span>그래프 종류</span>
            <select className="input-field" value={detailChartType}
              onChange={e => setDetailChartType(e.target.value)}>
              <option value="line">라인 그래프</option>
              <option value="box">박스형 그래프</option>
            </select>
          </label>
        </div>

        <div className="detail-chart-grid">
          {detailedCharts.map(chart => {
            const values = chart.samples.map(s => avg(s))
            return (
              <div className="detail-chart-card" key={chart.type}>
                <div className="detail-chart-card__title">
                  {detailChartBasis === 'personnel' ? chart.label : `${activePersonnel}: ${chart.label}`}
                </div>
                {detailChartType === 'line'
                  ? <MiniLineChart labels={chart.labels} values={values} color={chart.color} />
                  : <MiniBoxChart labels={chart.labels} samples={chart.samples} color={chart.color} />}
              </div>
            )
          })}
        </div>
      </div>

      {/* 대시보드 */}
      {workerStats.length > 0 && (
        <div style={{ marginTop: 24, paddingTop: 16, borderTop: '2px dashed #e2e8f0' }}>
          <div style={{
            fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-primary-dark)',
            textAlign: 'center', padding: '8px 16px 12px'
          }}>
            📊 전체 인원 분석 대시보드
          </div>

          <div className="chart-mode-toggle">
            <button
              className={`chart-mode-btn ${chartMode === 'total' ? 'active' : ''}`}
              onClick={() => setChartMode('total')}>누적</button>
            <button
              className={`chart-mode-btn ${chartMode === 'avg' ? 'active' : ''}`}
              onClick={() => setChartMode('avg')}>평균</button>
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
            {Object.entries({ '피킹': COLORS.pick, '이동': COLORS.move, '로딩/언로딩': COLORS.load, '회수': COLORS.recovery }).map(([label, color]) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 12, height: 12, background: color, borderRadius: 2 }} />
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#7C6E74' }}>{label}</span>
              </div>
            ))}
          </div>

          <div className="section-card" style={{ background: 'white' }}>
            <div className="section-title">인원별 작업 시간 {chartMode === 'avg' ? '평균' : '누적'} (초)</div>
            <div style={{ display: 'flex', height: 220, gap: 8, alignItems: 'flex-end', margin: '32px 0 24px 0', borderBottom: '1px dashed #D4C8CD' }}>
              {dashboardStats.map((w, i) => {
                const heightPct = maxT > 0 ? Math.max(2, (w.totalT / maxT) * 100) : 2
                return (
                  <div key={w.isAverage ? 'avg-time' : `${w.name}-${i}`} style={{ flex: w.isAverage ? '0 0 48px' : 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: `${heightPct}%`, position: 'relative', minWidth: 0 }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 800, position: 'absolute', top: -22, color: w.isAverage ? 'var(--color-primary-dark)' : '#2A1F24' }}>{w.totalT.toFixed(0)}s</div>
                    <div style={{ width: '100%', maxWidth: 36, height: '100%', display: 'flex', flexDirection: 'column-reverse', borderRadius: '4px 4px 0 0', overflow: 'hidden', background: '#F4EFF1', outline: w.isAverage ? '2px solid var(--color-primary-soft)' : 'none' }}>
                      {renderSegment(w.details.pickT, w.totalT, COLORS.pick, '피킹')}
                      {renderSegment(w.details.moveT, w.totalT, COLORS.move, '이동')}
                      {renderSegment(w.details.loadT, w.totalT, COLORS.load, '로딩')}
                      {renderSegment(w.details.recoverT, w.totalT, COLORS.recovery, '회수')}
                    </div>
                    <div style={{ position: 'absolute', bottom: -22, fontSize: '0.7rem', color: w.isAverage ? 'var(--color-primary-dark)' : '#7C6E74', fontWeight: 800, textAlign: 'center', width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.name}</div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="section-card" style={{ background: 'white' }}>
            <div className="section-title">인원별 총 이동 거리 {chartMode === 'avg' ? '평균' : '누적'} (m)</div>
            <div style={{ display: 'flex', height: 220, gap: 8, alignItems: 'flex-end', margin: '32px 0 24px 0', borderBottom: '1px dashed #D4C8CD' }}>
              {dashboardStats.map((w, i) => {
                const heightPct = maxDist > 0 ? Math.max(2, (w.dist / maxDist) * 100) : 2
                return (
                  <div key={w.isAverage ? 'avg-distance' : `${w.name}-${i}`} style={{ flex: w.isAverage ? '0 0 48px' : 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: `${heightPct}%`, position: 'relative', minWidth: 0 }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 800, position: 'absolute', top: -22, color: w.isAverage ? 'var(--color-primary-dark)' : COLORS.move }}>{w.dist.toFixed(0)}m</div>
                    <div style={{ width: '100%', maxWidth: 36, height: '100%', display: 'flex', flexDirection: 'column-reverse', borderRadius: '4px 4px 0 0', overflow: 'hidden', background: '#F4EFF1', outline: w.isAverage ? '2px solid var(--color-primary-soft)' : 'none' }}>
                      {renderSegment(w.details.moveDist, w.dist, COLORS.move, '이동', 'm')}
                      {renderSegment(w.details.recoverDist, w.dist, COLORS.recovery, '회수', 'm')}
                    </div>
                    <div style={{ position: 'absolute', bottom: -22, fontSize: '0.7rem', color: w.isAverage ? 'var(--color-primary-dark)' : '#7C6E74', fontWeight: 800, textAlign: 'center', width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.name}</div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="section-card" style={{ background: 'white' }}>
            <div className="section-title">인원별 업무 부하율 (%)</div>
            <div style={{ display: 'flex', height: 220, gap: 8, alignItems: 'flex-end', margin: '32px 0 24px 0', borderBottom: '1px dashed #D4C8CD' }}>
              {dashboardStats.map((w, i) => {
                const heightPct = maxWl > 0 ? Math.max(2, (w.wlRate / maxWl) * 100) : 2
                const totalColor = w.wlRate > 90 ? COLORS.recovery : w.wlRate > 70 ? COLORS.load : COLORS.move
                return (
                  <div key={w.isAverage ? 'avg-workload' : `${w.name}-${i}`} style={{ flex: w.isAverage ? '0 0 48px' : 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: `${heightPct}%`, position: 'relative', minWidth: 0 }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 800, position: 'absolute', top: -22, color: w.isAverage ? 'var(--color-primary-dark)' : totalColor }}>{w.wlRate.toFixed(1)}%</div>
                    <div style={{ width: '100%', maxWidth: 36, height: '100%', display: 'flex', flexDirection: 'column-reverse', borderRadius: '4px 4px 0 0', overflow: 'hidden', border: `1px solid ${totalColor}33`, background: '#F4EFF1', outline: w.isAverage ? '2px solid var(--color-primary-soft)' : 'none' }}>
                      {renderSegment(w.details.pickRate, w.wlRate, COLORS.pick, '피킹', '%')}
                      {renderSegment(w.details.moveRate, w.wlRate, COLORS.move, '이동', '%')}
                      {renderSegment(w.details.loadRate, w.wlRate, COLORS.load, '로딩', '%')}
                      {renderSegment(w.details.recoverRate, w.wlRate, COLORS.recovery, '회수', '%')}
                    </div>
                    <div style={{ position: 'absolute', bottom: -22, fontSize: '0.7rem', color: w.isAverage ? 'var(--color-primary-dark)' : '#7C6E74', fontWeight: 800, textAlign: 'center', width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.name}</div>
                  </div>
                )
              })}
            </div>
          </div>

          {teamTotal.totalT > 0 && (
            <div className="section-card" style={{ background: '#2A1F24', color: 'white' }}>
              <div className="section-title" style={{ color: 'white', borderBottomColor: '#3A2F33' }}>창고 전체 작업 시간 분포 (팀 총합)</div>
              <div style={{ height: 44, width: '100%', display: 'flex', borderRadius: 8, overflow: 'hidden', margin: '12px 0 8px', border: '1px solid #4A4045' }}>
                {renderHorizontalSegment(teamTotal.pickT, teamTotal.totalT, COLORS.pick, '피킹', 's')}
                {renderHorizontalSegment(teamTotal.moveT, teamTotal.totalT, COLORS.move, '이동', 's')}
                {renderHorizontalSegment(teamTotal.loadT, teamTotal.totalT, COLORS.load, '로딩', 's')}
                {renderHorizontalSegment(teamTotal.recoverT, teamTotal.totalT, COLORS.recovery, '회수', 's')}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', opacity: 0.85 }}>
                <span>총 작업 시간: {teamTotal.totalT.toFixed(1)}초</span>
                <span>총 이동 거리: {teamTotal.dist.toFixed(1)}m</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 명단 관리 모달 */}
      {isManagerOpen && (
        <div className="modal-overlay">
          <div className="section-card" style={{ width: '100%', maxWidth: 420, margin: 0, maxHeight: '85vh', overflowY: 'auto', background: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid #e2e8f0', paddingBottom: 10 }}>
              <span className="section-title" style={{ marginBottom: 0, border: 'none', padding: 0 }}>👥 물류 인원 명단 관리</span>
              <button onClick={() => { setIsManagerOpen(false); setEditingName(null) }}
                style={{ border: 'none', background: 'none', fontSize: '1.5rem', color: '#9C8E94', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <input className="input-field" placeholder="새 이름" value={newPersonName}
                onChange={e => setNewPersonName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && newPersonName.trim()) { addPersonnel(newPersonName.trim()); setNewPersonName('') } }} />
              <button className="btn btn-primary"
                onClick={() => { if (newPersonName.trim()) { addPersonnel(newPersonName.trim()); setNewPersonName('') } }}>
                추가
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {personnelList?.length === 0 && (
                <div style={{ textAlign: 'center', color: '#9C8E94', padding: 16 }}>등록된 인원이 없습니다.</div>
              )}
              {personnelList?.map(name => (
                <div key={name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 10, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                  {editingName === name ? (
                    <div style={{ display: 'flex', gap: 6, flex: 1 }}>
                      <input className="input-field" style={{ height: 36 }} value={editValue}
                        onChange={e => setEditValue(e.target.value)} autoFocus
                        onKeyDown={e => { if (e.key === 'Enter' && editValue.trim() && editValue !== name) { updatePersonnel(name, editValue.trim()); setEditingName(null) } }} />
                      <button onClick={() => { if (editValue.trim() && editValue !== name) updatePersonnel(name, editValue.trim()); setEditingName(null) }}
                        style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>✅</button>
                      <button onClick={() => setEditingName(null)}
                        style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
                    </div>
                  ) : (
                    <>
                      <span style={{ fontWeight: 500 }}>{name}</span>
                      <div style={{ display: 'flex', gap: 12 }}>
                        <button onClick={() => { setEditingName(name); setEditValue(name) }}
                          style={{ border: 'none', background: 'none', color: '#A50034', fontSize: '1.1rem', cursor: 'pointer' }}>✏️</button>
                        <button onClick={() => { if (window.confirm(`${name}님을 삭제하시겠습니까? 측정 데이터도 함께 삭제됩니다.`)) removePersonnel(name) }}
                          style={{ border: 'none', background: 'none', color: '#ef4444', fontSize: '1.1rem', cursor: 'pointer' }}>🗑️</button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
            <button className="btn" style={{ width: '100%', marginTop: 20, background: '#F4EFF1', color: '#4A4045' }}
              onClick={() => { setIsManagerOpen(false); setEditingName(null) }}>닫기</button>
          </div>
        </div>
      )}

      {/* 운반 종류 관리 모달 */}
      {isTransportManagerOpen && (
        <div className="modal-overlay">
          <div className="section-card" style={{ width: '100%', maxWidth: 420, margin: 0, maxHeight: '85vh', overflowY: 'auto', background: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid #e2e8f0', paddingBottom: 10 }}>
              <span className="section-title" style={{ marginBottom: 0, border: 'none', padding: 0 }}>🚚 운반 종류 관리</span>
              <button onClick={() => { setIsTransportManagerOpen(false); setEditingTransportId(null) }}
                style={{ border: 'none', background: 'none', fontSize: '1.5rem', color: '#9C8E94', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              <input className="input-field" placeholder="종류 이름 (예: 지게차)" value={newTransportLabel}
                onChange={e => setNewTransportLabel(e.target.value)} />
              <div style={{ display: 'flex', gap: 8 }}>
                <input className="input-field" type="number" step="0.1" placeholder="속도 (m/s)" value={newTransportSpeed}
                  onChange={e => setNewTransportSpeed(e.target.value)} />
                <button className="btn btn-primary"
                  onClick={() => {
                    if (newTransportLabel.trim() && newTransportSpeed) {
                      addTransportType(`tt_${Date.now()}`, newTransportLabel.trim(), newTransportSpeed)
                      setNewTransportLabel(''); setNewTransportSpeed('')
                    }
                  }}>추가</button>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {Object.entries(transportTypes).map(([id, t]) => (
                <div key={id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 10, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                  {editingTransportId === id ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                      <input className="input-field" value={editTransportLabel}
                        onChange={e => setEditTransportLabel(e.target.value)} />
                      <div style={{ display: 'flex', gap: 6 }}>
                        <input className="input-field" type="number" step="0.1" value={editTransportSpeed}
                          onChange={e => setEditTransportSpeed(e.target.value)} />
                        <button onClick={() => { updateTransportType(id, { label: editTransportLabel, speed: editTransportSpeed }); setEditingTransportId(null) }}
                          style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>✅</button>
                        <button onClick={() => setEditingTransportId(null)}
                          style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{t.label}</span>
                        <span style={{ fontSize: '0.78rem', color: '#A50034' }}>{t.speed} m/s</span>
                      </div>
                      <div style={{ display: 'flex', gap: 12 }}>
                        <button onClick={() => { setEditingTransportId(id); setEditTransportLabel(t.label); setEditTransportSpeed(t.speed) }}
                          style={{ border: 'none', background: 'none', color: '#A50034', fontSize: '1.1rem', cursor: 'pointer' }}>✏️</button>
                        <button onClick={() => { if (window.confirm(`${t.label}을(를) 삭제하시겠습니까?`)) removeTransportType(id) }}
                          style={{ border: 'none', background: 'none', color: '#ef4444', fontSize: '1.1rem', cursor: 'pointer' }}>🗑️</button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
            <button className="btn" style={{ width: '100%', marginTop: 20, background: '#F4EFF1', color: '#4A4045' }}
              onClick={() => { setIsTransportManagerOpen(false); setEditingTransportId(null) }}>닫기</button>
          </div>
        </div>
      )}
    </div>
  )
}
