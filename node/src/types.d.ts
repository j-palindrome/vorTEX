import { PresetValue } from './store'

declare global {
  type SocketEvents = {
    loadPresets: (callback: (presets: Record<string, any>) => void) => void
    savePresets: (presets: Record<string, any>) => void
    set: (path: string, command: string, value: PresetValue['value']) => void
    setPresets: (presets: string) => void
    get: (path: string, command: string, value: PresetValue['value']) => void
    getPresets: (callback: (presets: string) => void) => void
    getSpaceMouse: (
      index: number,
      position: number[],
      rotation: number[]
    ) => void
    setFiles: (files: string[]) => void
    getFiles: () => void
  }
}
