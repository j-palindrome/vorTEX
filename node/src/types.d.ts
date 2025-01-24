import { PresetValue } from './store'

declare global {
  type SocketEvents = {
    loadPresets: (callback: (presets: string) => void) => void
    savePresets: (presets: Record<string, object>) => void
    set: (path: string, command: string, value: PresetValue['value']) => void
    setPresets: (presets: string) => void
    get: (path: string, command: string, value: PresetValue['value']) => void
    getPresets: (callback: (presets: string) => void) => void
    getSpaceMouse: (position: number[], rotation: number[]) => void
    setFiles: (files: string[]) => void
  }
}
