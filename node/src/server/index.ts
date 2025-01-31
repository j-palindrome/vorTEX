//e.g server.js
import { ip } from 'address'
import express from 'express'
import maxApi from 'max-api'
import fs from 'node:fs'
import path from 'node:path'
import { Server as SocketServer } from 'socket.io'
import ViteExpress from 'vite-express'

const app = express()

const server = ViteExpress.listen(app, 7001, () =>
  console.log('Server is listening...')
)

// And then attach the socket.io server to the HTTP server
const io = new SocketServer<SocketEvents>(server)

// Then you can use `io` to listen the `connection` event and get a socket
// from a client

const settings: {
  mediaFolder: string
} = JSON.parse(
  fs.readFileSync(path.resolve(process.cwd(), 'settings.json')).toString()
)

const updateSettings = (newSettings: Partial<typeof settings>) => {
  for (let key of Object.keys(newSettings)) {
    settings[key] = newSettings[key]
  }
  fs.writeFileSync(
    path.resolve(process.cwd(), 'settings.json'),
    JSON.stringify(settings)
  )
}

io.on('connection', socket => {
  maxApi.outlet(
    '/message',
    `Go to ${ip()}:7001 from an iPad signed into same WiFi to access UI.`
  )

  socket.on('set', (route: string, property: string, value: any) => {
    if (value instanceof Array) {
      maxApi.outlet(route, property, ...value)
    } else {
      if ((property === 'file1' || property === 'file2') && value) {
        value = path.resolve(settings.mediaFolder, value)
      }
      maxApi.outlet(route, property, value)
    }
  })

  const presets = fs
    .readFileSync(path.resolve(process.cwd(), 'presets.json'))
    .toString()

  socket.on('loadPresets', callback => {
    callback(presets)
  })

  socket.on('savePresets', presets => {
    fs.writeFile(
      path.resolve(process.cwd(), 'presets.json'),
      JSON.stringify(presets),
      () => {}
    )
  })

  const readFiles = () => {
    if (!settings.mediaFolder) return
    try {
      const files = fs
        .readdirSync(settings.mediaFolder)
        .filter(file =>
          /\.(mov|mp4|m4a|png|jpg|aif|gif|webm|webp|vlc)$/.test(file)
        )
      socket.emit('setFiles', files)
    } catch (err) {
      maxApi.post(
        // @ts-ignore
        err.message,
        'Media folder not found; please drop the Media folder again.'
      )
    }
  }
  maxApi.addHandler('setMediaFolder', (folder: string) => {
    try {
      maxApi.post('media folder', folder, folder)
      updateSettings({ mediaFolder: folder })
      readFiles()
    } catch (err) {
      updateSettings({ mediaFolder: '' })
      if (err instanceof Error) maxApi.post('ERROR:', err.message)
    }
  })

  maxApi.addHandler('setPresetsFile', (file: string) => {
    try {
      maxApi.post('loading presets file', file)
      const fileContents = fs.readFileSync(file, 'utf-8')
      fs.writeFileSync(
        path.resolve(process.cwd(), 'presets.json'),
        fileContents
      )
      socket.emit('setPresets', fileContents)
    } catch (err) {
      console.log('failed')
    }
  })
  readFiles()

  maxApi.addHandler('savePresetsFile', (file: string) => {
    socket.emit('getPresets', presets => {
      fs.writeFile(file, presets, () => {
        maxApi.post('presets saved to external file')
      })
    })
  })

  maxApi.addHandler('spaceMouse', (...data) => {
    socket.emit('getSpaceMouse', data.slice(0, 3), data.slice(3, 6))
  })
})
