import { useCurrentUser } from '../store.js'
import { Badge, PageHeader } from '../components/ui.jsx'

function Tags({ label, items }) {
  return (
    <div className="field-block">
      <h4>{label}</h4>
      {items.length === 0 ? <p className="muted">None added yet.</p> : (
        <div className="tags">{items.map((t) => <Badge key={t}>{t}</Badge>)}</div>
      )}
    </div>
  )
}

export default function Profile() {
  const u = useCurrentUser()
  return (
    <>
      <PageHeader title="My Profile" subtitle="Read-only for now. Editing arrives in Phase 2." />
      <div className="card">
        <div className="row">
          <h2>{u.displayName}</h2>
          {u.role === 'moderator' && <Badge tone="accent">moderator</Badge>}
        </div>
        <p className="muted">Year {u.year} · {u.branch} · about {u.availabilityHours} h/week available</p>
        <p>{u.bio}</p>
        <Tags label="Skills known" items={u.skillsKnown} />
        <Tags label="Skills being learned" items={u.skillsLearning} />
        <Tags label="Topics of interest" items={u.topicsInterested} />
        <Tags label="Can teach" items={u.topicsCanTeach} />
        <Tags label="Participation" items={u.participationModes} />
      </div>
    </>
  )
}
