import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { get, post } from '../api'
import { PageHeader, Card, StatusBadge, Button, formatBytes } from '../components/ui'
import { ArrowLeft, Play, Square, RotateCw, TerminalSquare, FileText, Info } from 'lucide-react'

export default function ContainerDetail() {
  const { id } = useParams()
  const [info, setInfo] = useState(null)
  const [stats, setStats] = useState(null)
  const [tab, setTab] = useState('overview')
  const [logs, setLogs] = useState('')
  const [logFollow, setLogFollow] = useState(true)
  const logRef = useRef(null)
  const abortRef = useRef(null)

  async function load() {
    try {
      const [i, s] = await Promise.all([
        get(`/containers/${id}`),
        get(`/containers/${id}/stats`).catch(() => null),
      ])
      setInfo(i)
      setStats(s)
    } catch {}
  }

  useEffect(() => {
    load()
    const interval = setInterval(load, 5000)
    return () => clearInterval(interval)
  }, [id])

  useEffect(() => {
    if (tab !== 'logs') {
      if (abortRef.current) abortRef.current.abort()
      return
    }
    let cancelled = false
    async function fetchLogs() {
      const controller = new AbortController()
      abortRef.current = controller
      try {
        const res = await fetch(`/api/containers/${id}/logs?tail=200&follow=${logFollow}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          signal: controller.signal,
        })
        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let text = ''
        while (!cancelled) {
          const { done, value } = await reader.read()
          if (done) break
          text += decoder.decode(value, { stream: true })
          setLogs(text)
          if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
        }
      } catch {}
    }
    fetchLogs()
    return () => {
      cancelled = true
      if (abortRef.current) abortRef.current.abort()
    }
  }, [id, tab, logFollow])

  if (!info) return <div className="p-6 text-slate-500">Loading...</div>

  async function action(act) {
    try {
      await post(`/containers/${id}/${act}`)
      await load()
    } catch (e) {
      alert(e.message)
    }
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Info },
    { id: 'logs', label: 'Logs', icon: FileText },
  ]

  function formatUptime(startedAt) {
    if (!startedAt || startedAt.startsWith('0001')) return '-'
    const start = new Date(startedAt)
    if (isNaN(start)) return '-'
    let seconds = Math.floor((Date.now() - start.getTime()) / 1000)
    if (seconds < 0) return '-'
    const d = Math.floor(seconds / 86400)
    seconds %= 86400
    const h = Math.floor(seconds / 3600)
    seconds %= 3600
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    if (d > 0) return `${d}d ${h}h ${m}m`
    if (h > 0) return `${h}h ${m}m ${s}s`
    if (m > 0) return `${m}m ${s}s`
    return `${s}s`
  }

  return (
    <div className="p-6">
      <Link to="/containers" className="mb-4 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Back to Containers
      </Link>

      <PageHeader
        title={info.name}
        subtitle={info.image}
        actions={
          <>
            <StatusBadge state={info.state} />
            {info.running ? (
              <>
                <Button size="sm" onClick={() => action('stop')}>
                  <Square className="h-3.5 w-3.5" /> Stop
                </Button>
                <Button size="sm" onClick={() => action('restart')}>
                  <RotateCw className="h-3.5 w-3.5" /> Restart
                </Button>
              </>
            ) : (
              <Button size="sm" variant="success" onClick={() => action('start')}>
                <Play className="h-3.5 w-3.5" /> Start
              </Button>
            )}
            <Link to={`/terminal?container=${id}`}>
              <Button size="sm" variant="primary">
                <TerminalSquare className="h-3.5 w-3.5" /> Console
              </Button>
            </Link>
          </>
        }
      />

      <div className="mb-4 flex gap-1 border-b border-slate-800">
        {tabs.map(({ id: tid, label, icon: Icon }) => (
          <button
            key={tid}
            onClick={() => setTab(tid)}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === tid
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card className="p-5">
            <h3 className="mb-4 font-semibold text-white">Details</h3>
            <dl className="space-y-3 text-sm">
              {[
                ['ID', info.id?.slice(0, 12)],
                ['Image', info.image],
                ['State', info.state],
                ['Uptime', formatUptime(info.startedAt)],
                ['Created', new Date(info.created).toLocaleString()],
                ['Started', info.startedAt && !info.startedAt.startsWith('0001') ? new Date(info.startedAt).toLocaleString() : '-'],
                ['Restart Count', info.restartCount],
                ['Privileged', info.privileged ? 'Yes' : 'No'],
                ['Network Mode', info.networkMode],
                ['Restart Policy', info.restartPolicy?.Name || '-'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between border-b border-slate-800 pb-2">
                  <dt className="text-slate-500">{k}</dt>
                  <dd className="text-slate-300 font-mono text-xs">{v}</dd>
                </div>
              ))}
            </dl>
          </Card>

          <div className="space-y-4">
            {stats && (
              <Card className="p-5">
                <h3 className="mb-4 font-semibold text-white">Live Stats</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500">CPU</p>
                    <p className="text-xl font-bold text-blue-400">{stats.cpuPercent}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Memory</p>
                    <p className="text-xl font-bold text-purple-400">
                      {formatBytes(stats.memUsage)}
                      <span className="text-xs text-slate-500"> / {formatBytes(stats.memLimit)}</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Received Data</p>
                    <p className="text-lg font-bold text-green-400">{formatBytes(stats.netRx)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Sent Data</p>
                    <p className="text-lg font-bold text-orange-400">{formatBytes(stats.netTx)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Disk Read</p>
                    <p className="text-lg font-bold text-cyan-400">{formatBytes(stats.blockRead || 0)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Disk Write</p>
                    <p className="text-lg font-bold text-yellow-400">{formatBytes(stats.blockWrite || 0)}</p>
                  </div>
                </div>
              </Card>
            )}

            <Card className="p-5">
              <h3 className="mb-3 font-semibold text-white">Environment</h3>
              <div className="max-h-48 space-y-1 overflow-y-auto font-mono text-xs text-slate-400">
                {info.env?.map((e, i) => (
                  <div key={i}>{e}</div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {tab === 'logs' && (
        <Card>
          <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2">
            <span className="text-sm text-slate-400">Container logs</span>
            <label className="flex items-center gap-2 text-xs text-slate-500">
              <input
                type="checkbox"
                checked={logFollow}
                onChange={(e) => setLogFollow(e.target.checked)}
                className="accent-blue-500"
              />
              Follow
            </label>
          </div>
          <div
            ref={logRef}
            className="h-[500px] overflow-y-auto bg-slate-950 p-4 font-mono text-xs leading-relaxed text-slate-300"
          >
            {logs || <span className="text-slate-600">No logs yet...</span>}
          </div>
        </Card>
      )}
    </div>
  )
}
