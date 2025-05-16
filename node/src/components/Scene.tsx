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
      controlBoth ? 5 : getters.get('index') + 1
    )
  }, [controlBoth, socket])

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

  const enabledMeshes: boolean[] = useAppStore(state => {
    return state.preset.slice(0, 4).map(x => x['mesh_enable'])
  })

  // const currentPreset = useAppStore(state => state.currentPreset)
  const [mouseEnabled, setMouseEnabled] = useState([false, false, false, false])
  useEffect(() => {
    if (!socket) return

    socket.emit(
      'set',
      '/mesh',
      'spacemouse',
      mouseEnabled.map(x => (x === false ? 0 : 1))
    )
  }, [mouseEnabled, socket])
  // useEffect(() => {
  //   mouseEnable
  // }, [currentPreset])

  const help = useAppStore(state => state.help)
  return (
    <>
      <div className='h-[200px] w-screen bg-gray-600'>
        scroll me to hide browser UI
      </div>
      <div
        className={`h-screen w-screen p-2 pb-5 flex flex-col overflow-hidden`}
        ref={frameRef}>
        <div className='flex w-full overflow-x-auto overflow-y-hidden *:mx-1 pt-1 p-2 backdrop-blur rounded-lg'>
          <div className='*:h-10 *:flex *:items-center *:justify-end'>
            <div>enabled</div>
            <div>mouse</div>
          </div>
          <div className='border border-gray-700 rounded-lg'>
            <div className='h-10 flex *:h-full overflow-hidden items-center'>
              <div className='flex *:w-[40px]'>
                {_.range(4).map(x => {
                  return (
                    <button
                      key={x}
                      className={`${
                        enabledMeshes[x] ? 'bg-gray-700 rounded-lg' : ''
                      } w-10 h-10`}
                      onClick={() => {
                        setters.setPreset(
                          x,
                          {
                            mesh_enable: !enabledMeshes[x]
                          },
                          socket
                        )
                      }}>
                      <span className='mix-blend-difference'>{x + 1}</span>
                    </button>
                  )
                })}
              </div>
            </div>
            <div className='h-10 flex *:h-full overflow-hidden items-center'>
              <div className='flex *:w-[40px]'>
                {_.range(4).map(x => {
                  return (
                    <button
                      key={x}
                      className={`${
                        mouseEnabled[x] ? 'bg-gray-700 rounded-lg' : ''
                      } w-10 h-10`}
                      onClick={() => {
                        const newMouseEnabled = [...mouseEnabled]
                        newMouseEnabled[x] = !mouseEnabled[x]
                        setMouseEnabled(newMouseEnabled)
                      }}>
                      <span className='mix-blend-difference'>{x + 1}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* <MaxValue name='mesh_enable' title='on/off' />
            <button
              className={`${controlBoth ? 'bg-gray-700 rounded-lg' : ''} px-1`}
              onClick={() => {
                setControlBoth(!controlBoth)
              }}>
              <span className='mix-blend-difference'>both</span>
            </button> */}
          </div>
          <div className='flex items-center'>
            <div className='text-center mr-1'>control</div>
            <div className='border border-gray-700 rounded-lg grid grid-cols-2 overflow-hidden items-center flex-none'>
              {_.range(4).map(x => {
                return (
                  <button
                    key={x}
                    className={`${
                      index === x ? 'bg-gray-700 rounded-lg' : ''
                    } w-10 h-10`}
                    onClick={() => {
                      setters.set({ index: x as 0 | 1 | 2 | 3 })
                      socket.emit('set', '/mesh', 'spacemouse', x + 1)
                    }}>
                    <span className='mix-blend-difference'>{x + 1}</span>
                  </button>
                )
              })}
            </div>
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
          <MaxValue
            name='mesh_scale'
            title='scale'
            help='Fix the scale of the mesh to match files'
          />
          <div className='flex space-x-2'>
            <div className='grid grid-cols-2 auto-rows-auto'>
              <div className='col-span-2 text-center'>scramble</div>
              <MaxValue
                name='nurbs_random'
                title='lg'
                help='Scramble the mesh curvature (turn up curve to see)'
              />
              <MaxValue
                name='sorting_trigger'
                title='sm'
                help='Scramble the mesh vertices (turn up scra to see)'
              />
            </div>
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
        <div className='flex w-full'>{help}</div>

        <div className='w-screen h-0 grow flex overflow-hidden'>
          <div className='h-full'>
            <PresetInput />
          </div>
          <div className='h-full w-0 grow *:h-1/2 *:flex *:overflow-x-auto *:overflow-y-hidden *:w-full *:*:flex-none'>
            <div className='space-x-2'>
              <MaxValue
                name='color_alpha'
                title='alph'
                help='How transparent the mesh is'
              />
              <MaxValue
                name='color_brightness'
                title='br'
                help='How close to white the color is'
              />
              <MaxValue
                name='color_contrast'
                title='co'
                help='The contrast in the mesh color'
              />
              <MaxValue
                name='color_saturation'
                title='sat'
                help='The saturation of the mesh color'
              />
              <MaxValue
                name='color_hue'
                title='hue'
                help='Rotate the hue around the color wheel'
              />

              <MaxValue
                name='other_dim'
                title='dim'
                help='How many vertices are in the mesh grid (1x1 -> 100x100)'
              />
              <MaxValue
                name='nurbs_curvature'
                title='curve'
                help='How curved the mesh is (straight plane -> curved shape)'
              />
              <MaxValue
                name='mesh_pointSize'
                title='pt'
                help='When drawing in points mode, how large each point is'
              />
              <MaxValue
                name='sorting_scramble'
                title='scra'
                help='Scramble the vertices (straight plane -> fragmented blob)'
              />
              <MaxValue
                name='warping_smooth'
                title='bouba'
                help='Smooth out the mesh motion'
              />
              <MaxValue
                name='other_source'
                title='source'
                help='Switch the type of source. file1 and file2: files from the file dropdowns; colour: colour according to br/co/sat; text: the text source (in Max patcher); noise: the "noise" dropdown; colour_organ: color responding to sound.'
              />
              <MaxValue
                name='other_source2'
                title='source 2'
                help='Switch the type of source 2 (use xfade to fade between sources, source 1 -> source 2)'
              />
            </div>
            <div className='w-full'>
              <MaxValue
                className='mr-2'
                name='other_sourcefade'
                title='xfade'
                help='Fade between the source 1 and source 2'
              />
              <div
                className='h-full w-[60px] flex flex-col mr-2'
                onMouseEnter={() =>
                  setters.set({
                    help: 'Change how sliders behave (immediate -> 10s fade)'
                  })
                }>
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
                  help='How much the mesh ripples'
                />
                <MaxValue
                  className='mr-2'
                  name='nurbs_speed'
                  title='spd lg'
                  help='How fast the mesh ripples'
                />
                <MaxValue
                  className=''
                  name='nurbs_scale'
                  title='scl lg'
                  help='The size of the ripple (many ripples -> one big ripple)'
                />
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
                  help='How much the mesh jitters'
                />
                <MaxValue
                  className='mr-2'
                  name='warping_speed'
                  title='spd sm'
                  help='How fast the mesh jitters'
                />
                <MaxValue
                  className='mr-2'
                  name='warping_scale'
                  title='scl sm'
                  help='The size of the jitter (small jitters -> larger jitters)'
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
                  help='How much the mesh jitters in response to sound'
                />
                <MaxValue
                  className='mr-2'
                  name='warping_soundShape'
                  title='kiki'
                  help='The sharpness of the sound response (curved -> sharp)'
                />
              </div>
              <div className='h-full w-0 grow'></div>
              <div className='text-center h-full w-fit'>
                <div className='flex *:ml-2'>
                  <MaxValue
                    name='warping_type'
                    title='type'
                    help='The type of jitter in the mesh'
                  />
                  <MaxValue
                    name='mesh_drawMode'
                    title='draw-mode'
                    help='How the mesh is drawn (triangles, points, or lines)'
                  />
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
  const file1 = useAppStore(state => state.preset[4].video_file1)
  const file2 = useAppStore(state => state.preset[4].video_file2)
  const noise = useAppStore(state => state.preset[4].video_noise)
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

  const [spaceMouseStrength, setSpaceMouseStrength] = useState(0.5)
  useEffect(() => {
    if (!socket) return
    socket!.emit(
      'set',
      '/control',
      'spaceMouseStrength',
      Number(spaceMouseStrength)
    )
  }, [spaceMouseStrength])

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
        <div className='w-[200px] flex mt-2'>
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

      <div className='flex-none w-fit ml-2'>
        <div className='flex'>
          <h3>spaceMouse</h3>
          <select
            value={spaceMouseStrength}
            onChange={ev => {
              setSpaceMouseStrength(parseFloat(ev.target.value))
            }}>
            {[0, 0.25, 0.5, 0.75, 1].map(val => (
              <option key={val} value={val}>
                {val}
              </option>
            ))}
          </select>
        </div>
        <div className='flex mt-2'>
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
    <div className='flex flex-col h-full mr-1'>
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
      <div className='grid grid-cols-4 auto-rows-auto *:aspect-square *:w-10 *:h-10 h-full w-full overflow-auto'>
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
            {['a', 'b', 'c', 'd'][x]}
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
  className,
  help
}: {
  name: keyof MeshPreset
  title: string
  className?: string
  help: string
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
            onMouseEnter={() => setters.set({ help })}
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
            onMouseEnter={() => setters.set({ help })}
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
          <div
            className='space-y-1 h-full'
            onMouseEnter={() => setters.set({ help })}>
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
            onMouseEnter={() => setters.set({ help })}
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
          <SelectComponent
            name={name}
            value={value as string}
            title={title}
            help={help}
          />
        )
      case 'list':
        const listValue = value as number[]
        return (
          <div onMouseEnter={() => setters.set({ help })}>
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
  title,
  help
}: {
  name: string
  value: string
  title: string
  help: string
}) {
  const values = useAppStore(state => {
    const description = presetDescription[
      name
    ] as PresetValueDescription<'select'>
    return description.values!(state)
  })

  const socket = useSocket()!

  return (
    <div onMouseEnter={() => setters.set({ help })}>
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
