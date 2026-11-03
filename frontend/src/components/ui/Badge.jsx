import { getStatusInfo } from '../../utils/helpers'

export default function StatusBadge({ status }) {
  const info = getStatusInfo(status)
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${info.color}`}>
      {info.label}
    </span>
  )
}
