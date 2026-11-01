import { lwoText } from '../../i18n'
import { useState } from 'react'

/**
 * 사진 갤러리 + 추가 버튼. 클릭 시 미리보기 모달.
 */
export default function PhotoSection({ title, photos, onAdd, onRemove }) {
  const [preview, setPreview] = useState(null)
  const list = photos || []

  return (
    <div className="input-group">
      {title && <span className="input-label">{title}</span>}
      <div className="photo-gallery">
        {list.map((url, i) => (
          <div key={i} className="photo-item" onClick={() => setPreview(url)}
               style={{ cursor: 'zoom-in' }} title={lwoText('클릭하여 확대')}>
            <img src={url} alt={`${title || ''} ${i + 1}`} />
            <button
              onClick={(e) => { e.stopPropagation(); onRemove(i) }}
              aria-label={lwoText('사진 삭제')}
              style={{
                position: 'absolute', top: 2, right: 2,
                width: 22, height: 22, background: 'rgba(239, 68, 68, 0.95)',
                color: 'white', border: 'none', borderRadius: '50%',
                fontSize: 12, lineHeight: 1, cursor: 'pointer', zIndex: 2
              }}
            >✕</button>
          </div>
        ))}
        <label className="btn" style={{
          width: 80, height: 80, flexShrink: 0,
          background: '#F4EFF1', border: '1.5px dashed #D4C8CD',
          color: '#7C6E74', flexDirection: 'column',
          fontSize: '0.72rem', gap: 4, padding: 0, cursor: 'pointer'
        }}>
          <span style={{ fontSize: '1.4rem' }}>📷</span>
          <span>{lwoText(list.length > 0 ? '추가' : '촬영')}</span>
          <input
            type="file" accept="image/*" capture="environment"
            style={{ display: 'none' }}
            onChange={e => { const f = e.target.files[0]; if (f) onAdd(f); e.target.value = '' }}
          />
        </label>
      </div>

      {preview && (
        <div className="modal-overlay" onClick={() => setPreview(null)}
             style={{ cursor: 'zoom-out' }}>
          <img src={preview} alt={lwoText('미리보기')}
               style={{ maxWidth: '92vw', maxHeight: '88vh', borderRadius: 8, boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}
               onClick={e => e.stopPropagation()} />
          <button
            onClick={() => setPreview(null)}
            style={{
              position: 'fixed', top: 20, right: 20,
              width: 40, height: 40, borderRadius: '50%',
              border: 'none', background: 'rgba(255,255,255,0.95)',
              fontSize: '1.2rem', fontWeight: 700, cursor: 'pointer'
            }}
          >✕</button>
        </div>
      )}
    </div>
  )
}
