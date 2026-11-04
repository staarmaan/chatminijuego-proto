import Phaser from 'phaser'
import fishShet from './images/fishes/smallFishes.png'
import bg from './images/bg.png'
import hud from './images/hud.png'

export const preloadAnims = (scene: Phaser.Scene): void => {
  scene.load.image('bg', bg)
  scene.load.image('hud', hud)
  scene.load.spritesheet('smallFish', fishShet, {
    frameWidth: 16,
    frameHeight: 16
  })
}

export const createAnims = (scene: Phaser.Scene): void => {
  for (let i = 0; i < 6; i++) {
    scene.anims.create({
      key: `smallFish${i}`,
      frames: scene.anims.generateFrameNumbers('smallFish', {
        start: i*3,
        end: i*3 + 2,
      }),
      frameRate: 10,
      repeat: -1
    })
  }
}
