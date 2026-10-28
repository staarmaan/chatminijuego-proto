import { ElectronAPI } from '@electron-toolkit/preload'

export interface SpawnFishPayload {
  fishType: string | number
  scale?: number | string
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      onSpawnFish: (callback: (payload: SpawnFishPayload) => void) => () => void
    }
  }
}
