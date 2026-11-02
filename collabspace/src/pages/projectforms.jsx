// Forms for publishing/editing a project and for defining a role.
import { useState } from 'react'
import { go, useCurrentUser } from '../store.js'
import { Field, Modal, finish, useForm } from '../components/ui.jsx'
import { CATEGORIES, EXPERIENCE, addRole, createOpportunity, updateOpportunity } from '../collab.js'

export const emptyRole = { roleTitle: '', openings: '1', requiredSkills: '', preferredSkills: '', beginnerFriendly: false, deliverable: '', learningResources: '' }

export function RoleFields({ bind, check, errors }) {
  return (
    <>
      <Field label="Role title" error={errors.roleTitle}>
        <input {...bind('roleTitle')} placeholder="e.g. Embedded C contributor" />
      </Field>
      <div className="cols2">
        <Field label="Openings" error={errors.openings}>
          <input type="number" min="1" max="10" {...bind('openings')} />
        </Field>
        <label className="check"><input type="checkbox" {...check('beginnerFriendly')} /> Beginner-friendly role</label>
      </div>
      <Field label="Required skills" hint="Comma separated. Leave empty if none.">
        <input {...bind('requiredSkills')} />
      </Field>
      <Field label="Preferred skills" hint="Nice to have, never required.">
        <input {...bind('preferredSkills')} />
      </Field>
      <Field label="Expected deliverable" error={errors.deliverable}>
        <input {...bind('deliverable')} placeholder="What will this person hand over?" />
      </Field>
      <Field label="Learning resources (optional)" hint="One web link per line." error={errors.learningResources}>
        <textarea rows="2" {...bind('learningResources')} />
      </Field>
    </>
  )
}

export function RoleModal({ oppId, onClose }) {
  const user = useCurrentUser()
  const { values, bind, check } = useForm(emptyRole)
  const [errors, setErrors] = useState({})
  const submit = (e) => {
    e.preventDefault()
    if (finish(addRole(oppId, user.id, values), setErrors, 'Role added')) onClose()
  }
  return (
    <Modal title="Add a role" onClose={onClose}>
      <form onSubmit={submit} noValidate>
        <RoleFields bind={bind} check={check} errors={errors} />
        <div className="actions">
          <button type="button" className="btn ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn">Add role</button>
        </div>
      </form>
    </Modal>
  )
}

export function OpportunityForm({ existing, prefill, onClose }) {
  const user = useCurrentUser()
  const start = existing
    ? {
        title: existing.title, description: existing.description, expectedOutcome: existing.expectedOutcome, nextStep: existing.nextStep || '',
        category: existing.category, experience: existing.experience, durationDays: String(existing.durationDays),
        weeklyHours: String(existing.weeklyHours), deadline: existing.deadline || ''
      }
    : { title: prefill?.title || '', description: prefill?.description || '', expectedOutcome: '', nextStep: '', category: prefill?.category || '', experience: '', durationDays: '14', weeklyHours: '4', deadline: '', ...emptyRole }
  const { values, bind, check } = useForm(start)
  const [errors, setErrors] = useState({})

  const submit = (e) => {
    e.preventDefault()
    const res = existing ? updateOpportunity(existing.id, user.id, values) : createOpportunity(user.id, { ...values, sourcePostId: prefill?.sourcePostId }, values)
    if (finish(res, setErrors, existing ? 'Project updated' : 'Project published')) {
      onClose()
      if (!existing) go(`projects/${res.id}`)
    }
  }

  return (
    <Modal title={existing ? 'Edit project' : 'Publish a project'} onClose={onClose} wide>
      <form onSubmit={submit} noValidate>
        {prefill && <p className="note">Started from the community post "{prefill.title}". Add the details that make it a real project: outcome, time and at least one role.</p>}
        <Field label="Title" error={errors.title}><input {...bind('title')} placeholder="What do you want to build or learn?" /></Field>
        <Field label="Goal and problem" error={errors.description}><textarea rows="4" {...bind('description')} /></Field>
        <Field label="Expected outcome" error={errors.expectedOutcome}><input {...bind('expectedOutcome')} placeholder="What exists when the group is done?" /></Field>
        <Field label="First step" error={errors.nextStep} hint="How will the group start and coordinate?"><input {...bind('nextStep')} placeholder="e.g. Kickoff meeting on Saturday" /></Field>
        <div className="cols2">
          <Field label="Category" error={errors.category}>
            <select {...bind('category')}>
              <option value="">Choose...</option>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Experience expected" error={errors.experience}>
            <select {...bind('experience')}>
              <option value="">Choose...</option>
              {EXPERIENCE.map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
        </div>
        <div className="cols3">
          <Field label="Duration (days)" error={errors.durationDays}><input type="number" min="1" max="365" {...bind('durationDays')} /></Field>
          <Field label="Hours per week" error={errors.weeklyHours}><input type="number" min="1" max="40" {...bind('weeklyHours')} /></Field>
          <Field label="Deadline (optional)" error={errors.deadline}><input type="date" {...bind('deadline')} /></Field>
        </div>
        {!existing && (
          <>
            <h3 className="form-section">First role</h3>
            <p className="muted">Every project needs at least one role. You can add more after publishing.</p>
            <RoleFields bind={bind} check={check} errors={errors} />
          </>
        )}
        <div className="actions">
          <button type="button" className="btn ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn">{existing ? 'Save changes' : 'Publish project'}</button>
        </div>
      </form>
    </Modal>
  )
}
