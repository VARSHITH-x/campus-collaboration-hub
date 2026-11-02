// Student profile: view anyone's (#/profile/stu_003), edit your own.
import { useState } from 'react'
import { useCollection, useCurrentUser, useRoute } from '../store.js'
import { Badge, Empty, Field, Modal, PageHeader, Status, TagList, finish, useForm } from '../components/ui.jsx'
import { MODES, getStudentProfile, updateProfile } from '../learning.js'
import { joinList } from '../util.js'

function Section({ label, items }) {
  return (
    <div className="field-block">
      <h4>{label}</h4>
      {items.length === 0 ? <p className="muted">None added yet.</p> : <TagList items={items} />}
    </div>
  )
}

function EditProfile({ profile, onClose }) {
  const { values, bind, set } = useForm({
    displayName: profile.displayName, year: String(profile.year), branch: profile.branch, bio: profile.bio,
    skillsKnown: joinList(profile.skillsKnown), skillsLearning: joinList(profile.skillsLearning),
    topicsInterested: joinList(profile.topicsInterested), topicsCanTeach: joinList(profile.topicsCanTeach),
    availabilityHours: String(profile.availabilityHours), participationModes: profile.participationModes
  })
  const [errors, setErrors] = useState({})
  const toggle = (m) => set('participationModes', values.participationModes.includes(m)
    ? values.participationModes.filter((x) => x !== m) : [...values.participationModes, m])
  const submit = (e) => {
    e.preventDefault()
    if (finish(updateProfile(profile.id, profile.id, values), setErrors, 'Profile saved')) onClose()
  }
  return (
    <Modal title="Edit profile" onClose={onClose} wide>
      <form onSubmit={submit} noValidate>
        <Field label="Display name" error={errors.displayName}><input {...bind('displayName')} /></Field>
        <div className="cols3">
          <Field label="Year" error={errors.year}><input type="number" min="1" max="6" {...bind('year')} /></Field>
          <Field label="Branch" error={errors.branch}><input {...bind('branch')} /></Field>
          <Field label="Hours per week" error={errors.availabilityHours}><input type="number" min="0" max="60" {...bind('availabilityHours')} /></Field>
        </div>
        <Field label="Introduction" error={errors.bio}><textarea rows="3" {...bind('bio')} /></Field>
        <Field label="Skills you know" hint="Comma separated."><input {...bind('skillsKnown')} /></Field>
        <Field label="Skills you are learning" hint="Comma separated."><input {...bind('skillsLearning')} /></Field>
        <Field label="Topics of interest"><input {...bind('topicsInterested')} /></Field>
        <Field label="Topics you can teach"><input {...bind('topicsCanTeach')} /></Field>
        <div className="field">
          <span>How you want to take part</span>
          <div className="tags">
            {MODES.map((m) => (
              <label key={m} className="check"><input type="checkbox" checked={values.participationModes.includes(m)} onChange={() => toggle(m)} /> {m}</label>
            ))}
          </div>
        </div>
        <div className="actions">
          <button type="button" className="btn ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn">Save profile</button>
        </div>
      </form>
    </Modal>
  )
}

export default function Profile() {
  const me = useCurrentUser()
  useCollection('profiles')
  const opps = useCollection('opportunities')
  const apps = useCollection('applications')
  const offers = useCollection('mentorOffers')
  const circles = useCollection('circles')
  const { rest } = useRoute()
  const [editing, setEditing] = useState(false)

  const u = rest[0] ? getStudentProfile(rest[0]) : me
  if (!u) return <Empty title="Profile not found"><a className="btn ghost" href="#/home">Go home</a></Empty>
  const mine = u.id === me.id

  const owned = opps.filter((o) => o.creatorId === u.id)
  const joined = apps.filter((a) => a.applicantId === u.id && a.status === 'accepted').map((a) => opps.find((o) => o.id === a.opportunityId)).filter(Boolean)
  const myOffers = offers.filter((o) => o.mentorId === u.id && o.status === 'open')
  const myCircles = circles.filter((c) => c.memberIds.includes(u.id))

  return (
    <>
      <PageHeader title={mine ? 'My Profile' : u.displayName} subtitle={mine ? 'This is how other students see you.' : `Year ${u.year} · ${u.branch}`}>
        {mine && <button className="btn" onClick={() => setEditing(true)}>Edit profile</button>}
      </PageHeader>
      <div className="card">
        <div className="row"><h2>{u.displayName}</h2>{u.role === 'moderator' && <Badge tone="accent">moderator</Badge>}</div>
        <p className="muted">Year {u.year} · {u.branch}{u.availabilityHours > 0 && ` · about ${u.availabilityHours} h/week available`}</p>
        <p>{u.bio || 'No introduction yet.'}</p>
        <Section label="Skills known" items={u.skillsKnown} />
        <Section label="Skills being learned" items={u.skillsLearning} />
        <Section label="Topics of interest" items={u.topicsInterested} />
        <Section label="Can teach" items={u.topicsCanTeach} />
        <Section label="Participation" items={u.participationModes} />
      </div>

      <h2 className="section-title">Activity across CollabSpace</h2>
      <div className="grid three">
        <div className="card">
          <h3>Projects</h3>
          {owned.length + joined.length === 0 ? <p className="muted">No projects yet.</p> : (
            <ul className="plain-list">
              {owned.map((o) => <li key={o.id}><a href={`#/projects/${o.id}`}>{o.title}</a> <Status value={o.status} /> owner</li>)}
              {joined.map((o) => <li key={o.id}><a href={`#/projects/${o.id}`}>{o.title}</a> <Status value={o.status} /> member</li>)}
            </ul>
          )}
        </div>
        <div className="card">
          <h3>Mentoring and learning</h3>
          {myOffers.length + myCircles.length === 0 ? <p className="muted">No open offers or circles.</p> : (
            <ul className="plain-list">
              {myOffers.map((o) => <li key={o.id}>Mentoring: {o.topic}</li>)}
              {myCircles.map((c) => <li key={c.id}><a href={`#/learn/${c.id}`}>{c.topic}</a> circle</li>)}
            </ul>
          )}
        </div>
      </div>
      {editing && <EditProfile profile={u} onClose={() => setEditing(false)} />}
    </>
  )
}
