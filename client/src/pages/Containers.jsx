import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { get, post, del } from '../api'
import { PageHeader, Card, StatusBadge, Button, formatDate } from '../components/ui'
import { Play, Square, RotateCw, Trash2, Plus, RefreshCw, Pause, Eye, Box } from 'lucide-react'

export default function Containers() {
  const [containers, setContainers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ image: '', name: '', cmd: '' })
  const [busy, setBusy] = useState(null)

  async function load() {
    try {
      setContainers(await get('/containers'))
    } catch {}
    setLoading(false)
  }

  useEffect(() => {
    load()
    const i = setInterval(load, 5000)
    return () => clearInterval(i)
  }, [])

  async function action(id, act) {
    setBusy(id + act)
    try {
      await post(`/containers/${id}/${act}`)
      await load()
    } catch (e) {
      alert(e.message)
    }
    setBusy(null)
  }

  async function remove(id) {
    if (!confirm('Remove this container?')) return
    setBusy(id + 'del')
    try {
      await del(`/containers/${id}?force=true`)
      await load()
    } catch (e) {
      alert(e.message)
    }
    setBusy(null)
  }

  async function create(e) {
    e.preventDefault()
    try {
      const opts = { image: form.image, name: form.name || undefined }
      if (form.cmd) opts.Cmd = form.cmd.split(' ')
      await post('/containers', opts)
      setShowCreate(false)
      setForm({ image: '', name: '', cmd: '' })
      await load()
    } catch (e) {
      alert(e.message)
    }
  }

  return (
    <div className="p-6">
      <PageHeader
        title="Containers"
        subtitle={`${containers.length} total · ${containers.filter((c) => c.state === 'running').length} running`}
        actions={
          <>
            <Button onClick={load} variant="ghost" size="sm">
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </Button>
            <Button onClick={() => setShowCreate(true)} variant="primary" size="sm">
              <Plus className="h-3.5 w-3.5" /> Create
            </Button>
          </>
        }
      />

      {showCreate && (
        <Card className="mb-6 p-5">
          <h3 className="mb-4 font-semibold text-white">Create Container</h3>
          <form onSubmit={create} className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            <input
              placeholder="Image (e.g. nginx:alpine)"
              value={form.image}
              onChange={(e) => setForm({ ...form, image: e.target.value })}
              className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500"
              required
            />
            <input
              placeholder="Name (optional)"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500"
            />
            <input
              placeholder="Command (optional)"
              value={form.cmd}
              onChange={(e) => setForm({ ...form, cmd: e.target.value })}
              className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500"
            />
            <div className="flex gap-2">
              <Button type="submit" variant="primary" size="sm" className="flex-1">
                Create
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <Card className="p-12 text-center text-slate-500">Loading containers...</Card>
      ) : containers.length === 0 ? (
        <Card className="p-12 text-center text-slate-500">No containers found. Create one to get started.</Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {containers.map((c) => (
            <Card key={c.id} className="p-5 transition-colors hover:border-slate-700">
              <div className="mb-4 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800">
                    <Box className="h-5 w-5 text-slate-400" />
                  </div>
                  <div>
                    <Link to={`/containers/${c.id}`} className="font-semibold text-white hover:text-blue-400">
                      {c.names[0]}
                    </Link>
                    <p className="text-xs text-slate-500">{c.image}</p>
                  </div>
                </div>
                <StatusBadge state={c.state} />
              </div>

              <p className="mb-3 text-xs text-slate-500">{c.status}</p>

              {c.ports?.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-1">
                  {c.ports.filter((p) => p.public).map((p, i) => (
                    <span key={i} className="rounded bg-slate-800 px-1.5 py-0.5 text-xs text-slate-400">
                      {p.public}:{p.private}/{p.type}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-1.5 border-t border-slate-800 pt-3">
                {c.state === 'running' ? (
                  <>
                    <Button size="sm" variant="ghost" onClick={() => action(c.id, 'stop')} disabled={busy === c.id + 'stop'}>
                      <Square className="h-3.5 w-3.5" /> Stop
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => action(c.id, 'restart')} disabled={busy === c.id + 'restart'}>
                      <RotateCw className="h-3.5 w-3.5" /> Restart
                    </Button>
                  </>
                ) : (
                  <Button size="sm" variant="success" onClick={() => action(c.id, 'start')} disabled={busy === c.id + 'start'}>
                    <Play className="h-3.5 w-3.5" /> Start
                  </Button>
                )}
                <Link to={`/containers/${c.id}`} className="ml-auto">
                  <Button size="sm" variant="ghost">
                    <Eye className="h-3.5 w-3.5" /> Details
                  </Button>
                </Link>
                <Button size="sm" variant="danger" onClick={() => remove(c.id)} disabled={busy === c.id + 'del'}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
