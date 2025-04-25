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
  const [helpInfo, setHelpInfo] = useState<keyof typeof helpInfos | null>(null)
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
  // const [scrollFix, setScrollFix] = useState(false)

  const frameRef = useRef<HTMLDivElement>(null!)
  useEffect(() => {
    const onTouchMove = ev => {
      ev.preventDefault()
    }
    frameRef.current.addEventListener('touchmove', onTouchMove, {
      passive: false
    })
    return () => {
      frameRef.current.removeEventListener('touchmove', onTouchMove)
    }
  })

  return (
    <>
      <div className='h-[200px] w-screen bg-gray-600'>
        scroll me to hide browser UI
      </div>
      <div
        className={`h-screen w-screen p-2 pb-5 flex flex-col overflow-hidden`}
        ref={frameRef}>
        <div className='flex w-full overflow-x-auto overflow-y-hidden *:mx-1 pt-1 p-2 backdrop-blur rounded-lg'>
          <div>
            <div className='h-8 border border-gray-700 rounded-lg flex *:h-full overflow-hidden items-center'>
              <div className='flex *:w-[40px]'>
                {_.range(4).map(x => {
                  return (
                    <button
                      key={x}
                      className={`${
                        index === x ? 'bg-gray-700 rounded-lg' : ''
                      }`}
                      onClick={() => {
                        setters.set({ index: x })
                        socket.emit('set', '/mesh', 'spacemouse', x + 1)
                      }}>
                      <span className='mix-blend-difference'>{x + 1}</span>
                    </button>
                  )
                })}
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
            <button
              className={`px-1 block`}
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
                  if (index === 2 || controlBoth) {
                    setters.setPreset(
                      2,
                      { color_alpha: secondOriginal * newValue },
                      socket,
                      { save: false }
                    )
                  }
                  if (index === 3 || controlBoth) {
                    setters.setPreset(
                      3,
                      { color_alpha: secondOriginal * newValue },
                      socket,
                      { save: false }
                    )
                  }
                  if (index === 4 || controlBoth) {
                    setters.setPreset(
                      4,
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
              <span className='mix-blend-difference'>fadeout</span>
            </button>
            <button
              className='px-1 block'
              onClick={() => {
                socket.emit('getFiles')
              }}>
              reload
            </button>
          </div>
          <FileChooser />
          <MaxValue name='mesh_scale' title='scale' />
          <div className='flex space-x-2'>
            <MaxValue name='nurbs_random' title='lg' />
            <MaxValue name='sorting_trigger' title='sm' />
            <button
              className='bg-red-900 px-1'
              onClick={() => {
                setters.setPreset(
                  index,
                  getters.get('presets')[getters.get('currentPreset')][index],
                  socket
                )
              }}>
              RESET
            </button>
            <button
              className='bg-red-900 px-1'
              onClick={() => {
                setters.setPreset(
                  index,
                  { mesh_position: [0, 0, 0], mesh_rotatexyz: [0, 0, 0] },
                  socket,
                  { save: true }
                )
              }}>
              CENTER
            </button>
            <button
              className='bg-red-900 px-1'
              onClick={() => {
                for (let i = 0; i < 4; i++) {
                  setters.setPreset(index, { mesh_enable: false }, socket)
                  socket.emit('set', '/global/volume', '', 0)
                }
              }}>
              CUT
            </button>
          </div>
        </div>

        <div className='w-screen h-0 grow flex overflow-hidden'>
          <div className='h-full'>
            <PresetInput />
          </div>
          <div className='h-full w-0 grow *:h-1/2 *:flex *:overflow-x-auto *:overflow-y-hidden *:w-full *:*:flex-none'>
            <div className='space-x-2'>
              <MaxValue name='color_alpha' title='alph' />
              <MaxValue name='color_brightness' title='br' />
              <MaxValue name='color_contrast' title='co' />
              <MaxValue name='color_saturation' title='sat' />
              <MaxValue name='color_hue' title='hue' />

              <MaxValue name='other_dim' title='dim' />
              <MaxValue name='nurbs_curvature' title='curve' />
              <MaxValue name='mesh_pointSize' title='pt' />
              <MaxValue name='sorting_scramble' title='scra' />
              <MaxValue name='warping_smooth' title='bouba' />
              <MaxValue name='other_source' title='source' />
              <MaxValue name='other_source2' title='source 2' />
            </div>
            <div className='w-full'>
              <MaxValue
                className='mr-2'
                name='other_sourcefade'
                title='xfade'
              />
              <div className='h-full w-[60px] flex flex-col mr-2'>
                <div className='text-xs text-center'>fade</div>
                <Slider
                  className='h-full w-full rounded-lg border border-white'
                  innerClassName='left-0 bottom-0 w-full bg-white'
                  sliderStyle={({ x, y }) => ({
                    height: `${y * 100}%`
                  })}
                  values={{ x: 0, y: fadeTime / 10 }}
                  onChange={({ x, y }) => {
                    setters.set({ fadeTime: y * 10 })
                  }}
                />
              </div>
              <div className='grid grid-rows-[1fr] grid-cols-3 gap-y-2 h-full'>
                {/* <div className='text-center text-xs col-span-3 flex items-center space-x-2'>
                  <div className='grow border-b border-white py-1'></div>
                  <div className='w-fit h-[.8em]'>nurbs</div>
                  <div className='grow border-b border-white py-1'></div>
                </div> */}
                <MaxValue
                  className='mr-2'
                  name='nurbs_strength'
                  title='str lg'
                />
                <MaxValue className='mr-2' name='nurbs_speed' title='spd lg' />
                <MaxValue className='' name='nurbs_scale' title='scl lg' />
              </div>
              <div className='grid grid-rows-[1fr] grid-cols-3 gap-y-2 h-full'>
                {/* <div className='text-center text-xs col-span-3 flex items-center space-x-2'>
                  <div className='grow border-b border-white py-1'></div>
                  <div className='w-fit h-[.8em]'>vertices</div>
                  <div className='grow border-b border-white py-1'></div>
                </div> */}
                <MaxValue
                  className='mr-2'
                  name='warping_strength'
                  title='str sm'
                />
                <MaxValue
                  className='mr-2'
                  name='warping_speed'
                  title='spd sm'
                />
                <MaxValue
                  className='mr-2'
                  name='warping_scale'
                  title='scl sm'
                />
              </div>
              <div className='grid grid-rows-[1fr] grid-cols-2 gap-y-2 h-full'>
                {/* <div className='text-center text-xs col-span-3 flex items-center space-x-2'>
                  <div className='grow border-b border-white py-1'></div>
                  <div className='w-fit h-[.8em]'>sound</div>
                  <div className='grow border-b border-white py-1'></div>
                </div> */}
                <MaxValue
                  className='mr-2'
                  name='warping_sound'
                  title='str snd'
                />
                <MaxValue
                  className='mr-2'
                  name='warping_soundShape'
                  title='kiki'
                />
              </div>
              <div className='h-full w-0 grow'></div>
              <div className='text-center h-full w-fit'>
                <div className='flex *:ml-2'>
                  <MaxValue name='warping_type' title='type' />
                  <MaxValue name='mesh_drawMode' title='draw-mode' />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

function FileChooser() {
  const values = useAppStore(state => state.files)
  const file1 = useAppStore(state => state.preset[5].video_file1)
  const file2 = useAppStore(state => state.preset[5].video_file2)
  const noise = useAppStore(state => state.preset[5].video_noise)
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
        <div className='w-[200px] flex'>
          <h3 className='whitespace-pre'>file 1</h3>
          <select
            className='w-full'
            value={file1}
            onChange={ev => {
              setters.setPreset(
                'global',
                {
                  video_file1: ev.target.value
                },
                socket!
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
        <div className='w-[200px] flex'>
          <h3 className='whitespace-pre'>file 2</h3>
          <select
            className='w-full'
            value={file2}
            onChange={ev => {
              setters.setPreset(
                'global',
                {
                  video_file2: ev.target.value
                },
                socket!
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
              socket!
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

  const [index, setIndex] = useState(0)

  return (
    <div className='flex flex-col h-full'>
      <div className='flex space-x-1 px-1 mb-2'>
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
      <div className='grid grid-cols-4 auto-rows-auto *:aspect-square *:w-8 *:h-8 h-full w-full overflow-auto'>
        {_.range(4).map(x => (
          <button
            className={`rounded flex text-xs items-center justify-center m-0.5 ${
              index === x
                ? 'bg-yellow-500 text-white'
                : 'bg-[rgb(94,96,172)] text-white'
            }`}
            onClick={() => {
              setIndex(x)
            }}>
            {['a', 'b', 'c', 'd', 'e'][x]}
          </button>
        ))}
        {_.range(index * 64, (index + 1) * 64).map(i => (
          <button
            className={`rounded flex text-xs items-center justify-center m-0.5 ${
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

function MaxValue({
  name,
  title,
  className
}: {
  name: keyof MeshPreset
  title: string
  className?: string
}) {
  const socket = useSocket()!
  const index = useAppStore(state => state.index)
  const value = useAppStore(state => state.preset[state.index][name])
  const [_group, control] = name.split('_')
  const description = presetDescription[name]

  useEffect(() => {
    if (!socket) return
    switch (description.type) {
      case 'trigger':
        setters.setPreset(index, { [name]: 'bang' }, socket)
    }
  }, [socket])

  const typedComponent = () => {
    switch (description.type) {
      case 'trigger':
        return (
          <button
            onClick={() => {
              setters.setPreset(index, { [name]: 'bang' }, socket)
            }}
            className={`min-w-12 border border-gray-700 mx-1 px-1`}>
            {title}
          </button>
        )
      case 'boolean':
        return (
          <button
            onClick={() => {
              setters.setPreset(index, { [name]: !value }, socket)
            }}
            className={`min-w-12 border border-gray-700 mx-1 px-1 ${
              value ? 'bg-gray-700' : ''
            }`}>
            {control}
          </button>
        )
      case 'string':
        return (
          <div className='space-y-1 h-full'>
            <h3>{title}</h3>
            <div className='overflow-y-auto h-full w-[120px] overflow-hidden'>
              {(description.values as string[])!.map(item => (
                <button
                  className={`block w-full text-left px-2 ${
                    value === item ? 'bg-yellow-500 text-black' : ''
                  }`}
                  onClick={() =>
                    setters.setPreset(index, { [name]: item }, socket)
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
          <div
            className={`w-[60px] h-full flex flex-col items-center ${className}`}>
            <h3 className='w-full text-center text-xs whitespace-nowrap !font-sans'>
              {title.slice(0, 8) + (title.length > 8 ? '...' : '')}
            </h3>
            <Slider
              className='w-full h-full rounded-lg border'
              onChange={({ y }) => {
                if (!socket) return
                setters.setPreset(index, { [name]: y }, socket)
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
            socket
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
