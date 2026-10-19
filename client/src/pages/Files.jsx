import { useState, useEffect } from 'react'
import { get, put, post, del } from '../api'
import { PageHeader, Card, Button, formatBytes } from '../components/ui'
import { Folder, File, ChevronRight, Save, ArrowLeft, RefreshCw, FolderPlus, Trash2 } from 'lucide-react'
import Editor from '@monaco-editor/react'

export default function Files() {
  const [path, setPath] = useState('/')
  const [entries, setEntries] = useState([])
  const [selected, setSelected] = useState(null)
  const [content, setContent] = useState('')
  const [dirty, setDirty] = useState(false)
  const [loading, setLoading] = useState(false)

  async function load(dir) {
    setLoading(true)
    try {
      setEntries(await get(`/files?path=${encodeURIComponent(dir)}`)
      )
    } catch (e) {
      alert(e.message)
    }
    setLoading(false)
  }

  useEffect(() => {
    load(path)
  }, [path])

  async function openFile(entry) {
    if (entry.isDir) {
      setPath(entry.path)
      setSelected(null)
      setContent('')
      setDirty(false)
      return
    }
    try {
      const data = await get(`/files/read?path=${encodeURIComponent(entry.path)}`)
      setSelected(entry)
      setContent(data.content)
      setDirty(false)
    } catch (e) {
      alert(e.message)
    }
  }

  async function save() {
    if (!selected) return
    try {
      await put('/files/write', { path: selected.path, content })
      setDirty(false)
    } catch (e) {
      alert(e.message)
    }
  }

  async function createDir() {
    const name = prompt('Directory name:')
    if (!name) return
    try {
      await post('/files/mkdir', { path: `${path}/${name}`.replace(/\/+/g, '/') })
      await load(path)
    } catch (e) {
      alert(e.message)
    }
  }

  async function removeEntry(entry) {
    if (!confirm(`Delete ${entry.name}?`)) return
    try {
      await del(`/files?path=${encodeURIComponent(entry.path)}`)
      if (selected?.path === entry.path) {
        setSelected(null)
        setContent('')
      }
      await load(path)
    } catch (e) {
      alert(e.message)
    }
  }

  function goUp() {
    const parts = path.split('/').filter(Boolean)
    parts.pop()
    setPath('/' + parts.join('/'))
    setSelected(null)
    setContent('')
    setDirty(false)
  }

  const crumbs = path.split('/').filter(Boolean)

  return (
    <div className="flex h-screen flex-col p-6">
      <PageHeader
        title="Files"
        subtitle="Browse and edit host filesystem"
        actions={
          <>
            <Button onClick={() => load(path)} variant="ghost" size="sm">
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
            <Button onClick={createDir} variant="default" size="sm">
              <FolderPlus className="h-3.5 w-3.5" /> New Folder
            </Button>
          </>
        }
      />

      <div className="mb-3 flex items-center gap-1 text-sm">
        <button onClick={() => setPath('/')} className="text-slate-400 hover:text-white">
          root
        </button>
        {crumbs.map((c, i) => (
          <span key={i} className="flex items-center">
            <ChevronRight className="h-3 w-3 text-slate-600" />
            <button
              onClick={() => setPath('/' + crumbs.slice(0, i + 1).join('/'))}
              className="text-slate-400 hover:text-white"
            >
              {c}
            </button>
          </span>
        ))}
      </div>

      <div className="flex flex-1 gap-4 overflow-hidden">
        <Card className="w-80 flex-shrink-0 overflow-y-auto">
          {path !== '/' && (
            <button
              onClick={goUp}
              className="flex w-full items-center gap-2 border-b border-slate-800 px-4 py-2.5 text-sm text-slate-400 hover:bg-slate-800/50 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" /> ..
            </button>
          )}
          {loading ? (
            <p className="p-4 text-sm text-slate-500">Loading...</p>
          ) : (
            entries.map((entry) => (
              <div
                key={entry.path}
                className={`group flex cursor-pointer items-center justify-between border-b border-slate-800/50 px-4 py-2 text-sm transition-colors hover:bg-slate-800/50 ${
                  selected?.path === entry.path ? 'bg-blue-600/10 text-blue-400' : 'text-slate-300'
                }`}
                onClick={() => openFile(entry)}
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  {entry.isDir ? (
                    <Folder className="h-4 w-4 flex-shrink-0 text-yellow-400" />
                  ) : (
                    <File className="h-4 w-4 flex-shrink-0 text-slate-500" />
                  )}
                  <span className="truncate">{entry.name}</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    removeEntry(entry)
                  }}
                  className="hidden text-slate-600 hover:text-red-400 group-hover:block"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))
          )}
        </Card>

        <Card className="flex flex-1 flex-col overflow-hidden">
          {selected ? (
            <>
              <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2">
                <span className="text-sm text-slate-400">
                  {selected.name} · {formatBytes(selected.size)}
                </span>
                <Button onClick={save} variant={dirty ? 'primary' : 'default'} size="sm" disabled={!dirty}>
                  <Save className="h-3.5 w-3.5" /> Save
                </Button>
              </div>
              <div className="flex-1">
                <Editor
                  height="100%"
                  theme="vs-dark"
                  language={selected.name.endsWith('.json') ? 'json' : selected.name.endsWith('.yml') || selected.name.endsWith('.yaml') ? 'yaml' : selected.name.endsWith('.sh') ? 'shell' : 'plaintext'}
                  value={content}
                  onChange={(v) => {
                    setContent(v ?? '')
                    setDirty(true)
                  }}
                  options={{
                    fontSize: 13,
                    minimap: { enabled: false },
                    automaticLayout: true,
                  }}
                />
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center text-sm text-slate-600">
              Select a file to edit
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
