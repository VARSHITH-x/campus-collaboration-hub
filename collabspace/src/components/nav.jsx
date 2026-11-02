import { useEffect, useRef, useState } from 'react'
import { demoUsers } from '../data.js'
import { switchUser, useCollection, useCurrentUser } from '../store.js'
import { unreadCount } from '../notify.js'
import { toast } from './ui.jsx'

export const links = [
  { page: 'home', label: 'Home' },
  { page: 'projects', label: 'Collaborate' },
  { page: 'learn', label: 'Learn & Mentor' },
  { page: 'community', label: 'Communities' },
  { page: 'activity', label: 'Activity' },
  { page: 'profile', label: 'My Profile' }
]

function UserMenu() {
  const user = useCurrentUser()
  const [open, setOpen] = useState(false)
  const box = useRef(null)

  useEffect(() => {
    const close = (e) => box.current && !box.current.contains(e.target) && setOpen(false)
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const pick = (u) => {
    switchUser(u.id)
    setOpen(false)
    toast(`Now viewing as ${u.displayName}`)
  }

  return (
    <div className="user-menu" ref={box}>
      <button className="btn ghost" onClick={() => setOpen(!open)} aria-expanded={open}>
        {user.displayName} <span className="caret">▾</span>
      </button>
      {open && (
        <div className="dropdown">
          <p className="dropdown-note">Demo user switcher. This is not authentication.</p>
          {demoUsers.map((u) => (
            <button key={u.id} className={`dropdown-item ${u.id === user.id ? 'on' : ''}`} onClick={() => pick(u)}>
              {u.displayName}
              <small>{u.role === 'moderator' ? 'moderator' : `Year ${u.year} · ${u.branch}`}</small>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Nav({ page }) {
  const [menu, setMenu] = useState(false)
  const me = useCurrentUser()
  useCollection('notifications')
  const unread = unreadCount(me.id)
  return (
    <header className="nav">
      <div className="nav-inner">
        <a className="brand" href="#/home">Collab<span>Space</span></a>
        <button className="btn ghost burger" onClick={() => setMenu(!menu)} aria-expanded={menu} aria-controls="main-nav">Menu</button>
        <nav id="main-nav" aria-label="Main" className={`nav-links ${menu ? 'show' : ''}`}>
          {links.map((l) => (
            <a key={l.page} href={`#/${l.page}`} className={page === l.page ? 'active' : ''} onClick={() => setMenu(false)}>
              {l.label}
              {l.page === 'activity' && unread > 0 && <span className="count" aria-label={`${unread} unread`}>{unread}</span>}
            </a>
          ))}
        </nav>
        <UserMenu />
      </div>
    </header>
  )
}
