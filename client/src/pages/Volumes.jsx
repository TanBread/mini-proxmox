import { useState, useEffect } from 'react'
import { get, post, del } from '../api'
import { PageHeader, Card, Button, formatBytes, formatDate } from '../components/ui'
import { HardDrive, Trash2, Plus, RefreshCw } from 'lucide-react'

export default function Volumes() {
  const [volumes, setVolumes] = useState([])
  const [showCreate, setShowCreate] = useState(false)
  const [name, setName] = useState('')

  async function load() {
    try {
      setVolumes(await get('/volumes'))
    } catch {}
  }

  useEffect(() => {
    load()
  }, [])

  async function create(e) {
    e.preventDefault()
    try {
      await post('/volumes', { Name: name })
      setShowCreate(false)
      setName('')
      await load()
    } catch (err) {
      alert(err.message)
    }
  }

  async function remove(volName) {
    if (!confirm(`Remove volume ${volName}?`)) return
    try {
      await del(`/volumes/${volName}?force=true`)
      await load()
    } catch (e) {
      alert(e.message)
    }
  }

  return (
    <div className="p-6">
      <PageHeader
        title="Volumes"
        subtitle={`${volumes.length} volumes`}
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
              placeholder="Volume name"
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
        {volumes.map((v) => (
          <Card key={v.name} className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800">
                <HardDrive className="h-5 w-5 text-slate-400" />
              </div>
              <div>
                <p className="font-medium text-white">{v.name}</p>
                <p className="text-xs text-slate-500">
                  {v.driver} · {v.mountpoint}
                  {v.usageData?.Size > 0 && ` · ${formatBytes(v.usageData.Size)}`}
                </p>
              </div>
            </div>
            <Button size="sm" variant="danger" onClick={() => remove(v.name)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </Card>
        ))}
        {volumes.length === 0 && (
          <Card className="p-12 text-center text-slate-500">No volumes found</Card>
        )}
      </div>
    </div>
  )
}
