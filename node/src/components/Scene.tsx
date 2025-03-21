import _, { cloneDeep } from 'lodash'
import { useEffect, useRef, useState } from 'react'
import { useSocket } from '../context'
import {
  MeshPreset,
  PresetValueDescription,
  getters,
  presetDescription,
  setters,
  useAppStore
} from '../store'
import Slider from './Slider'

const helpInfos = {
  start: 'Click on "help" above a control to view a guide on how to use it.',
  meshes: 'Switch to Mesh 1 or 2 to have ALL controls pertain to that mesh.',
  files:
    'Files are configured globally; "file1" and "file2" are available in Source selection to be used by either mesh in COLOR.\n "noise" is also available as a source.',
  presets:
    'Dark grey: unused slot.\n Light grey: used slot.\n Gold: active slot.\n Click "save" to save the current settings to the selected slot (saves both meshes and global settings).\n Click "delete" to free up the selected slot, turning it dark grey.\n Use "SAVE PRESETS" in the Max window to export the current preset file, and drop an external file on to "Presets File" to import an external preset file.',
  color:
    'a: alpha, br: brightness, co: contrast, sat: saturation, hue: hue.\n Select 2 sources to crossfade between them in the same mesh with "xfade."',
  shape:
    'dim: the amount of resolution on the NURBS mesh.\n curve: the strength of the curve.\n pt-size: when in POINTS or LINES draw mode, how thick points or lines are.\n scramble: amount of randomization on the position of points in the mesh.\n Click "Scramble" to randomize the curve or order of points again.\n draw-mode: How the mesh is rendered.\n scale: stretch the mesh to fit media.',
  noise:
    'nurbs: larger warping on the NURBS mesh, covering bigger curves. \nvertices: smaller warping on individual points. type is the type of noise generated. \nsound: amount that sound affects the warping of vertices in the mesh.'
}

export default function Scene() {
  const index = useAppStore(state => state.index)

  const socket = useSocket()!

  const [controlBoth, setControlBoth] = useState(false)

  useEffect(() => {
    if (!socket) return
    socket.emit(
      'set',
      '/mesh',
      'spacemouse',
      controlBoth ? 3 : getters.get('index') + 1
    )
  }, [controlBoth])
  useEffect(() => {
    if (!socket) return
    socket.emit(
      'set',
      '/mesh',
      'spacemouse',
      controlBoth ? 3 : getters.get('index') + 1
    )
  }, [socket])

  const fadeTime = useAppStore(state => state.fadeTime)

  return (
    <div className='h-full w-full flex flex-col'>
      <div className='flex w-full overflow-x-auto overflow-y-hidden *:m-1 pt-2 m-2 p-2 backdrop-blur rounded-lg'>
        <div>
          <div className='h-8 border border-gray-700 rounded-lg flex *:h-full overflow-hidden items-center w-[80px]'>
            <div className='flex *:w-[40px]'>
              <button
                className={`${index === 0 ? 'bg-gray-700 rounded-lg' : ''}`}
                onClick={() => {
                  setters.set({ index: 0 })
                  socket.emit('set', '/mesh', 'spacemouse', 1)
                }}>
                <span className='mix-blend-difference'>1</span>
              </button>
              <button
                className={`${index === 1 ? 'bg-gray-700 rounded-lg' : ''}`}
                onClick={() => {
                  setters.set({ index: 1 })
                  socket.emit('set', '/mesh', 'spacemouse', 2)
                }}>
                <span className='mix-blend-difference'>2</span>
              </button>
            </div>
          </div>
          <MaxValue name='mesh_enable' title='on/off' />
          <button
            className={`${controlBoth ? 'bg-gray-700 rounded-lg' : ''} px-1`}
            onClick={() => {
              setControlBoth(!controlBoth)
            }}>
            <span className='mix-blend-difference'>both</span>
          </button>
        </div>
        <div>
          <Slider
            className='w-[100px] h-[36px] rounded-lg border border-white'
            innerClassName='left-0 top-0 h-full bg-white'
            sliderStyle={({ x, y }) => ({
              width: `${x * 100}%`
            })}
            values={{ x: fadeTime / 10, y: 0 }}
            onChange={({ x, y }) => {
              console.log(x)

              setters.set({ fadeTime: x * 10 })
            }}
          />
          <button
            className={`px-1`}
            onClick={() => {
              let newValue = 1
              const fadeFrame = 1 / (fadeTime * 60)

              const currentPreset = getters.get('preset')
              const firstOriginal = currentPreset[0].color_alpha
              const secondOriginal = currentPreset[1].color_alpha
              const fade = () => {
                newValue -= fadeFrame
                const index = getters.get('index')

                if (index === 0 || controlBoth) {
                  setters.setPreset(
                    0,
                    { color_alpha: firstOriginal * newValue },
                    socket,
                    { save: false }
                  )
                }
                if (index === 1 || controlBoth) {
                  setters.setPreset(
                    1,
                    { color_alpha: secondOriginal * newValue },
                    socket,
                    { save: false }
                  )
                }
                if (newValue > 0) {
                  requestAnimationFrame(fade)
                }
              }
              fade()
            }}>
            <span className='mix-blend-difference'>fade</span>
          </button>
        </div>
        <FileChooser />
        <div className='grid grid-cols-[repeat(3,90px)] grid-rows-2 gap-1'>
          <button
            className='bg-red-900 px-1'
            onClick={() => {
              setters.setPreset(
                index,
                getters.get('presets')[getters.get('currentPreset')][index],
                socket,
                { save: true }
              )
            }}>
            RESET
          </button>
          <button
            className='bg-red-900 px-1'
            onClick={() => {
              setters.setPreset(index, { mesh_position: [0, 0, 0] }, socket, {
                save: true
              })
            }}>
            position
          </button>
          <button
            className='bg-red-900 px-1'
            onClick={() => {
              setters.setPreset(index, { mesh_rotatexyz: [0, 0, 0] }, socket, {
                save: true
              })
            }}>
            rotation
          </button>
          <button
            className='bg-red-900 px-1'
            onClick={() => {
              setters.setPreset(
                index,
                _.pick(
                  getters.get('presets')[getters.get('currentPreset')][index],
                  [
                    'color_alpha',
                    'color_brightness',
                    'color_contrast',
                    'color_saturation',
                    'color_hue'
                  ]
                ),
                socket
              )
            }}>
            color
          </button>
          <button
            className='bg-red-900 px-1'
            onClick={() => {
              setters.setPreset(
                index,
                _.pick(
                  getters.get('presets')[getters.get('currentPreset')][index],
                  [
                    'nurbs_curvature',
                    'mesh_pointSize',
                    'mesh_drawMode',
                    'mesh_scale',
                    'other_dim'
                  ]
                ),
                socket,
                { save: true }
              )
            }}>
            shape
          </button>
          <button
            className='bg-red-900 px-1'
            onClick={() => {
              setters.setPreset(
                index,
                _.pick(
                  getters.get('presets')[getters.get('currentPreset')][index],
                  [
                    'warping_scale',
                    'warping_smooth',
                    'warping_sound',
                    'warping_soundScale',
                    'warping_speed',
                    'warping_strength',
                    'warping_type',
                    'nurbs_scale',
                    'nurbs_speed'
                  ]
                ),
                socket,
                { save: true }
              )
            }}>
            noise
          </button>
        </div>
      </div>

      <div className='w-screen h-0 grow flex'>
        <div className='h-full w-0 grow *:h-1/2 *:flex *:overflow-x-auto *:overflow-y-hidden *:w-full *:*:flex-none'>
          <div className=''>
            <MaxValue name='color_alpha' title='a' />
            <MaxValue name='color_brightness' title='br' />
            <MaxValue name='color_contrast' title='co' />
            <MaxValue name='color_saturation' title='sat' />
            <MaxValue name='color_hue' title='hue' />

            <MaxValue name='other_source' title='source' />
            <MaxValue name='other_source2' title='source 2' />
            <MaxValue name='other_sourcefade' title='xfade' />

            <MaxValue name='other_dim' title='dim' />
            <MaxValue name='nurbs_curvature' title='curve' />
            <MaxValue name='mesh_pointSize' title='pt-size' />
            <MaxValue name='sorting_scramble' title='scramble' />
            <div className='text-center h-full'>
              <div>
                <h2>Scramble</h2>
                <MaxValue name='nurbs_random' title='curve' />
                <MaxValue name='sorting_trigger' title='points' />
              </div>
              <div className='flex space-x-2'>
                <MaxValue name='mesh_drawMode' title='draw-mode' />
                <MaxValue name='mesh_scale' title='scale' />
              </div>
            </div>
          </div>
          <div>
            <PresetInput />
            <div className='flex h-full justify-center items-end *:mx-1'>
              <div className='text-center h-full flex flex-col'>
                <h3 className=''>nurbs</h3>
                <div className='flex h-full'>
                  <MaxValue name='nurbs_strength' title='strength' />
                  <MaxValue name='nurbs_speed' title='speed' />
                  <MaxValue name='nurbs_scale' title='scale' />
                </div>
              </div>
              <div className='pt-6 h-full'>
                <div className='h-full border-l border-white/50'></div>
              </div>
              <div className='text-center h-full flex flex-col'>
                <h3 className=''>vertices</h3>
                <div className='flex h-full'>
                  <MaxValue name='warping_strength' title='strength' />
                  <MaxValue name='warping_speed' title='speed' />
                  <MaxValue name='warping_scale' title='scale' />
                  <MaxValue name='warping_smooth' title='smooth' />
                  <MaxValue name='warping_type' title='type' />
                </div>
              </div>
              <div className='pt-6 h-full'>
                <div className='h-full border-l border-white/50'></div>
              </div>
              <div className='text-center h-full flex flex-col'>
                <h3 className=''>sound</h3>
                <div className='flex h-full space-x-4'>
                  <MaxValue name='warping_sound' title='strength' />
                  <MaxValue name='warping_soundType' title='sound type' />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function FileChooser() {
  const values = useAppStore(state => state.files)
  const file1 = useAppStore(state => state.preset[2].video_file1)
  const file2 = useAppStore(state => state.preset[2].video_file2)
  const noise = useAppStore(state => state.preset[2].video_noise)
  const noiseTypes = [
    'noise.perlin',
    'noise.simplex',
    'noise.cell',
    'noise.checker',
    'fractal.multi.rigid',
    'fractal.multi.hybrid',
    'fractal.fbm',
    'fractal.multi',
    'fractal.hetero',
    'noise.voronoi',
    'noise.voronoi.crackle',
    'noise.voronoi.smooth',
    'noise.voronoise',
    'noise.voronoi.id',
    'distorted',
    'distorted.2axis'
  ]

  const socket = useSocket()

  return (
    <div className='flex'>
      <div className='w-[200px]'>
        <div className='w-[200px]'>
          <h3>file 1</h3>
          <select
            className='w-full'
            value={file1}
            onChange={ev => {
              setters.setPreset(
                'global',
                {
                  video_file1: ev.target.value
                },
                socket!,
                { save: true }
              )
            }}>
            <option value=''>---</option>
            {values.map(val => (
              <option key={val} value={val}>
                {val}
              </option>
            ))}
          </select>
        </div>
        <div className='w-[200px]'>
          <h3>file 2</h3>
          <select
            className='w-full'
            value={file2}
            onChange={ev => {
              setters.setPreset(
                'global',
                {
                  video_file2: ev.target.value
                },
                socket!,
                { save: true }
              )
            }}>
            <option value=''>---</option>
            {values.map(val => (
              <option key={val} value={val}>
                {val}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className='w-[200px]'>
        <h3>noise</h3>
        <select
          value={noise}
          onChange={ev => {
            setters.setPreset(
              'global',
              {
                video_noise: ev.target.value
              },
              socket!,
              { save: true }
            )
          }}>
          <option value=''>---</option>
          {noiseTypes.map(val => (
            <option key={val} value={val}>
              {val}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}

function PresetInput() {
  const [copy, setCopy] = useState(false)
  const allPresets = useAppStore(state => state.presets)
  const currentPreset = useAppStore(state => state.currentPreset)

  const socket = useSocket()!

  return (
    <div className='w-[225px] h-full flex flex-col '>
      <div className='flex space-x-1 px-1'>
        <button
          onClick={() => setCopy(!copy)}
          className={`w-1/2 h-12 rounded-lg ${
            copy ? 'bg-yellow-500 text-black' : 'bg-gray-500 text-white'
          }`}>
          copy
        </button>
        <button
          onClick={() => setters.savePreset(currentPreset, socket)}
          className={`w-1/2 h-12 rounded-lg ${
            copy ? 'bg-yellow-500 text-black' : 'bg-gray-500 text-white'
          }`}>
          save
        </button>
      </div>
      <div className='flex flex-wrap *:aspect-square *:w-6 h-full w-full overflow-auto'>
        {_.range(49).map(i => (
          <button
            className={`rounded flex items-center justify-center m-1 ${
              currentPreset === `${i}`
                ? 'bg-yellow-500 text-black'
                : allPresets[i]
                ? 'bg-gray-500 text-white'
                : 'bg-gray-600/50 text-white'
            }`}
            onClick={() => {
              if (copy) {
                setters.modify(state => {
                  state.presets[`${i}`] = cloneDeep(state.preset)
                })
                setCopy(false)
              }
              setters.loadPreset(`${i}`, socket)
            }}>
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  )
}

function MaxValue({ name, title }: { name: keyof MeshPreset; title: string }) {
  const socket = useSocket()!
  const index = useAppStore(state => state.index)
  const value = useAppStore(state => state.preset[state.index][name])
  const [_group, control] = name.split('_')
  const description = presetDescription[name]

  const typedComponent = () => {
    switch (description.type) {
      case 'trigger':
        return (
          <button
            onClick={() => {
              setters.setPreset(index, { [name]: 'bang' }, socket)
            }}
            className={`border border-gray-700 mx-1`}>
            {title}
          </button>
        )
      case 'boolean':
        return (
          <button
            onClick={() => {
              setters.setPreset(index, { [name]: !value }, socket, {
                save: true
              })
            }}
            className={`border border-gray-700 mx-1 ${
              value ? 'bg-gray-700' : ''
            }`}>
            {control}
          </button>
        )
      case 'string':
        return (
          <div className='space-y-1 h-full'>
            <h3>{title}</h3>
            <div className='overflow-y-auto h-full'>
              {(description.values as string[])!.map(item => (
                <button
                  className={`block w-full text-left px-2 ${
                    value === item ? 'bg-yellow-500 text-black' : ''
                  }`}
                  onClick={() =>
                    setters.setPreset(index, { [name]: item }, socket, {
                      save: true
                    })
                  }
                  key={item}
                  value={item}>
                  {item}
                </button>
              ))}
            </div>
          </div>
        )
      case 'slider':
        return (
          <div className='w-[50px] h-full flex flex-col items-center'>
            <h3 className='w-full text-center text-xs whitespace-nowrap !font-sans'>
              {title.slice(0, 8) + (title.length > 8 ? '...' : '')}
            </h3>
            <Slider
              className='w-full h-full rounded-lg border'
              onChange={({ y }) => {
                if (!socket) return

                setters.setPreset(index, { [name]: y }, socket, {
                  save: true
                })
              }}
              sliderStyle={({ y }) => ({
                height: `${y * 100}%`
              })}
              innerClassName='w-full bg-white bottom-0 left-0 rounded-t-lg'
              values={{ x: 0, y: value as number }}
            />
          </div>
        )
      case 'select':
        return (
          <SelectComponent name={name} value={value as string} title={title} />
        )
      case 'list':
        const listValue = value as number[]
        return (
          <div>
            <div className='w-full text-center text-sm font-bold'>{title}</div>
            <div className='flex *:mx-2'>
              {listValue.map(value => (
                <span>{value.toFixed(2)}</span>
              ))}
            </div>
          </div>
        )
      default:
        return <></>
    }
  }
  return typedComponent()
}

function SelectComponent({
  name,
  value,
  title
}: {
  name: string
  value: string
  title: string
}) {
  const values = useAppStore(state => {
    const description = presetDescription[
      name
    ] as PresetValueDescription<'select'>
    return description.values!(state)
  })

  const socket = useSocket()!

  return (
    <div>
      <h3>{title}</h3>
      <select
        value={value}
        onChange={ev => {
          setters.setPreset(
            getters.get('index'),
            { [name]: ev.target.value },
            socket,
            { save: true }
          )
        }}>
        <option value=''>---</option>
        {values.map(val => (
          <option key={val} value={val}>
            {val}
          </option>
        ))}
      </select>
    </div>
  )
}
