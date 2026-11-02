// Collaborate: project discovery list. A project id in the URL opens the detail page.
import { useMemo, useState } from 'react'
import { useCollection, useRoute } from '../store.js'
import { Badge, Empty, PageHeader, Status, Who } from '../components/ui.jsx'
import { CATEGORIES, RECRUITING, openingsLeft, rolesOf } from '../collab.js'
import { fmtDate, localToday } from '../util.js'
import { OpportunityForm } from './projectforms.jsx'
import ProjectDetail from './project.jsx'

const STATUS_GROUPS = {
  recruiting: (o) => RECRUITING.includes(o.status),
  active: (o) => o.status === 'active',
  finished: (o) => ['completed', 'archived'].includes(o.status),
  all: () => true
}

function deadlineOk(opp, mode) {
  if (mode === 'any') return true
  if (mode === 'none') return !opp.deadline
  if (!opp.deadline) return false
  return (Date.parse(opp.deadline) - Date.parse(localToday())) / 86400000 <= Number(mode)
}

function ProjectList() {
  const opps = useCollection('opportunities')
  useCollection('roles')
  useCollection('applications')
  const [q, setQ] = useState('')
  const [category, setCategory] = useState('all')
  const [group, setGroup] = useState('recruiting')
  const [deadline, setDeadline] = useState('any')
  const [creating, setCreating] = useState(false)

  const shown = useMemo(() => {
    const text = q.trim().toLowerCase()
    return opps
      .filter((o) => STATUS_GROUPS[group](o))
      .filter((o) => category === 'all' || o.category === category)
      .filter((o) => deadlineOk(o, deadline))
      .filter((o) => !text || `${o.title} ${o.description} ${o.category}`.toLowerCase().includes(text))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }, [opps, q, category, group, deadline])

  return (
    <>
      <PageHeader title="Collaborate" subtitle="Find a project to join, or publish your own and recruit by role.">
        <button className="btn" onClick={() => setCreating(true)}>Publish a project</button>
      </PageHeader>

      <div className="filters">
        <input type="search" placeholder="Search projects" aria-label="Search projects" value={q} onChange={(e) => setQ(e.target.value)} />
        <select aria-label="Status" value={group} onChange={(e) => setGroup(e.target.value)}>
          <option value="recruiting">Recruiting</option>
          <option value="active">In progress</option>
          <option value="finished">Completed / archived</option>
          <option value="all">All statuses</option>
        </select>
        <select aria-label="Category" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="all">All categories</option>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select aria-label="Deadline" value={deadline} onChange={(e) => setDeadline(e.target.value)}>
          <option value="any">Any deadline</option>
          <option value="7">Within 7 days</option>
          <option value="30">Within 30 days</option>
          <option value="none">No deadline</option>
        </select>
      </div>

      {shown.length === 0 ? (
        <Empty title="No projects match" text="Try a different filter, or publish the first one." />
      ) : (
        <div className="grid two">
          {shown.map((o) => (
            <div key={o.id} className="card link-card stretch">
              <div className="row"><h3><a className="stretch-link" href={`#/projects/${o.id}`}>{o.title}</a></h3><Status value={o.status} /></div>
              <p className="muted clamp">{o.description}</p>
              <div className="tags">
                <Badge>{o.category}</Badge>
                <Badge tone={o.experience === 'beginner-friendly' ? 'accent' : ''}>{o.experience}</Badge>
              </div>
              <p className="meta">
                By <Who id={o.creatorId} /> · {o.durationDays} days · {o.weeklyHours} h/week
                {o.deadline && ` · deadline ${fmtDate(o.deadline)}`}
              </p>
              <small className="muted">
                {rolesOf(o.id).length} role{rolesOf(o.id).length === 1 ? '' : 's'}
                {RECRUITING.includes(o.status) && ` · ${openingsLeft(o.id)} opening${openingsLeft(o.id) === 1 ? '' : 's'} left`}
              </small>
            </div>
          ))}
        </div>
      )}
      {creating && <OpportunityForm onClose={() => setCreating(false)} />}
    </>
  )
}

export default function Projects() {
  const { rest } = useRoute()
  return rest[0] ? <ProjectDetail id={rest[0]} /> : <ProjectList />
}
