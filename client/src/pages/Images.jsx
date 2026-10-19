import { useState, useEffect } from 'react'
import { get, post, del } from '../api'
import { PageHeader, Card, Button, formatBytes, formatDate } from '../components/ui'
import { Layers, Trash2, Download, RefreshCw, Play } from 'lucide-react'

export default function Images() {
  const [images, setImages] = useState([])
  const [pullTag, setPullTag] = useState('')
  const [pulling, setPulling] = useState(false)
  const [starting, setStarting] = useState(null)

  async function load() {
    try {
      setImages(await get('/images'))
    } catch {}
  }

  useEffect(() => {
    load()
  }, [])

  async function pull(e) {
    e.preventDefault()
    if (!pullTag) return
    setPulling(true)
    try {
      await post('/images/pull', { tag: pullTag })
      setPullTag('')
      await load()
    } catch (err) {
      alert(err.message)
    }
    setPulling(false)
  }

  async function remove(id) {
    if (!confirm('Delete this image?')) return
    try {
      await del(`/images/${id}?force=true`)
      await load()
    } catch (e) {
      alert(e.message)
    }
  }

  async function startContainer(tag) {
    setStarting(tag)
    try {
      await post('/containers', { image: tag })
      alert(`Container created from ${tag}. Go to Containers to start it.`)
    } catch (e) {
      alert(e.message)
    }
    setStarting(null)
  }

  function displayName(tag) {
    // nginx:alpine -> name: nginx, tag: alpine
    // ghcr.io/user/image:v1 -> name: ghcr.io/user/image, tag: v1
    const lastColon = tag.lastIndexOf(':')
    if (lastColon === -1) return { name: tag, tag: 'latest' }
    // Avoid treating port numbers as tags (e.g. localhost:5000/image)
    const afterColon = tag.slice(lastColon + 1)
    if (afterColon.includes('/')) return { name: tag, tag: 'latest' }
    return { name: tag.slice(0, lastColon), tag: afterColon }
  }

  return (
    <div className="p-6">
      <PageHeader
        title="Images"
        subtitle={`${images.length} images`}
        actions={
          <Button onClick={load} variant="ghost" size="sm">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </Button>
        }
      />

      <Card className="mb-6 p-5">
        <form onSubmit={pull} className="flex gap-2">
          <input
            placeholder="Image tag (e.g. nginx:latest, redis:alpine)"
            value={pullTag}
            onChange={(e) => setPullTag(e.target.value)}
            className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500"
          />
          <Button type="submit" variant="primary" disabled={pulling}>
            <Download className="h-3.5 w-3.5" /> {pulling ? 'Pulling...' : 'Pull'}
          </Button>
        </form>
      </Card>

      <div className="space-y-3">
        {images.map((img) => {
          const primaryTag = img.tags[0] || '<none>'
          const { name, tag } = displayName(primaryTag)
          return (
            <Card key={img.id} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800">
                  <Layers className="h-5 w-5 text-slate-400" />
                </div>
                <div>
                  <p className="font-medium text-white">{name}</p>
                  <p className="text-xs text-slate-500">
                    {formatBytes(img.size)} · {tag}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="success"
                  onClick={() => startContainer(primaryTag)}
                  disabled={starting === primaryTag}
                >
                  <Play className="h-3.5 w-3.5" /> {starting === primaryTag ? 'Creating...' : 'Start'}
                </Button>
                <Button size="sm" variant="danger" onClick={() => remove(img.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </Card>
          )
        })}
        {images.length === 0 && (
          <Card className="p-12 text-center text-slate-500">No images found</Card>
        )}
      </div>
    </div>
  )
}
