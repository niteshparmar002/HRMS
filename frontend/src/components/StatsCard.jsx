export default function StatsCard({ title, value, icon: Icon, color = 'blue', subtitle = '' }) {
  const colors = {
    blue:   { bg: 'bg-primary-50', icon: 'text-primary-600', ring: 'ring-primary-100' },
    green:  { bg: 'bg-green-50',   icon: 'text-green-600',   ring: 'ring-green-100' },
    red:    { bg: 'bg-red-50',     icon: 'text-red-600',     ring: 'ring-red-100' },
    purple: { bg: 'bg-purple-50',  icon: 'text-purple-600',  ring: 'ring-purple-100' },
  }
  const c = colors[color] || colors.blue

  return (
    <div className="card p-5 flex items-center gap-4">
      <div className={`w-12 h-12 ${c.bg} rounded-xl flex items-center justify-center ring-4 ${c.ring} flex-shrink-0`}>
        <Icon className={`w-6 h-6 ${c.icon}`} />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value ?? '—'}</p>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  )
}
