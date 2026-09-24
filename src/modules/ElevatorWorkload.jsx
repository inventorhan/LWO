import { useState, useCallback } from 'react'
import { getGap, nOr } from '../shared/utils/common'
import TimerSection from '../shared/components/TimerSection'
import PhotoSection from '../shared/components/PhotoSection'
import HelpHint, { HintFormula, HintNote } from '../shared/components/HelpHint'

const CARD_TITLES = {
  load:     'E/V 로딩',
  move:     '이동 시간',
  unload:   'E/V 언로딩',
  recovery: '회수 시간'
}

const COLORS = {
  load: '#f59e0b',
  move: '#3b82f6',
  unload: '#ea580c',
  recovery: '#8b6914'  /* 똥색 */
}

const WEIGHT_OPTIONS = [0.5, 0.6, 0.7, 0.8, 0.9, 1.0]
const ITEM_TYPES = ['박스', '대차', '파렛트', '손수레']

export default function ElevatorWorkload({
  data,
  /* 호기 단위 액션 */
  switchHogi, removeHogi, updateElevatorBasic,
  addElevatorCycle, removeElevatorCycle, updateElevatorCycleCard,
  addElevatorCard, removeElevatorCard,
  addElevatorLoadItem, updateElevatorLoadItem, removeElevatorLoadItem,
  /* 사진 (active hogi에 자동 적용됨) */
  addPhoto, removePhoto
}) {
  const activeHogi = data.activeHogi || 1
  const hogiKey = String(activeHogi)
  const cur = data.dataByHogi?.[hogiKey] || {
    basicInfo: { weight: 0.8, evWidth: '', evDepth: '', stackLevel: 4 },
    measurements: [],
    loadItems: [],
    photos: []
  }
  const basicInfo = cur.basicInfo || {}
  const measurements = cur.measurements || []
  const loadItems = cur.loadItems || []
  const photos = cur.photos || []

  const [activeCycleId, setActiveCycleId] = useState(null)
  const effectiveCycleId = activeCycleId && measurements.find(m => m.id === activeCycleId)
    ? activeCycleId
    : (measurements[measurements.length - 1]?.id || null)
  const activeCycle = measurements.find(m => m.id === effectiveCycleId)
  const activeIndex = activeCycle ? measurements.findIndex(m => m.id === effectiveCycleId) + 1 : 0

  const handleAddCycle = useCallback(() => {
    addElevatorCycle()
    setActiveCycleId(null)
  }, [addElevatorCycle])

  const handleDeleteCycle = (id) => {
    if (measurements.length <= 1) return
    if (window.confirm(`${activeIndex}회차의 모든 측정 데이터가 삭제됩니다. 계속하시겠습니까?`)) {
      removeElevatorCycle(id)
      setActiveCycleId(null)
    }
  }

  /* ── 호기 목록 / 추가·삭제 ── */
  const hogiList = Object.keys(data.dataByHogi || { '1': null })
    .map(k => parseInt(k))
    .filter(n => !isNaN(n))
    .sort((a, b) => a - b)

  const handleAddHogi = useCallback(() => {
    /* 빈 번호 자동 채움: [1,2,3,5] → 4를 먼저 사용 */
    const used = new Set(hogiList)
    let next = 1
    while (used.has(next)) next++
    switchHogi(next)
  }, [hogiList, switchHogi])

  const handleRemoveHogi = useCallback(() => {
    if (hogiList.length <= 1) return
    if (window.confirm(`${activeHogi}호기의 모든 기초 정보·측정·적재 데이터가 삭제됩니다. 계속하시겠습니까?`)) {
      removeHogi(activeHogi)
    }
  }, [hogiList.length, activeHogi, removeHogi])

  /* ── 합산 계산 ── */
  const totalTransportSec = measurements.reduce((sum, m) =>
    sum + (m.cards?.reduce((cs, c) => cs + (parseFloat(getGap(c.start, c.end)) || 0), 0) || 0), 0)
  const moveSec = measurements.reduce((sum, m) =>
    sum + (m.cards?.filter(c => c.type === 'move')
      .reduce((cs, c) => cs + (parseFloat(getGap(c.start, c.end)) || 0), 0) || 0), 0)
  const weight = parseFloat(basicInfo.weight) || 0.8
  const weightedTime = 3600 * weight
  /* 부하율 = 평균 1회 운반시간 × 시간당 공급횟수 ÷ 부하 가중 시간 */
  const cycleCount = measurements.length || 0
  const avgCycleSec = cycleCount > 0 ? totalTransportSec / cycleCount : 0
  const supplyPerHour = nOr(basicInfo.supplyPerHour, 1)   /* 미입력 시 기본 1회/h */
  const hourlyBusySec = avgCycleSec * supplyPerHour
  const workloadRate = weightedTime > 0 ? ((hourlyBusySec / weightedTime) * 100) : 0

  /* ── E/V 면적·적재율 계산 (단위: m) ── */
  const evAreaM2 = (parseFloat(basicInfo.evWidth) || 0) * (parseFloat(basicInfo.evDepth) || 0)
  const stackLevel = parseFloat(basicInfo.stackLevel) || 4
  const usedAreaM2 = loadItems.reduce((acc, it) => {
    const a = (parseFloat(it.width) || 0) * (parseFloat(it.depth) || 0)
    return acc + (a * (parseInt(it.qty) || 0)) / stackLevel
  }, 0)
  const loadingRate = (evAreaM2 > 0)
    ? ((usedAreaM2 / evAreaM2) * 100)
    : null

  /* ── 호기별 통계 (대시보드) ── */
  const hogiStats = Object.entries(data.dataByHogi || {}).map(([k, h]) => {
    const ms = h.measurements || []
    const cycleCnt = ms.length || 1
    let loadT = 0, moveT2 = 0, unloadT = 0, recoverT = 0
    ms.forEach(m => m.cards?.forEach(c => {
      const g = parseFloat(getGap(c.start, c.end)) || 0
      if (c.type === 'load') loadT += g
      else if (c.type === 'move') moveT2 += g
      else if (c.type === 'unload') unloadT += g
      else if (c.type === 'recovery') recoverT += g
    }))
    const totalT = loadT + moveT2 + unloadT + recoverT
    const wgt = parseFloat(h.basicInfo?.weight) || 0.8
    const capacityT = 3600 * wgt
    /* 부하율: 평균 1회 시간 × 시간당 공급횟수 기준 */
    const supply = nOr(h.basicInfo?.supplyPerHour, 1)   /* 미입력 시 기본 1회/h */
    const avgCycle = totalT / cycleCnt
    const wlRate = capacityT > 0 ? (avgCycle * supply / capacityT * 100) : 0
    return { hogi: parseInt(k), totalT, loadT, moveT2, unloadT, recoverT, wlRate }
  }).sort((a, b) => a.hogi - b.hogi)

  const maxT = Math.max(1, ...hogiStats.map(h => h.totalT))

  const renderSeg = (val, total, color) => {
    if (val <= 0 || total <= 0) return null
    const pct = (val / total) * 100
    return <div style={{ height: `${pct}%`, width: '100%', background: color }} />
  }

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <div className="module-title">Elevator 부하율 산출</div>

      {/* 호기 선택 탭 (회차와 동일한 UI: 추가/삭제 가능) */}
      <div className="section-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
          <div className="section-title" style={{ marginBottom: 0, border: 'none', paddingBottom: 0 }}>
            호기 선택 <span className="sub-title">| {hogiList.length}대 중 {activeHogi}호기</span>
            <HelpHint title="호기 선택">
              <p>측정할 엘리베이터 호기를 선택·추가·삭제합니다.</p>
              <ul style={{ paddingLeft: 18, margin: '6px 0' }}>
                <li>기본 1호기로 시작 — <b>+ 호기</b> 버튼으로 추가</li>
                <li>번호는 <b>가장 작은 빈 번호부터 자동 채움</b> — [1,2,3,5]에서 추가하면 4호기 생성</li>
                <li>호기별로 기초 정보 / 적재 / 측정 데이터가 독립적으로 저장됩니다</li>
                <li>2대 이상일 때 우측 <b>🗑️ 호기삭제</b>로 현재 선택된 호기 제거</li>
              </ul>
              <HintNote type="warn">호기 삭제 시 해당 호기의 모든 측정·적재 데이터가 함께 삭제됩니다.</HintNote>
            </HelpHint>
          </div>
          {hogiList.length > 1 && (
            <button className="btn" onClick={handleRemoveHogi}
              style={{ height: 32, padding: '0 12px', background: '#FEF3C7', color: '#B45309', fontSize: '0.78rem' }}>
              🗑️ 호기삭제
            </button>
          )}
        </div>

        <div className="cycle-tabs-container">
          {hogiList.map(h => (
            <button key={h} onClick={() => switchHogi(h)}
              className={`cycle-tab-btn ${activeHogi === h ? 'active' : ''}`}
              style={{ padding: '0 12px', minWidth: 'auto', height: 38, fontSize: '0.85rem' }}
              title={`${h}호기`}
            >{h}호기</button>
          ))}
          <button onClick={handleAddHogi} className="cycle-tab-btn"
            style={{ padding: '0 12px', minWidth: 'auto', height: 38, fontSize: '0.85rem', background: '#FDF2F4', color: '#A50034', borderColor: '#E8C5CC' }}
            title="호기 추가">+ 호기</button>
        </div>
      </div>

      {/* 기초 정보 */}
      <div className="section-card">
        <div className="section-title">
          {activeHogi}호기 — 기초 정보
          <HelpHint title="기초 정보 입력">
            <p>선택한 호기의 <b>물리적 치수</b>와 <b>사진</b>을 기록합니다.</p>
            <ul style={{ paddingLeft: 18, margin: '6px 0' }}>
              <li><b>E/V 가로/세로 (m)</b>: 카(케이지) 내부 치수. 예: 2.2 × 1.5 → 면적 3.3 m²</li>
              <li><b>호기 적재 사진</b>: 실제 적재 상태를 기록 (선택)</li>
            </ul>
            <HintNote>치수는 케이지 <b>내부 유효 공간</b> 기준으로 입력하세요 (벽체 두께 제외).</HintNote>
          </HelpHint>
        </div>
        <div className="input-grid">
          <div className="input-group">
            <div className="input-label-row"><span className="input-label">E/V 가로 (m)</span></div>
            <input className="input-field" type="number" step="0.1" min={0} value={basicInfo.evWidth ?? ''}
              onChange={e => updateElevatorBasic({ evWidth: e.target.value })} placeholder="예: 2.2" />
          </div>
          <div className="input-group">
            <div className="input-label-row"><span className="input-label">E/V 세로 (m)</span></div>
            <input className="input-field" type="number" step="0.1" min={0} value={basicInfo.evDepth ?? ''}
              onChange={e => updateElevatorBasic({ evDepth: e.target.value })} placeholder="예: 1.5" />
          </div>
          <div className="input-group full-width">
            <PhotoSection title="호기 적재 사진" photos={photos} onAdd={addPhoto} onRemove={removePhoto} />
          </div>
        </div>
      </div>

      {/* E/V 적재율 자동 계산 */}
      <div className="section-card">
        <div className="section-title">
          E/V 적재율 자동 계산
          <HelpHint title="E/V 적재율">
            <p>케이지 면적 대비 실제로 사용된 적재 면적의 비율입니다.</p>
            <HintFormula>{`E/V 면적     = 가로 × 세로                          [m²]
실 적재 면적 = Σ (가로 × 세로 × 개수) ÷ 적재 단수 [m²]
적재율(%)    = 실 적재 면적 ÷ E/V 면적 × 100`}</HintFormula>
            <p>아래 <b>실 적재 항목 입력</b>에서 박스/대차/파렛트/손수레 등 종류와 개수, 치수를 추가하세요.</p>
            <HintNote type="warn">100% 가까이 차면 운행 안전성에 영향이 있을 수 있습니다.</HintNote>
          </HelpHint>
        </div>
        <div className="input-grid">
          <div className="input-group">
            <div className="input-label-row"><span className="input-label">적재 단수</span></div>
            <input className="input-field" type="number" step="1" min={1} value={basicInfo.stackLevel ?? 4}
              onChange={e => updateElevatorBasic({ stackLevel: e.target.value })} placeholder="예: 4" />
          </div>
        </div>
        <div className="calc-grid">
          <div className="result-box tone-middle">
            <span className="result-box__label">실제 사용 적재 면적 = Σ(가로×세로×개수) ÷ {stackLevel}</span>
            <span className="result-box__value">{usedAreaM2 > 0 ? `${usedAreaM2.toFixed(1)} m²` : '—'}</span>
          </div>
          <div className="result-box tone-slate">
            <span className="result-box__label">E/V 면적 = 가로 × 세로</span>
            <span className="result-box__value">{evAreaM2 > 0 ? `${evAreaM2.toFixed(1)} m²` : '—'}</span>
          </div>
          <div className="result-box full-width tone-final">
            <span className="result-box__label">E/V 적재율 = 실적재 / E/V 면적</span>
            <span className="result-box__value">{loadingRate !== null ? `${loadingRate.toFixed(1)}%` : '—'}</span>
          </div>
        </div>

        {/* 적재 항목 입력 */}
        <div style={{ height: 1, background: 'var(--color-card-border)', margin: '14px 0' }} />
        <div className="section-title" style={{ marginBottom: 8 }}>실 적재 항목 입력</div>
        {loadItems.length === 0 && (
          <div style={{ textAlign: 'center', padding: 12, color: '#7C6E74', fontSize: '0.85rem' }}>
            아래 버튼으로 박스 / 대차 / 파렛트 항목을 추가해 주세요.
          </div>
        )}
        {loadItems.map((it, idx) => (
          <div key={it.id} className="section-card" style={{ background: 'white', margin: '0 0 10px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>적재 #{idx + 1}</span>
              <button onClick={() => removeElevatorLoadItem(it.id)}
                style={{ border: 'none', background: 'none', color: '#9C8E94', fontSize: '1.1rem', cursor: 'pointer' }}>🗑️</button>
            </div>
            <div className="input-grid">
              <div className="input-group">
                <div className="input-label-row"><span className="input-label">종류</span></div>
                <select className="input-field" value={it.type}
                  onChange={e => updateElevatorLoadItem(it.id, { type: e.target.value })}>
                  {ITEM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="input-group">
                <div className="input-label-row"><span className="input-label">개수</span></div>
                <input className="input-field" type="number" min={1} value={it.qty}
                  onChange={e => updateElevatorLoadItem(it.id, { qty: e.target.value })} />
              </div>
              <div className="input-group">
                <div className="input-label-row"><span className="input-label">가로 (m)</span></div>
                <input className="input-field" type="number" step="0.1" min={0} value={it.width}
                  onChange={e => updateElevatorLoadItem(it.id, { width: e.target.value })} placeholder="예: 1.2" />
              </div>
              <div className="input-group">
                <div className="input-label-row"><span className="input-label">세로 (m)</span></div>
                <input className="input-field" type="number" step="0.1" min={0} value={it.depth}
                  onChange={e => updateElevatorLoadItem(it.id, { depth: e.target.value })} placeholder="예: 0.8" />
              </div>
            </div>
          </div>
        ))}
        <button className="btn" style={{ width: '100%', background: '#FDF2F4', color: '#A50034', border: '1px solid #E8C5CC', marginTop: 4 }}
          onClick={addElevatorLoadItem}>＋ 적재 항목 추가</button>
      </div>

      {/* 측정 결과 (평균 1회 × 시간당 공급횟수) */}
      <div className="section-card">
        <div className="section-title">
          측정 결과 <span className="sub-title">| 평균 1회 측정 × 시간당 공급횟수 ({measurements.length}회 측정)</span>
          <HelpHint title="측정 결과">
            <p>1시간 내내 측정하기 어렵기 때문에, <b>몇 회 측정한 평균 1회 운반 시간</b>에
              <b> 시간당 공급횟수</b>를 곱해 1시간 부하율을 환산합니다.</p>
            <HintFormula>{`평균 1회 운반 시간 = Σ(로딩+이동+언로딩+회수) ÷ 측정 횟수
시간당 점유 시간 = 평균 1회 운반 시간 × 시간당 공급횟수
부하율(%) = 시간당 점유 시간 ÷ (3600 × 가중치) × 100`}</HintFormula>
            <p><b>판정 기준</b>: ~70% 여유 / 70~90% 적정 / 90% 초과 과부하</p>
            <HintNote type="ok">원단위 기준 시간당 공급횟수를 입력해야 부하율이 계산됩니다.</HintNote>
          </HelpHint>
        </div>
        <div className="input-grid">
          <div className="input-group">
            <div className="input-label-row"><span className="input-label">E/V 부하 가중치 (0~1)</span></div>
            <select className="input-field" value={basicInfo.weight ?? 0.8}
              onChange={e => updateElevatorBasic({ weight: parseFloat(e.target.value) })}>
              {WEIGHT_OPTIONS.map(w => <option key={w} value={w}>{w.toFixed(1)}</option>)}
            </select>
          </div>
          <div className="input-group">
            <div className="input-label-row"><span className="input-label">시간당 공급횟수 (회/h)</span></div>
            <input className="input-field" type="number" step="0.1" min={0} value={basicInfo.supplyPerHour ?? 1}
              onChange={e => updateElevatorBasic({ supplyPerHour: e.target.value })} placeholder="원단위 기준 1시간당 공급 횟수 (기본 1)" />
          </div>
          <div className="result-box tone-final">
            <span className="result-box__label">평균 1회 운반 시간</span>
            <span className="result-box__value">{avgCycleSec.toFixed(1)}초</span>
          </div>
          <div className="result-box tone-blue">
            <span className="result-box__label">시간당 점유 시간 = 평균 1회 × 공급횟수</span>
            <span className="result-box__value">{hourlyBusySec.toFixed(1)}초</span>
          </div>
          <div className="result-box tone-blue">
            <span className="result-box__label">누적 이동 시간</span>
            <span className="result-box__value">{moveSec.toFixed(1)}초</span>
          </div>
          <div className="result-box tone-slate">
            <span className="result-box__label">부하 가중 시간 = 3600 × {weight}</span>
            <span className="result-box__value">{weightedTime.toFixed(0)}초</span>
          </div>
          <div className="result-box full-width tone-final">
            <span className="result-box__label">E/V 부하율</span>
            <span className="result-box__value">{workloadRate.toFixed(1)}%</span>
          </div>
        </div>
      </div>

      {/* 측정 내역 (회차) */}
      <div className="section-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
          <div className="section-title" style={{ marginBottom: 0, border: 'none', paddingBottom: 0 }}>
            측정 내역 <span className="sub-title">| {measurements.length}회 중 {activeIndex || 0}회차</span>
            <HelpHint title="측정 내역">
              <p>한 사이클을 4단계로 측정합니다.</p>
              <ul style={{ paddingLeft: 18, margin: '6px 0' }}>
                <li><b>① 로딩</b>: E/V 안에 짐을 싣는 시간 + 자재 종수</li>
                <li><b>② 이동</b>: 층간 이동 시간 (1~10층 선택)</li>
                <li><b>③ 언로딩</b>: 도착 층에서 짐을 내리는 시간 (공정 번호)</li>
                <li><b>④ 회수</b>: 빈 차로 출발 층 복귀</li>
              </ul>
              <p>▶ 시작 → 작업 → ⏹ 종료. + 탭으로 다음 회차 추가.</p>
              <HintNote>9호기까지 각각 독립 측정 가능. 호기를 바꿔도 데이터는 보존됩니다.</HintNote>
            </HelpHint>
          </div>
          {measurements.length > 1 && (
            <button className="btn" onClick={() => handleDeleteCycle(effectiveCycleId)}
              style={{ height: 32, padding: '0 12px', background: '#FEF3C7', color: '#B45309', fontSize: '0.78rem' }}>
              🗑️ 회차삭제
            </button>
          )}
        </div>

        <div className="cycle-tabs-container">
          {measurements.map((m, idx) => (
            <button
              key={m.id}
              onClick={() => setActiveCycleId(m.id)}
              className={`cycle-tab-btn ${effectiveCycleId === m.id ? 'active' : ''}`}
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
            onStart={() => updateElevatorCycleCard(effectiveCycleId, card.id, { start: Date.now(), end: null })}
            onEnd={() => updateElevatorCycleCard(effectiveCycleId, card.id, { end: Date.now() })}
            onDelete={() => {
              if (window.confirm('이 카드를 삭제하시겠습니까?')) {
                removeElevatorCard(effectiveCycleId, card.id)
              }
            }}
            extraInputs={
              card.type === 'load' ? (
                <div className="input-group">
                  <span className="input-label">자재 종수</span>
                  <input className="input-field" type="number" min={0} value={card.materialCount ?? ''}
                    onChange={e => updateElevatorCycleCard(effectiveCycleId, card.id, { materialCount: e.target.value })} />
                </div>
              ) : card.type === 'move' ? (
                <div className="input-group">
                  <span className="input-label">층 선택 (1~10)</span>
                  <select className="input-field" value={card.floorNo ?? 1}
                    onChange={e => updateElevatorCycleCard(effectiveCycleId, card.id, { floorNo: parseInt(e.target.value) })}>
                    {Array.from({ length: 10 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}층</option>)}
                  </select>
                </div>
              ) : card.type === 'unload' ? (
                <div className="input-group">
                  <span className="input-label">공정 번호 (1~10)</span>
                  <select className="input-field" value={card.processNo ?? 1}
                    onChange={e => updateElevatorCycleCard(effectiveCycleId, card.id, { processNo: parseInt(e.target.value) })}>
                    {Array.from({ length: 10 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}공정</option>)}
                  </select>
                </div>
              ) : null
            }
          />
        ))}

        <div className="input-grid" style={{ marginTop: 12, gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 6 }}>
          <button className="btn" style={{ background: COLORS.load, color: 'white', fontSize: '0.85rem' }} onClick={() => effectiveCycleId && addElevatorCard(effectiveCycleId, 'load')}>+ 로딩</button>
          <button className="btn" style={{ background: COLORS.move, color: 'white', fontSize: '0.85rem' }} onClick={() => effectiveCycleId && addElevatorCard(effectiveCycleId, 'move')}>+ 이동</button>
          <button className="btn" style={{ background: COLORS.unload, color: 'white', fontSize: '0.85rem' }} onClick={() => effectiveCycleId && addElevatorCard(effectiveCycleId, 'unload')}>+ 언로딩</button>
          <button className="btn" style={{ background: COLORS.recovery, color: 'white', fontSize: '0.85rem' }} onClick={() => effectiveCycleId && addElevatorCard(effectiveCycleId, 'recovery')}>+ 회수</button>
        </div>
      </div>

      {/* 호기별 그래프 */}
      {hogiStats.some(h => h.totalT > 0) && (
        <div style={{ marginTop: 24, paddingTop: 16, borderTop: '2px dashed #e2e8f0' }}>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-primary-dark)', textAlign: 'center', padding: '8px 16px 12px' }}>
            🛗 호기별 부하 분석 대시보드
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
            {Object.entries({ '로딩': COLORS.load, '이동': COLORS.move, '언로딩': COLORS.unload, '회수': COLORS.recovery }).map(([label, color]) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 12, height: 12, background: color, borderRadius: 2 }} />
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#7C6E74' }}>{label}</span>
              </div>
            ))}
          </div>

          <div className="section-card" style={{ background: 'white' }}>
            <div className="section-title">호기별 작업 시간 (초)</div>
            <div style={{ display: 'flex', height: 220, gap: 8, alignItems: 'flex-end', margin: '32px 0 24px 0', borderBottom: '1px dashed #D4C8CD' }}>
              {hogiStats.map(h => {
                const heightPct = maxT > 0 ? Math.max(2, (h.totalT / maxT) * 100) : 2
                return (
                  <div key={h.hogi} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: `${heightPct}%`, position: 'relative', minWidth: 0 }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 800, position: 'absolute', top: -22, color: 'var(--color-text-primary)' }}>{h.totalT.toFixed(0)}s</div>
                    <div style={{ width: '100%', maxWidth: 36, height: '100%', display: 'flex', flexDirection: 'column-reverse', borderRadius: '4px 4px 0 0', overflow: 'hidden', background: '#F1F5F9' }}>
                      {renderSeg(h.loadT, h.totalT, COLORS.load)}
                      {renderSeg(h.moveT2, h.totalT, COLORS.move)}
                      {renderSeg(h.unloadT, h.totalT, COLORS.unload)}
                      {renderSeg(h.recoverT, h.totalT, COLORS.recovery)}
                    </div>
                    <div style={{ position: 'absolute', bottom: -22, fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: 700, textAlign: 'center', width: '100%' }}>{h.hogi}호기</div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="section-card" style={{ background: 'white' }}>
            <div className="section-title">호기별 부하율 (%)</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {hogiStats.map(h => {
                const wlColor = h.wlRate > 90 ? '#B45309' : h.wlRate > 70 ? '#ea580c' : '#047857'
                return (
                  <div key={h.hogi} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 60, fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-text-secondary)' }}>{h.hogi}호기</span>
                    <div style={{ flex: 1, height: 22, background: '#F1F5F9', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ width: `${Math.min(100, h.wlRate)}%`, height: '100%', background: wlColor, transition: 'width .3s' }} />
                    </div>
                    <span style={{ width: 56, fontSize: '0.82rem', fontWeight: 800, color: wlColor, textAlign: 'right' }}>{h.wlRate.toFixed(1)}%</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
