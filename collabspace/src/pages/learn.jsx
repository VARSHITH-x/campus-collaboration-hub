// Learn & Mentor: mentor directory, learning requests and circles.
// A circle id in the URL opens the circle page.
import { useMemo, useState } from 'react'
import { go, useCollection, useCurrentUser, useRoute } from '../store.js'
import { Badge, Confirm, Empty, Field, Modal, PageHeader, Status, Tabs, TagList, TextPrompt, Who, finish, useForm } from '../components/ui.jsx'
import {
  LEVELS, OFFER_FORMATS, REQUEST_FORMATS, cancelRequest, closeOffer, createCircle, createLearningRequest,
  createOffer, finishRequest, joinCircle, offerHelp, requestMentorship
} from '../learning.js'
import MyLearning from './mylearn.jsx'
import Circle from './circle.jsx'

// A small modal form: `fields` describes the inputs, `action` calls the rule function.
function FormModal({ title, fields, initial, action, submitLabel, success, onClose, onDone }) {
  const { values, bind } = useForm(initial)
  const [errors, setErrors] = useState({})
  const submit = (e) => {
    e.preventDefault()
    const res = action(values)
    if (finish(res, setErrors, success)) { onClose(); if (onDone) onDone(res) }
  }
  return (
    <Modal title={title} onClose={onClose}>
      <form onSubmit={submit} noValidate>
        {fields.map((f) => (
          <Field key={f.name} label={f.label} hint={f.hint} error={errors[f.name]}>
            {f.type === 'select' ? (
              <select {...bind(f.name)}>
                <option value="">Choose...</option>
                {f.options.map((o) => <option key={o}>{o}</option>)}
              </select>
            ) : f.type === 'textarea' ? (
              <textarea rows="3" {...bind(f.name)} />
            ) : (
              <input type={f.type || 'text'} {...bind(f.name)} />
            )}
          </Field>
        ))}
        <div className="actions">
          <button type="button" className="btn ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn">{submitLabel}</button>
        </div>
      </form>
    </Modal>
  )
}

const OFFER_FIELDS = [
  { name: 'topic', label: 'Topic' },
  { name: 'description', label: 'What you can help with, and the limits', type: 'textarea' },
  { name: 'audienceLevel', label: 'Who is it for?', type: 'select', options: LEVELS },
  { name: 'format', label: 'Format', type: 'select', options: OFFER_FORMATS },
  { name: 'availability', label: 'Availability', hint: 'For example: weekday evenings' }
]
const REQUEST_FIELDS = [
  { name: 'topic', label: 'Topic' },
  { name: 'currentLevel', label: 'Your current level', type: 'select', options: LEVELS.filter((l) => l !== 'any level') },
  { name: 'targetOutcome', label: 'Target outcome', type: 'textarea', hint: 'What do you want to be able to do?' },
  { name: 'durationDays', label: 'Duration (days)', type: 'number' },
  { name: 'weeklyHours', label: 'Hours per week', type: 'number' },
  { name: 'preferredFormat', label: 'Help you prefer', type: 'select', options: REQUEST_FORMATS }
]
const CIRCLE_FIELDS = [
  { name: 'topic', label: 'Topic' },
  { name: 'targetOutcome', label: 'Target outcome', type: 'textarea' },
  { name: 'durationDays', label: 'Duration (days)', type: 'number' },
  { name: 'maxMembers', label: 'Maximum members', type: 'number' }
]

function Mentors({ user }) {
  const offers = useCollection('mentorOffers')
  const profiles = useCollection('profiles')
  const matches = useCollection('mentorshipRequests')
  const [q, setQ] = useState('')
  const [format, setFormat] = useState('all')
  const [branch, setBranch] = useState('all')
  const [year, setYear] = useState('all')
  const [posting, setPosting] = useState(false)
  const [asking, setAsking] = useState(null)
  const [closing, setClosing] = useState(null)
  const branches = [...new Set(profiles.map((p) => p.branch))].sort()

  const shown = useMemo(() => {
    const text = q.trim().toLowerCase()
    return offers
      .filter((o) => o.status === 'open')
      .filter((o) => format === 'all' || o.format === format)
      .map((o) => ({ o, mentor: profiles.find((p) => p.id === o.mentorId) }))
      .filter(({ mentor }) => mentor && (branch === 'all' || mentor.branch === branch) && (year === 'all' || mentor.year === Number(year)))
      .filter(({ o, mentor }) => !text || `${o.topic} ${o.description} ${o.availability} ${mentor.skillsKnown.join(' ')} ${mentor.topicsCanTeach.join(' ')}`.toLowerCase().includes(text))
  }, [offers, profiles, q, format, branch, year])

  return (
    <>
      <div className="row bar-row">
        <div className="filters tight">
          <input type="search" placeholder="Search topic, skill or availability" aria-label="Search mentors" value={q} onChange={(e) => setQ(e.target.value)} />
          <select aria-label="Format" value={format} onChange={(e) => setFormat(e.target.value)}>
            <option value="all">Any format</option>
            {OFFER_FORMATS.map((f) => <option key={f}>{f}</option>)}
          </select>
          <select aria-label="Branch" value={branch} onChange={(e) => setBranch(e.target.value)}>
            <option value="all">Any branch</option>
            {branches.map((b) => <option key={b}>{b}</option>)}
          </select>
          <select aria-label="Year" value={year} onChange={(e) => setYear(e.target.value)}>
            <option value="all">Any year</option>
            {[1, 2, 3, 4].map((y) => <option key={y} value={y}>Year {y}</option>)}
          </select>
        </div>
        <button className="btn" onClick={() => setPosting(true)}>Offer to mentor</button>
      </div>
      {shown.length === 0 ? <Empty title="No mentor offers match" text="Clear the filters, or post your own offer." /> : (
        <div className="grid two">
          {shown.map(({ o, mentor }) => {
            const sent = matches.find((m) => m.offerId === o.id && m.fromId === user.id && ['pending', 'accepted'].includes(m.status))
            return (
              <div key={o.id} className="card">
                <div className="row"><h3>{o.topic}</h3><Badge>{o.format}</Badge></div>
                <p className="meta"><Who id={mentor.id} /> · Year {mentor.year} · {mentor.branch}</p>
                <p>{o.description}</p>
                <p className="meta">For: {o.audienceLevel} · Available: {o.availability}</p>
                <TagList items={mentor.topicsCanTeach} />
                <div className="actions left">
                  {o.mentorId === user.id
                    ? <button className="btn ghost small" onClick={() => setClosing(o)}>Close offer</button>
                    : sent ? <><Status value={sent.status} /><small className="muted">Your request</small></>
                      : <button className="btn" onClick={() => setAsking(o)}>Request mentorship</button>}
                </div>
              </div>
            )
          })}
        </div>
      )}
      {posting && <FormModal title="Offer to mentor" fields={OFFER_FIELDS} initial={{ topic: '', description: '', audienceLevel: '', format: '', availability: '' }}
        action={(v) => createOffer(user.id, v)} submitLabel="Publish offer" success="Offer published" onClose={() => setPosting(false)} />}
      {asking && <TextPrompt title={`Request mentorship: ${asking.topic}`} label="Tell the mentor about your level and goal" field="message" submitLabel="Send request" success="Request sent"
        onSubmit={(m) => requestMentorship(user.id, asking.id, m)} onClose={() => setAsking(null)} />}
      {closing && <Confirm title="Close this offer?" danger label="Close offer" text="It will stop appearing in the directory. Existing matches are not affected."
        onConfirm={() => finish(closeOffer(closing.id, user.id), null, 'Offer closed')} onClose={() => setClosing(null)} />}
    </>
  )
}

function Requests({ user }) {
  const requests = useCollection('learningRequests')
  const matches = useCollection('mentorshipRequests')
  const [q, setQ] = useState('')
  const [posting, setPosting] = useState(false)
  const [helping, setHelping] = useState(null)
  const [finishing, setFinishing] = useState(null)
  const [cancelling, setCancelling] = useState(null)
  const text = q.trim().toLowerCase()
  const shown = requests.filter((r) => r.status === 'open' && (!text || `${r.topic} ${r.targetOutcome}`.toLowerCase().includes(text)))

  return (
    <>
      <div className="row bar-row">
        <div className="filters tight"><input type="search" placeholder="Search learning requests" aria-label="Search requests" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <button className="btn" onClick={() => setPosting(true)}>Post a learning request</button>
      </div>
      {shown.length === 0 ? <Empty title="No open learning requests" text="Post what you want to learn and others can respond." /> : (
        <div className="grid two">
          {shown.map((r) => {
            const sent = matches.find((m) => m.learningRequestId === r.id && m.fromId === user.id && ['pending', 'accepted'].includes(m.status))
            return (
              <div key={r.id} className="card">
                <div className="row"><h3>{r.topic}</h3><Badge>{r.preferredFormat}</Badge></div>
                <p className="meta">Asked by <Who id={r.requesterId} /> · level: {r.currentLevel}</p>
                <p>{r.targetOutcome}</p>
                <p className="meta">{r.durationDays} days · {r.weeklyHours} h/week</p>
                <div className="actions left">
                  {r.requesterId === user.id ? (
                    <>
                      <button className="btn" onClick={() => setFinishing(r)}>Mark completed</button>
                      <button className="btn ghost small" onClick={() => setCancelling(r)}>Cancel request</button>
                    </>
                  ) : sent ? <><Status value={sent.status} /><small className="muted">Your response</small></>
                    : <button className="btn" onClick={() => setHelping(r)}>Offer help or learn together</button>}
                </div>
              </div>
            )
          })}
        </div>
      )}
      {posting && <FormModal title="Post a learning request" fields={REQUEST_FIELDS} initial={{ topic: '', currentLevel: '', targetOutcome: '', durationDays: '14', weeklyHours: '4', preferredFormat: '' }}
        action={(v) => createLearningRequest(user.id, v)} submitLabel="Post request" success="Request posted" onClose={() => setPosting(false)} />}
      {helping && <TextPrompt title={`Respond: ${helping.topic}`} label="How can you help, or what would you bring to a peer group?" field="message" submitLabel="Send" success="Response sent"
        onSubmit={(m) => offerHelp(user.id, helping.id, m)} onClose={() => setHelping(null)} />}
      {finishing && <TextPrompt title="Mark as completed" label="What did you learn?" field="outcome" submitLabel="Mark completed" success="Learning request completed"
        onSubmit={(o) => finishRequest(finishing.id, user.id, o)} onClose={() => setFinishing(null)} />}
      {cancelling && <Confirm title="Cancel this request?" danger label="Cancel request" text="It will stop appearing as open."
        onConfirm={() => finish(cancelRequest(cancelling.id, user.id), null, 'Request cancelled')} onClose={() => setCancelling(null)} />}
    </>
  )
}

function Circles({ user }) {
  const circles = useCollection('circles')
  const milestones = useCollection('milestones')
  const [posting, setPosting] = useState(false)
  const open = circles.filter((c) => c.status === 'open')

  return (
    <>
      <div className="row bar-row">
        <p className="muted">Small groups that learn one topic together on a short pathway.</p>
        <button className="btn" onClick={() => setPosting(true)}>Start a circle</button>
      </div>
      {open.length === 0 ? <Empty title="No open circles" text="Start one and invite others to join." /> : (
        <div className="grid two">
          {open.map((c) => {
            const member = c.memberIds.includes(user.id)
            const full = c.memberIds.length >= c.maxMembers
            return (
              <div key={c.id} className="card">
                <div className="row"><h3>{c.topic}</h3><Badge>{c.memberIds.length}/{c.maxMembers} members</Badge></div>
                <p>{c.targetOutcome}</p>
                <p className="meta">{c.durationDays} days · {milestones.filter((m) => m.circleId === c.id).length} milestones · started by <Who id={c.creatorId} /></p>
                <div className="actions left">
                  <a className="btn ghost" href={`#/learn/${c.id}`}>Open circle</a>
                  {!member && !full && <button className="btn" onClick={() => finish(joinCircle(c.id, user.id), null, 'You joined the circle')}>Join</button>}
                  {!member && full && <Badge>full</Badge>}
                  {member && <Badge tone="accent">you are in</Badge>}
                </div>
              </div>
            )
          })}
        </div>
      )}
      {posting && <FormModal title="Start a learning circle" fields={CIRCLE_FIELDS} initial={{ topic: '', targetOutcome: '', durationDays: '14', maxMembers: '6' }}
        action={(v) => createCircle(user.id, v)} submitLabel="Start circle" success="Circle started" onClose={() => setPosting(false)}
        onDone={(res) => go(`learn/${res.id}`)} />}
    </>
  )
}

export default function Learn() {
  const user = useCurrentUser()
  const { rest } = useRoute()
  const [tab, setTab] = useState('mentors')

  if (rest[0]) return <Circle id={rest[0]} />
  return (
    <>
      <PageHeader title="Learn & Mentor" subtitle="Find a mentor, learn alongside peers, and track progress to a clear finish." />
      <Tabs value={tab} onChange={setTab} tabs={[
        { key: 'mentors', label: 'Mentors' }, { key: 'requests', label: 'Learning requests' },
        { key: 'circles', label: 'Circles' }, { key: 'mine', label: 'My learning' }
      ]} />
      <div className="tab-body" key={tab}>
        {tab === 'mentors' && <Mentors user={user} />}
        {tab === 'requests' && <Requests user={user} />}
        {tab === 'circles' && <Circles user={user} />}
        {tab === 'mine' && <MyLearning user={user} />}
      </div>
    </>
  )
}
