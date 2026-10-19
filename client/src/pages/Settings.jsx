import { useState, useEffect } from 'react'
import { get } from '../api'
import { PageHeader, Card, formatBytes } from '../components/ui'
import { User, Shield, Server, Cpu, MemoryStick, HardDrive, Monitor } from 'lucide-react'

export default function Settings() {
  const [me, setMe] = useState(null)
  const [hw, setHw] = useState(null)

  useEffect(() => {
    get('/me').then(setMe).catch(() => {})
    get('/system/hardware').then(setHw).catch(() => {})
  }, [])

  return (
    <div className="p-6">
      <PageHeader title="Settings" subtitle="Account and server information" />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Account */}
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

        {/* Server Overview */}
        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <Server className="h-4 w-4 text-green-400" />
            <h3 className="font-semibold text-white">Server</h3>
          </div>
          {hw && (
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <dt className="text-slate-500">Hostname</dt>
                <dd className="text-slate-300">{hw.hostname} <span className="text-slate-600">({hw.user})</span></dd>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <dt className="text-slate-500">OS</dt>
                <dd className="text-slate-300">{hw.platform} {hw.arch} · kernel {hw.kernel}</dd>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <dt className="text-slate-500">App Version</dt>
                <dd className="font-mono text-xs text-slate-300">v{hw.appVersion}</dd>
              </div>
            </dl>
          )}
        </Card>

        {/* CPU */}
        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <Cpu className="h-4 w-4 text-blue-400" />
            <h3 className="font-semibold text-white">CPU</h3>
          </div>
          {hw?.cpu && (
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <dt className="text-slate-500">Model</dt>
                <dd className="max-w-[60%] text-right text-slate-300">{hw.cpu.model}</dd>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <dt className="text-slate-500">Clock Speed</dt>
                <dd className="text-slate-300">{hw.cpu.speed || '-'}</dd>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <dt className="text-slate-500">Cores</dt>
                <dd className="text-slate-300">{hw.cpu.cores}</dd>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <dt className="text-slate-500">Threads</dt>
                <dd className="text-slate-300">{hw.cpu.threads}</dd>
              </div>
            </dl>
          )}
        </Card>

        {/* Memory */}
        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <MemoryStick className="h-4 w-4 text-purple-400" />
            <h3 className="font-semibold text-white">Memory</h3>
          </div>
          {hw?.memory && (
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <dt className="text-slate-500">Total</dt>
                <dd className="text-slate-300">{formatBytes(hw.memory.total)}</dd>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <dt className="text-slate-500">Speed</dt>
                <dd className="text-slate-300">{hw.memory.speed || '-'}</dd>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <dt className="text-slate-500">ECC</dt>
                <dd className="text-slate-300">
                  {hw.memory.ecc === null ? '-' : hw.memory.ecc ? 'Yes' : 'No'}
                </dd>
              </div>
              {hw.memory.modules && (
                <div className="flex justify-between pb-2">
                  <dt className="text-slate-500">Modules</dt>
                  <dd className="text-slate-300">{hw.memory.modules.join(', ')}</dd>
                </div>
              )}
            </dl>
          )}
        </Card>

        {/* GPU */}
        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <Monitor className="h-4 w-4 text-orange-400" />
            <h3 className="font-semibold text-white">GPU</h3>
          </div>
          {hw && (
            hw.gpu.length === 0 ? (
              <p className="text-sm text-slate-600">No GPU detected</p>
            ) : (
              <div className="space-y-4">
                {hw.gpu.map((gpu, i) => (
                  <dl key={i} className="space-y-3 text-sm">
                    <div className="flex justify-between border-b border-slate-800 pb-2">
                      <dt className="text-slate-500">Model</dt>
                      <dd className="max-w-[60%] text-right text-slate-300">{gpu.name}</dd>
                    </div>
                    <div className="flex justify-between border-b border-slate-800 pb-2">
                      <dt className="text-slate-500">VRAM</dt>
                      <dd className="text-slate-300">{gpu.vram || '-'}</dd>
                    </div>
                  </dl>
                ))}
              </div>
            )
          )}
        </Card>

        {/* Storage */}
        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <HardDrive className="h-4 w-4 text-green-400" />
            <h3 className="font-semibold text-white">Storage & Drives</h3>
          </div>
          {hw?.storage && (
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <dt className="text-slate-500">Total Storage</dt>
                <dd className="text-slate-300">{formatBytes(hw.storage.totalStorage)}</dd>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <dt className="text-slate-500">Drives</dt>
                <dd className="text-slate-300">{hw.storage.driveCount}</dd>
              </div>
              {hw.storage.drives.length > 0 && (
                <div className="pb-2">
                  <dt className="mb-1 text-slate-500">Drive Details</dt>
                  <dd className="space-y-1">
                    {hw.storage.drives.map((d, i) => (
                      <div key={i} className="flex justify-between text-xs">
                        <span className="font-mono text-slate-400">{d.name}</span>
                        <span className="text-slate-300">{d.size}</span>
                      </div>
                    ))}
                  </dd>
                </div>
              )}
            </dl>
          )}
        </Card>
      </div>
    </div>
  )
}
