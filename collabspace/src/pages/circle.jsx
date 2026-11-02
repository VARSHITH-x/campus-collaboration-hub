// One learning circle: roster, ordered milestones, progress and completion.
import { useState } from 'react'
import { useCollection, useCurrentUser } from '../store.js'
import { Badge, Confirm, Empty, Field, Links, Modal, Progress, Status, TextPrompt, Who, finish, useForm } from '../components/ui.jsx'
import { addMilestone, completeCircle, joinCircle, leaveCircle, removeMilestone, toggleMilestone } from '../learning.js'

function MilestoneModal({ circle, onClose }) {
  const user = useCurrentUser()
  const { values, bind } = useForm({ title: '', description: '', resourceLinks: '' })
  const [errors, setErrors] = useState({})
  const submit = (e) => {
    e.preventDefault()
    if (finish(addMilestone(circle.id, user.id, values), setErrors, 'Milestone added')) onClose()
  }
  return (
    <Modal title="Add a milestone" onClose={onClose}>
      <form onSubmit={submit} noValidate>
        <Field label="Title" error={errors.title}><input autoFocus {...bind('title')} /></Field>
        <Field label="Description (optional)" error={errors.description}><textarea rows="2" {...bind('description')} /></Field>
        <Field label="Resource links (optional)" hint="One web link per line." error={errors.resourceLinks}><textarea rows="2" {...bind('resourceLinks')} /></Field>
        <div className="actions">
          <button type="button" className="btn ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn">Add milestone</button>
        </div>
      </form>
    </Modal>
  )
}

export default function Circle({ id }) {
  const user = useCurrentUser()
  const circle = useCollection('circles').find((c) => c.id === id)
  const milestones = useCollection('milestones')
  const [adding, setAdding] = useState(false)
  const [finishing, setFinishing] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const [removing, setRemoving] = useState(null)

  if (!circle) return <Empty title="Circle not found"><a className="btn ghost" href="#/learn">Back to Learn &amp; Mentor</a></Empty>
  const ms = milestones.filter((m) => m.circleId === id).sort((a, b) => a.order - b.order)
  const member = circle.memberIds.includes(user.id)
  const isCreator = circle.creatorId === user.id
  const open = circle.status === 'open'
  const mine = ms.filter((m) => m.completedBy.includes(user.id)).length

  return (
    <>
      <a className="back" href="#/learn">Back to Learn &amp; Mentor</a>
      <div className="page-head">
        <div>
          <h1>{circle.topic}</h1>
          <p className="muted">{circle.targetOutcome}</p>
          <p className="meta"><Status value={circle.status} /> · {circle.durationDays} days · {circle.memberIds.length}/{circle.maxMembers} members</p>
        </div>
        <div className="actions">
          {open && !member && circle.memberIds.length < circle.maxMembers && <button className="btn" onClick={() => finish(joinCircle(id, user.id), null, 'You joined the circle')}>Join circle</button>}
          {open && member && !isCreator && <button className="btn ghost" onClick={() => setLeaving(true)}>Leave</button>}
          {open && isCreator && <button className="btn" onClick={() => setFinishing(true)}>Finish circle</button>}
        </div>
      </div>

      {circle.status === 'completed' && (
        <div className="card accent-card"><h3>Learning outcome</h3><p>{circle.summary}</p></div>
      )}

      <div className="two-col">
        <section>
          <div className="page-head">
            <h2>Learning pathway</h2>
            {open && isCreator && <button className="btn ghost" onClick={() => setAdding(true)}>Add milestone</button>}
          </div>
          {member && ms.length > 0 && (
            <div className="card"><div className="row"><span>Your progress</span><span>{mine}/{ms.length}</span></div><Progress value={mine} max={ms.length} /></div>
          )}
          {ms.length === 0 ? <Empty title="No milestones yet" text={isCreator ? 'Add the first step of the pathway.' : 'The creator has not added a pathway yet.'} /> : (
            <ol className="stack pathway">
              {ms.map((m, i) => {
                const done = m.completedBy.includes(user.id)
                return (
                  <li key={m.id} className="card">
                    <div className="row">
                      <h3>{i + 1}. {m.title}</h3>
                      {m.status === 'completed' ? <Badge tone="accent">everyone done</Badge> : <Badge>{m.completedBy.length}/{circle.memberIds.length} done</Badge>}
                    </div>
                    {m.description && <p>{m.description}</p>}
                    <Links items={m.resourceLinks} />
                    <div className="actions left">
                      {open && member && (
                        <label className="check">
                          <input type="checkbox" checked={done} onChange={() => finish(toggleMilestone(m.id, user.id), null)} /> I have completed this
                        </label>
                      )}
                      {open && isCreator && <button className="btn ghost small" onClick={() => setRemoving(m)}>Remove</button>}
                    </div>
                  </li>
                )
              })}
            </ol>
          )}
        </section>

        <section>
          <h2>Members</h2>
          <div className="stack">
            {circle.memberIds.map((mid) => (
              <div key={mid} className="card row">
                <Who id={mid} />
                {mid === circle.creatorId ? <Badge tone="accent">creator</Badge> : <small className="muted">{ms.filter((m) => m.completedBy.includes(mid)).length}/{ms.length} done</small>}
              </div>
            ))}
          </div>
        </section>
      </div>

      {adding && <MilestoneModal circle={circle} onClose={() => setAdding(false)} />}
      {finishing && (
        <TextPrompt title="Finish this circle" intro="This closes the circle. Its pathway stays viewable." label="What did the group learn?" field="summary" submitLabel="Finish circle" success="Circle completed"
          onSubmit={(s) => completeCircle(id, user.id, s)} onClose={() => setFinishing(false)} />
      )}
      {leaving && <Confirm title="Leave this circle?" danger label="Leave" text="Your milestone ticks will no longer count toward the group."
        onConfirm={() => finish(leaveCircle(id, user.id), null, 'You left the circle')} onClose={() => setLeaving(false)} />}
      {removing && <Confirm title="Remove this milestone?" danger label="Remove" text={`"${removing.title}" will be removed from the pathway.`}
        onConfirm={() => finish(removeMilestone(removing.id, user.id), null, 'Milestone removed')} onClose={() => setRemoving(null)} />}
    </>
  )
}
