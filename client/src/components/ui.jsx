export function StatusBadge({ state }) {
  const styles = {
    running: 'bg-green-500/10 text-green-400 border-green-500/20',
    exited: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    paused: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    created: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    restarting: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    removing: 'bg-red-500/10 text-red-400 border-red-500/20',
  }
  const dot = {
    running: 'bg-green-400',
    exited: 'bg-slate-400',
    paused: 'bg-yellow-400',
    created: 'bg-blue-400',
    restarting: 'bg-orange-400',
    removing: 'bg-red-400',
  }
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium ${
        styles[state] || styles.exited
      }`}
    >
      <span className={`h-2 w-2 rounded-full ${dot[state] || dot.exited}`} />
      {state.charAt(0).toUpperCase() + state.slice(1)}
    </span>
  )
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="mb-6 flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}

export function Card({ children, className = '' }) {
  return (
    <div className={`rounded-xl border border-slate-800 bg-slate-900 ${className}`}>
      {children}
    </div>
  )
}

export function Button({ children, onClick, variant = 'default', size = 'md', disabled, className = '', ...props }) {
  const variants = {
    default: 'bg-slate-800 text-slate-200 hover:bg-slate-700 border-slate-700',
    primary: 'bg-blue-600 text-white hover:bg-blue-700 border-blue-600',
    danger: 'bg-red-600/10 text-red-400 hover:bg-red-600/20 border-red-600/20',
    success: 'bg-green-600/10 text-green-400 hover:bg-green-600/20 border-green-600/20',
    ghost: 'bg-transparent text-slate-400 hover:bg-slate-800 hover:text-slate-200 border-transparent',
  }
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-3.5 py-1.5 text-sm',
  }
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 rounded-lg border font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

export function formatDate(ts) {
  if (!ts) return '-'
  const d = typeof ts === 'number' ? new Date(ts * 1000) : new Date(ts)
  return d.toLocaleString()
}
