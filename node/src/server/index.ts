import { ip } from 'address'
//e.g server.js

import express from 'express'
import maxApi from 'max-api'
import fs from 'fs'
import path from 'path'
import { Server as SocketServer } from 'socket.io'
// import ViteExpress from 'vite-express'

const app = express()

const server = app.listen(7001, () => console.log('Server is listening...'))

// Serve static files from public folder
app.use(express.static(path.join(process.cwd(), 'dist')))

// Serve index.html at the root route
// app.get('/', (req, res) => {
//   res.sendFile(path.join(process.cwd(), 'dist', 'index.html'))
// })

// And then attach the socket.io server to the HTTP server
const io = new SocketServer<SocketEvents>(server)

// Then you can use `io` to listen the `connection` event and get a socket
// from a client
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

maxApi.post('folders', settings.mediaFolder, settings.presetBackupFolder)
const ipAdd = ip()
maxApi.outlet(
  '/message',
  `Go to http://${ipAdd}:7001 from an iPad signed into same WiFi to access UI.`
)
maxApi.outlet('/message/ip', `http://${ipAdd}:7001`)
maxApi.outlet(
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

maxApi.addHandler('spaceMouse', (...data) => {
  io.fetchSockets().then(sockets => {
    sockets.forEach(socket =>
      socket.emit('getSpaceMouse', data[0], data.slice(1, 4), data.slice(4))
    )
  })
})

readFiles()

maxApi.addHandler('setPresetsFile', (file: string) => {
  try {
    maxApi.post('loading presets file', file)
    const fileContents = fs.readFileSync(file, 'utf-8')
    fs.writeFileSync(path.resolve(process.cwd(), 'presets.json'), fileContents)
    io.fetchSockets().then(sockets => {
      sockets.forEach(socket => socket.emit('setPresets', fileContents))
    })
  } catch (err) {
    console.log('failed')
  }
})

let presets: Record<string, any>
io.on('connection', socket => {
  socket.on('set', (route: string, property: string, value: any) => {
    if (value instanceof Array) {
      maxApi.outlet(route, property, ...value)
    } else {
      if (settings.mediaFolder) {
        if ((property === 'file1' || property === 'file2') && value) {
          value = path.resolve(settings.mediaFolder, value)
        }
        maxApi.outlet(route, property, value)
      } else {
        maxApi.post('No media folder selected; please drop Media Folder in.')
      }
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
      return JSON.parse(fs.readFileSync(presetsPath).toString())
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
  maxApi.post(
    `${new Date()
      .toISOString()
      .slice(0, 19)
      .replace(/[\/:]/g, '-')}_presets.json`
  )

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
