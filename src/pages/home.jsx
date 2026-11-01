import { useCollection, useCurrentUser } from '../store.js'
import { Badge, PageHeader } from '../components/ui.jsx'

const modules = [
  { page: 'projects', title: 'Collaborate', text: 'Post a project, define roles, take applications, assign tasks and close it with an outcome.' },
  { page: 'learn', title: 'Learn & Mentor', text: 'Find a mentor, offer help, form a learning circle and track milestones.' },
  { page: 'community', title: 'Communities', text: 'Discuss, ask questions, share resources, vote in polls and read announcements.' }
]

export default function Home() {
  const user = useCurrentUser()
  const communities = useCollection('communities')
  return (
    <>
      <section className="hero">
        <h1>Find people. Share goals. Build together.</h1>
        <p className="muted">
          Welcome, {user.displayName}. CollabSpace helps students discover short-term goals,
          join them, and close them when the work is done.
        </p>
      </section>

      <div className="grid three">
        {modules.map((m) => (
          <a key={m.page} className="card link-card" href={`#/${m.page}`}>
            <h3>{m.title}</h3>
            <p className="muted">{m.text}</p>
          </a>
        ))}
      </div>

      <PageHeader title="Campus communities" subtitle="Loaded from the shared storage layer. Joining and posting arrive in Phase 2." />
      <div className="grid three">
        {communities.map((c) => (
          <div key={c.id} className="card">
            <div className="row"><h3>{c.name}</h3><Badge>{c.type}</Badge></div>
            <p className="muted">{c.description}</p>
            <small className="muted">{c.memberIds.length} demo member{c.memberIds.length === 1 ? '' : 's'}</small>
          </div>
        ))}
      </div>
    </>
  )
}
