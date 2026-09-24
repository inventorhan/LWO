import { useState, useEffect } from 'react'
import { fmtTime, getGap } from '../utils/common'

/**
 * Start/End 버튼식 타이머 카드. Start 누른 뒤 0.1초마다 갱신.
 */
export default function TimerSection({ title, start, end, onStart, onEnd, onDelete, extraInputs }) {
  const [, setTick] = useState(0)

  useEffect(() => {
    if (!start || end) return
    const interval = setInterval(() => setTick(t => t + 1), 200)
    return () => clearInterval(interval)
  }, [start, end])

  const gap = getGap(start, end)
  const displayGap = gap ? gap + '초' : '—'
  const isRunning = !!start && !end

  return (
    <div className="timing-section">
      {onDelete && (
        <button
          onClick={onDelete}
          aria-label="삭제"
          style={{
            position: 'absolute', top: '10px', right: '10px',
            width: 28, height: 28, padding: 0,
            background: 'transparent', border: 'none',
            fontSize: '1.1rem', color: '#9C8E94', cursor: 'pointer', zIndex: 10
          }}
          title="삭제"
        >🗑️</button>
      )}

      <div style={{
        fontSize: '0.95rem', fontWeight: 800, color: 'var(--color-text-primary)',
        marginBottom: 12, paddingRight: onDelete ? 32 : 0, letterSpacing: '-0.01em'
      }}>{title}</div>

      {extraInputs && <div style={{ marginBottom: 12 }}>{extraInputs}</div>}

      <div className="input-grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)' }}>
        <div className="input-group">
          <span className="input-label">Start</span>
          <button
            type="button"
            className="btn btn-time"
            style={{ backgroundColor: isRunning ? '#059669' : '#334155' }}
            onClick={onStart}
          >
            {start ? fmtTime(start) : '▶ Start'}
          </button>
        </div>
        <div className="input-group">
          <span className="input-label">End</span>
          <button
            type="button"
            className="btn btn-time"
            style={{ backgroundColor: end ? '#0F172A' : '#E11D48' }}
            onClick={onEnd}
            disabled={!start}
          >
            {end ? fmtTime(end) : '⏹ End'}
          </button>
        </div>
        <div className="input-group full-width" style={{ marginTop: 4 }}>
          <div className="result-box tone-dark" style={{
            flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 44
          }}>
            <span className="result-box__label" style={{ marginBottom: 0 }}>Gap Time</span>
            <span className="result-box__value">{displayGap}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
