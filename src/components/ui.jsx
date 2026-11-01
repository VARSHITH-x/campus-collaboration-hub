// Small shared pieces: Modal, Badge, Empty, PageHeader, Planned, Toasts.
import { useEffect, useState } from 'react'

export function Badge({ children, tone = '' }) {
  return <span className={`badge ${tone}`}>{children}</span>
}

export function PageHeader({ title, subtitle, children }) {
  return (
    <div className="page-head">
      <div>
        <h1>{title}</h1>
        {subtitle && <p className="muted">{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}

export function Empty({ title, text }) {
  return (
    <div className="empty">
      <strong>{title}</strong>
      {text && <p className="muted">{text}</p>}
    </div>
  )
}

export function Modal({ title, onClose, children }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <h2>{title}</h2>
        {children}
      </div>
    </div>
  )
}

// Honest placeholder for a screen that is built in a later phase.
export function Planned({ title, phase, items }) {
  return (
    <>
      <PageHeader title={title} subtitle={`Planned for ${phase}. Nothing on this page is functional yet.`} />
      <div className="card">
        <h3>What will be built here</h3>
        <ul className="plain-list">
          {items.map((t) => <li key={t}>{t}</li>)}
        </ul>
      </div>
    </>
  )
}

// Toasts: call toast('Saved') from anywhere.
let pushToast = () => {}
export const toast = (message, tone = 'ok') => pushToast(message, tone)

export function Toasts() {
  const [list, setList] = useState([])
  useEffect(() => {
    pushToast = (message, tone) => {
      const id = Date.now() + Math.random()
      setList((l) => [...l, { id, message, tone }])
      setTimeout(() => setList((l) => l.filter((t) => t.id !== id)), 3200)
    }
    return () => { pushToast = () => {} }
  }, [])
  return (
    <div className="toasts" aria-live="polite">
      {list.map((t) => <div key={t.id} className={`toast ${t.tone}`}>{t.message}</div>)}
    </div>
  )
}
