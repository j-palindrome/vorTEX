import { useEffect, useRef, useState } from 'react'
import { SocketProvider } from './context'
import {
  AppState,
  getters,
  initialGlobal,
  initialMesh,
  setters,
  useAppStore
} from './store'
import { Socket, io } from 'socket.io-client'
import Scene from './components/Scene'
import { cloneDeep } from 'lodash'

function App() {
  const [socket, setSocket] = useState<Socket<SocketEvents, SocketEvents>>()
  const loaded = useRef(false)

  useEffect(() => {
    // Set zoom level to 100% on page load
    document.body.style.zoom = '100%'
  }, [])

  useEffect(() => {
    const socket: Socket<SocketEvents, SocketEvents> = io()
    setSocket(socket)
    socket.emit('set', '/mesh', '', 1)
    socket.emit('loadPresets', presets => {
      const newPresets: AppState['presets'] = presets
      const defaultKeys = Object.keys(initialMesh)

      for (let value of Object.values(newPresets)) {
        while (value.length < 5) {
          value.push(cloneDeep(initialMesh))
        }
        if (value.length < 6) {
          value.push(cloneDeep(initialGlobal))
        }
        for (let mesh of value.slice(0, 5)) {
          for (let key of defaultKeys) {
            if (mesh[key] === undefined) {
              mesh[key] = initialMesh[key]
            }
          }
        }
        for (let key of Object.keys(initialGlobal)) {
          if (value[5][key] === undefined) value[5][key] = initialGlobal[key]
        }
      }

      setters.setPreset(0, newPresets['0'][0], socket)
      setters.setPreset(1, newPresets['0'][1], socket)
      setters.setPreset(2, newPresets['0'][1], socket)
      setters.setPreset(3, newPresets['0'][3], socket)
      setters.setPreset(4, newPresets['0'][4], socket)
      setters.setPreset('global', newPresets['0'][5], socket)
      setters.set({
        presets: newPresets,
        currentPreset: '0'
      })
      window.setTimeout(() => (loaded.current = true), 500)
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
      if (!loaded.current) return
      setters.setPreset(
        index,
        { mesh_position: position, mesh_rotatexyz: rotation },
        socket,
        { send: false, save: true }
      )
    })

    socket.on('setFiles', files => {
      setters.set({ files })
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
