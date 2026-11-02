// Small shared pieces used by every page.
import { Component, useEffect, useState } from 'react'
import { useCollection } from '../store.js'

export function Badge({ children, tone = '' }) {
  return <span className={`badge ${tone}`}>{children}</span>
}

const TONES = {
  open: 'accent', forming: 'accent', active: 'accent', accepted: 'accent', completed: 'accent',
  declined: 'warn', removed: 'warn', reported: 'warn', hidden: 'warn', actioned: 'warn'
}
export function Status({ value }) {
  return <Badge tone={TONES[value] || ''}>{String(value).replace('_', ' ')}</Badge>
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

export function Empty({ title, text, children }) {
  return (
    <div className="empty">
      <strong>{title}</strong>
      {text && <p className="muted">{text}</p>}
      {children}
    </div>
  )
}

// A student's name, linking to their profile.
export function Who({ id }) {
  const profiles = useCollection('profiles')
  const p = profiles.find((x) => x.id === id)
  if (!p) return <span className="muted">Unknown student</span>
  return <a className="who" href={`#/profile/${p.id}`}>{p.displayName}</a>
}

export function Modal({ title, onClose, wide, children }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${wide ? 'wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <h2>{title}</h2>
        {children}
      </div>
    </div>
  )
}

// Ask before anything destructive.
export function Confirm({ title, text, label = 'Confirm', danger, onConfirm, onClose }) {
  return (
    <Modal title={title} onClose={onClose}>
      <p className="muted">{text}</p>
      <div className="actions">
        <button className="btn ghost" onClick={onClose}>Cancel</button>
        <button className={`btn ${danger ? 'danger' : ''}`} onClick={() => { onConfirm(); onClose() }}>{label}</button>
      </div>
    </Modal>
  )
}

export function Tabs({ tabs, value, onChange }) {
  return (
    <div className="tabs" role="tablist">
      {tabs.map((t) => (
        <button key={t.key} role="tab" aria-selected={value === t.key} className={`tab ${value === t.key ? 'on' : ''}`} onClick={() => onChange(t.key)}>
          {t.label}
        </button>
      ))}
    </div>
  )
}

export function Progress({ value, max }) {
  const pct = max ? Math.round((value / max) * 100) : 0
  return (
    <div className="progress" role="progressbar" aria-valuenow={pct} aria-valuemin="0" aria-valuemax="100">
      <div style={{ width: `${pct}%` }} />
    </div>
  )
}

export function Links({ items }) {
  if (!items || items.length === 0) return null
  return (
    <div className="links">
      {items.map((u) => {
        let host = u
        try { host = new URL(u).hostname.replace(/^www\./, '') } catch { /* keep raw text */ }
        return <a key={u} href={u} target="_blank" rel="noopener noreferrer">{host}</a>
      })}
    </div>
  )
}

export function TagList({ items }) {
  if (!items || items.length === 0) return null
  return <div className="tags">{items.map((t) => <Badge key={t}>{t}</Badge>)}</div>
}

// ---- Forms --------------------------------------------------------------------
export function Field({ label, error, hint, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {hint && <small className="muted">{hint}</small>}
      {error && <small className="err">{error}</small>}
    </label>
  )
}

export function useForm(initial) {
  const [values, setValues] = useState(initial)
  const set = (name, value) => setValues((v) => ({ ...v, [name]: value }))
  const bind = (name) => ({ value: values[name] ?? '', onChange: (e) => set(name, e.target.value) })
  const check = (name) => ({ checked: !!values[name], onChange: (e) => set(name, e.target.checked) })
  return { values, bind, check, set }
}

// Handles the result of a rule function: toast + inline errors. Returns true on success.
export function finish(res, setErrors, message) {
  if (res.ok) {
    if (setErrors) setErrors({})
    if (message) toast(message)
    return true
  }
  if (setErrors) setErrors(res.errors || {})
  toast(res.error, 'error')
  return false
}

// A modal with one text box, used for short messages, notes and summaries.
export function TextPrompt({ title, intro, label, field, submitLabel, success, onSubmit, onClose }) {
  const { values, bind } = useForm({ text: '' })
  const [errors, setErrors] = useState({})
  const submit = (e) => {
    e.preventDefault()
    const res = onSubmit(values.text)
    if (finish(res, setErrors, success)) onClose()
  }
  return (
    <Modal title={title} onClose={onClose}>
      <form onSubmit={submit} noValidate>
        {intro && <p className="muted">{intro}</p>}
        <Field label={label} error={errors[field]}>
          <textarea rows="4" autoFocus {...bind('text')} />
        </Field>
        <div className="actions">
          <button type="button" className="btn ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn">{submitLabel}</button>
        </div>
      </form>
    </Modal>
  )
}

// If one screen crashes (for example from damaged saved data), show a way out instead of a blank page.
export class ErrorBoundary extends Component {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch(error) { console.error(error) }
  componentDidUpdate(prev) { if (this.state.failed && prev.resetKey !== this.props.resetKey) this.setState({ failed: false }) }
  render() {
    if (!this.state.failed) return this.props.children
    return (
      <Empty title="Something went wrong on this page" text="Your saved data may be damaged. Restoring the demo data usually fixes it.">
        <div className="actions">
          <a className="btn ghost" href="#/home" onClick={() => this.setState({ failed: false })}>Go home</a>
          <button className="btn" onClick={() => { this.props.onReset(); this.setState({ failed: false }) }}>Restore demo data</button>
        </div>
      </Empty>
    )
  }
}

// Toasts: call toast('Saved') from anywhere.
let pushToast = () => {}
export const toast = (message, tone = 'ok') => pushToast(message, tone === 'error' ? 'error' : 'ok')

export function Toasts() {
  const [list, setList] = useState([])
  useEffect(() => {
    pushToast = (message, tone) => {
      const id = Date.now() + Math.random()
      setList((l) => [...l, { id, message, tone }].slice(-3))
      setTimeout(() => setList((l) => l.filter((t) => t.id !== id)), 3500)
    }
    return () => { pushToast = () => {} }
  }, [])
  return (
    <div className="toasts" aria-live="polite">
      {list.map((t) => <div key={t.id} className={`toast ${t.tone}`}>{t.message}</div>)}
    </div>
  )
}
