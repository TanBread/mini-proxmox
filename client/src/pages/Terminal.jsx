import { useEffect, useRef, useState } from 'react'
import { Terminal as XTerm } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'
import { wsUrl } from '../api'
import { PageHeader, Card, Button } from '../components/ui'
import { TerminalSquare, Trash2 } from 'lucide-react'

export default function Terminal() {
  const containerRef = useRef(null)
  const termRef = useRef(null)
  const wsRef = useRef(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    const term = new XTerm({
      theme: {
        background: '#020617',
        foreground: '#e2e8f0',
        cursor: '#3b82f6',
        selectionBackground: '#3b82f640',
      },
      fontSize: 13,
      fontFamily: 'Consolas, Monaco, monospace',
      cursorBlink: true,
    })
    const fit = new FitAddon()
    term.loadAddon(fit)
    term.open(containerRef.current)
    fit.fit()
    termRef.current = term

    const ws = new WebSocket(wsUrl('/ws/terminal'))
    wsRef.current = ws

    ws.onopen = () => {
      setConnected(true)
      ws.send(JSON.stringify({ type: 'resize', cols: term.cols, rows: term.rows }))
    }

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)
        if (msg.type === 'output') {
          term.write(msg.data)
        } else if (msg.type === 'ready') {
          term.write(`\r\n\x1b[32mConnected to ${msg.shell} (${msg.platform})\x1b[0m\r\n\r\n`)
        } else if (msg.type === 'exit') {
          term.write(`\r\n\x1b[31m[Process exited with code ${msg.code}]\x1b[0m\r\n`)
          setConnected(false)
        }
      } catch {
        term.write(event.data)
      }
    }

    ws.onclose = () => {
      setConnected(false)
      term.write('\r\n\x1b[31m[Connection closed]\x1b[0m\r\n')
    }

    term.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'input', data }))
      }
    })

    const resizeHandler = () => {
      fit.fit()
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'resize', cols: term.cols, rows: term.rows }))
      }
    }
    window.addEventListener('resize', resizeHandler)

    return () => {
      window.removeEventListener('resize', resizeHandler)
      ws.close()
      term.dispose()
    }
  }, [])

  function clear() {
    termRef.current?.clear()
  }

  return (
    <div className="flex h-screen flex-col p-6">
      <PageHeader
        title="Terminal"
        subtitle={connected ? 'Connected — full shell with sudo' : 'Connecting...'}
        actions={
          <Button onClick={clear} variant="ghost" size="sm">
            <Trash2 className="h-3.5 w-3.5" /> Clear
          </Button>
        }
      />

      <Card className="flex-1 overflow-hidden">
        <div className="flex items-center gap-2 border-b border-slate-800 px-4 py-2">
          <TerminalSquare className="h-4 w-4 text-slate-500" />
          <span className="text-sm text-slate-400">host shell</span>
          <span
            className={`ml-auto h-2 w-2 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400'}`}
          />
        </div>
        <div ref={containerRef} className="h-full p-2" />
      </Card>
    </div>
  )
}
