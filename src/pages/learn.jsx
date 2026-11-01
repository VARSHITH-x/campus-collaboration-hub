import { Planned } from '../components/ui.jsx'

export default function Learn() {
  return (
    <Planned
      title="Learn & Mentor"
      phase="Phase 2"
      items={[
        'Mentor directory with subject and availability filters',
        'Mentor offers and learning requests',
        'Accept, decline or withdraw requests',
        'Learning circles with member rosters',
        'Ordered milestones with progress tracking'
      ]}
    />
  )
}
