import { useMemo } from 'react'
import { n, fmtN } from '../shared/utils/common'
import HelpHint, { HintFormula, HintNote } from '../shared/components/HelpHint'

/* 섹션 내 입력↔결과 사이 구분선 */
const Divider = ({ label }) => (
  <div className="inv-divider">
    <span>{label || '산출 결과'}</span>
  </div>
)

export default function InventoryStorage({ data, updateData }) {
  const f = data || {}
  const set = (k, v) => updateData({ [k]: v })

  /* ── 1. 자사 기초 재고 ── */
  /* 고객 라인 */
  const custDayProd   = useMemo(() => n(f.customerDayUph)   * n(f.customerDayTime),   [f.customerDayUph, f.customerDayTime])
  const custNightProd = useMemo(() => n(f.customerNightUph) * n(f.customerNightTime), [f.customerNightUph, f.customerNightTime])
  const custDailyProd = useMemo(() => custDayProd + custNightProd,                     [custDayProd, custNightProd])
  /* 자사 라인 */
  const selfDayProd   = useMemo(() => n(f.selfDayUph)   * n(f.selfDayTime),   [f.selfDayUph, f.selfDayTime])
  const selfNightProd = useMemo(() => n(f.selfNightUph) * n(f.selfNightTime), [f.selfNightUph, f.selfNightTime])
  const selfDailyProd = useMemo(() => selfDayProd + selfNightProd,             [selfDayProd, selfNightProd])
  /* 일일 부족 수량 (양수=부족, 음수=잉여 → +/- 부호 표시) */
  const shortageQty = useMemo(() => custDailyProd - selfDailyProd, [custDailyProd, selfDailyProd])
  const appliedShortageQty = useMemo(() => Math.abs(shortageQty), [shortageQty])
  const fmtSigned = (v) => v === 0 ? '0대' : `${v > 0 ? '+' : '−'}${Math.abs(Math.round(v)).toLocaleString()}대`
  const fmtAbsQty = (v) => `${Math.abs(Math.round(v)).toLocaleString()}대`

  /* 고객 UPH 기준 (시간 → 수량 환산용) */
  const refUph = n(f.customerDayUph)

  /* ── 2. 운반 리드타임 → 수량 환산 ── */
  const ageingQty   = useMemo(() => (n(f.ageingTime)         / 3600) * refUph, [f.ageingTime, refUph])
  const safetyQty   = useMemo(() => (n(f.safetyStockTime)    / 3600) * refUph, [f.safetyStockTime, refUph])
  const loadQty     = useMemo(() => (n(f.depotLoadTime)      / 3600) * refUph, [f.depotLoadTime, refUph])
  const moveQty     = useMemo(() => (n(f.selfToCustomerTime) / 3600) * refUph, [f.selfToCustomerTime, refUph])
  const leadTimeStock = useMemo(() => ageingQty + safetyQty + loadQty + moveQty,
    [ageingQty, safetyQty, loadQty, moveQty])

  /* ── 3. 고객사 운영 재고 ── */
  const unloadQty       = useMemo(() => (n(f.customerDockTime)   / 3600) * refUph, [f.customerDockTime, refUph])
  const waitQty         = useMemo(() => (n(f.waitTime)           / 3600) * refUph, [f.waitTime, refUph])
  const customerSafeQty = useMemo(() => (n(f.customerSafetyTime) / 3600) * refUph, [f.customerSafetyTime, refUph])
  const customerOpsStock = useMemo(() => unloadQty + waitQty + customerSafeQty,
    [unloadQty, waitQty, customerSafeQty])

  /* ── 4. Total 적정 재고 ── */
  const finalStock = useMemo(() => appliedShortageQty + leadTimeStock + customerOpsStock,
    [appliedShortageQty, leadTimeStock, customerOpsStock])

  /* ── 5. 적정 Space 산출 ── */
  const spaceWidth   = n(f.spaceWidth)
  const spaceDepth   = n(f.spaceDepth)
  const spaceHeight  = n(f.spaceHeight) || 1   /* 높이(단) — 0이면 1로 보정 */
  const spaceMargin  = n(f.spaceMargin) || 1   /* 여유율 — 0이면 1로 보정 */
  const unitArea     = spaceWidth * spaceDepth                                            /* 1단 1개 면적 m² */
  const baseArea     = unitArea * Math.max(0, finalStock) / spaceHeight                  /* 단 수 나눠 바닥 면적 */
  const finalArea    = baseArea * spaceMargin                                             /* 여유율 적용 */

  const leadRows = [
    { key: 'ageingTime',         label: '숙성 시간 (초)',                 out: '숙성 수량',  outVal: ageingQty },
    { key: 'safetyStockTime',    label: '안심 재고 시간 (정책성, 초)',     out: '안심 수량',  outVal: safetyQty },
    { key: 'depotLoadTime',      label: 'Depot ~ 상차 시간 (초)',          out: '상차 수량',  outVal: loadQty },
    { key: 'selfToCustomerTime', label: '자사 ~ 고객 이동 시간 (초)',      out: '이동 수량',  outVal: moveQty }
  ]

  const opsRows = [
    { key: 'customerDockTime',   label: '고객 Dock ~ Depot 하차 시간 (초)', out: '하차 수량',     outVal: unloadQty },
    { key: 'waitTime',           label: '대기 시간 (초)',                  out: '대기 수량',     outVal: waitQty },
    { key: 'customerSafetyTime', label: '고객사 안전 재고 시간 (초)',       out: '안전 재고 수량', outVal: customerSafeQty }
  ]

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <div className="module-title">적정 재고 보관량 산출</div>

      {/* ── 1. 자사 기초 재고 ── */}
      <div className="section-card">
        <div className="section-title">
          자사 기초 재고
          <HelpHint title="자사 기초 재고">
            <p>고객사 요구량 대비 자사 생산량이 얼마나 <b>부족한지</b>를 산출하는 첫 단계입니다.</p>
            <HintFormula>{`고객 일일 = 주간(UPH × 시간) + 야간(UPH × 시간)
자사 일일 = 주간(UPH × 시간) + 야간(UPH × 시간)
부족 수량 = 고객 일일 − 자사 일일
적용 수량 = |부족 수량|`}</HintFormula>
            <ul style={{ paddingLeft: 18, margin: '6px 0' }}>
              <li><b>UPH</b>: 시간당 생산 수량 (Units Per Hour)</li>
              <li>주간/야간 모두 운영하지 않으면 해당 시간을 <b>0</b>으로 두세요</li>
            </ul>
            <HintNote type="ok">결과가 음수(잉여)여도 적정 재고 계산에는 절대값으로 반영합니다.</HintNote>
          </HelpHint>
        </div>

        <div className="inv-section-label">📥 고객 라인</div>
        <div className="input-grid">
          <div className="input-group">
            <div className="input-label-row"><span className="input-label">고객 주간 UPH</span></div>
            <input className="input-field" type="number" min={0} value={f.customerDayUph || ''}
              onChange={e => set('customerDayUph', e.target.value)} placeholder="예: 300" />
          </div>
          <div className="input-group">
            <div className="input-label-row"><span className="input-label">주간 작업 시간 (h)</span></div>
            <input className="input-field" type="number" step="0.1" min={0} value={f.customerDayTime || ''}
              onChange={e => set('customerDayTime', e.target.value)} placeholder="예: 8" />
          </div>
          <div className="input-group">
            <div className="input-label-row"><span className="input-label">고객 야간 UPH</span></div>
            <input className="input-field" type="number" min={0} value={f.customerNightUph || ''}
              onChange={e => set('customerNightUph', e.target.value)} placeholder="예: 200" />
          </div>
          <div className="input-group">
            <div className="input-label-row"><span className="input-label">야간 작업 시간 (h)</span></div>
            <input className="input-field" type="number" step="0.1" min={0} value={f.customerNightTime || ''}
              onChange={e => set('customerNightTime', e.target.value)} placeholder="예: 4" />
          </div>
        </div>

        <div style={{ height: 1, background: 'var(--color-card-border)', margin: '14px 0' }} />

        <div className="inv-section-label">📥 자사 라인</div>
        <div className="input-grid">
          <div className="input-group">
            <div className="input-label-row"><span className="input-label">자사 주간 UPH</span></div>
            <input className="input-field" type="number" min={0} value={f.selfDayUph || ''}
              onChange={e => set('selfDayUph', e.target.value)} placeholder="예: 200" />
          </div>
          <div className="input-group">
            <div className="input-label-row"><span className="input-label">주간 작업 시간 (h)</span></div>
            <input className="input-field" type="number" step="0.1" min={0} value={f.selfDayTime || ''}
              onChange={e => set('selfDayTime', e.target.value)} placeholder="예: 8" />
          </div>
          <div className="input-group">
            <div className="input-label-row"><span className="input-label">자사 야간 UPH</span></div>
            <input className="input-field" type="number" min={0} value={f.selfNightUph || ''}
              onChange={e => set('selfNightUph', e.target.value)} placeholder="예: 100" />
          </div>
          <div className="input-group">
            <div className="input-label-row"><span className="input-label">야간 작업 시간 (h)</span></div>
            <input className="input-field" type="number" step="0.1" min={0} value={f.selfNightTime || ''}
              onChange={e => set('selfNightTime', e.target.value)} placeholder="예: 4" />
          </div>
        </div>

        <Divider label="기초 재고 산출" />
        <div className="input-grid">
          <div className="result-box tone-slate">
            <span className="result-box__label">고객 일일 생산 수량</span>
            <span className="result-box__value">{fmtN(custDailyProd, '대', 0)}</span>
          </div>
          <div className="result-box tone-slate">
            <span className="result-box__label">자사 일일 생산 수량</span>
            <span className="result-box__value">{fmtN(selfDailyProd, '대', 0)}</span>
          </div>
          <div className="result-box full-width tone-final" style={{ padding: '14px 16px' }}>
            <span className="result-box__label" style={{ fontSize: '0.85rem' }}>
              일일 부족/잉여 차이 = 고객 일일 − 자사 일일 ({fmtSigned(shortageQty)})
            </span>
            <span className="result-box__value" style={{ fontSize: '1.5rem' }}>{fmtAbsQty(appliedShortageQty)}</span>
          </div>
        </div>
      </div>

      {/* ── 2. 운반 리드타임 ── */}
      <div className="section-card">
        <div className="section-title">
          운반 리드타임 → 수량 환산 <span className="sub-title">| 고객 UPH 기준</span>
          <HelpHint title="운반 리드타임 → 수량 환산">
            <p>자사에서 출하 후 고객사 입고까지의 <b>대기·이동 시간</b>을 수량으로 환산해 재고에 더합니다.</p>
            <HintFormula>{`수량 = (시간초 ÷ 3600) × 고객 주간 UPH

리드타임 재고 = 숙성 + 안심 + 상차 + 이동`}</HintFormula>
            <ul style={{ paddingLeft: 18, margin: '6px 0' }}>
              <li><b>숙성 시간</b>: 자사 보관 / 품질 안정화 시간</li>
              <li><b>안심 재고 (정책성)</b>: 운반 사고·설비 고장·차량 수배 대비</li>
              <li><b>Depot ~ 상차</b>: 출하 대기 + 상차 시간</li>
              <li><b>자사 ~ 고객 이동</b>: 운송 시간</li>
            </ul>
            <HintNote>모든 시간 입력 단위는 <b>초(sec)</b>입니다. 1시간 = 3600초.</HintNote>
          </HelpHint>
        </div>
        <div className="inv-section-label">📥 입력 + 자동 산출</div>
        {leadRows.map((r) => (
          <div key={r.key} className="inv-lead-row">
            <div className="input-group">
              <div className="input-label-row"><span className="input-label">{r.label}</span></div>
              <input className="input-field" type="number" min={0} value={f[r.key] || ''}
                onChange={e => set(r.key, e.target.value)} placeholder="초" />
            </div>
            <div className="result-box tone-slate">
              <span className="result-box__label">{r.out} = 시간/3600 × 고객 UPH</span>
              <span className="result-box__value">{fmtN(r.outVal, '대', 0)}</span>
            </div>
          </div>
        ))}
        <Divider label="합계" />
        <div className="input-grid">
          <div className="result-box full-width tone-final" style={{ padding: '14px 16px' }}>
            <span className="result-box__label">리드타임 재고 = 숙성 + 안심 + 상차 + 이동</span>
            <span className="result-box__value" style={{ fontSize: '1.4rem' }}>{fmtN(leadTimeStock, '대', 0)}</span>
          </div>
        </div>
      </div>

      {/* ── 3. 고객사 운영 재고 ── */}
      <div className="section-card">
        <div className="section-title">
          고객사 운영 재고 <span className="sub-title">| 고객 UPH 기준</span>
          <HelpHint title="고객사 운영 재고">
            <p>고객사 도착 후 조립 라인 투입 전까지 <b>현장에서 머무는 시간</b>을 수량화합니다.</p>
            <HintFormula>{`고객사 운영 재고 = 하차 + 대기 + 안전 재고
수량 = (시간초 ÷ 3600) × 고객 주간 UPH`}</HintFormula>
            <ul style={{ paddingLeft: 18, margin: '6px 0' }}>
              <li><b>Dock ~ Depot 하차</b>: 고객사 하역 시간</li>
              <li><b>대기 시간</b>: 조립 라인 투입 전 보관 시간</li>
              <li><b>고객 안전 재고</b>: 7대 로스(불량/대기/이동 등) 감안 추가 재고</li>
            </ul>
          </HelpHint>
        </div>
        <div className="inv-section-label">📥 입력 + 자동 산출</div>
        {opsRows.map((r) => (
          <div key={r.key} className="inv-lead-row">
            <div className="input-group">
              <div className="input-label-row"><span className="input-label">{r.label}</span></div>
              <input className="input-field" type="number" min={0} value={f[r.key] || ''}
                onChange={e => set(r.key, e.target.value)} placeholder="초" />
            </div>
            <div className="result-box tone-slate">
              <span className="result-box__label">{r.out} = 시간/3600 × 고객 UPH</span>
              <span className="result-box__value">{fmtN(r.outVal, '대', 0)}</span>
            </div>
          </div>
        ))}
        <Divider label="합계" />
        <div className="input-grid">
          <div className="result-box full-width tone-final" style={{ padding: '14px 16px' }}>
            <span className="result-box__label">고객사 운영 재고 = 하차 + 대기 + 안전 재고</span>
            <span className="result-box__value" style={{ fontSize: '1.4rem' }}>{fmtN(customerOpsStock, '대', 0)}</span>
          </div>
        </div>
      </div>

      {/* ── 4. Total 적정 재고 ── */}
      <div className="section-card">
        <div className="section-title">
          Total 적정 재고
          <HelpHint title="Total 적정 재고">
            <p>위 3가지 결과를 모두 합한 <b>최종 권장 보관 수량</b>입니다.</p>
            <HintFormula>{`Total 적정 재고
  = ① 일일 부족/잉여 절대값
  + ② 리드타임 재고
  + ③ 고객사 운영 재고`}</HintFormula>
            <HintNote type="ok">이 수치만큼 자사 창고에 항상 확보해두면 고객사 라인이 멈추지 않습니다.</HintNote>
            <HintNote type="warn">잉여(자사 일일 &gt; 고객 일일) 상태에서도 ① 항목은 절대값으로 적용합니다.</HintNote>
          </HelpHint>
        </div>
        <div className="input-grid">
          <div className="result-box tone-blue">
            <span className="result-box__label">① 일일 부족/잉여 절대값</span>
            <span className="result-box__value">{fmtAbsQty(appliedShortageQty)}</span>
          </div>
          <div className="result-box tone-blue">
            <span className="result-box__label">② 리드타임 재고</span>
            <span className="result-box__value">{fmtN(leadTimeStock, '대', 0)}</span>
          </div>
          <div className="result-box tone-blue">
            <span className="result-box__label">③ 고객사 운영 재고</span>
            <span className="result-box__value">{fmtN(customerOpsStock, '대', 0)}</span>
          </div>
          <div className="result-box full-width tone-final" style={{ padding: '18px 16px' }}>
            <span className="result-box__label" style={{ fontSize: '0.85rem' }}>
              ⭐ Total 적정 재고 = ① 절대값 + ② + ③
            </span>
            <span className="result-box__value" style={{ fontSize: '1.7rem' }}>{fmtN(finalStock, '대', 0)}</span>
          </div>
        </div>

        <div style={{ marginTop: 12, padding: 12, background: '#f8fafc', borderRadius: 8, fontSize: '0.78rem', color: '#4A4045', lineHeight: 1.7 }}>
          <div><strong>① Total 적정 재고</strong> = 일일 부족/잉여 절대값 + 리드타임 재고 + 고객사 운영 재고</div>
          <div><strong>② 안심 재고</strong> : 운반 사고, 설비 고장 빈도수, 차량 수배 등등</div>
          <div><strong>③ 대기 시간</strong> : 고객사 조립 라인 투입 전 보관 수량</div>
          <div><strong>④ 고객 안전 재고</strong> : 7대 로스 감안 재고</div>
        </div>
      </div>

      {/* ── 5. 적정 Space 산출 ── */}
      <div className="section-card">
        <div className="section-title">
          적정 Space 산출
          <HelpHint title="적정 Space 산출">
            <p>Total 적정 재고를 <b>실제 창고 바닥 면적</b>으로 환산합니다.</p>
            <HintFormula>{`1단 면적     = 가로 × 세로                      [m²]
필요 바닥 면적 = 1단 면적 × 적정 재고 ÷ 높이(단)  [m²]
최종 적정 면적 = 필요 바닥 면적 × 여유율          [m²]`}</HintFormula>
            <ul style={{ paddingLeft: 18, margin: '6px 0' }}>
              <li><b>가로 / 세로 (m)</b>: 한 단위 적재물의 바닥 치수</li>
              <li><b>높이 (단)</b>: 위로 몇 단까지 쌓을 수 있는지</li>
              <li><b>여유율 (계수)</b>: 통로·안전 공간을 포함한 보정 (예: 1.2 = 20% 여유)</li>
            </ul>
            <HintNote>높이를 늘리면 바닥 면적이 줄고, 여유율을 늘리면 실제 필요 면적이 커집니다.</HintNote>
          </HelpHint>
        </div>
        <div className="input-grid">
          <div className="input-group">
            <div className="input-label-row"><span className="input-label">가로 (m)</span></div>
            <input className="input-field" type="number" step="0.1" min={0} value={f.spaceWidth || ''}
              onChange={e => set('spaceWidth', e.target.value)} placeholder="예: 1.2" />
          </div>
          <div className="input-group">
            <div className="input-label-row"><span className="input-label">세로 (m)</span></div>
            <input className="input-field" type="number" step="0.1" min={0} value={f.spaceDepth || ''}
              onChange={e => set('spaceDepth', e.target.value)} placeholder="예: 1.2" />
          </div>
          <div className="input-group">
            <div className="input-label-row"><span className="input-label">높이 (단)</span></div>
            <input className="input-field" type="number" step="1" min={1} value={f.spaceHeight || ''}
              onChange={e => set('spaceHeight', e.target.value)} placeholder="예: 3" />
          </div>
          <div className="input-group">
            <div className="input-label-row"><span className="input-label">여유율 (가중치)</span></div>
            <input className="input-field" type="number" step="0.1" min={1} value={f.spaceMargin || ''}
              onChange={e => set('spaceMargin', e.target.value)} placeholder="예: 1.2" />
          </div>
          <div className="result-box tone-slate full-width">
            <span className="result-box__label">1단 면적 (가로 × 세로)</span>
            <span className="result-box__value">{unitArea > 0 ? `${unitArea.toFixed(2)} m²` : '—'}</span>
          </div>
          <div className="result-box full-width tone-final" style={{ padding: '18px 16px' }}>
            <span className="result-box__label" style={{ fontSize: '0.85rem' }}>
              ⭐ 물류 적정 면적 = (가로 × 세로 × 적정 재고) ÷ 높이 × 여유율
            </span>
            <span className="result-box__value" style={{ fontSize: '1.7rem' }}>
              {finalArea > 0 ? `${finalArea.toLocaleString(undefined, { maximumFractionDigits: 1 })} m²` : '—'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
