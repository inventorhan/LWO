import { useState } from 'react'
import { n, fmtN } from '../shared/utils/common'
import HelpHint, { HintFormula, HintNote } from '../shared/components/HelpHint'

const newAmrItem = () => ({
  id: `amr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  itemName: '',
  tactTime: '', recycleRate: '', loadQty: '',
  amrtSpeed: '', distance: '',
  loadCount: '', loadTime: '', unloadCount: '', unloadTime: ''
})

/* 레거시 단일(평면) 데이터 → 아이템 1개로 시드 */
const seedFromLegacy = (d) => ({
  id: 'amr-default',
  itemName: '',
  tactTime: d.tactTime || '',
  recycleRate: d.recycleRate || '',
  loadQty: d.loadQty || '',
  amrtSpeed: d.amrtSpeed || '',
  distance: d.distance || '',
  loadCount: d.loadCount || '',
  loadTime: d.loadTime || '',
  unloadCount: d.unloadCount || '',
  unloadTime: d.unloadTime || ''
})

/* 아이템(구역) 1개의 AMR 원단위(대) 산출 */
const calcItem = (it) => {
  const uph = n(it.tactTime) > 0 ? (3600 / n(it.tactTime)) * (n(it.recycleRate) / 100) : 0
  const runCount = n(it.loadQty) > 0 ? uph / n(it.loadQty) : 0
  const cycle = runCount > 0 ? 3600 / runCount : 0
  const roundTripDist = n(it.distance) * 2
  const totalLoadSec = n(it.loadCount) * n(it.loadTime)
  const totalUnloadSec = n(it.unloadCount) * n(it.unloadTime)
  const totalLoadUnloadSec = totalLoadSec + totalUnloadSec
  const roundTripSec = n(it.amrtSpeed) > 0 ? (roundTripDist / n(it.amrtSpeed)) + totalLoadUnloadSec : 0
  const roundTripMin = roundTripSec / 60
  const baseRaw = cycle > 0 ? roundTripSec / cycle : 0
  return { uph, runCount, cycle, roundTripDist, totalLoadSec, totalUnloadSec, totalLoadUnloadSec, roundTripSec, roundTripMin, baseRaw }
}

export default function AmrCalculation({ data, updateData }) {
  const f = data || {}
  const items = f.items?.length ? f.items : [seedFromLegacy(f)]
  const [activeIdx, setActiveIdx] = useState(0)
  const safeIdx = Math.min(activeIdx, Math.max(0, items.length - 1))
  const active = items[safeIdx]

  const setItems = (next) => updateData({ items: typeof next === 'function' ? next(items) : next })
  const updateItem = (id, upd) => setItems(list => list.map(it => it.id === id ? { ...it, ...upd } : it))
  const setActive = (upd) => updateItem(active.id, upd)

  const addItem = () => {
    const next = [...items, newAmrItem()]
    setItems(next)
    setActiveIdx(next.length - 1)
  }
  const removeItem = (id) => {
    if (!window.confirm('이 아이템(구역)을 삭제하시겠습니까?')) return
    if (items.length <= 1) {
      setItems([newAmrItem()])
      setActiveIdx(0)
    } else {
      setItems(items.filter(it => it.id !== id))
      setActiveIdx(Math.max(0, safeIdx - 1))
    }
  }

  /* ── 아이템별 산출 + 합산 ── */
  const calcs = items.map(calcItem)
  const activeCalc = calcs[safeIdx] || calcItem(active)
  const totalBaseRaw = calcs.reduce((s, c) => s + c.baseRaw, 0)

  const margin = n(f.operationRate) || 1.2
  const adjustedRaw = totalBaseRaw * margin
  const amrAdjustedUnits = adjustedRaw > 0 ? Math.ceil(adjustedRaw) : 0
  const amrRequired = amrAdjustedUnits + n(f.spare)

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <div className="module-title">AMR 대수 산출</div>

      {/* 아이템(구역) 탭 */}
      <div className="section-card">
        <div className="module-action-bar">
          <div className="section-title" style={{ marginBottom: 0, border: 'none', padding: 0 }}>
            아이템(구역) 선택 <span className="sub-title">| {items.length}개</span>
            <HelpHint title="아이템(구역) 선택">
              <p>여러 아이템을 <b>여러 구역</b>에서 공급하는 조건을 각각 입력합니다.</p>
              <ul style={{ paddingLeft: 18, margin: '6px 0' }}>
                <li>아이템(구역)별로 생산수량·운행 조건이 독립적으로 저장됩니다.</li>
                <li>아이템별 <b>AMR 원단위(대)</b>를 모두 합산해 총 필요 대수를 산출합니다.</li>
              </ul>
              <HintNote>예: 아이템1 0.2대 + 아이템2 0.4대 + 아이템3 0.2대 → 총 0.8대 → 올림 1대 (+Spare)</HintNote>
            </HelpHint>
          </div>
        </div>
        <div className="item-tabs">
          {items.map((item, idx) => (
            <button key={item.id} className={`mini-tab ${idx === safeIdx ? 'active' : ''}`} onClick={() => setActiveIdx(idx)}>
              {item.itemName || `아이템-${idx + 1}`}
            </button>
          ))}
          <button className="mini-tab add" onClick={addItem}>+ 아이템 추가</button>
        </div>
      </div>

      {/* 활성 아이템 입력 */}
      <div className="section-card">
        <div className="warehouse-item__head">
          <strong>{active.itemName || `아이템 ${safeIdx + 1}`}</strong>
          <button className="mini-btn" onClick={() => removeItem(active.id)}>삭제</button>
        </div>
        <div className="input-grid">
          <div className="input-group full-width">
            <div className="input-label-row"><span className="input-label">아이템(구역) 이름</span></div>
            <input className="input-field" value={active.itemName}
              onChange={e => setActive({ itemName: e.target.value })} placeholder="예: A구역 Lotte(BW)" />
          </div>
        </div>
      </div>

      {/* 1) 생산 수량 정보 */}
      <div className="section-card">
        <div className="section-title">
          생산 수량 정보
          <HelpHint title="생산 수량 정보">
            <p>AMR이 1시간에 몇 번 왕복해야 하는지 결정하는 <b>기준 사이클</b>을 산출합니다.</p>
            <HintFormula>{`UPH        = (3600 ÷ Tact) × 회수율
운행 횟수   = UPH ÷ 장입 수량
Cycle Time = 3600 ÷ 운행 횟수`}</HintFormula>
            <ul style={{ paddingLeft: 18, margin: '6px 0' }}>
              <li><b>Tact Time (초)</b>: 1개 생산 표준 시간</li>
              <li><b>회수율 (%)</b>: 양품 비율 (예: 90)</li>
              <li><b>장입 수량 (개/회)</b>: AMR 1회당 운반 가능 수</li>
            </ul>
            <HintNote>Cycle Time 안에 AMR이 한 번 왕복을 끝내야 합니다.</HintNote>
          </HelpHint>
        </div>
        <div className="input-grid">
          <div className="input-group">
            <div className="input-label-row"><span className="input-label">Tact Time (초)</span></div>
            <input className="input-field" type="number" step="0.1" min={0} value={active.tactTime || ''}
              onChange={e => setActive({ tactTime: e.target.value })} placeholder="초" />
          </div>
          <div className="input-group">
            <div className="input-label-row"><span className="input-label">회수율 (%)</span></div>
            <input className="input-field" type="number" step="0.1" min={0} max={100} value={active.recycleRate || ''}
              onChange={e => setActive({ recycleRate: e.target.value })} placeholder="예: 90" />
          </div>
          <div className="input-group">
            <div className="input-label-row"><span className="input-label">장입 수량 (개/회)</span></div>
            <input className="input-field" type="number" step="0.1" min={0} value={active.loadQty || ''}
              onChange={e => setActive({ loadQty: e.target.value })} />
          </div>
        </div>
        <div className="calc-grid calc-grid--three">
          <div className="result-box tone-slate">
            <span className="result-box__label">UPH = (3600 / Tact) × 회수율</span>
            <span className="result-box__value">{fmtN(activeCalc.uph, '', 1)}</span>
          </div>
          <div className="result-box tone-slate">
            <span className="result-box__label">AMR 운행 횟수 = UPH / 장입수량</span>
            <span className="result-box__value">{fmtN(activeCalc.runCount, '회', 1)}</span>
          </div>
          <div className="result-box tone-final">
            <span className="result-box__label">AMR 1회 Cycle Time = 3600 / 운행횟수</span>
            <span className="result-box__value">{fmtN(activeCalc.cycle, '초', 1)}</span>
          </div>
        </div>
      </div>

      {/* 2) AMR 운행 산출 */}
      <div className="section-card">
        <div className="section-title">
          AMR 운행 산출
          <HelpHint title="AMR 운행 산출">
            <p>AMR이 1회 왕복하는 데 걸리는 시간을 구성하는 <b>이동·로딩·언로딩</b> 시간을 입력합니다.</p>
            <HintFormula>{`왕복 거리       = 편도 거리 × 2
Total 로딩      = 로딩 횟수 × 시간
Total 언로딩    = 언로딩 횟수 × 시간`}</HintFormula>
            <ul style={{ paddingLeft: 18, margin: '6px 0' }}>
              <li><b>AMR Speed (m/s)</b>: 기종 사양 (보통 1.0~2.0)</li>
              <li><b>로딩/언로딩 횟수</b>: 1 사이클 내 발생 횟수 (다중 적재 시 &gt;1)</li>
            </ul>
            <HintNote>로딩·언로딩 시간은 AMR이 정지한 상태에서 소요되는 시간만 포함합니다.</HintNote>
          </HelpHint>
        </div>

        <div className="input-grid">
          <div className="input-group">
            <div className="input-label-row"><span className="input-label">AMR Speed (m/s)</span></div>
            <input className="input-field" type="number" step="0.1" min={0} value={active.amrtSpeed || ''}
              onChange={e => setActive({ amrtSpeed: e.target.value })} />
          </div>
          <div className="input-group">
            <div className="input-label-row"><span className="input-label">AMR 이동 거리 (m, 편도)</span></div>
            <input className="input-field" type="number" step="0.1" min={0} value={active.distance || ''}
              onChange={e => setActive({ distance: e.target.value })} />
          </div>
          <div className="result-box full-width tone-blue">
            <span className="result-box__label">왕복 이동 거리 = 거리 × 2</span>
            <span className="result-box__value">{fmtN(activeCalc.roundTripDist, 'm', 1)}</span>
          </div>
        </div>

        <div style={{ height: 1, background: 'var(--color-card-border)', margin: '14px 0' }} />
        <div className="input-grid">
          <div className="input-group">
            <div className="input-label-row"><span className="input-label">로딩 횟수</span></div>
            <input className="input-field" type="number" step="0.1" min={0} value={active.loadCount || ''}
              onChange={e => setActive({ loadCount: e.target.value })} />
          </div>
          <div className="input-group">
            <div className="input-label-row"><span className="input-label">로딩 시간 (초/회)</span></div>
            <input className="input-field" type="number" step="0.1" min={0} value={active.loadTime || ''}
              onChange={e => setActive({ loadTime: e.target.value })} />
          </div>
          <div className="result-box full-width tone-final">
            <span className="result-box__label">Total 로딩 시간</span>
            <span className="result-box__value">{fmtN(activeCalc.totalLoadSec, '초', 1)}</span>
          </div>
        </div>

        <div style={{ height: 1, background: 'var(--color-card-border)', margin: '14px 0' }} />
        <div className="input-grid">
          <div className="input-group">
            <div className="input-label-row"><span className="input-label">언로딩 횟수</span></div>
            <input className="input-field" type="number" step="0.1" min={0} value={active.unloadCount || ''}
              onChange={e => setActive({ unloadCount: e.target.value })} />
          </div>
          <div className="input-group">
            <div className="input-label-row"><span className="input-label">언로딩 시간 (초/회)</span></div>
            <input className="input-field" type="number" step="0.1" min={0} value={active.unloadTime || ''}
              onChange={e => setActive({ unloadTime: e.target.value })} />
          </div>
          <div className="result-box full-width tone-final">
            <span className="result-box__label">Total 언로딩 시간</span>
            <span className="result-box__value">{fmtN(activeCalc.totalUnloadSec, '초', 1)}</span>
          </div>
        </div>

        <div style={{ height: 1, background: 'var(--color-card-border)', margin: '14px 0' }} />
        <div className="input-grid">
          <div className="result-box full-width tone-final">
            <span className="result-box__label">Total 로딩 + 언로딩 시간</span>
            <span className="result-box__value">{fmtN(activeCalc.totalLoadUnloadSec, '초', 1)}</span>
          </div>
        </div>
      </div>

      {/* 3) AMR 왕복 이동 시간 + 이 아이템 원단위 */}
      <div className="section-card">
        <div className="section-title">
          AMR 총 왕복시간 산출 <span className="sub-title">| 이 아이템 원단위</span>
          <HelpHint title="AMR 총 왕복시간 산출">
            <p>위에서 입력한 거리·속도·로딩/언로딩 시간을 합산한 <b>실제 왕복 소요 시간</b>과
              이 아이템의 <b>AMR 원단위(대)</b>입니다.</p>
            <HintFormula>{`총 왕복 시간(초) = (왕복 거리 ÷ Speed) + Total 로딩 + Total 언로딩
AMR 원단위(대)   = 총 왕복 시간 ÷ Cycle Time`}</HintFormula>
            <HintNote type="warn">아이템별 원단위는 소수로 누적되며, 하단에서 모두 합산됩니다.</HintNote>
          </HelpHint>
        </div>
        <div className="input-grid">
          <div className="result-box tone-final">
            <span className="result-box__label">총 왕복시간(초) = (왕복거리 / Speed) + 로딩언로딩</span>
            <span className="result-box__value">{fmtN(activeCalc.roundTripSec, '초', 1)}</span>
          </div>
          <div className="result-box tone-blue">
            <span className="result-box__label">총 왕복시간(분)</span>
            <span className="result-box__value">{fmtN(activeCalc.roundTripMin, '분', 2)}</span>
          </div>
          <div className="result-box full-width tone-final">
            <span className="result-box__label">이 아이템 AMR 원단위 = 총 왕복시간 ÷ Cycle Time</span>
            <span className="result-box__value">{fmtN(activeCalc.baseRaw, '대', 2)}</span>
          </div>
        </div>
      </div>

      {/* 4) 실제 AMR 필요 대수 — 전체 아이템 합산 */}
      <div className="section-card">
        <div className="section-title">
          실제 AMR 필요 대수 <span className="sub-title">| 전체 아이템(구역) 합산</span>
          <HelpHint title="실제 AMR 필요 대수">
            <p>모든 아이템(구역)의 원단위를 합산한 뒤, 여유율과 예비 대수를 반영한
              <b> 최종 도입 필요 대수</b>입니다.</p>
            <HintFormula>{`총 원단위    = Σ (아이템별 AMR 원단위)
여유율 적용  = ⌈ 총 원단위 × AMR 여유율 ⌉
필요 대수    = 여유율 적용 + Spare(예비)`}</HintFormula>
            <ul style={{ paddingLeft: 18, margin: '6px 0' }}>
              <li><b>AMR 여유율</b>: 0.9, 1.2, 1.8처럼 소수점으로 직접 입력</li>
              <li><b>Spare</b>: 갑작스러운 고장 대비 (보통 1)</li>
            </ul>
            <HintNote type="ok">여유율·올림·Spare는 전체 합산 원단위에 한 번만 적용됩니다.</HintNote>
          </HelpHint>
        </div>

        {/* 아이템별 원단위 목록 */}
        <div className="input-grid">
          {items.map((it, idx) => (
            <div key={it.id} className="result-box tone-slate">
              <span className="result-box__label">{it.itemName || `아이템-${idx + 1}`} 원단위</span>
              <span className="result-box__value">{fmtN(calcs[idx].baseRaw, '대', 2)}</span>
            </div>
          ))}
          <div className="result-box full-width tone-blue">
            <span className="result-box__label">총 원단위 = Σ 아이템별 원단위</span>
            <span className="result-box__value">{fmtN(totalBaseRaw, '대', 2)}</span>
          </div>
        </div>

        <div style={{ height: 1, background: 'var(--color-card-border)', margin: '14px 0' }} />
        <div className="input-grid">
          <div className="input-group">
            <div className="input-label-row"><span className="input-label">AMR 여유율</span></div>
            <input className="input-field" type="number" min={0} step="0.1" value={f.operationRate ?? 1.2}
              onChange={e => updateData({ operationRate: e.target.value })} placeholder="예: 1.2" />
          </div>
          <div className="input-group">
            <div className="input-label-row"><span className="input-label">AMR Spare (대)</span></div>
            <input className="input-field" type="number" min={0} value={f.spare ?? 1}
              onChange={e => updateData({ spare: e.target.value })} />
          </div>

          <div className="result-box tone-blue full-width">
            <span className="result-box__label">여유율 적용 AMR 수량 = 총 원단위 × AMR 여유율 (소수 → 올림)</span>
            <span className="result-box__value">
              {adjustedRaw > 0
                ? <>{adjustedRaw.toFixed(2)} → <span style={{ color: '#F59E0B' }}>{amrAdjustedUnits}대</span></>
                : '—'}
            </span>
          </div>
          <div className="result-box full-width tone-final" style={{ padding: '14px 16px' }}>
            <span className="result-box__label" style={{ fontSize: '0.85rem' }}>
              ⭐ AMR 필요 대수 = ⌈ 총 원단위 × 여유율 ⌉ + Spare
            </span>
            <span className="result-box__value" style={{ fontSize: '1.5rem' }}>
              {amrRequired > 0 ? `${amrRequired}대` : '—'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
