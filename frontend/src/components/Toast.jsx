import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react'

// Module-level store — no Context needed
let _listeners = []
let _toasts = []

export function showToast(message, type = 'success') {
  const id = Date.now() + Math.random()
  _toasts = [..._toasts, { id, message, type }]
  _listeners.forEach((fn) => fn(_toasts))

  setTimeout(() => {
    _toasts = _toasts.filter((t) => t.id !== id)
    _listeners.forEach((fn) => fn(_toasts))
  }, 3500)
}

const icons = {
  success: <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />,
  error:   <XCircle    className="w-4 h-4 text-red-500   flex-shrink-0" />,
  info:    <AlertCircle className="w-4 h-4 text-blue-500 flex-shrink-0" />,
}

const styles = {
  success: 'border-green-200 bg-green-50',
  error:   'border-red-200   bg-red-50',
  info:    'border-blue-200  bg-blue-50',
}

function Toast({ id, message, type }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
  }, [])

  const dismiss = () => {
    setVisible(false)
    setTimeout(() => {
      _toasts = _toasts.filter((t) => t.id !== id)
      _listeners.forEach((fn) => fn(_toasts))
    }, 200)
  }

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-lg border shadow-md text-sm font-medium text-gray-800
        transition-all duration-200 ${styles[type] || styles.info}
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
    >
      {icons[type]}
      <span className="flex-1">{message}</span>
      <button onClick={dismiss} className="p-0.5 rounded text-gray-400 hover:text-gray-600 transition-colors">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

export function ToastContainer() {
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    _listeners.push(setToasts)
    return () => {
      _listeners = _listeners.filter((fn) => fn !== setToasts)
    }
  }, [])

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-80 max-w-[calc(100vw-2rem)]">
      {toasts.map((t) => (
        <Toast key={t.id} {...t} />
      ))}
    </div>
  )
}
