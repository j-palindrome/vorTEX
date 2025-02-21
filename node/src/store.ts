import { produce } from 'immer'
import _ from 'lodash'
import { useRef } from 'react'
import { Socket } from 'socket.io-client'
import { create } from 'zustand'

export type PresetValueDescription<
  K extends 'slider' | 'boolean' | 'string' | 'trigger' | 'list' | 'select'
> = {
  type: K
  values?: K extends 'string'
    ? string[]
    : K extends 'select'
    ? (state: AppState) => string[]
    : undefined
  default: K extends 'slider'
    ? number
    : K extends 'boolean'
    ? boolean
    : K extends 'string'
    ? string
    : K extends 'trigger'
    ? 'bang' | null
    : K extends 'list'
    ? number[]
    : K extends 'select'
    ? string
    : undefined
}

export type PresetValue<
  K extends 'slider' | 'boolean' | 'string' | 'trigger' | 'list' | 'select'
> = K extends 'slider'
  ? number
  : K extends 'boolean'
  ? boolean
  : K extends 'trigger'
  ? 'bang' | null
  : K extends 'string'
  ? string
  : K extends 'list'
  ? number[]
  : K extends 'select'
  ? string
  : undefined

export type MeshPreset = {
  nurbs_speed: PresetValue<'slider'>
  nurbs_strength: PresetValue<'slider'>
  nurbs_scale: PresetValue<'slider'>
  nurbs_curvature: PresetValue<'slider'>
  nurbs_random: PresetValue<'trigger'>
  mesh_pointSize: PresetValue<'slider'>
  mesh_enable: PresetValue<'boolean'>
  mesh_drawMode: PresetValue<'string'>
  mesh_position: PresetValue<'list'>
  mesh_rotatexyz: PresetValue<'list'>
  color_brightness: PresetValue<'slider'>
  color_contrast: PresetValue<'slider'>
  color_saturation: PresetValue<'slider'>
  color_hue: PresetValue<'slider'>
  color_alpha: PresetValue<'slider'>
  sorting_scramble: PresetValue<'slider'>
  sorting_trigger: PresetValue<'trigger'>
  warping_type: PresetValue<'string'>
  warping_strength: PresetValue<'slider'>
  warping_speed: PresetValue<'slider'>
  warping_smooth: PresetValue<'slider'>
  warping_sound: PresetValue<'slider'>
  warping_scale: PresetValue<'slider'>
  warping_soundType: PresetValue<'string'>
  warping_soundScale: PresetValue<'slider'>
  mouse_sensitivity: PresetValue<'slider'>
  other_dim: PresetValue<'slider'>
  mesh_scale: PresetValue<'string'>
  other_source: PresetValue<'string'>
  other_source2: PresetValue<'string'>
  other_sourcefade: PresetValue<'slider'>
}

export type GlobalPreset = {
  video_file1: string
  video_file2: string
  video_noise: string
}

type MeshPresets = [MeshPreset, MeshPreset, GlobalPreset]

export type AppState = {
  preset: MeshPresets
  presets: Record<string, MeshPresets>
  currentPreset: string
  files: string[]
  index: 0 | 1
}

export const presetDescription: {
  [K in keyof MeshPreset]: PresetValueDescription<
    'boolean' | 'slider' | 'string' | 'trigger' | 'list' | 'select'
  >
} = {
  mesh_position: { type: 'list', default: [0, 0, 0] },
  mesh_rotatexyz: { type: 'list', default: [0, 0, 0] },
  mesh_enable: { type: 'boolean', default: 1 },
  nurbs_speed: { type: 'slider', default: 0 },
  nurbs_curvature: { type: 'slider', default: 0 },
  nurbs_scale: { type: 'slider', default: 0 },
  nurbs_random: { type: 'trigger', default: 'bang' },
  mesh_pointSize: { type: 'slider', default: 0 },
  mesh_drawMode: {
    type: 'string',
    values: [
      'tri_grid',
      'points',
      'line_strip',
      'line_loop',
      'lines',
      'lines_adjacency',
      'line_strip_adjacency'
    ],
    default: 'tri_grid'
  },
  mesh_scale: {
    type: 'string',
    values: ['1:1', '4:3', '16:9'],
    default: '16:9'
  },
  color_brightness: { type: 'slider', default: 0.5 },
  color_contrast: { type: 'slider', default: 0.5 },
  color_saturation: { type: 'slider', default: 0.5 },
  color_hue: { type: 'slider', default: 0.5 },
  color_alpha: { type: 'slider', default: 1 },
  sorting_scramble: { type: 'slider', default: 0 },
  sorting_trigger: { type: 'trigger', default: 'bang' },
  warping_type: {
    type: 'string',
    values: [
      'simplex',
      'cell',
      'checker',
      'distorted',
      'voronoi',
      'gradient',
      'value.cubicspline'
    ],
    default: 'simplex'
  },
  warping_soundType: {
    type: 'string',
    values: ['ripple', 'cell'],
    default: 'ripple'
  },
  warping_sound: { type: 'slider', default: 0 },
  warping_speed: { type: 'slider', default: 0 },
  warping_strength: { type: 'slider', default: 0 },
  warping_smooth: { type: 'slider', default: 0 },
  warping_scale: { type: 'slider', default: 0 },
  warping_soundScale: { type: 'slider', default: 0 },
  mouse_sensitivity: { type: 'slider', default: 0.5 },
  other_dim: { type: 'slider', default: 0.2 },
  other_source: {
    type: 'string',
    values: ['file1', 'file2', 'colour', 'text', 'noise', 'colour_organ'],
    default: 'file1'
  },
  other_source2: {
    type: 'string',
    values: ['file1', 'file2', 'colour', 'text', 'noise', 'colour_organ'],
    default: 'file1'
  },
  other_sourcefade: {
    type: 'slider',
    default: 0
  },
  nurbs_strength: { type: 'slider', default: 0 }
}

export const initialMesh = Object.fromEntries(
  Object.keys(presetDescription).map(key => [
    key,
    presetDescription[key].default
  ])
) as MeshPreset

export const initialGlobal: GlobalPreset = {
  video_file1: '',
  video_file2: '',
  video_noise: 'noise.simplex'
}

const initialState: AppState = {
  preset: [initialMesh, initialMesh, initialGlobal],
  presets: {},
  currentPreset: '0',
  files: [],
  index: 0
}

export const useAppStore = create<AppState>(() => initialState)
export const useAppStoreRef = <T>(callback: (state: AppState) => T) => {
  const storeValue: T = useAppStore(callback)
  const storeValueRef = useRef(storeValue)
  storeValueRef.current = storeValue
  return [storeValue, storeValueRef] as [
    typeof storeValue,
    typeof storeValueRef
  ]
}

const modify = (modifier: (state: AppState) => void) =>
  useAppStore.setState(produce(modifier))

export const setters = {
  savePreset: (name: string, socket: Socket<SocketEvents, SocketEvents>) => {
    modify(state => {
      state.presets[name] = _.cloneDeep(state.preset)
      socket.emit('savePresets', state.presets)
    })
  },
  deletePreset: (name: string, socket: Socket<SocketEvents, SocketEvents>) => {
    modify(state => {
      delete state.presets[name]
      socket.emit('savePresets', state.presets)
    })
  },
  loadPreset: (name: string, socket: Socket<SocketEvents, SocketEvents>) => {
    const presets = getters.get('presets')
    const currentPreset = getters.get('preset')
    const newPreset = !presets[name]
      ? _.cloneDeep(currentPreset)
      : presets[name]
    setters.savePreset(getters.get('currentPreset'), socket)

    for (let i = 0; i < 2; i++) {
      const thisMesh = currentPreset[i] as MeshPreset
      setters.setPreset(i, { ...thisMesh, ...newPreset[i] }, socket)
    }

    setters.setPreset(
      'global',
      { ...currentPreset[2], ...newPreset[2] },
      socket
    )

    modify(state => {
      state.currentPreset = name
    })
  },
  setPreset: <K extends number | 'global'>(
    index: K,
    newPreset: K extends number ? Partial<MeshPreset> : Partial<GlobalPreset>,
    socket: Socket<SocketEvents>,
    // when setting/getting these are useful for preventing infinite loops
    { commit = true, send: sendToMax = true, save = false } = {}
  ) => {
    if (sendToMax) {
      for (let key of Object.keys(newPreset)) {
        socket.emit(
          'set',
          '/' + index + '/' + key.slice(0, key.indexOf('_')),
          key.slice(key.indexOf('_') + 1),
          newPreset[key]
        )
      }
    }

    if (commit) {
      modify(state => {
        for (let [key, value] of Object.entries(newPreset)) {
          if (typeof index === 'number') {
            state.preset[index][key] = value
          } else if (index === 'global') {
            // global
            state.preset[2][key] = value
          }
        }
        if (save) {
          state.presets[state.currentPreset] = state.preset
          socket.emit('savePresets', getters.get('presets'))
        }
      })
    }
  },
  set: (newState: Partial<AppState>) =>
    modify(state => Object.assign(state, newState)),
  modify: (modifier: (oldState: AppState) => void) => modify(modifier)
}

export const getters = {
  get: <T extends keyof AppState>(key: T) => useAppStore.getState()[key],
  getCurrentMesh: () => {
    const state = useAppStore.getState()
    return state.preset[state.index]
  }
}
