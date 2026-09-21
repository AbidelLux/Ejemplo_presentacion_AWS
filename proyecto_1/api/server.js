const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');

const PORT = process.env.PORT || 8000;
// path.resolve es necesario: al pasar `cwd` en spawn(), Node resuelve un
// comando relativo contra ese cwd (el de los discos), no contra el cwd
// del propio servidor, asi que hay que convertirlo a ruta absoluta antes.
const BINARY_PATH = path.resolve(process.env.BINARY_PATH || path.join(__dirname, '..', 'src', 'run'));
const DATA_DIR = process.env.DATA_DIR || '/data';
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';
const IDLE_MS = Number(process.env.IDLE_MS || 250);
const COMMAND_TIMEOUT_MS = Number(process.env.COMMAND_TIMEOUT_MS || 20000);

const ANSI_CSI_REGEX = /\x1B\[[0-9;]*[a-zA-Z]/g;
// Algunas rutas de error del binario (ver Shared::handler / scanner::errores)
// emiten un ESC suelto sin secuencia CSI completa; se limpia aparte.
const LONE_ESC_REGEX = /\x1B/g;
const SENTINEL = '###END###';

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function stripAnsi(text) {
  return text.replace(ANSI_CSI_REGEX, '').replace(LONE_ESC_REGEX, '');
}

let child = null;
let outBuf = '';
let lastDataTs = 0;
let ready = false;

function spawnChild() {
  ready = false;
  outBuf = '';

  child = spawn(BINARY_PATH, ['--api'], {
    cwd: DATA_DIR,
    env: { ...process.env, TERM: 'dumb' },
  });

  child.stdout.on('data', (chunk) => {
    outBuf += chunk.toString('utf8');
    lastDataTs = Date.now();
  });

  child.stderr.on('data', (chunk) => {
    console.error('[proyecto_1]', chunk.toString('utf8').trim());
  });

  child.on('exit', (code, signal) => {
    console.error(`proyecto_1 --api termino (code=${code}, signal=${signal}). Reiniciando en 1s...`);
    ready = false;
    setTimeout(spawnChild, 1000);
  });

  ready = true;
  lastDataTs = Date.now();
  console.log(`proyecto_1 (pid=${child.pid}) escuchando comandos, cwd=${DATA_DIR}`);
}

spawnChild();

// Espera la salida del comando en curso. Se corta al encontrar el
// centinela ###END### (fin normal de un comando) o, si el proceso se
// queda esperando una confirmacion intermedia (p. ej. rmdisk pregunta
// [S/N] antes de terminar, ver Shared::confirmation), al detectar que
// dejo de producir texto nuevo durante IDLE_MS.
function waitForResponse() {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const interval = setInterval(() => {
      const sentinelIndex = outBuf.indexOf(SENTINEL);
      if (sentinelIndex !== -1) {
        clearInterval(interval);
        const raw = outBuf.slice(0, sentinelIndex);
        outBuf = outBuf.slice(sentinelIndex + SENTINEL.length);
        resolve(stripAnsi(raw).trim());
        return;
      }

      const idleFor = Date.now() - lastDataTs;
      const hasOutput = outBuf.trim().length > 0;
      if (hasOutput && idleFor > IDLE_MS) {
        clearInterval(interval);
        const raw = outBuf;
        outBuf = '';
        resolve(stripAnsi(raw).trim());
        return;
      }

      if (Date.now() - start > COMMAND_TIMEOUT_MS) {
        clearInterval(interval);
        reject(new Error('Tiempo de espera agotado esperando respuesta de proyecto_1'));
      }
    }, 30);
  });
}

function runCommand(commandLine) {
  return new Promise((resolve, reject) => {
    if (!ready || !child) {
      reject(new Error('El proceso de proyecto_1 no esta disponible'));
      return;
    }
    waitForResponse().then(resolve, reject);
    child.stdin.write(`${commandLine}\n`);
  });
}

// Serializa los comandos: stdin/stdout del proceso hijo es un unico canal
// compartido (una sola "sesion"), asi que no se pueden procesar dos
// comandos en paralelo.
let queue = Promise.resolve();

const app = express();
app.use(cors({ origin: ALLOWED_ORIGIN }));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: ready ? 'ok' : 'starting' });
});

app.post('/api/command', (req, res) => {
  const command = req.body && typeof req.body.command === 'string' ? req.body.command : '';
  const trimmed = command.trim();

  if (trimmed.length === 0) {
    res.json({ output: '' });
    return;
  }
  if (/^exit$/i.test(trimmed)) {
    res.json({ output: 'El comando "exit" esta deshabilitado en la consola remota.' });
    return;
  }

  queue = queue
    .then(() => runCommand(command))
    .then((output) => {
      res.json({ output });
    })
    .catch((err) => {
      res.status(500).json({ error: err.message || 'Error ejecutando el comando' });
    });
});

app.listen(PORT, () => {
  console.log(`API de proyecto_1 escuchando en el puerto ${PORT}`);
});
