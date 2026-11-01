import { Planned } from '../components/ui.jsx'

export default function Activity() {
  return (
    <Planned
      title="Activity"
      phase="Phase 3"
      items={[
        'In-app notifications for accepted applications, mentor replies, comments and tasks',
        'Read and unread state',
        'Links from each notification to the related item'
      ]}
    />
  )
}
