// "My learning": messages sent to me, messages I sent, active matches,
// my offers and requests, and my circles.
import { useCollection } from '../store.js'
import { Badge, Empty, Status, Who, finish } from '../components/ui.jsx'
import { respondMentorship, withdrawMentorship } from '../learning.js'
import { fmtDate } from '../util.js'

const KIND = { request: 'asked to be mentored', offer: 'offered help' }

function Section({ title, count, children }) {
  return (
    <section className="section">
      <h2>{title} {count > 0 && <small className="muted">({count})</small>}</h2>
      {children}
    </section>
  )
}

export default function MyLearning({ user }) {
  const matches = useCollection('mentorshipRequests')
  const offers = useCollection('mentorOffers')
  const requests = useCollection('learningRequests')
  const circles = useCollection('circles')
  const milestones = useCollection('milestones')

  const inbox = matches.filter((m) => m.toId === user.id && m.status === 'pending')
  const sent = matches.filter((m) => m.fromId === user.id)
  const active = matches.filter((m) => m.status === 'accepted' && (m.fromId === user.id || m.toId === user.id))
  const myOffers = offers.filter((o) => o.mentorId === user.id)
  const myRequests = requests.filter((r) => r.requesterId === user.id)
  const myCircles = circles.filter((c) => c.memberIds.includes(user.id))

  return (
    <>
      <Section title="Waiting for your answer" count={inbox.length}>
        {inbox.length === 0 ? <Empty title="Nothing waiting" text="Requests and offers sent to you will appear here." /> : (
          <div className="stack">
            {inbox.map((m) => (
              <div key={m.id} className="card">
                <div className="row"><h3>{m.topic}</h3><Badge>{m.kind === 'request' ? 'mentorship request' : 'offer of help'}</Badge></div>
                <p className="meta"><Who id={m.fromId} /> {KIND[m.kind]} · {fmtDate(m.createdAt)}</p>
                <p>{m.message}</p>
                <div className="actions left">
                  <button className="btn" onClick={() => finish(respondMentorship(m.id, user.id, 'accepted'), null, 'Accepted. You are now matched.')}>Accept</button>
                  <button className="btn ghost" onClick={() => finish(respondMentorship(m.id, user.id, 'declined'), null, 'Declined')}>Decline</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="Active matches" count={active.length}>
        {active.length === 0 ? <Empty title="No active matches" text="Accepted requests and offers show up here." /> : (
          <div className="stack">
            {active.map((m) => (
              <div key={m.id} className="card row">
                <span><strong>{m.topic}</strong> · <Who id={m.fromId === user.id ? m.toId : m.fromId} /></span>
                <Status value="accepted" />
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="Messages I sent" count={sent.length}>
        {sent.length === 0 ? <Empty title="No messages sent" /> : (
          <div className="stack">
            {sent.map((m) => (
              <div key={m.id} className="card row">
                <span><strong>{m.topic}</strong> · to <Who id={m.toId} /></span>
                <span className="inline">
                  <Status value={m.status} />
                  {m.status === 'pending' && <button className="btn ghost small" onClick={() => finish(withdrawMentorship(m.id, user.id), null, 'Withdrawn')}>Withdraw</button>}
                </span>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="My mentor offers and learning requests" count={myOffers.length + myRequests.length}>
        {myOffers.length + myRequests.length === 0 ? <Empty title="Nothing posted" text="Offer to mentor or post a learning request from the other tabs." /> : (
          <div className="stack">
            {myOffers.map((o) => (
              <div key={o.id} className="card row"><span><Badge>offer</Badge> {o.topic}</span><Status value={o.status} /></div>
            ))}
            {myRequests.map((r) => (
              <div key={r.id} className="card">
                <div className="row"><span><Badge>request</Badge> {r.topic}</span><Status value={r.status} /></div>
                {r.outcome && <p className="note">Outcome: {r.outcome}</p>}
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="My circles" count={myCircles.length}>
        {myCircles.length === 0 ? <Empty title="You are not in a circle" text="Join or start one from the Circles tab." /> : (
          <div className="stack">
            {myCircles.map((c) => {
              const ms = milestones.filter((m) => m.circleId === c.id)
              const done = ms.filter((m) => m.completedBy.includes(user.id)).length
              return (
                <a key={c.id} className="card row link-card" href={`#/learn/${c.id}`}>
                  <span><strong>{c.topic}</strong> · {done}/{ms.length} milestones done</span>
                  <Status value={c.status} />
                </a>
              )
            })}
          </div>
        )}
      </Section>
    </>
  )
}
