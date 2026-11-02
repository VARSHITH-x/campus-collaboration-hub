// Communities: directory, one community's feed, and the moderator's report queue.
import { useState } from 'react'
import { useCollection, useCurrentUser, useRoute } from '../store.js'
import { Badge, Confirm, Empty, PageHeader, Status, Who, finish } from '../components/ui.jsx'
import { isModerator, joinCommunity, leaveCommunity, resolveReport } from '../community.js'
import { fmtDate } from '../util.js'
import Feed from './feed.jsx'

function Directory({ user }) {
  const communities = useCollection('communities')
  const posts = useCollection('posts')
  const [type, setType] = useState('all')
  const [leaving, setLeaving] = useState(null)
  const types = ['all', 'general', 'batch', 'branch', 'topic']
  const shown = communities.filter((c) => type === 'all' || c.type === type)

  return (
    <>
      <PageHeader title="Communities" subtitle="Batch, branch and topic spaces. Join one to post; anyone can read and comment.">
        {isModerator(user.id) && <a className="btn ghost" href="#/community/moderation">Moderation queue</a>}
      </PageHeader>
      <div className="filters tight">
        {types.map((t) => (
          <button key={t} className={`chip ${type === t ? 'on' : ''}`} onClick={() => setType(t)}>{t === 'all' ? 'All' : t}</button>
        ))}
      </div>
      <div className="grid three">
        {shown.map((c) => {
          const member = c.memberIds.includes(user.id)
          const count = posts.filter((p) => p.communityId === c.id && ['published', 'reported'].includes(p.status)).length
          return (
            <div key={c.id} className="card">
              <div className="row"><h3>{c.name}</h3><Badge>{c.type}</Badge></div>
              <p className="muted">{c.description}</p>
              <small className="muted">{c.memberIds.length} member{c.memberIds.length === 1 ? '' : 's'} · {count} post{count === 1 ? '' : 's'}</small>
              <div className="actions left">
                <a className="btn" href={`#/community/${c.id}`}>Open feed</a>
                {member
                  ? <button className="btn ghost" onClick={() => setLeaving(c)}>Leave</button>
                  : <button className="btn ghost" onClick={() => finish(joinCommunity(user.id, c.id), null, `Joined ${c.name}`)}>Join</button>}
              </div>
            </div>
          )
        })}
      </div>
      {leaving && <Confirm title={`Leave ${leaving.name}?`} danger label="Leave" text="You can rejoin at any time. Your earlier posts stay in the feed."
        onConfirm={() => finish(leaveCommunity(user.id, leaving.id), null, `Left ${leaving.name}`)} onClose={() => setLeaving(null)} />}
    </>
  )
}

function Moderation({ user }) {
  const reports = useCollection('reports')
  const posts = useCollection('posts')
  const comments = useCollection('comments')
  const opps = useCollection('opportunities')
  const [removing, setRemoving] = useState(null)

  if (!isModerator(user.id)) {
    return <Empty title="Moderators only" text="Switch to the Campus Moderator demo user to review reports."><a className="btn ghost" href="#/community">Back to communities</a></Empty>
  }
  const open = reports.filter((r) => r.status === 'open')
  const done = reports.filter((r) => r.status !== 'open')
  const preview = (r) => {
    const item = (r.entityType === 'post' ? posts : r.entityType === 'comment' ? comments : opps).find((x) => x.id === r.entityId)
    if (!item) return 'Content no longer available'
    return r.entityType === 'comment' ? item.content : item.title
  }
  const act = (r, action, msg) => finish(resolveReport(user.id, r.id, action), null, msg)

  return (
    <>
      <a className="back" href="#/community">Back to communities</a>
      <PageHeader title="Moderation queue" subtitle="Reports are records for review. Nothing is removed automatically." />
      {open.length === 0 ? <Empty title="No open reports" text="Reports from students will appear here." /> : (
        <div className="stack">
          {open.map((r) => (
            <div key={r.id} className="card">
              <div className="row"><h3>{{ post: 'Post', comment: 'Comment', opportunity: 'Project' }[r.entityType]}: {preview(r)}</h3><Status value={r.status} /></div>
              <p>Reason: {r.reason}</p>
              <p className="meta">Reported by <Who id={r.reporterId} /> · {fmtDate(r.createdAt)}</p>
              <div className="actions left">
                <button className="btn ghost" onClick={() => act(r, 'reviewed', 'Marked as reviewed')}>Mark reviewed</button>
                <button className="btn ghost" onClick={() => act(r, 'dismissed', 'Report dismissed')}>Dismiss</button>
                <button className="btn danger" onClick={() => setRemoving(r)}>{r.entityType === 'opportunity' ? 'Archive project' : 'Remove content'}</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {done.length > 0 && (
        <section className="section">
          <h2>Handled reports</h2>
          <div className="stack">
            {done.map((r) => (
              <div key={r.id} className="card row"><span>{r.entityType}: {preview(r)}</span><Status value={r.status} /></div>
            ))}
          </div>
        </section>
      )}
      {removing && <Confirm title={removing.entityType === 'opportunity' ? 'Archive this project?' : 'Remove this content?'} danger label={removing.entityType === 'opportunity' ? 'Archive' : 'Remove'} text={removing.entityType === 'opportunity' ? 'It will stop appearing as open and pending applicants will be declined.' : 'It will no longer be visible to students.'}
        onConfirm={() => act(removing, 'actioned', removing.entityType === 'opportunity' ? 'Project archived' : 'Content removed')} onClose={() => setRemoving(null)} />}
    </>
  )
}

export default function Community() {
  const user = useCurrentUser()
  const communities = useCollection('communities')
  const { rest } = useRoute()

  if (rest[0] === 'moderation') return <Moderation user={user} />
  if (rest[0]) {
    const c = communities.find((x) => x.id === rest[0])
    if (!c) return <Empty title="Community not found"><a className="btn ghost" href="#/community">Back to communities</a></Empty>
    const member = c.memberIds.includes(user.id)
    return (
      <>
        <a className="back" href="#/community">Back to communities</a>
        <PageHeader title={c.name} subtitle={c.description}>
          {member
            ? <Badge tone="accent">member</Badge>
            : <button className="btn" onClick={() => finish(joinCommunity(user.id, c.id), null, `Joined ${c.name}`)}>Join to post</button>}
        </PageHeader>
        <Feed community={c} />
      </>
    )
  }
  return <Directory user={user} />
}
