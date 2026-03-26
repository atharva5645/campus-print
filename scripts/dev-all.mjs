import { spawn } from 'node:child_process'
import process from 'node:process'

const processes = []

function startProcess(name, command, args, cwd) {
  const child = spawn(command, args, {
    cwd,
    shell: true,
    stdio: 'inherit',
  })

  child.on('exit', (code) => {
    if (code !== 0) {
      console.error(`${name} exited with code ${code}`)
    }
  })

  processes.push(child)
  return child
}

function shutdown() {
  for (const child of processes) {
    if (!child.killed) {
      child.kill()
    }
  }
  process.exit(0)
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

startProcess('backend', 'npm', ['run', 'dev'], 'backend')
startProcess('frontend', 'npm', ['run', 'dev'], '.')
