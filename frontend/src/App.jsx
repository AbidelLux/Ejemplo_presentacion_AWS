import React, { useEffect, useRef, useState } from 'react';

// En build de produccion (S3) esto viene inyectado por Vite desde .env.production.
// En desarrollo local cae a localhost:8000 (donde corre proyecto_1 vía docker/npm).
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const WELCOME = [
  'Consola remota de Proyecto 1 (simulador de sistema de archivos).',
  `API: ${API_URL}`,
  'Escribe un comando (mkdisk, fdisk, mount, mkfs, login, rep, ...) y presiona Enter.',
  '',
];

function useConnectionStatus() {
  const [status, setStatus] = useState('checking');

  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        const res = await fetch(`${API_URL}/api/health`);
        if (!res.ok) throw new Error('bad status');
        const data = await res.json();
        if (!cancelled) setStatus(data.status === 'ok' ? 'online' : 'starting');
      } catch {
        if (!cancelled) setStatus('offline');
      }
    }

    check();
    const interval = setInterval(check, 15000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return status;
}

export default function App() {
  const [lines, setLines] = useState(() =>
    WELCOME.map((text, i) => ({ id: `welcome-${i}`, type: 'system', text })),
  );
  const [command, setCommand] = useState('');
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [loading, setLoading] = useState(false);

  const status = useConnectionStatus();
  const outputRef = useRef(null);
  const inputRef = useRef(null);
  const idCounter = useRef(0);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [lines]);

  function nextId() {
    idCounter.current += 1;
    return idCounter.current;
  }

  function appendLine(type, text) {
    setLines((prev) => [...prev, { id: nextId(), type, text }]);
  }

  async function runCommand(cmd) {
    appendLine('input', cmd);
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: cmd }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        appendLine('error', data.error || `Error HTTP ${res.status}`);
      } else if (data.output) {
        appendLine('output', data.output);
      }
    } catch (err) {
      appendLine('error', `No se pudo contactar la API (${API_URL}): ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    const cmd = command;
    if (!cmd.trim() || loading) return;
    setHistory((prev) => [...prev, cmd]);
    setHistoryIndex(-1);
    setCommand('');
    runCommand(cmd);
  }

  function handleKeyDown(e) {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length === 0) return;
      const nextIndex = historyIndex === -1 ? history.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(nextIndex);
      setCommand(history[nextIndex]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex === -1) return;
      const nextIndex = historyIndex + 1;
      if (nextIndex >= history.length) {
        setHistoryIndex(-1);
        setCommand('');
      } else {
        setHistoryIndex(nextIndex);
        setCommand(history[nextIndex]);
      }
    }
  }

  return (
    <div className="console-page" onClick={() => inputRef.current?.focus()}>
      <header className="console-header">
        <h1>Proyecto 1 · Consola</h1>
        <span className={`status-badge status-${status}`}>{statusLabel(status)}</span>
      </header>

      <div className="console-output" ref={outputRef}>
        {lines.map((line) => (
          <pre key={line.id} className={`console-line line-${line.type}`}>
            {line.type === 'input' ? `[(execute)]>: ${line.text}` : line.text}
          </pre>
        ))}
        {loading && <pre className="console-line line-system">ejecutando...</pre>}
      </div>

      <form className="console-input-row" onSubmit={handleSubmit}>
        <span className="prompt">[(execute)]&gt;:</span>
        <input
          ref={inputRef}
          type="text"
          autoFocus
          spellCheck={false}
          autoComplete="off"
          value={command}
          disabled={loading}
          onChange={(e) => setCommand(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder='mkdisk -size=3000 -u=m -path=/data/disco1.dsk'
        />
      </form>
    </div>
  );
}

function statusLabel(status) {
  switch (status) {
    case 'online':
      return 'API conectada';
    case 'starting':
      return 'API iniciando';
    case 'offline':
      return 'API sin conexion';
    default:
      return 'verificando...';
  }
}
