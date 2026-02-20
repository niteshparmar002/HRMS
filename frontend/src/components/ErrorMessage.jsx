import { AlertCircle, RefreshCw } from 'lucide-react'

export default function ErrorMessage({ message = 'Something went wrong.', onRetry = null }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
      <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center">
        <AlertCircle className="w-6 h-6 text-red-500" />
      </div>
      <div>
        <p className="text-sm font-medium text-gray-900">Failed to load data</p>
        <p className="text-sm text-gray-500 mt-1">{message}</p>
      </div>
      {onRetry && (
        <button onClick={onRetry} className="btn-secondary mt-2">
          <RefreshCw className="w-4 h-4" />
          Try again
        </button>
      )}
    </div>
  )
}
