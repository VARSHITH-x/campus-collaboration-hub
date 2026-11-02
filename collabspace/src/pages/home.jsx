// Home dashboard. Every number and list here is computed from stored data.
import { useCollection, useCurrentUser } from '../store.js'
import { Badge, Empty, Status } from '../components/ui.jsx'
import { RECRUITING, filled, teamIds } from '../collab.js'
import { fmtDate } from '../util.js'

const low = (list) => (list || []).map((s) => s.toLowerCase())

function Block({ title, link, linkLabel, children }) {
  return (
    <section className="card">
      <div className="row"><h3>{title}</h3>{link && <a className="link-btn" href={link}>{linkLabel}</a>}</div>
      {children}
    </section>
  )
}

function useDashboard(user) {
  const opps = useCollection('opportunities')
  const roles = useCollection('roles')
  const apps = useCollection('applications')
  const tasks = useCollection('tasks')
  const matches = useCollection('mentorshipRequests')
  const offers = useCollection('mentorOffers')
  const posts = useCollection('posts')
  const reports = useCollection('reports')
  const notes = useCollection('notifications')

  const owned = opps.filter((o) => o.creatorId === user.id)
  const mineProjects = opps.filter((o) => o.status !== 'archived' && teamIds(o).includes(user.id) &&
    (o.creatorId === user.id || apps.some((a) => a.opportunityId === o.id && a.applicantId === user.id && a.status === 'accepted')))

  const attention = []
  owned.filter((o) => RECRUITING.includes(o.status)).forEach((o) => {
    const n = apps.filter((a) => a.opportunityId === o.id && a.status === 'pending').length
    if (n) attention.push({ key: `a${o.id}`, text: `${n} pending application${n === 1 ? '' : 's'} for ${o.title}`, link: `projects/${o.id}` })
  })
  owned.forEach((o) => {
    const n = tasks.filter((t) => t.opportunityId === o.id && t.status === 'submitted').length
    if (n) attention.push({ key: `r${o.id}`, text: `${n} task${n === 1 ? '' : 's'} waiting for your review in ${o.title}`, link: `projects/${o.id}` })
  })
  tasks.filter((t) => t.assigneeId === user.id && t.status !== 'completed' && t.status !== 'submitted').forEach((t) => {
    const o = opps.find((x) => x.id === t.opportunityId)
    if (o && ['forming', 'active'].includes(o.status)) attention.push({ key: t.id, text: `Your task "${t.title}" is due ${fmtDate(t.dueDate)}`, link: `projects/${o.id}` })
  })
  const waiting = matches.filter((m) => m.toId === user.id && m.status === 'pending').length
  if (waiting) attention.push({ key: 'm', text: `${waiting} mentorship message${waiting === 1 ? '' : 's'} waiting for your answer`, link: 'learn' })
  const openReports = reports.filter((r) => r.status === 'open').length
  if (user.role === 'moderator' && openReports) attention.push({ key: 'rep', text: `${openReports} open report${openReports === 1 ? '' : 's'} to review`, link: 'community/moderation' })

  // Roles whose skills overlap with what this student knows or is learning.
  const mySkills = new Set([...low(user.skillsKnown), ...low(user.skillsLearning)])
  const suggestedRoles = []
  opps.filter((o) => RECRUITING.includes(o.status) && o.creatorId !== user.id).forEach((o) => {
    roles.filter((r) => r.opportunityId === o.id && filled(r.id) < r.openings).forEach((r) => {
      if (apps.some((a) => a.roleId === r.id && a.applicantId === user.id && ['pending', 'accepted'].includes(a.status))) return
      const hits = [...r.requiredSkills, ...r.preferredSkills].filter((s) => mySkills.has(s.toLowerCase()))
      if (hits.length) suggestedRoles.push({ role: r, opp: o, hits })
    })
  })
  suggestedRoles.sort((a, b) => b.hits.length - a.hits.length)

  const wanted = low(user.skillsLearning)
  const suggestedOffers = offers.filter((o) => o.status === 'open' && o.mentorId !== user.id &&
    wanted.some((w) => o.topic.toLowerCase().includes(w) || w.includes(o.topic.toLowerCase())))

  const announcements = posts
    .filter((p) => p.postType === 'announcement' && ['published', 'reported'].includes(p.status))
    .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.createdAt.localeCompare(a.createdAt)).slice(0, 3)

  const recent = notes.filter((n) => n.recipientId === user.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 4)
  return { attention, mineProjects, suggestedRoles: suggestedRoles.slice(0, 4), suggestedOffers: suggestedOffers.slice(0, 3), announcements, recent }
}

export default function Home() {
  const user = useCurrentUser()
  const d = useDashboard(user)
  const communities = useCollection('communities')
  const mine = communities.filter((c) => c.memberIds.includes(user.id))

  return (
    <>
      <section className="hero">
        <h1>Find people. Share goals. Build together.</h1>
        <p className="muted">Welcome, {user.displayName}. Short-term goals, learning partners and campus conversations, in one place.</p>
        <div className="actions left">
          <a className="btn" href="#/projects">Find a project</a>
          <a className="btn ghost" href="#/learn">Find a mentor</a>
          <a className="btn ghost" href="#/community">Join a conversation</a>
        </div>
      </section>

      <div className="grid two">
        <Block title="Needs your attention">
          {d.attention.length === 0 ? <p className="muted">Nothing is waiting for you right now.</p> : (
            <ul className="plain-list tight">{d.attention.map((a) => <li key={a.key}><a href={`#/${a.link}`}>{a.text}</a></li>)}</ul>
          )}
        </Block>

        <Block title="Your projects" link="#/projects" linkLabel="Browse all">
          {d.mineProjects.length === 0 ? <p className="muted">You are not on a project yet. Apply for a role or publish your own.</p> : (
            <ul className="plain-list tight">
              {d.mineProjects.map((o) => (
                <li key={o.id}><a href={`#/projects/${o.id}`}>{o.title}</a> <Status value={o.status} /> {o.creatorId === user.id && <Badge>owner</Badge>}</li>
              ))}
            </ul>
          )}
        </Block>

        <Block title="Roles that match your skills" link="#/projects" linkLabel="All projects">
          {d.suggestedRoles.length === 0 ? <p className="muted">No open role matches your listed skills yet. Add skills to your profile to see matches.</p> : (
            <ul className="plain-list tight">
              {d.suggestedRoles.map(({ role, opp, hits }) => (
                <li key={role.id}><a href={`#/projects/${opp.id}`}>{role.title}</a> in {opp.title}<br /><small className="muted">Matches: {hits.join(', ')}</small></li>
              ))}
            </ul>
          )}
        </Block>

        <Block title="Mentors for what you are learning" link="#/learn" linkLabel="All mentors">
          {d.suggestedOffers.length === 0 ? <p className="muted">No open mentor offer matches your learning list. Browse the mentor directory instead.</p> : (
            <ul className="plain-list tight">
              {d.suggestedOffers.map((o) => <li key={o.id}><a href="#/learn">{o.topic}</a> <small className="muted">· {o.format}</small></li>)}
            </ul>
          )}
        </Block>

        <Block title="Campus announcements" link="#/community" linkLabel="Communities">
          {d.announcements.length === 0 ? <p className="muted">No announcements.</p> : (
            <ul className="plain-list tight">
              {d.announcements.map((p) => <li key={p.id}>{p.pinned && <Badge tone="accent">pinned</Badge>} <a href={`#/community/${p.communityId}`}>{p.title}</a></li>)}
            </ul>
          )}
        </Block>

        <Block title="Recent activity" link="#/activity" linkLabel="See all">
          {d.recent.length === 0 ? <p className="muted">Nothing yet. Updates about your applications, tasks and replies appear here.</p> : (
            <ul className="plain-list tight">{d.recent.map((n) => <li key={n.id} className={n.read ? '' : 'strong'}>{n.message}</li>)}</ul>
          )}
        </Block>
      </div>

      <h2 className="section-title">Your communities</h2>
      {mine.length === 0 ? <Empty title="You have not joined a community" text="Join a batch, branch or topic space to start posting."><a className="btn ghost" href="#/community">Browse communities</a></Empty> : (
        <div className="tags">{mine.map((c) => <a key={c.id} className="chip" href={`#/community/${c.id}`}>{c.name}</a>)}</div>
      )}
    </>
  )
}
