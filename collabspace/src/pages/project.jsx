// One project: overview + roles, applications, team, tasks and completion.
import { useState } from 'react'
import { useCollection, useCurrentUser } from '../store.js'
import { Badge, Confirm, Empty, Field, Links, Modal, Status, TagList, Tabs, TextPrompt, Who, finish, useForm } from '../components/ui.jsx'
import {
  ACTIVE_APP, RECRUITING, TASK_LABEL, applyToRole, createTask, deleteTask, filled, removeRole,
  respondToApplication, teamIds, transitionOpportunity, updateTaskStatus, withdrawApplication
} from '../collab.js'
import { fmtDate, joinList } from '../util.js'
import { reportEntity } from '../community.js'
import { OpportunityForm, RoleModal } from './projectforms.jsx'

function ApplyModal({ role, onClose }) {
  const user = useCurrentUser()
  const { values, bind } = useForm({
    message: '', knownSkills: joinList(user.skillsKnown), skillsToLearn: joinList(user.skillsLearning),
    weeklyHours: String(Math.min(40, Math.max(1, user.availabilityHours || 4)))
  })
  const [errors, setErrors] = useState({})
  const submit = (e) => {
    e.preventDefault()
    if (finish(applyToRole(user.id, role.id, values), setErrors, 'Application sent')) onClose()
  }
  return (
    <Modal title={`Apply: ${role.title}`} onClose={onClose}>
      <form onSubmit={submit} noValidate>
        <p className="muted">Skills and hours are filled in from your profile. Change them if this role needs something different.</p>
        <Field label="What can you contribute?" error={errors.message}><textarea rows="3" autoFocus {...bind('message')} /></Field>
        <Field label="Skills you already have"><input {...bind('knownSkills')} /></Field>
        <Field label="Skills you want to learn"><input {...bind('skillsToLearn')} /></Field>
        <Field label="Hours per week" error={errors.weeklyHours}><input type="number" min="1" max="40" {...bind('weeklyHours')} /></Field>
        <div className="actions">
          <button type="button" className="btn ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn">Send application</button>
        </div>
      </form>
    </Modal>
  )
}

function TaskModal({ opp, onClose }) {
  const user = useCurrentUser()
  const team = teamIds(opp)
  const { values, bind } = useForm({ title: '', description: '', assigneeId: team.find((id) => id !== opp.creatorId) || opp.creatorId, dueDate: '', learningResources: '' })
  const [errors, setErrors] = useState({})
  const submit = (e) => {
    e.preventDefault()
    if (finish(createTask(opp.id, user.id, values), setErrors, 'Task assigned')) onClose()
  }
  return (
    <Modal title="Assign a task" onClose={onClose}>
      <form onSubmit={submit} noValidate>
        <Field label="Task" error={errors.title}><input autoFocus {...bind('title')} /></Field>
        <Field label="Details (optional)" error={errors.description}><textarea rows="2" {...bind('description')} /></Field>
        <div className="cols2">
          <Field label="Assign to" error={errors.assigneeId}>
            <select {...bind('assigneeId')}>
              <OptionNames ids={team} />
            </select>
          </Field>
          <Field label="Due date" error={errors.dueDate}><input type="date" {...bind('dueDate')} /></Field>
        </div>
        <Field label="Learning resources (optional)" hint="One web link per line." error={errors.learningResources}>
          <textarea rows="2" {...bind('learningResources')} />
        </Field>
        <div className="actions">
          <button type="button" className="btn ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn">Assign task</button>
        </div>
      </form>
    </Modal>
  )
}

function OptionNames({ ids }) {
  const profiles = useCollection('profiles')
  return ids.map((id) => <option key={id} value={id}>{profiles.find((p) => p.id === id)?.displayName || id}</option>)
}

// ---- Tabs ---------------------------------------------------------------------
function Overview({ opp, isOwner, user }) {
  const roles = useCollection('roles').filter((r) => r.opportunityId === opp.id)
  const apps = useCollection('applications')
  const source = useCollection('posts').find((p) => p.id === opp.sourcePostId)
  const [applying, setApplying] = useState(null)
  const [adding, setAdding] = useState(false)
  const [removing, setRemoving] = useState(null)
  const recruiting = RECRUITING.includes(opp.status)

  return (
    <>
      <div className="card">
        {source && <p className="meta">Started from a community post: <a className="who" href={`#/community/${source.communityId}`}>{source.title}</a></p>}
        <p>{opp.description}</p>
        <h4>Expected outcome</h4>
        <p>{opp.expectedOutcome}</p>
        {opp.nextStep && <><h4>First step</h4><p>{opp.nextStep}</p></>}
        <p className="meta">
          {opp.durationDays} days · {opp.weeklyHours} h/week · {opp.experience}
          {opp.deadline && ` · deadline ${fmtDate(opp.deadline)}`} · {opp.category}
        </p>
      </div>

      {['completed', 'archived'].includes(opp.status) && (
        <div className="card accent-card">
          <h3>Outcome</h3>
          <p>{opp.outcomeSummary || 'No outcome summary was recorded.'}</p>
          <small className="muted">Completed {fmtDate(opp.completedAt)}{opp.archivedAt && ` · archived ${fmtDate(opp.archivedAt)}`}</small>
        </div>
      )}

      <div className="page-head">
        <h2>Roles</h2>
        {isOwner && recruiting && <button className="btn ghost" onClick={() => setAdding(true)}>Add a role</button>}
      </div>
      {roles.length === 0 && <Empty title="No roles yet" />}
      <div className="stack">
        {roles.map((r) => {
          const left = r.openings - filled(r.id)
          const mine = apps.find((a) => a.roleId === r.id && a.applicantId === user.id && ACTIVE_APP.includes(a.status))
          return (
            <div key={r.id} className="card">
              <div className="row">
                <h3>{r.title}</h3>
                <span>
                  {r.beginnerFriendly && <Badge tone="accent">beginner-friendly</Badge>}{' '}
                  <Badge>{filled(r.id)}/{r.openings} filled</Badge>
                </span>
              </div>
              <p className="muted">Deliverable: {r.deliverable}</p>
              {r.requiredSkills.length > 0 && <><h4>Required skills</h4><TagList items={r.requiredSkills} /></>}
              {r.preferredSkills.length > 0 && <><h4>Preferred skills</h4><TagList items={r.preferredSkills} /></>}
              <Links items={r.learningResources} />
              <div className="actions left">
                {!isOwner && recruiting && !mine && left > 0 && <button className="btn" onClick={() => setApplying(r)}>Apply for this role</button>}
                {!isOwner && recruiting && !mine && left <= 0 && <Badge>full</Badge>}
                {mine && <><Status value={mine.status} /><small className="muted">Your application</small></>}
                {isOwner && recruiting && <button className="btn ghost small" onClick={() => setRemoving(r)}>Remove role</button>}
              </div>
            </div>
          )
        })}
      </div>
      {applying && <ApplyModal role={applying} onClose={() => setApplying(null)} />}
      {adding && <RoleModal oppId={opp.id} onClose={() => setAdding(false)} />}
      {removing && (
        <Confirm title="Remove this role?" danger label="Remove" text={`"${removing.title}" will be deleted, along with any declined or withdrawn applications for it.`}
          onConfirm={() => finish(removeRole(removing.id, user.id), null, 'Role removed')} onClose={() => setRemoving(null)} />
      )}
    </>
  )
}

function Applications({ opp, isOwner, user }) {
  const apps = useCollection('applications').filter((a) => a.opportunityId === opp.id)
  const roles = useCollection('roles')
  const [leaving, setLeaving] = useState(null)
  const list = (isOwner ? apps : apps.filter((a) => a.applicantId === user.id)).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const canAnswer = RECRUITING.includes(opp.status)

  if (list.length === 0) {
    return <Empty title={isOwner ? 'No applications yet' : 'You have not applied'} text={isOwner ? 'Applications for your roles will appear here.' : 'Open the Overview tab to apply for a role.'} />
  }
  return (
    <div className="stack">
      {list.map((a) => (
        <div key={a.id} className="card">
          <div className="row">
            <h3><Who id={a.applicantId} /> <span className="muted">for {roles.find((r) => r.id === a.roleId)?.title || 'a removed role'}</span></h3>
            <Status value={a.status} />
          </div>
          <p>{a.message}</p>
          <p className="meta">{a.weeklyHours} h/week · applied {fmtDate(a.createdAt)}</p>
          {a.knownSkills.length > 0 && <><h4>Has</h4><TagList items={a.knownSkills} /></>}
          {a.skillsToLearn.length > 0 && <><h4>Wants to learn</h4><TagList items={a.skillsToLearn} /></>}
          <div className="actions left">
            {isOwner && a.status === 'pending' && canAnswer && (
              <>
                <button className="btn" onClick={() => finish(respondToApplication(a.id, user.id, 'accepted'), null, 'Applicant added to the team')}>Accept</button>
                <button className="btn ghost" onClick={() => finish(respondToApplication(a.id, user.id, 'declined'), null, 'Application declined')}>Decline</button>
              </>
            )}
            {a.applicantId === user.id && ACTIVE_APP.includes(a.status) && !['completed', 'archived'].includes(opp.status) && (
              <button className="btn ghost" onClick={() => setLeaving(a)}>{a.status === 'accepted' ? 'Leave project' : 'Withdraw'}</button>
            )}
          </div>
        </div>
      ))}
      {leaving && (
        <Confirm title={leaving.status === 'accepted' ? 'Leave this project?' : 'Withdraw your application?'} danger label={leaving.status === 'accepted' ? 'Leave' : 'Withdraw'}
          text="Tasks assigned to you will go back to unassigned." onConfirm={() => finish(withdrawApplication(leaving.id, user.id), null, 'Done')} onClose={() => setLeaving(null)} />
      )}
    </div>
  )
}

function Team({ opp }) {
  const apps = useCollection('applications').filter((a) => a.opportunityId === opp.id && a.status === 'accepted')
  const roles = useCollection('roles')
  return (
    <div className="stack">
      <div className="card row"><span><Who id={opp.creatorId} /></span><Badge tone="accent">owner</Badge></div>
      {apps.length === 0 && <Empty title="No team members yet" text="Accepted applicants will appear here with their roles." />}
      {apps.map((a) => (
        <div key={a.id} className="card row">
          <span><Who id={a.applicantId} /></span>
          <Badge>{roles.find((r) => r.id === a.roleId)?.title || 'Role'}</Badge>
        </div>
      ))}
    </div>
  )
}

function Tasks({ opp, isOwner, user }) {
  const tasks = useCollection('tasks').filter((t) => t.opportunityId === opp.id)
  useCollection('applications')
  const [adding, setAdding] = useState(false)
  const [changes, setChanges] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const member = teamIds(opp).includes(user.id)
  const live = ['forming', 'active'].includes(opp.status)

  if (!member) return <Empty title="Team members only" text="Tasks are visible to the owner and accepted team members." />
  const act = (t, to, msg) => finish(updateTaskStatus(t.id, user.id, to), null, msg)

  return (
    <>
      <div className="page-head">
        <h2>Task board</h2>
        {isOwner && live && <button className="btn" onClick={() => setAdding(true)}>Assign a task</button>}
      </div>
      {tasks.length === 0 && <Empty title="No tasks yet" text={isOwner ? 'Assign the first task to a team member.' : 'The owner has not assigned any tasks.'} />}
      <div className="stack">
        {tasks.map((t) => (
          <div key={t.id} className="card">
            <div className="row"><h3>{t.title}</h3><Badge tone={t.status === 'completed' ? 'accent' : ''}>{TASK_LABEL[t.status]}</Badge></div>
            {t.description && <p>{t.description}</p>}
            <p className="meta">{t.assigneeId ? <>Assigned to <Who id={t.assigneeId} /></> : 'Unassigned'} · due {fmtDate(t.dueDate)}</p>
            <Links items={t.learningResources} />
            {t.reviewNote && <p className="note">Review note: {t.reviewNote}</p>}
            {live && (
              <div className="actions left">
                {t.assigneeId === user.id && t.status === 'not_started' && <button className="btn" onClick={() => act(t, 'in_progress', 'Task started')}>Start</button>}
                {t.assigneeId === user.id && t.status === 'in_progress' && <button className="btn" onClick={() => act(t, 'submitted', 'Submitted for review')}>Submit for review</button>}
                {isOwner && t.status === 'submitted' && (
                  <>
                    <button className="btn" onClick={() => act(t, 'completed', 'Task accepted')}>Accept work</button>
                    <button className="btn ghost" onClick={() => setChanges(t)}>Request changes</button>
                  </>
                )}
                {isOwner && <button className="btn ghost small" onClick={() => setDeleting(t)}>Delete</button>}
              </div>
            )}
          </div>
        ))}
      </div>
      {adding && <TaskModal opp={opp} onClose={() => setAdding(false)} />}
      {changes && (
        <TextPrompt title="Request changes" label="What needs to change?" field="note" submitLabel="Send back" success="Sent back to the contributor"
          onSubmit={(note) => updateTaskStatus(changes.id, user.id, 'in_progress', note)} onClose={() => setChanges(null)} />
      )}
      {deleting && (
        <Confirm title="Delete this task?" danger label="Delete" text={`"${deleting.title}" will be removed for everyone.`}
          onConfirm={() => finish(deleteTask(deleting.id, user.id), null, 'Task deleted')} onClose={() => setDeleting(null)} />
      )}
    </>
  )
}

// ---- Page ---------------------------------------------------------------------
export default function ProjectDetail({ id }) {
  const user = useCurrentUser()
  const opp = useCollection('opportunities').find((o) => o.id === id)
  const tasks = useCollection('tasks')
  useCollection('applications')
  const [tab, setTab] = useState('overview')
  const [editing, setEditing] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [confirm, setConfirm] = useState(null)
  const [reporting, setReporting] = useState(false)

  if (!opp) {
    return <Empty title="Project not found" text="It may have been removed."><a className="btn ghost" href="#/projects">Back to projects</a></Empty>
  }
  const isOwner = opp.creatorId === user.id
  const unfinished = tasks.filter((t) => t.opportunityId === opp.id && t.status !== 'completed').length
  const move = (to, msg) => finish(transitionOpportunity(opp.id, user.id, to), null, msg)

  return (
    <>
      <a className="back" href="#/projects">Back to projects</a>
      <div className="page-head">
        <div>
          <h1>{opp.title}</h1>
          <p className="muted">Owner: <Who id={opp.creatorId} /> · <Status value={opp.status} /></p>
        </div>
        {!isOwner && opp.status !== 'archived' && <button className="btn ghost" onClick={() => setReporting(true)}>Report</button>}
        {isOwner && (
          <div className="actions">
            {['open', 'forming', 'active'].includes(opp.status) && <button className="btn ghost" onClick={() => setEditing(true)}>Edit</button>}
            {RECRUITING.includes(opp.status) && <button className="btn" onClick={() => move('active', 'Recruitment closed. Work is under way.')}>Close recruitment</button>}
            {opp.status === 'active' && <button className="btn" onClick={() => setCompleting(true)}>Mark completed</button>}
            {['open', 'forming', 'completed'].includes(opp.status) && <button className="btn ghost" onClick={() => setConfirm(true)}>Archive</button>}
          </div>
        )}
      </div>

      <Tabs value={tab} onChange={setTab} tabs={[
        { key: 'overview', label: 'Overview' }, { key: 'applications', label: isOwner ? 'Applications' : 'My application' },
        { key: 'team', label: 'Team' }, { key: 'tasks', label: 'Tasks' }
      ]} />
      <div className="tab-body" key={tab}>
        {tab === 'overview' && <Overview opp={opp} isOwner={isOwner} user={user} />}
        {tab === 'applications' && <Applications opp={opp} isOwner={isOwner} user={user} />}
        {tab === 'team' && <Team opp={opp} />}
        {tab === 'tasks' && <Tasks opp={opp} isOwner={isOwner} user={user} />}
      </div>

      {editing && <OpportunityForm existing={opp} onClose={() => setEditing(false)} />}
      {reporting && (
        <TextPrompt title="Report this project" label="What is the problem?" field="reason" submitLabel="Send report" success="Report sent to the moderators"
          onSubmit={(r) => reportEntity(user.id, 'opportunity', opp.id, r)} onClose={() => setReporting(false)} />
      )}
      {completing && (
        <TextPrompt title="Complete this project" label="Outcome summary" field="summary" submitLabel="Mark completed" success="Project completed"
          intro={unfinished ? `${unfinished} task${unfinished === 1 ? ' is' : 's are'} not completed yet. You can still finish the project.` : 'Record what the group produced.'}
          onSubmit={(s) => transitionOpportunity(opp.id, user.id, 'completed', s)} onClose={() => setCompleting(false)} />
      )}
      {confirm && (
        <Confirm title="Archive this project?" danger label="Archive" text="Archived projects stay viewable but stop appearing as open. Pending applicants will be declined. This cannot be undone."
          onConfirm={() => move('archived', 'Project archived')} onClose={() => setConfirm(false)} />
      )}
    </>
  )
}
