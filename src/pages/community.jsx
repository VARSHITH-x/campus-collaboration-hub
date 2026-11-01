import { Planned } from '../components/ui.jsx'

export default function Community() {
  return (
    <Planned
      title="Communities"
      phase="Phase 2"
      items={[
        'Join or leave communities and read each feed',
        'Discussion, question, resource, poll and announcement posts',
        'Comments, replies and reactions',
        'Polls with one vote per demo user',
        'Pinned announcements, reporting and moderator actions'
      ]}
    />
  )
}
