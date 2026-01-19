import http from 'node:http'
import { spawn } from 'node:child_process'

const ports = [5173, 5174, 5176]
const resetPath = '/__dev/sw-reset'

const checkPort = (port) =>
  new Promise((resolve) => {
    const req = http.request(
      {
        method: 'GET',
        host: 'localhost',
        port,
        path: '/',
        timeout: 1000,
      },
      (res) => {
        res.resume()
        resolve(true)
      }
    )

    req.on('error', () => resolve(false))
    req.on('timeout', () => {
      req.destroy()
      resolve(false)
    })
    req.end()
  })

const openUrl = (url) => {
  if (process.platform === 'win32') {
    const child = spawn('cmd', ['/c', 'start', '""', url], {
      stdio: 'ignore',
      detached: true,
    })
    child.unref()
    return
  }

  const command = process.platform === 'darwin' ? 'open' : 'xdg-open'
  const child = spawn(command, [url], { stdio: 'ignore', detached: true })
  child.unref()
}

const results = await Promise.all(
  ports.map(async (port) => ({
    port,
    open: await checkPort(port),
  }))
)

console.log('Vite ports status:')
for (const result of results) {
  console.log(`- ${result.port}: ${result.open ? 'open' : 'closed'}`)
}

const targetPort = results.find((result) => result.open)?.port ?? ports[0]
const targetUrl = `http://localhost:${targetPort}${resetPath}`

if (!results.some((result) => result.open)) {
  console.log(`No responding port found. Falling back to ${targetPort}.`)
}

console.log(`Opening ${targetUrl}`)
openUrl(targetUrl)
