import { useEffect, useState } from 'react'
import { SocketProvider } from './context'
import { AppState, getters, initialMesh, setters } from './store'
import { Socket, io } from 'socket.io-client'
import Scene from './components/Scene'

function App() {
  const [socket, setSocket] = useState<Socket<SocketEvents, SocketEvents>>()

  useEffect(() => {
    const socket: Socket<SocketEvents, SocketEvents> = io()
    setSocket(socket)

    socket.emit('loadPresets', presets => {
      console.log('loading presets', presets)

      const newPresets: AppState['presets'] = presets
      const defaultKeys = Object.keys(initialMesh)
      for (let value of Object.values(newPresets)) {
        for (let mesh of value) {
          for (let key of defaultKeys) {
            if (mesh[key] === undefined) {
              mesh[key] = initialMesh[key]
            }
          }
        }
      }
      console.log('setting presets', newPresets)

      setters.set({
        presets: newPresets
      })
    })

    socket.on('setPresets', presets => {
      const newPresets: AppState['presets'] = JSON.parse(presets)
      const defaultKeys = Object.keys(initialMesh)
      for (let value of Object.values(newPresets)) {
        for (let mesh of value) {
          for (let key of defaultKeys) {
            if (mesh[key] === undefined) {
              mesh[key] = initialMesh[key]
            }
          }
        }
      }
      setters.set({
        presets: newPresets
      })
    })

    socket.on('getPresets', callback => {
      callback(JSON.stringify(getters.get('presets')))
    })

    // ability to set from Max to update web interface
    socket.on('get', (path, command, value) => {
      const reassembledPath = `${path}_${command}`
      setters.setPreset(
        getters.get('index'),
        { [reassembledPath]: value },
        socket,
        { send: false } // already present in Max
      )
    })

    socket.on('getSpaceMouse', (position, rotation) => {
      const currentMesh = getters.getCurrentMesh()
      const newPosition = currentMesh.mesh_position.map(
        (x, i) => x + position[i]
      )

      const newRotation = currentMesh.mesh_rotatexyz.map(
        (x, i) => x + rotation[i]
      )

      setters.setPreset(
        getters.get('index'),
        { mesh_position: newPosition, mesh_rotatexyz: newRotation },
        socket
      )
    })

    socket.on('setFiles', files => {
      setters.set({ files })
      setters.setPreset(
        'global',
        {
          video_file1: files[0] ?? undefined,
          video_file2: files[0] ?? undefined
        },
        socket
      )
    })

    setters.setPreset(0, initialMesh, socket)
    setters.setPreset(1, { ...initialMesh, mesh_enable: false }, socket)

    return () => {
      socket.close()
    }
  }, [])

  return (
    <SocketProvider socket={socket}>
      <Scene />
    </SocketProvider>
  )
}

export default App
