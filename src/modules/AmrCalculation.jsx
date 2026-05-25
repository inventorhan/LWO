import { useMemo } from 'react'
import { n, fmtN } from '../shared/utils/common'
import HelpHint, { HintFormula, HintNote } from '../shared/components/HelpHint'

export default function AmrCalculation({ data, updateData }) {
  const f = data || {}
  const set = (k, v) => updateData({ [k]: v })

  /* ── 생산 수량 (UPH / 운행횟수 / Cycle) ── */
  const uph = useMemo(() => {
    const tt = n(f.tactTime)
    const rr = n(f.recycleRate) / 100
    return tt > 0 ? (3600 / tt) * rr : 0
  }, [f.tactTime, f.recycleRate])

  const amrRunCount  = useMemo(() => n(f.loadQty) > 0 ? uph / n(f.loadQty) : 0, [uph, f.loadQty])
  /* AMR 1회 Cycle Time = 3600 / 운행횟수 (PPT 산식) */
  const amrCycleTime = useMemo(() => amrRunCount > 0 ? 3600 / amrRunCount : 0, [amrRunCount])

  /* ── 왕복 이동 시간 ── */
  const roundTripDist = useMemo(() => n(f.distance) * 2, [f.distance])
  const totalLoadSec  = useMemo(() => n(f.loadCount) * n(f.loadTime), [f.loadCount, f.loadTime])
  const totalUnloadSec = useMemo(() => n(f.unloadCount) * n(f.unloadTime), [f.unloadCount, f.unloadTime])
  const totalLoadUnloadSec = totalLoadSec + totalUnloadSec

  const roundTripSec = useMemo(() => {
    const speed = n(f.amrtSpeed)
    return speed > 0 ? (roundTripDist / speed) + totalLoadUnloadSec : 0
  }, [roundTripDist, f.amrtSpeed, totalLoadUnloadSec])

  const roundTripMin = roundTripSec / 60

  /* ── 필요 대수 (PPT 요청: 1.2대 → Round-up → 2대, +Spare) ── */
  /* 원단위 = 왕복시간 / Cycle (실수). 여유율을 곱한 뒤 ceil 하여 최종 대수 */
  const baseRaw = useMemo(() =>
    amrCycleTime > 0 ? roundTripSec / amrCycleTime : 0,
    [roundTripSec, amrCycleTime]
  )

  const amrMargin = n(f.operationRate) || 1.2
  const adjustedRaw = baseRaw * amrMargin
  /* 결과가 1.2대 이면 무조건 2대로 — Math.ceil */
  const amrBaseUnits = baseRaw > 0 ? Math.ceil(baseRaw) : 0
  const amrAdjustedUnits = adjustedRaw > 0 ? Math.ceil(adjustedRaw) : 0
  const amrRequired = amrAdjustedUnits + n(f.spare)

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <div className="module-title">AMR 대수 산출</div>

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
            <input className="input-field" type="number" step="0.1" min={0} value={f.tactTime || ''}
              onChange={e => set('tactTime', e.target.value)} placeholder="초" />
          </div>
          <div className="input-group">
            <div className="input-label-row"><span className="input-label">회수율 (%)</span></div>
            <input className="input-field" type="number" step="0.1" min={0} max={100} value={f.recycleRate || ''}
              onChange={e => set('recycleRate', e.target.value)} placeholder="예: 90" />
          </div>
          <div className="input-group">
            <div className="input-label-row"><span className="input-label">장입 수량 (개/회)</span></div>
            <input className="input-field" type="number" step="0.1" min={0} value={f.loadQty || ''}
              onChange={e => set('loadQty', e.target.value)} />
          </div>
        </div>
        <div className="calc-grid calc-grid--three">
          <div className="result-box tone-slate">
            <span className="result-box__label">UPH = (3600 / Tact) × 회수율</span>
            <span className="result-box__value">{fmtN(uph, '', 1)}</span>
          </div>
          <div className="result-box tone-slate">
            <span className="result-box__label">AMR 운행 횟수 = UPH / 장입수량</span>
            <span className="result-box__value">{fmtN(amrRunCount, '회', 1)}</span>
          </div>
          <div className="result-box tone-final">
            <span className="result-box__label">AMR 1회 Cycle Time = 3600 / 운행횟수</span>
            <span className="result-box__value">{fmtN(amrCycleTime, '초', 1)}</span>
          </div>
        </div>
      </div>

      {/* 2) AMR 운행 산출 — 왕복거리 / 로딩 / 언로딩 그룹화 */}
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

        {/* AMR Speed + 이동거리 (나란히) */}
        <div className="input-grid">
          <div className="input-group">
            <div className="input-label-row"><span className="input-label">AMR Speed (m/s)</span></div>
            <input className="input-field" type="number" step="0.1" min={0} value={f.amrtSpeed || ''}
              onChange={e => set('amrtSpeed', e.target.value)} />
          </div>
          <div className="input-group">
            <div className="input-label-row"><span className="input-label">AMR 이동 거리 (m, 편도)</span></div>
            <input className="input-field" type="number" step="0.1" min={0} value={f.distance || ''}
              onChange={e => set('distance', e.target.value)} />
          </div>
          <div className="result-box full-width tone-blue">
            <span className="result-box__label">왕복 이동 거리 = 거리 × 2</span>
            <span className="result-box__value">{fmtN(roundTripDist, 'm', 1)}</span>
          </div>
        </div>

        {/* 로딩 그룹: 횟수 + 시간(나란히) → Total */}
        <div style={{ height: 1, background: 'var(--color-card-border)', margin: '14px 0' }} />
        <div className="input-grid">
          <div className="input-group">
            <div className="input-label-row"><span className="input-label">로딩 횟수</span></div>
            <input className="input-field" type="number" step="0.1" min={0} value={f.loadCount || ''}
              onChange={e => set('loadCount', e.target.value)} />
          </div>
          <div className="input-group">
            <div className="input-label-row"><span className="input-label">로딩 시간 (초/회)</span></div>
            <input className="input-field" type="number" step="0.1" min={0} value={f.loadTime || ''}
              onChange={e => set('loadTime', e.target.value)} />
          </div>
          <div className="result-box full-width tone-final">
            <span className="result-box__label">Total 로딩 시간</span>
            <span className="result-box__value">{fmtN(totalLoadSec, '초', 1)}</span>
          </div>
        </div>

        {/* 언로딩 그룹: 횟수 + 시간(나란히) → Total */}
        <div style={{ height: 1, background: 'var(--color-card-border)', margin: '14px 0' }} />
        <div className="input-grid">
          <div className="input-group">
            <div className="input-label-row"><span className="input-label">언로딩 횟수</span></div>
            <input className="input-field" type="number" step="0.1" min={0} value={f.unloadCount || ''}
              onChange={e => set('unloadCount', e.target.value)} />
          </div>
          <div className="input-group">
            <div className="input-label-row"><span className="input-label">언로딩 시간 (초/회)</span></div>
            <input className="input-field" type="number" step="0.1" min={0} value={f.unloadTime || ''}
              onChange={e => set('unloadTime', e.target.value)} />
          </div>
          <div className="result-box full-width tone-final">
            <span className="result-box__label">Total 언로딩 시간</span>
            <span className="result-box__value">{fmtN(totalUnloadSec, '초', 1)}</span>
          </div>
        </div>

        {/* 로딩+언로딩 합계 */}
        <div style={{ height: 1, background: 'var(--color-card-border)', margin: '14px 0' }} />
        <div className="input-grid">
          <div className="result-box full-width tone-final">
            <span className="result-box__label">Total 로딩 + 언로딩 시간</span>
            <span className="result-box__value">{fmtN(totalLoadUnloadSec, '초', 1)}</span>
          </div>
        </div>
      </div>

      {/* 3) AMR 왕복 이동 시간 산출 */}
      <div className="section-card">
        <div className="section-title">
          AMR 총 왕복시간 산출 <span className="sub-title">| AMR Cycle Time</span>
          <HelpHint title="AMR 총 왕복시간 산출">
            <p>위에서 입력한 거리·속도·로딩/언로딩 시간을 합산한 <b>실제 왕복 소요 시간</b>입니다.</p>
            <HintFormula>{`총 왕복 시간(초) = (왕복 거리 ÷ Speed)
                  + Total 로딩
                  + Total 언로딩`}</HintFormula>
            <HintNote type="warn">이 값이 Cycle Time보다 크면 AMR 1대로 부족 → 다음 섹션에서 필요 대수가 늘어납니다.</HintNote>
          </HelpHint>
        </div>
        <div className="input-grid">
          <div className="result-box tone-final">
            <span className="result-box__label">총 왕복시간(초) = (왕복거리 / Speed) + 로딩언로딩</span>
            <span className="result-box__value">{fmtN(roundTripSec, '초', 1)}</span>
          </div>
          <div className="result-box tone-blue">
            <span className="result-box__label">총 왕복시간(분)</span>
            <span className="result-box__value">{fmtN(roundTripMin, '분', 2)}</span>
          </div>
        </div>
      </div>

      {/* 4) 실제 AMR 필요 대수 — 여유율 입력 + Round-up + Spare */}
      <div className="section-card">
        <div className="section-title">
          실제 AMR 필요 대수
          <HelpHint title="실제 AMR 필요 대수">
            <p>여유율과 예비 대수를 반영한 <b>최종 도입 필요 대수</b>입니다.</p>
            <HintFormula>{`원단위        = 총 왕복시간 ÷ Cycle
                (원단위는 소수와 올림값을 함께 표시)
여유율 적용  = 원단위 × AMR 여유율
                (충전·수리·동선 여유 보정)
필요 대수    = ⌈ 여유율 적용 ⌉ + Spare(예비)`}</HintFormula>
            <ul style={{ paddingLeft: 18, margin: '6px 0' }}>
              <li><b>AMR 여유율</b>: 0.9, 1.2, 1.8처럼 소수점으로 직접 입력</li>
              <li><b>Spare</b>: 갑작스러운 고장 대비 (보통 1)</li>
            </ul>
            <HintNote type="ok">최종 필요 대수는 소수점을 올림한 뒤 Spare를 더합니다.</HintNote>
          </HelpHint>
        </div>
        <div className="input-grid">
          <div className="input-group">
            <div className="input-label-row"><span className="input-label">AMR 여유율</span></div>
            <input className="input-field" type="number" min={0} step="0.1" value={f.operationRate ?? 1.2}
              onChange={e => set('operationRate', e.target.value)} placeholder="예: 1.2" />
          </div>
          <div className="input-group">
            <div className="input-label-row"><span className="input-label">AMR Spare (대)</span></div>
            <input className="input-field" type="number" min={0} value={f.spare ?? 1}
              onChange={e => set('spare', e.target.value)} />
          </div>

          <div className="result-box tone-blue full-width">
            <span className="result-box__label">AMR 원단위 = 총왕복시간 / AMR Cycle Time (소수 → 올림)</span>
            <span className="result-box__value">
              {baseRaw > 0
                ? <>{baseRaw.toFixed(2)} → <span style={{ color: '#F59E0B' }}>{amrBaseUnits}대</span></>
                : '—'}
            </span>
          </div>
          <div className="result-box tone-blue full-width">
            <span className="result-box__label">여유율 적용 AMR 수량 = AMR 원단위 × AMR 여유율</span>
            <span className="result-box__value">
              {adjustedRaw > 0
                ? <>{adjustedRaw.toFixed(2)} → <span style={{ color: '#F59E0B' }}>{amrAdjustedUnits}대</span></>
                : '—'}
            </span>
          </div>
          <div className="result-box full-width tone-final" style={{ padding: '14px 16px' }}>
            <span className="result-box__label" style={{ fontSize: '0.85rem' }}>
              ⭐ AMR 필요 대수 = ⌈ 여유율 적용 AMR 수량 ⌉ + Spare
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
