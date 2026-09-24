import { useState, useRef, useEffect } from 'react'
import splashImg from '../../assets/splash.jpg'

export default function SplashScreen({ fadeMs = 400 }) {
  const [phase, setPhase] = useState('show')
  const doneTimer = useRef(null)

  useEffect(() => () => clearTimeout(doneTimer.current), [])

  const dismiss = () => {
    if (phase !== 'show') return
    setPhase('fade')
    doneTimer.current = setTimeout(() => setPhase('done'), fadeMs)
  }

  if (phase === 'done') return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'linear-gradient(180deg, #070D18 0%, #0F172A 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        padding: 16,
        opacity: phase === 'fade' ? 0 : 1,
        transition: `opacity ${fadeMs}ms ease`,
        pointerEvents: phase === 'fade' ? 'none' : 'auto'
      }}
    >
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        background: 'rgba(255, 255, 255, 0.06)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        backdropFilter: 'blur(10px)',
        padding: '5px 14px',
        borderRadius: 20,
        boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
        marginBottom: 4
      }}>
        <span className="brand-badge">NOL-IS</span>
        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#E2E8F0', letterSpacing: '0.04em' }}>
          Smart Operations Suite
        </span>
      </div>

      <img
        src={splashImg}
        alt="NOL-IS LWO"
        style={{
          maxWidth: '100%',
          maxHeight: '68vh',
          width: 'auto',
          height: 'auto',
          objectFit: 'contain',
          userSelect: 'none',
          WebkitUserDrag: 'none',
          borderRadius: 14,
          boxShadow: '0 20px 48px -12px rgba(0, 0, 0, 0.7)'
        }}
        draggable={false}
      />

      <button
        onClick={dismiss}
        style={{
          padding: '14px 54px',
          fontSize: '1.05rem',
          fontWeight: 800,
          color: 'white',
          background: 'linear-gradient(135deg, #E11D48 0%, #C40030 50%, #9E0026 100%)',
          border: '1.5px solid rgba(255,255,255,0.4)',
          borderRadius: 999,
          boxShadow: '0 8px 28px rgba(196, 0, 48, 0.45), 0 0 0 6px rgba(196,0,48,0.2)',
          cursor: 'pointer',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          animation: 'splashPulse 1.8s ease-in-out infinite',
          flexShrink: 0
        }}
      >
        ▶ Start
      </button>

      <div style={{
        fontSize: '0.74rem',
        fontWeight: 600,
        color: '#64748B',
        letterSpacing: '0.02em',
        marginTop: 2
      }}>
        LWO v1.3.0 · Logistics Work Optimizer
      </div>
      <style>{`
        @keyframes splashPulse {
          0%, 100% { transform: scale(1);    box-shadow: 0 8px 28px rgba(196, 0, 48, 0.45), 0 0 0 6px rgba(196,0,48,0.2); }
          50%      { transform: scale(1.05); box-shadow: 0 12px 36px rgba(196, 0, 48, 0.6), 0 0 0 10px rgba(196,0,48,0.3); }
        }
      `}</style>
    </div>
  )
}
