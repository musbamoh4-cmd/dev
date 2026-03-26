import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const isWindows = process.platform === 'win32'
const viteBin = isWindows
  ? path.join(root, 'node_modules', '.bin', 'vite.cmd')
  : path.join(root, 'node_modules', '.bin', 'vite')

if (!fs.existsSync(viteBin)) {
  console.error('Vite binary not found. Run `npm install` first.')
  process.exit(1)
}

let shuttingDown = false
let serverProc
let viteProc

const shutdown = () => {
  if (serverProc && !serverProc.killed) {
    serverProc.kill('SIGINT')
  }
  if (viteProc && !viteProc.killed) {
    viteProc.kill('SIGINT')
  }
  if (isWindows) {
    setTimeout(() => process.exit(0), 200)
  }
}

const spawnProcess = (command, args, name) => {
  const child = spawn(command, args, {
    cwd: root,
    stdio: 'inherit',
    shell: false,
  })

  child.on('exit', (code, signal) => {
    if (shuttingDown) {
      return
    }
    shuttingDown = true
    if (signal) {
      console.log(`${name} exited with signal ${signal}`)
    } else if (code !== 0) {
      console.log(`${name} exited with code ${code}`)
    }
    shutdown()
  })

  return child
}

serverProc = spawnProcess(process.execPath, ['server/index.js'], 'server')

const viteCommand = isWindows ? 'cmd.exe' : viteBin
const viteArgs = isWindows ? ['/d', '/s', '/c', viteBin] : []
viteProc = spawnProcess(viteCommand, viteArgs, 'vite')

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
