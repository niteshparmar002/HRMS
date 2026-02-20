const variants = {
  present: 'bg-green-100 text-green-700',
  absent:  'bg-red-100 text-red-700',
  default: 'bg-gray-100 text-gray-600',
}

export default function Badge({ label, variant = 'default' }) {
  const cls = variants[variant?.toLowerCase()] || variants.default
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {label}
    </span>
  )
}
