import { useState, useEffect } from 'react'
import { get } from '../api'
import { getToken } from '../api'
import { PageHeader, Card, formatDate } from '../components/ui'
import { User, Shield, Server, Info } from 'lucide-react'

export default function Settings() {
  const [me, setMe] = useState(null)
  const [sys, setSys] = useState(null)

  useEffect(() => {
    get('/me').then(setMe).catch(() => {})
    get('/system/info').then(setSys).catch(() => {})
  }, [])

  return (
    <div className="p-6">
      <PageHeader title="Settings" subtitle="Account and server information" />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <User className="h-4 w-4 text-blue-400" />
            <h3 className="font-semibold text-white">Account</h3>
          </div>
          {me && (
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <dt className="text-slate-500">Username</dt>
                <dd className="text-slate-300">{me.user?.username || me.username}</dd>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <dt className="text-slate-500">Role</dt>
                <dd className="flex items-center gap-1.5 text-slate-300">
                  <Shield className="h-3.5 w-3.5 text-blue-400" />
                  {me.user?.role || me.role}
                </dd>
              </div>
            </dl>
          )}
          <div className="mt-4 rounded-lg bg-slate-800/50 p-3 text-xs text-slate-500">
            <p className="mb-1 font-medium text-slate-400">Roles</p>
            <p><span className="text-slate-300">admin</span> — full access (create/delete, terminal, file editing)</p>
            <p><span className="text-slate-300">user</span> — read-only (view containers, images, logs)</p>
          </div>
        </Card>

        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <Server className="h-4 w-4 text-green-400" />
            <h3 className="font-semibold text-white">Server</h3>
          </div>
          {sys && (
            <dl className="space-y-3 text-sm">
              {[
                ['Hostname', sys.name],
                ['OS', sys.operatingSystem],
                ['Docker', sys.dockerVersion],
                ['CPUs', sys.ncpus],
                ['Memory', `${(sys.memTotal / 1024 ** 3).toFixed(1)} GB`],
                ['Kernel', sys.kernelVersion],
                ['Containers', `${sys.containersRunning} running / ${sys.containers} total`],
                ['Images', sys.images],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between border-b border-slate-800 pb-2">
                  <dt className="text-slate-500">{k}</dt>
                  <dd className="font-mono text-xs text-slate-300">{v}</dd>
                </div>
              ))}
            </dl>
          )}
        </Card>
      </div>
    </div>
  )
}
