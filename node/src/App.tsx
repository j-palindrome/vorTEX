import { useEffect, useRef, useState } from 'react'
import { SocketProvider } from './context'
import { AppState, getters, initialMesh, setters, useAppStore } from './store'
import { Socket, io } from 'socket.io-client'
import Scene from './components/Scene'

function App() {
  const [socket, setSocket] = useState<Socket<SocketEvents, SocketEvents>>()

  useEffect(() => {
    const socket: Socket<SocketEvents, SocketEvents> = io()
    setSocket(socket)
    socket.emit('set', '/mesh', '', 1)
    socket.emit('loadPresets', presets => {
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

      setters.set({
        presets: newPresets,
        currentPreset: '0'
      })
      setters.setPreset(0, newPresets['0'][0], socket)
      setters.setPreset(1, newPresets['0'][1], socket)
      setters.setPreset('global', newPresets['0'][2], socket)
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

    socket.on('getSpaceMouse', (index, position, rotation) => {
      setters.setPreset(
        index,
        { mesh_position: position, mesh_rotatexyz: rotation },
        socket,
        { send: false, save: true }
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

    return () => {
      socket.close()
    }
  }, [])

  const scrollContainerRef = useRef<HTMLDivElement | null>(null)

  // useEffect(() => {
  //   const scrollContainer = document.getElementById('scrollContainer')
  //   scrollContainerRef.current = scrollContainer as HTMLDivElement

  //   const observer = new IntersectionObserver(
  //     entries => {
  //       entries.forEach(entry => {
  //         if (entry.isIntersecting) {

  //           observer.disconnect()
  //         }
  //       })
  //     },
  //     { threshold: 1.0 }
  //   )

  //   if (scrollContainer) {
  //     observer.observe(scrollContainer)
  //   }

  //   return () => {
  //     observer.disconnect()
  //   }
  // }, [])

  return (
    <>
      <SocketProvider socket={socket}>
        <Scene />
      </SocketProvider>
    </>
  )
}

export default App
