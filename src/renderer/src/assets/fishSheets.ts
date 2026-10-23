const files = import.meta.glob('./images/fishes/*.png', {
  eager: true, //whenever to import all immediately or wait for them.
  query: '?url',
  import: 'default'
}) as Record<string, string>

export const FISH_FRAME_WIDTH = 38
export const FISH_FRAME_HEIGHT = 37
export const FISH_FRAME_COUNT = 8

//url is just the directory of the images.
export const fishSheets = Object.entries(files).map(([path, url]) => {
  const name = path.split('/').pop()!.replace(/\.png$/, '')
  return {
    key: `fish-${name}`, // fish-clownfish, fish-basa, ...
    url,
    frameWidth: FISH_FRAME_WIDTH,
    frameHeight: FISH_FRAME_HEIGHT,
    frameCount: FISH_FRAME_COUNT
  }
})
