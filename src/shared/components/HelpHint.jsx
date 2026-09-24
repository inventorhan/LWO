import { useState, useEffect } from 'react'

/**
 * 섹션 카드 옆에 붙이는 ? 도움말 버튼.
 * 클릭 시 작은 모달로 해당 섹션 설명을 보여준다.
 *
 * 사용 예:
 *   <div className="section-title">
 *     기초 정보 입력
 *     <HelpHint title="기초 정보 입력">
 *       <p>작업자 이름, 운반 종류, 속도, 가중치를 설정합니다.</p>
 *       ...
 *     </HelpHint>
 *   </div>
 */
export default function HelpHint({ title, children }) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen(true) }}
        title={`${title} 도움말`}
        aria-label={`${title} 도움말 열기`}
        style={{
          flexShrink: 0,
          width: 22, height: 22,
          marginLeft: 6,
          borderRadius: '50%',
          border: '1.5px solid var(--color-primary)',
          background: 'var(--color-primary-softer)',
          color: 'var(--color-primary-dark)',
          fontSize: '0.78rem',
          fontWeight: 800,
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 0,
          lineHeight: 1
        }}
      >?</button>

      {open && (
        <div
          className="modal-overlay"
          onClick={() => setOpen(false)}
          style={{ padding: 14 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'white',
              width: '100%',
              maxWidth: 460,
              maxHeight: 'calc(100vh - 28px)',
              borderRadius: 12,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              boxShadow: '0 16px 48px rgba(0,0,0,0.3)'
            }}
          >
            {/* 헤더 */}
            <div style={{
              padding: '12px 16px',
              background: 'linear-gradient(135deg, var(--color-primary-dark), var(--color-primary))',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8
            }}>
              <div style={{ fontWeight: 800, fontSize: '0.98rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>💡</span><span>{title}</span>
              </div>
              <button
                onClick={() => setOpen(false)}
                style={{
                  background: 'rgba(255,255,255,0.18)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  color: 'white',
                  width: 30, height: 30,
                  borderRadius: 7,
                  fontSize: '1rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >✕</button>
            </div>

            {/* 본문 */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '14px 18px 18px',
              fontSize: '0.9rem',
              lineHeight: 1.65,
              color: 'var(--color-text-primary)'
            }}>
              {children}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

/* 공식/예시를 강조하는 작은 박스 */
export const HintFormula = ({ children }) => (
  <pre style={{
    background: '#0F172A',
    color: '#F8FAFC',
    padding: '10px 14px',
    borderRadius: 8,
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    fontSize: '0.8rem',
    margin: '8px 0',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    overflow: 'auto',
    border: '1px solid #1E293B'
  }}>{children}</pre>
)

export const HintNote = ({ children, type = 'info' }) => {
  const colors = {
    info: { bg: 'var(--color-primary-softer)', border: 'var(--color-primary)' },
    warn: { bg: '#FEF3C7', border: '#B45309' },
    ok:   { bg: '#D1FAE5', border: '#047857' }
  }[type]
  return (
    <div style={{
      background: colors.bg,
      borderLeft: `3px solid ${colors.border}`,
      padding: '8px 12px',
      borderRadius: 4,
      margin: '8px 0',
      fontSize: '0.85rem',
      lineHeight: 1.6
    }}>{children}</div>
  )
}
