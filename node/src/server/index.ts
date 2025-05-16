import { ip } from 'address'
//e.g server.js

import express from 'express'
import fs from 'node:fs'
import path from 'node:path'
import { Server as SocketServer } from 'socket.io'
import { remove } from 'lodash'
import ViteExpress from 'vite-express'
import osc from 'osc'

// const server = app.listen(7001, () => console.log('Server is listening...'))
const app = express()

const server = ViteExpress.listen(app, 7001, () =>
  console.log('Server is listening...')
)

// Serve static files from public folder
// app.use(express.static(path.join(process.cwd(), 'dist')))

// Serve index.html at the root route
// app.get('/', (req, res) => {
//   res.sendFile(path.join(process.cwd(), 'dist', 'index.html'))
// })

// And then attach the socket.io server to the HTTP server
const io = new SocketServer<SocketEvents>(server)

// OSC setup
const oscPortOut = new osc.UDPPort({
  localAddress: 'localhost',
  localPort: 11001, // receive from Max
  remoteAddress: 'localhost',
  remotePort: 11002 // send to Max
})
oscPortOut.open()

function oscSend(address: string, ...args: any[]) {
  oscPortOut.send({
    address,
    args: args
      .map(arg => {
        if (typeof arg === 'number') return { type: 'f', value: arg }
        if (typeof arg === 'string') return { type: 's', value: arg }
        if (Array.isArray(arg))
          return arg.map(a => ({
            type: typeof a === 'number' ? 'f' : 's',
            value: a
          }))
        return { type: 's', value: String(arg) }
      })
      .flat()
  })
}

const settings = {
  mediaFolder: path.join(
    process.cwd().match(/\/Users\/[^\/]+\//)![0],
    '/Documents/VorTEX_media'
  ),
  presetBackupFolder: path.join(
    process.cwd().match(/\/Users\/[^\/]+\//)![0],
    '/Documents/VorTEX_presets'
  )
}

oscSend('/folders', settings.mediaFolder, settings.presetBackupFolder)
const ipAdd = ip()
oscSend(
  '/message',
  `Go to http://${ipAdd}:7001 from an iPad signed into same WiFi to access UI.`
)
oscSend('/message/ip', `http://${ipAdd}:7001`)
oscSend(
  '/message/name',
  `name`,
  `presets_${new Date().toISOString().slice(0, 10).replace(/[\/:]/g, '-')}.json`
)

let files: string[] = []
const readFiles = (socket?: any) => {
  if (!settings.mediaFolder) return
  try {
    files = fs
      .readdirSync(settings.mediaFolder)
      .filter(file =>
        /\.(mov|mp4|m4a|png|jpg|aif|gif|webm|webp|vlc)$/.test(file)
      )
      .filter(file => !file.startsWith('.'))
  } catch (err) {
    fs.mkdirSync(path.resolve(process.cwd(), settings.mediaFolder))
    files = []
  }
  if (!socket) {
    io.fetchSockets().then(sockets => {
      sockets.forEach(socket => socket.emit('setFiles', []))
    })
  }
}

oscPortOut.on('message', msg => {
  if (msg.address === '/spaceMouse') {
    const data = msg.args.map(a => a.value)
    io.fetchSockets().then(sockets => {
      sockets.forEach(socket =>
        socket.emit('getSpaceMouse', data[0], data.slice(1, 4), data.slice(4))
      )
    })
  }
})

readFiles()

oscPortOut.on('message', msg => {
  if (msg.address === '/setPresetsFile') {
    const file = msg.args[0].value
    try {
      oscSend('/post', 'loading presets file', file)
      const fileContents = fs.readFileSync(file, 'utf-8')
      fs.writeFileSync(
        path.resolve(process.cwd(), 'presets.json'),
        fileContents
      )
      io.fetchSockets().then(sockets => {
        sockets.forEach(socket => socket.emit('setPresets', fileContents))
      })
    } catch (err) {
      console.log('failed')
    }
  }
})

let presets: Record<string, any> = {}
io.on('connection', socket => {
  socket.on('set', (route: string, property: string, value: any) => {
    if (value instanceof Array) {
      oscSend(route, property, ...value)
    } else {
      if ((property === 'file1' || property === 'file2') && value) {
        value = path.resolve(settings.mediaFolder, value)
      }
      oscSend(route, property, value)
    }
  })

  socket.emit('setFiles', files)

  socket.on('getFiles', () => {
    readFiles(socket)
    socket.emit('setFiles', files)
  })

  const readPresets = () => {
    const presetsPath = path.resolve(process.cwd(), 'presets.json')
    if (!fs.existsSync(presetsPath)) {
      fs.writeFileSync(presetsPath, '{}')
    }
    try {
      const presets = JSON.parse(fs.readFileSync(presetsPath).toString())
      for (let preset of Object.keys(presets)) {
        // fix for mesh lengths
        if (presets[preset].length > 4) {
          remove(presets[4])
        }
      }
      return presets
    } catch (e) {
      const defaultPresets = {}
      fs.writeFileSync(presetsPath, JSON.stringify(defaultPresets))
      return defaultPresets
    }
  }
  presets = readPresets()

  socket.on('loadPresets', callback => {
    callback(presets)
  })

  socket.on('savePresets', presets => {
    fs.promises.writeFile(
      path.resolve(process.cwd(), 'presets.json'),
      JSON.stringify(presets)
    )
  })
})

// backup every 10 mins
setInterval(() => {
  const presetsFolder = path.resolve(settings.presetBackupFolder)
  if (!fs.existsSync(presetsFolder)) {
    fs.mkdirSync(presetsFolder)
  }

  fs.writeFileSync(
    path.join(
      presetsFolder,
      `${new Date()
        .toISOString()
        .slice(0, 19)
        .replace(/[\/:]/g, '-')}_presets.json`
    ),
    JSON.stringify(presets)
  )
}, 1000 * 60 * 10)
