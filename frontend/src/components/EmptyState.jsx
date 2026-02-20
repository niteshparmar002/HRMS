import { Inbox } from 'lucide-react'

export default function EmptyState({ title = 'No records found', description = '', action = null }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
        <Inbox className="w-6 h-6 text-gray-400" />
      </div>
      <div>
        <p className="text-sm font-medium text-gray-900">{title}</p>
        {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
