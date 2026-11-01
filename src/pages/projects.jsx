import { Planned } from '../components/ui.jsx'

export default function Projects() {
  return (
    <Planned
      title="Collaborate"
      phase="Phase 2"
      items={[
        'Discover, search and filter project opportunities',
        'Create and edit opportunities with roles and openings',
        'Apply for a role (no duplicate active applications)',
        'Accept or decline applications and see the team',
        'Task board: assign, update status, review',
        'Complete and archive a project with an outcome summary'
      ]}
    />
  )
}
