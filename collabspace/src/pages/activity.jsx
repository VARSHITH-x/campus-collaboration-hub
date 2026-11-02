// Activity: the signed-in demo user's notifications, newest first.
import { useState } from 'react'
import { go, useCollection, useCurrentUser } from '../store.js'
import { Badge, Empty, PageHeader, Tabs } from '../components/ui.jsx'
import { markAllRead, markRead, routeFor } from '../notify.js'
import { fmtDate } from '../util.js'

const LABEL = {
  application: 'Application', task: 'Task', project: 'Project', mentorship: 'Mentorship',
  circle: 'Circle', comment: 'Comment', post: 'Post', report: 'Report', bridge: 'Idea to project'
}

export default function Activity() {
  const user = useCurrentUser()
  const all = useCollection('notifications')
  const [tab, setTab] = useState('unread')

  const mine = all.filter((n) => n.recipientId === user.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const unread = mine.filter((n) => !n.read)
  const shown = tab === 'unread' ? unread : mine

  const open = (n) => {
    markRead(n.id, user.id)
    const route = routeFor(n)
    if (route) go(route)
  }

  return (
    <>
      <PageHeader title="Activity" subtitle="Things that happened to you or your projects.">
        {unread.length > 0 && <button className="btn ghost" onClick={() => markAllRead(user.id)}>Mark all as read</button>}
      </PageHeader>
      <Tabs value={tab} onChange={setTab} tabs={[
        { key: 'unread', label: `Unread (${unread.length})` }, { key: 'all', label: `All (${mine.length})` }
      ]} />
      <div className="tab-body" key={tab}>
        {shown.length === 0 ? (
          <Empty title={tab === 'unread' ? 'You are all caught up' : 'No activity yet'}
            text="Applications, task updates, mentorship replies and comments will show up here." />
        ) : (
          <div className="stack">
            {shown.map((n) => (
              <button key={n.id} className={`card notif ${n.read ? '' : 'unread'}`} onClick={() => open(n)}>
                <span className="row">
                  <Badge tone={n.read ? '' : 'accent'}>{LABEL[n.eventType] || 'Update'}</Badge>
                  <small className="muted">{fmtDate(n.createdAt)}</small>
                </span>
                <span className="notif-text">{n.message}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
