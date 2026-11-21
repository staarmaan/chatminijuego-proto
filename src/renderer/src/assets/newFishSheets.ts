const files = import.meta.glob('./images/fishes/newFishGraphics/*.png', {
  eager: true,
  query: '?url',
  import: 'default'
}) as Record<string, string>

export const NEW_FISH_FRAME_WIDTH = 48
export const NEW_FISH_FRAME_HEIGHT = 48
export const NEW_FISH_FRAME_COUNT = 3

// Each sheet is 3 frames wide: 0 = small, 1 = med, 2 = big.
export const newFishSheets = Object.entries(files).map(([path, url]) => {
  const name = path.split('/').pop()!.replace(/\.png$/, '')
  return {
    key: name,
    url,
    frameWidth: NEW_FISH_FRAME_WIDTH,
    frameHeight: NEW_FISH_FRAME_HEIGHT,
    frameCount: NEW_FISH_FRAME_COUNT
  }
})
