import { useState } from 'react'
import Nav from './components/nav.jsx'
import { Modal, Toasts, toast } from './components/ui.jsx'
import { storage, useRoute, useStorageError } from './store.js'
import Home from './pages/home.jsx'
import Projects from './pages/projects.jsx'
import Learn from './pages/learn.jsx'
import Community from './pages/community.jsx'
import Activity from './pages/activity.jsx'
import Profile from './pages/profile.jsx'

const pages = { home: Home, projects: Projects, learn: Learn, community: Community, activity: Activity, profile: Profile }

export default function App() {
  const { page } = useRoute()
  const storageError = useStorageError()
  const [confirmReset, setConfirmReset] = useState(false)
  const Page = pages[page] || Home

  const reset = () => {
    storage.resetDemoData()
    setConfirmReset(false)
    toast('Demo data restored')
  }

  return (
    <>
      <Nav page={pages[page] ? page : 'home'} />
      {storageError && <div className="banner">{storageError}</div>}
      <main className="page" key={page}>
        <Page />
      </main>
      <footer className="footer">
        <span className="muted">
          Client-side prototype: data lives in this browser only and does not sync between devices.
          Demo records are fictional.
        </span>
        <button className="btn ghost small" onClick={() => setConfirmReset(true)}>Reset demo data</button>
      </footer>
      {confirmReset && (
        <Modal title="Reset demo data?" onClose={() => setConfirmReset(false)}>
          <p className="muted">This deletes everything saved in this browser for CollabSpace and restores the original demo records.</p>
          <div className="actions">
            <button className="btn ghost" onClick={() => setConfirmReset(false)}>Cancel</button>
            <button className="btn danger" onClick={reset}>Reset</button>
          </div>
        </Modal>
      )}
      <Toasts />
    </>
  )
}
