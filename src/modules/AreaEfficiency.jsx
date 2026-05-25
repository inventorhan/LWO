import { useState } from 'react'
import { fileToBase64, calcArea } from '../shared/utils/common'
import HelpHint, { HintFormula, HintNote } from '../shared/components/HelpHint'

const LOAD_TYPES = ['박스', '파렛트', '대차', 'Rack', '기타']
/* 최고 높이 점유율 select 옵션 */
const VOL_WEIGHT_OPTIONS = [0.5, 0.6, 0.7, 0.8, 0.9, 1.0]

function emptyZone(no) {
  return { no, width: '', height: '', photo: null, items: [] }
}

function emptyItem() {
  return { type: '박스', qty: 1, minHeight: '', maxHeight: '', volWeight: 0.8, width: '', depth: '', photo: null }
}

/* m² 그대로 표시 (소수점 1자리) */
function fmtArea(m2) {
  if (m2 == null || m2 <= 0) return '—'
  return `${m2.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} m²`
}

function PhotoButton({ photo, onChange, label = '사진 촬영' }) {
  return (
    <label className="btn" style={{
      minHeight: 44, padding: 6,
      background: photo ? '#fff' : '#F4EFF1',
      border: '1.5px dashed #D4C8CD',
      color: '#7C6E74', fontSize: '0.78rem', gap: 6, cursor: 'pointer'
    }}>
      {photo ? (
        <img src={photo} alt="" style={{ height: 30, width: 30, objectFit: 'cover', borderRadius: 4 }} />
      ) : (
        <span style={{ fontSize: '1rem' }}>📷</span>
      )}
      <span>{photo ? '변경' : label}</span>
      <input type="file" accept="image/*" capture="environment" style={{ display: 'none' }}
        onChange={e => { if (e.target.files[0]) onChange(e.target.files[0]) }} />
    </label>
  )
}

export default function AreaEfficiency({ data, updateData }) {
  const factory = data.factory || { width: '', height: '', photo: null }
  const zones = data.zones || []

  const [activeZone, setActiveZone] = useState(0)
  const safeActiveZone = Math.min(activeZone, Math.max(0, zones.length - 1))

  const setFactory = (upd) => updateData({ factory: { ...factory, ...upd } })
  const setZones = (upd) => updateData({ zones: typeof upd === 'function' ? upd(zones) : upd })

  const factoryArea = calcArea(factory.width, factory.height)
  const factoryPhotos = Array.isArray(factory.photos) ? factory.photos : (factory.photo ? [factory.photo] : [])

  const addZone = () => {
    const next = [...zones, emptyZone(zones.length + 1)]
    setZones(next)
    setActiveZone(next.length - 1)
  }

  const removeZone = (idx) => {
    if (zones.length <= 1) return
    if (!window.confirm(`${idx + 1}구역을 삭제하시겠습니까?`)) return
    const next = zones.filter((_, i) => i !== idx).map((z, i) => ({ ...z, no: i + 1 }))
    setZones(next)
    setActiveZone(Math.min(idx, next.length - 1))
  }

  const updateZone = (idx, upd) => setZones(z => z.map((zone, i) => i === idx ? { ...zone, ...upd } : zone))
  const addItem = (zIdx) => setZones(z => z.map((zone, i) => i === zIdx ? { ...zone, items: [...zone.items, emptyItem()] } : zone))
  const removeItem = (zIdx, iIdx) => setZones(z => z.map((zone, i) =>
    i === zIdx ? { ...zone, items: zone.items.filter((_, j) => j !== iIdx) } : zone))
  const updateItem = (zIdx, iIdx, upd) => setZones(z => z.map((zone, i) =>
    i === zIdx ? { ...zone, items: zone.items.map((item, j) => j === iIdx ? { ...item, ...upd } : item) } : zone
  ))

  const handlePhoto = async (type, zIdx, iIdx, file) => {
    try {
      const b64 = await fileToBase64(file)
      if (type === 'factory') setFactory({ photos: [...factoryPhotos, b64], photo: null })
      else if (type === 'zone') updateZone(zIdx, { photo: b64 })
      else if (type === 'item') updateItem(zIdx, iIdx, { photo: b64 })
    } catch {/* ignore */}
  }

  const curZone = zones[safeActiveZone]
  const zoneArea = curZone ? calcArea(curZone.width, curZone.height) : null

  /* 체적 효율: 최고/최저 높이 차이에 최고 높이 점유율을 반영 */
  const volumeStats = (curZone?.items || []).map(it => {
    const lo = parseFloat(it.minHeight)
    const hi = parseFloat(it.maxHeight)
    const w  = parseFloat(it.volWeight) || 0.8
    if (!isNaN(lo) && !isNaN(hi) && hi > 0) {
      const drop = (hi - lo) * w
      const ratePct = (drop / hi) * 100  /* 손실 비율 */
      const usedPct = ((hi - drop) / hi) * 100
      return { type: it.type, lo, hi, w, drop, ratePct, usedPct }
    }
    return null
  }).filter(Boolean)

  const avgUsedPct = volumeStats.length > 0
    ? volumeStats.reduce((acc, v) => acc + v.usedPct, 0) / volumeStats.length
    : null

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <div className="module-title">면적 효율 산출</div>

      {/* 공장 면적 */}
      <div className="section-card">
        <div className="section-title">
          공장 면적 입력
          <HelpHint title="공장 면적 입력">
            <p>분석 대상 <b>공장 전체</b>의 외곽 치수를 입력합니다. 모든 단위는 <b>미터(m)</b>.</p>
            <ul style={{ paddingLeft: 18, margin: '6px 0' }}>
              <li>가로 / 세로 입력 → 공장 면적 자동 산출</li>
              <li>공장 사진은 선택 항목 (전경 또는 도면)</li>
            </ul>
            <HintNote>이 값은 아래 구역별 효율 분석의 분모(공장 전체 면적)로 사용됩니다.</HintNote>
          </HelpHint>
        </div>
        <div className="input-grid">
          <div className="input-group">
            <span className="input-label">가로 (m)</span>
            <input className="input-field" type="number" step="0.1" min={0} value={factory.width}
              onChange={e => setFactory({ width: e.target.value })} placeholder="예: 50.0" />
          </div>
          <div className="input-group">
            <span className="input-label">세로 (m)</span>
            <input className="input-field" type="number" step="0.1" min={0} value={factory.height}
              onChange={e => setFactory({ height: e.target.value })} placeholder="예: 30.0" />
          </div>
          <div className="input-group full-width">
            <div className="result-box tone-slate">
              <span className="result-box__label">공장 면적 (자동)</span>
              <span className="result-box__value">{fmtArea(factoryArea)}</span>
            </div>
          </div>
          <div className="input-group full-width">
            <span className="input-label">공장 사진</span>
            {factoryPhotos.length > 0 && (
              <div className="photo-gallery" style={{ marginBottom: 8 }}>
                {factoryPhotos.map((photo, idx) => (
                  <div key={idx} className="photo-item" style={{ width: 120, height: 90 }}>
                    <img src={photo} alt="" />
                    <button onClick={() => setFactory({ photos: factoryPhotos.filter((_, i) => i !== idx), photo: null })}
                      style={{ position: 'absolute', right: 3, top: 3, border: 'none', background: 'rgba(0,0,0,0.55)', color: 'white', borderRadius: 4, width: 24, height: 24, cursor: 'pointer' }}>×</button>
                  </div>
                ))}
              </div>
            )}
            <label className="btn" style={{
              height: 72,
              width: '100%',
              padding: 12,
              background: '#F4EFF1', border: '1.5px dashed #D4C8CD', color: '#7C6E74',
              flexDirection: 'column', fontSize: '0.85rem', gap: 4, cursor: 'pointer',
              overflow: 'hidden', whiteSpace: 'normal'
            }}>
              <span style={{ fontSize: '1.5rem' }}>📷</span><span>공장 사진 추가</span>
              <input type="file" accept="image/*" capture="environment" style={{ display: 'none' }}
                onChange={e => { if (e.target.files[0]) handlePhoto('factory', null, null, e.target.files[0]) }} />
            </label>
          </div>
        </div>
      </div>

      {/* 구역 */}
      <div className="section-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
          <span className="section-title" style={{ marginBottom: 0, border: 'none', padding: 0 }}>
            구역 면적 입력
            <HelpHint title="구역 면적 입력">
              <p>공장을 <b>여러 구역</b>으로 나눠 각 구역의 면적과 적재물을 따로 분석합니다.</p>
              <ul style={{ paddingLeft: 18, margin: '6px 0' }}>
                <li>상단 탭에서 구역 선택 → + 구역 버튼으로 추가</li>
                <li>각 구역 가로/세로 (m) 입력 → 구역 면적 자동 산출</li>
                <li><b>실사용 적재 면적 분석</b>에서 박스/파렛트/대차 등을 등록</li>
                <li>각 적재 항목별로 최저/최고 높이까지 입력해 체적 효율도 측정</li>
              </ul>
              <HintNote>구역 단위로 세분화할수록 어느 구역이 비효율적인지 정확히 찾을 수 있습니다.</HintNote>
            </HelpHint>
          </span>
          {zones.length > 1 && curZone && (
            <button className="btn" onClick={() => removeZone(safeActiveZone)}
              style={{ height: 30, padding: '0 10px', background: '#FEF3C7', color: '#B45309', fontSize: '0.75rem' }}>
              🗑️ {safeActiveZone + 1}구역 삭제
            </button>
          )}
        </div>

        <div className="cycle-tabs-container">
          {zones.map((z, i) => (
            <button key={i} className={`cycle-tab-btn ${safeActiveZone === i ? 'active' : ''}`}
              style={{ padding: '0 12px', minWidth: 'auto', height: 38, fontSize: '0.85rem' }}
              onClick={() => setActiveZone(i)}>{i + 1}구역</button>
          ))}
          <button className="cycle-tab-btn" onClick={addZone}
            style={{ padding: '0 12px', minWidth: 'auto', height: 38, fontSize: '0.85rem', background: '#FDF2F4', color: '#A50034', borderColor: '#E8C5CC' }}>
            ＋ 구역
          </button>
        </div>

        {curZone && (
          <>
            <div className="input-grid">
              <div className="input-group">
                <span className="input-label">구역 번호</span>
                <input className="input-field" type="text" value={curZone.no} readOnly />
              </div>
              <div className="input-group">
                <span className="input-label">가로 (m)</span>
                <input className="input-field" type="number" step="0.1" min={0} value={curZone.width}
                  onChange={e => updateZone(safeActiveZone, { width: e.target.value })} placeholder="예: 10.0" />
              </div>
              <div className="input-group">
                <span className="input-label">세로 (m)</span>
                <input className="input-field" type="number" step="0.1" min={0} value={curZone.height}
                  onChange={e => updateZone(safeActiveZone, { height: e.target.value })} placeholder="예: 8.0" />
              </div>
              <div className="input-group">
                <span className="input-label">구역 사진</span>
                <PhotoButton photo={curZone.photo}
                  onChange={(f) => handlePhoto('zone', safeActiveZone, null, f)} />
              </div>
              <div className="input-group full-width">
                <div className="result-box tone-slate">
                  <span className="result-box__label">구역 면적 (자동)</span>
                  <span className="result-box__value">{fmtArea(zoneArea)}</span>
                </div>
              </div>
            </div>

            {/* 실사용 적재 */}
            <div style={{ height: 1, background: 'var(--color-card-border)', margin: '16px 0' }} />
            <div className="section-title">실사용 적재 면적 분석</div>

            {curZone.items.length === 0 && (
              <div style={{ textAlign: 'center', padding: 16, color: '#7C6E74', fontSize: '0.85rem' }}>
                아래 버튼으로 적재 항목을 추가해 주세요.
              </div>
            )}

            {curZone.items.map((item, iIdx) => {
              const itemArea = calcArea(item.width, item.depth)
              const totalArea = itemArea ? itemArea * (parseInt(item.qty) || 1) : null
              const lo = parseFloat(item.minHeight); const hi = parseFloat(item.maxHeight)
              const w = parseFloat(item.volWeight) || 0.8
              const lossPct = (!isNaN(lo) && !isNaN(hi) && hi > 0) ? ((hi - lo) / hi) * w * 100 : null
              return (
                <div key={iIdx} className="section-card" style={{ background: '#ffffff', margin: '0 0 12px 0', position: 'relative' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#2A1F24' }}>적재 #{iIdx + 1}</span>
                    <button onClick={() => { if (window.confirm('이 적재 항목을 삭제하시겠습니까?')) removeItem(safeActiveZone, iIdx) }}
                      style={{ border: 'none', background: 'none', color: '#9C8E94', fontSize: '1.1rem', cursor: 'pointer' }}>🗑️</button>
                  </div>
                  <div className="input-grid">
                    <div className="input-group">
                      <div className="input-label-row"><span className="input-label">적재 종류</span></div>
                      <select className="input-field" value={item.type}
                        onChange={e => updateItem(safeActiveZone, iIdx, { type: e.target.value })}>
                        {LOAD_TYPES.map(t => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                    <div className="input-group">
                      <div className="input-label-row"><span className="input-label">적재 개수</span></div>
                      <input className="input-field" type="number" min={1} value={item.qty}
                        onChange={e => updateItem(safeActiveZone, iIdx, { qty: e.target.value })} />
                    </div>
                    <div className="input-group">
                      <div className="input-label-row"><span className="input-label">가로 (m)</span></div>
                      <input className="input-field" type="number" step="0.1" min={0} value={item.width}
                        onChange={e => updateItem(safeActiveZone, iIdx, { width: e.target.value })} placeholder="예: 1.2" />
                    </div>
                    <div className="input-group">
                      <div className="input-label-row"><span className="input-label">세로 (m)</span></div>
                      <input className="input-field" type="number" step="0.1" min={0} value={item.depth}
                        onChange={e => updateItem(safeActiveZone, iIdx, { depth: e.target.value })} placeholder="예: 0.8" />
                    </div>
                    <div className="input-group">
                      <div className="input-label-row"><span className="input-label">최저 높이 (m)</span></div>
                      <input className="input-field" type="number" step="0.1" min={0} value={item.minHeight ?? ''}
                        onChange={e => updateItem(safeActiveZone, iIdx, { minHeight: e.target.value })} placeholder="예: 0.5" />
                    </div>
                    <div className="input-group">
                      <div className="input-label-row"><span className="input-label">최고 높이 (m)</span></div>
                      <input className="input-field" type="number" step="0.1" min={0} value={item.maxHeight ?? ''}
                        onChange={e => updateItem(safeActiveZone, iIdx, { maxHeight: e.target.value })} placeholder="예: 1.7" />
                    </div>
                    <div className="input-group">
                      <div className="input-label-row"><span className="input-label">최고 높이 점유율</span></div>
                      <select className="input-field" value={item.volWeight ?? 0.8}
                        onChange={e => updateItem(safeActiveZone, iIdx, { volWeight: parseFloat(e.target.value) })}>
                        {VOL_WEIGHT_OPTIONS.map(w => <option key={w} value={w}>{w.toFixed(1)}</option>)}
                      </select>
                    </div>
                    <div className="input-group">
                      <div className="input-label-row"><span className="input-label">실 적재 사진</span></div>
                      <PhotoButton photo={item.photo}
                        onChange={(f) => handlePhoto('item', safeActiveZone, iIdx, f)} />
                    </div>
                    <div className="input-group full-width">
                      <div className="result-box tone-blue">
                        <span className="result-box__label">합계 면적 (가×세×개수)</span>
                        <span className="result-box__value">{fmtArea(totalArea)}</span>
                      </div>
                    </div>
                    <div className="input-group full-width">
                      <div className="result-box tone-final">
                        <span className="result-box__label">체적 손실율 = ((최고−최저) / 최고) × 최고 높이 점유율</span>
                        <span className="result-box__value">{lossPct !== null ? `${lossPct.toFixed(1)}%` : '—'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}

            <button className="btn" style={{ width: '100%', marginTop: 8, background: '#FDF2F4', color: '#A50034', border: '1px solid #E8C5CC' }}
              onClick={() => addItem(safeActiveZone)}>＋ 적재 항목 추가</button>

            <div style={{ height: 1, background: 'var(--color-card-border)', margin: '16px 0' }} />
            <div className="input-grid" style={{ marginTop: 8 }}>
              <div className="result-box full-width tone-final">
                <span className="result-box__label">전체 적재 항목 평균 체적 사용율</span>
                <span className="result-box__value">{avgUsedPct !== null ? `${avgUsedPct.toFixed(1)}%` : '—'}</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* 구역별 효율 결과 */}
      {(() => {
        const zoneStats = zones.map((zone, i) => {
          const za = calcArea(zone.width, zone.height)
          const ia = zone.items.reduce((acc, item) => {
            const a = calcArea(item.width, item.depth)
            return acc + (a ? a * (parseInt(item.qty) || 1) : 0)
          }, 0)
          const eff = (za && ia) ? Math.min(999, (ia / za) * 100) : null
          return { idx: i, za, ia, eff }
        })
        const maxEff = Math.max(1, ...zoneStats.map(z => z.eff || 0))
        return (
          <div className="section-card" style={{ background: '#2A1F24', borderColor: '#3A2F33', color: 'white' }}>
            <div className="section-title" style={{ color: 'white', borderBottomColor: '#4A4045' }}>
              📊 구역별 면적 효율 분석
              <HelpHint title="구역별 면적 효율 분석">
                <p>모든 구역의 효율을 한 화면에서 비교하는 결과 영역입니다.</p>
                <HintFormula>{`면적 효율(%)    = 실사용 면적 ÷ 구역 면적 × 100
체적 손실율(%) = ((최고−최저) ÷ 최고) × 최고 높이 점유율
평균 체적 사용율 = ((최고−손실) ÷ 최고) 항목 평균`}</HintFormula>
                <ul style={{ paddingLeft: 18, margin: '6px 0' }}>
                  <li>막대그래프: 각 구역의 효율(%) — 색상으로 강도 표시</li>
                  <li>카드: 실제 사용 면적 / 구역 전체 면적</li>
                  <li>하단: 공장 전체 면적</li>
                </ul>
                <HintNote type="warn">90% 초과 = 포화(통로 부족 가능). 50% 미만 = 활용 저조 → 재배치 검토.</HintNote>
              </HelpHint>
            </div>

            {/* 그래프 */}
            {zoneStats.some(z => z.eff !== null) && (
              <div style={{ display: 'flex', height: 200, gap: 8, alignItems: 'flex-end', margin: '32px 0 28px 0', borderBottom: '1px dashed #4A4045', padding: '0 4px' }}>
                {zoneStats.map(z => {
                  const heightPct = z.eff !== null ? Math.max(2, (z.eff / maxEff) * 100) : 2
                  const color = z.eff === null ? '#4A4045' : z.eff > 90 ? '#dc2626' : z.eff > 50 ? '#0ea5e9' : '#0891b2'
                  return (
                    <div key={z.idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', position: 'relative', minWidth: 0 }}>
                      <div style={{ flex: 1, width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                        <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'white', textAlign: 'center', marginBottom: 4 }}>
                          {z.eff !== null ? `${z.eff.toFixed(0)}%` : '—'}
                        </div>
                        <div style={{ fontSize: '0.65rem', color: '#9C8E94', textAlign: 'center', marginBottom: 4 }}>
                          {z.ia > 0 ? `(${z.ia.toFixed(0)}m²)` : ''}
                        </div>
                        <div style={{ width: '100%', maxWidth: 56, margin: '0 auto', height: `${heightPct}%`, background: color, borderRadius: '4px 4px 0 0', minHeight: 4, transition: 'height .3s' }} />
                      </div>
                      <div style={{ position: 'absolute', bottom: -22, fontSize: '0.72rem', color: '#D4C8CD', fontWeight: 700, textAlign: 'center', width: '100%' }}>
                        {z.idx + 1}구역
                        {z.za > 0 && <div style={{ fontSize: '0.62rem', color: '#9C8E94', fontWeight: 500 }}>({z.za.toFixed(0)}m²)</div>}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* 카드 형태 요약 — 실제 면적 표시 */}
            <div className="input-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 8 }}>
              {zoneStats.map(z => (
                <div key={z.idx} className="result-box" style={{ background: '#3A2F33', alignItems: 'center', padding: 12, textAlign: 'center' }}>
                  <span className="result-box__label" style={{ fontSize: '0.78rem', color: '#D4C8CD' }}>{z.idx + 1}구역</span>
                  <span className="result-box__value" style={{ fontSize: '1.3rem', color: 'white' }}>
                    {z.eff !== null ? `${z.eff.toFixed(0)}%` : '—'}
                  </span>
                  {z.za > 0 && (
                    <span style={{ fontSize: '0.7rem', color: '#9C8E94', marginTop: 4, lineHeight: 1.4 }}>
                      실제 {fmtArea(z.ia)}<br/>/ 전체 {fmtArea(z.za)}
                    </span>
                  )}
                </div>
              ))}
            </div>
            {factoryArea && (
              <div style={{ marginTop: 14, textAlign: 'center', fontSize: '0.85rem', color: '#9C8E94' }}>
                공장 전체 면적: <strong style={{ color: 'white' }}>{fmtArea(factoryArea)}</strong>
              </div>
            )}
          </div>
        )
      })()}
    </div>
  )
}
