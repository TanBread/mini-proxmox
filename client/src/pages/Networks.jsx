import { useState, useEffect } from 'react'
import { get, post, del } from '../api'
import { PageHeader, Card, Button, formatDate } from '../components/ui'
import { Globe, Trash2, Plus, RefreshCw } from 'lucide-react'

export default function Networks() {
  const [networks, setNetworks] = useState([])
  const [showCreate, setShowCreate] = useState(false)
  const [name, setName] = useState('')

  async function load() {
    try {
      setNetworks(await get('/networks'))
    } catch {}
  }

  useEffect(() => {
    load()
  }, [])

  async function create(e) {
    e.preventDefault()
    try {
      await post('/networks', { Name: name })
      setShowCreate(false)
      setName('')
      await load()
    } catch (err) {
      alert(err.message)
    }
  }

  async function remove(id) {
    if (!confirm('Remove this network?')) return
    try {
      await del(`/networks/${id}`)
      await load()
    } catch (e) {
      alert(e.message)
    }
  }

  return (
    <div className="p-6">
      <PageHeader
        title="Networks"
        subtitle={`${networks.length} networks`}
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
          <form onSubmit={create} className="flex gap-2">
            <input
              placeholder="Network name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500"
              required
            />
            <Button type="submit" variant="primary">Create</Button>
            <Button type="button" variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
          </form>
        </Card>
      )}

      <div className="space-y-3">
        {networks.map((n) => (
          <Card key={n.id} className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800">
                <Globe className="h-5 w-5 text-slate-400" />
              </div>
              <div>
                <p className="font-medium text-white">{n.name}</p>
                <p className="text-xs text-slate-500">
                  {n.driver} · {n.scope} · {Object.keys(n.containers || {}).length} containers
                </p>
              </div>
            </div>
            {!['bridge', 'host', 'none'].includes(n.name) && (
              <Button size="sm" variant="danger" onClick={() => remove(n.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}
