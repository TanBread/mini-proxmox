import { useState, useEffect, useRef } from 'react'
import { get, post, del } from '../api'
import { PageHeader, Card, Button, formatBytes, formatDate } from '../components/ui'
import { Layers, Trash2, Download, RefreshCw, Play, Search, Star, DownloadCloud } from 'lucide-react'

export default function Images() {
  const [images, setImages] = useState([])
  const [pullTag, setPullTag] = useState('')
  const [pulling, setPulling] = useState(false)
  const [starting, setStarting] = useState(null)
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const searchRef = useRef(null)
  const debounceRef = useRef(null)

  async function load() {
    try {
      setImages(await get('/images'))
    } catch {}
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    function onClick(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  function onSearchChange(value) {
    setPullTag(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!value.trim()) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const s = await get(`/images/search?q=${encodeURIComponent(value)}`)
        setSuggestions(s)
        setShowSuggestions(s.length > 0)
      } catch {
        setSuggestions([])
      }
    }, 300)
  }

  function pickSuggestion(name) {
    setPullTag(name)
    setSuggestions([])
    setShowSuggestions(false)
  }

  function formatCount(n) {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
    return String(n)
  }

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
          <div ref={searchRef} className="relative flex-1">
            <input
              placeholder="Search Docker Hub or enter image tag (e.g. nginx:latest)"
              value={pullTag}
              onChange={(e) => onSearchChange(e.target.value)}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 pr-9 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500"
            />
            <Search className="absolute right-3 top-2.5 h-4 w-4 text-slate-500" />
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-80 overflow-y-auto rounded-lg border border-slate-700 bg-slate-800 shadow-xl">
                {suggestions.map((s) => (
                  <button
                    key={s.name}
                    type="button"
                    onClick={() => pickSuggestion(s.name)}
                    className="flex w-full items-start gap-3 px-3 py-2.5 text-left transition-colors hover:bg-slate-700"
                  >
                    <Layers className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium text-white">{s.name}</span>
                        {s.isOfficial && (
                          <span className="rounded bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-medium text-blue-400">
                            Official
                          </span>
                        )}
                      </div>
                      {s.description && (
                        <p className="truncate text-xs text-slate-500">{s.description}</p>
                      )}
                      <div className="mt-0.5 flex items-center gap-3 text-xs text-slate-600">
                        <span className="flex items-center gap-1">
                          <Star className="h-3 w-3" /> {formatCount(s.stars)}
                        </span>
                        <span className="flex items-center gap-1">
                          <DownloadCloud className="h-3 w-3" /> {formatCount(s.pulls)}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
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
