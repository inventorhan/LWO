import { fileToBase64, n, fmtN } from '../shared/utils/common'
import HelpHint, { HintFormula, HintNote } from '../shared/components/HelpHint'

function AutomationPhotoInput({ title, photo, onChange, onRemove }) {
  return (
    <div className="input-group">
      <div className="input-label-row"><span className="input-label">{title}</span></div>
      <label className="btn photo-upload-btn">
        {photo
          ? <img src={photo} alt="" className="photo-upload-btn__img" />
          : <span>사진 촬영</span>}
        <input type="file" accept="image/*" capture="environment" style={{ display: 'none' }}
          onChange={e => { if (e.target.files[0]) onChange(e.target.files[0]) }} />
      </label>
      {photo && (
        <button className="btn" style={{ background: '#FEF3C7', color: '#B45309', height: 32, fontSize: '0.78rem' }}
          onClick={onRemove}>사진 제거</button>
      )}
    </div>
  )
}

export default function AutomationRate({ data, updateData }) {
  const f = data || {}
  const set = (k, v) => updateData({ [k]: v })

  const hasTotal = f.totalItems !== '' && f.totalItems !== null && f.totalItems !== undefined
  const totalItems = n(f.totalItems)
  const automatedItems = n(f.automatedItems)
  const automationRate = hasTotal && totalItems > 0 ? (automatedItems / totalItems) * 100 : null

  const hasRehandlingTotal = f.rehandlingTotalItems !== '' && f.rehandlingTotalItems !== null && f.rehandlingTotalItems !== undefined
  const rehandlingTotal = hasRehandlingTotal ? n(f.rehandlingTotalItems) : totalItems
  const rehandlingItems = n(f.rehandlingItems)
  const rehandlingRate = (hasRehandlingTotal || hasTotal) && rehandlingTotal > 0 ? (rehandlingItems / rehandlingTotal) * 100 : null

  const handlePhoto = async (key, file) => {
    try {
      set(key, await fileToBase64(file))
    } catch {/* ignore */}
  }

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <div className="module-title">물류 자동화율</div>

      <div className="section-card">
        <div className="section-title">기초 정보 입력</div>
        <div className="input-grid">
          <div className="input-group">
            <div className="input-label-row"><span className="input-label">회사명</span></div>
            <input className="input-field" value={f.companyName || ''}
              onChange={e => set('companyName', e.target.value)} placeholder="입력" />
          </div>
          <div className="input-group">
            <div className="input-label-row"><span className="input-label">측정자</span></div>
            <input className="input-field" value={f.inspector || ''}
              onChange={e => set('inspector', e.target.value)} placeholder="입력" />
          </div>
          <AutomationPhotoInput
            title="자동화 사진"
            photo={f.automationPhoto}
            onChange={(file) => handlePhoto('automationPhoto', file)}
            onRemove={() => set('automationPhoto', null)}
          />
          <AutomationPhotoInput
            title="Re-Handling 사진"
            photo={f.rehandlingPhoto}
            onChange={(file) => handlePhoto('rehandlingPhoto', file)}
            onRemove={() => set('rehandlingPhoto', null)}
          />
        </div>
      </div>

      <div className="section-card">
        <div className="section-title">
          물류 자동화율
          <HelpHint title="물류 자동화율">
            <p>수작업 피딩을 자동화로 대체한 부품 비율을 산출합니다.</p>
            <HintFormula>{`물류 자동화율 = 자동화 적용 Item 수 ÷ 총 입고 Item 수 × 100`}</HintFormula>
            <HintNote>도입과 내수를 구분해 관리할 때는 같은 기준으로 각각 입력해 비교하세요.</HintNote>
          </HelpHint>
        </div>
        <div className="input-grid">
          <div className="input-group">
            <div className="input-label-row"><span className="input-label">총 입고 Item 수</span></div>
            <input className="input-field" type="number" min={0} value={f.totalItems || ''}
              onChange={e => set('totalItems', e.target.value)} placeholder="예: 200" />
          </div>
          <div className="input-group">
            <div className="input-label-row"><span className="input-label">자동화 적용 Item 수</span></div>
            <input className="input-field" type="number" min={0} value={f.automatedItems || ''}
              onChange={e => set('automatedItems', e.target.value)} placeholder="예: 100" />
          </div>
          <div className="result-box full-width tone-final">
            <span className="result-box__label">자동화율 = 자동화 적용 Item 수 ÷ 총 입고 Item 수</span>
            <span className="result-box__value">{fmtN(automationRate, '%', 1, true)}</span>
          </div>
        </div>
      </div>

      <div className="section-card">
        <div className="section-title">
          Re-Handling율
          <HelpHint title="Re-Handling율">
            <p>입고 Item 중 Re-Handling이 발생한 Item 비율을 산출합니다.</p>
            <HintFormula>{`Re-Handling율 = Re-Handling Item 수 ÷ 총 입고 Item 수 × 100`}</HintFormula>
            <HintNote>용기가 바뀌면 Re-Handling 작업으로 봅니다.</HintNote>
          </HelpHint>
        </div>
        <div className="input-grid">
          <div className="input-group">
            <div className="input-label-row"><span className="input-label">총 입고 Item 수</span></div>
            <input className="input-field" type="number" min={0} value={f.rehandlingTotalItems || ''}
              onChange={e => set('rehandlingTotalItems', e.target.value)} placeholder="미입력 시 총 입고 Item 수" />
          </div>
          <div className="input-group">
            <div className="input-label-row"><span className="input-label">Re-Handling Item 수</span></div>
            <input className="input-field" type="number" min={0} value={f.rehandlingItems || ''}
              onChange={e => set('rehandlingItems', e.target.value)} placeholder="예: 100" />
          </div>
          <div className="result-box full-width tone-final">
            <span className="result-box__label">Re-Handling율 = Re-Handling Item 수 ÷ 총 입고 Item 수</span>
            <span className="result-box__value">{fmtN(rehandlingRate, '%', 1, true)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
