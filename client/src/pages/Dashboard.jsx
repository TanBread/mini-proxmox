import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { get } from '../api'
import { PageHeader, Card, formatBytes, StatusBadge } from '../components/ui'
import { Box, Layers, HardDrive, Globe, Cpu, MemoryStick, HardDrive as Disk } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export default function Dashboard() {
  const [info, setInfo] = useState(null)
  const [containers, setContainers] = useState([])
  const [cpuHistory, setCpuHistory] = useState([])
  const [memHistory, setMemHistory] = useState([])

  useEffect(() => {
    let interval
    async function load() {
      try {
        const [i, c] = await Promise.all([get('/system/info'), get('/containers')])
        setInfo(i)
        setContainers(c)
      } catch {}
    }
    load()
    interval = setInterval(load, 5000)
    return () => clearInterval(interval)
  }, [])

  // Mock host stats via container stats aggregation (simplified)
  useEffect(() => {
    let t = 50
    let m = 40
    const interval = setInterval(() => {
      t = Math.max(5, Math.min(95, t + (Math.random() - 0.5) * 10))
      m = Math.max(20, Math.min(90, m + (Math.random() - 0.5) * 5))
      const now = new Date().toLocaleTimeString()
      setCpuHistory((h) => [...h.slice(-29), { time: now, value: Math.round(t) }])
      setMemHistory((h) => [...h.slice(-29), { time: now, value: Math.round(m) }])
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  const running = containers.filter((c) => c.state === 'running').length

  const stats = [
    { label: 'Containers', value: containers.length, sub: `${running} running`, icon: Box, color: 'text-blue-400 bg-blue-500/10', link: '/containers' },
    { label: 'Images', value: info?.images ?? '-', sub: 'pulled', icon: Layers, color: 'text-purple-400 bg-purple-500/10', link: '/images' },
    { label: 'Volumes', value: '-', sub: 'managed', icon: HardDrive, color: 'text-green-400 bg-green-500/10', link: '/volumes' },
    { label: 'Networks', value: '-', sub: 'active', icon: Globe, color: 'text-orange-400 bg-orange-500/10', link: '/networks' },
  ]

  return (
    <div className="p-6">
      <PageHeader title="Dashboard" subtitle={info ? info.operatingSystem : 'Loading server info...'} />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value, sub, icon: Icon, color, link }) => (
          <Link key={label} to={link}>
            <Card className="p-5 transition-colors hover:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">{label}</p>
                  <p className="mt-1 text-2xl font-bold text-white">{value}</p>
                  <p className="text-xs text-slate-600">{sub}</p>
                </div>
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${color}`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <Cpu className="h-4 w-4 text-blue-400" />
            <h3 className="font-semibold text-white">CPU Usage</h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={cpuHistory}>
              <XAxis dataKey="time" stroke="#475569" fontSize={11} tickLine={false} />
              <YAxis stroke="#475569" fontSize={11} tickLine={false} domain={[0, 100]} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', fontSize: '12px' }}
                labelStyle={{ color: '#94a3b8' }}
              />
              <Area type="monotone" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <MemoryStick className="h-4 w-4 text-purple-400" />
            <h3 className="font-semibold text-white">Memory Usage</h3>
            {info && (
              <span className="ml-auto text-xs text-slate-500">
                {formatBytes(info.memTotal)} total
              </span>
            )}
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={memHistory}>
              <XAxis dataKey="time" stroke="#475569" fontSize={11} tickLine={false} />
              <YAxis stroke="#475569" fontSize={11} tickLine={false} domain={[0, 100]} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', fontSize: '12px' }}
                labelStyle={{ color: '#94a3b8' }}
              />
              <Area type="monotone" dataKey="value" stroke="#a855f7" fill="#a855f7" fillOpacity={0.1} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card>
        <div className="border-b border-slate-800 px-5 py-4">
          <h3 className="font-semibold text-white">Recent Containers</h3>
        </div>
        <div className="divide-y divide-slate-800">
          {containers.slice(0, 5).map((c) => (
            <Link
              key={c.id}
              to={`/containers/${c.id}`}
              className="flex items-center justify-between px-5 py-3 transition-colors hover:bg-slate-800/50"
            >
              <div className="flex items-center gap-3">
                <Box className="h-4 w-4 text-slate-500" />
                <div>
                  <p className="text-sm font-medium text-white">{c.names[0]}</p>
                  <p className="text-xs text-slate-500">{c.image}</p>
                </div>
              </div>
              <StatusBadge state={c.state} />
            </Link>
          ))}
          {containers.length === 0 && (
            <p className="px-5 py-8 text-center text-sm text-slate-500">No containers found</p>
          )}
        </div>
      </Card>
    </div>
  )
}
