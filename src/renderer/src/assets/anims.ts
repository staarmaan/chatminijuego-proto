import Phaser from 'phaser'
import bg from './images/bg.png'
import hud from './images/hud.png'
import smallFishSheet from './images/fishes/smallFishes.png'
import medFishSheet from './images/fishes/medFishes.png'
import bubbleParticleSheet from './images/bubbleParticle.png'
import fishFoodSheet from './images/fishFood.png'
import genericSmokeSheet from './images/fx/genericSmoke.png'

export const preloadAnims = (scene: Phaser.Scene): void => {
  scene.load.image('bg', bg)
  scene.load.image('hud', hud)
  scene.load.spritesheet('smallFish', smallFishSheet, { frameWidth: 16, frameHeight: 16 })
  scene.load.spritesheet('medFish', medFishSheet, { frameWidth: 32, frameHeight: 32 })
  scene.load.spritesheet('bubbleParticle', bubbleParticleSheet, { frameWidth: 7, frameHeight: 7 })
  scene.load.spritesheet('fishFood', fishFoodSheet, { frameWidth: 5, frameHeight: 5 })
  scene.load.spritesheet('genericSmoke', genericSmokeSheet, { frameWidth: 16, frameHeight: 16 })
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

  for (let i = 0; i < 6; i++) {
    scene.anims.create({
      key: `medFish${i}`,
      frames: scene.anims.generateFrameNumbers('medFish', {
        start: i*3,
        end: i*3 + 2,
      }),
      frameRate: 7,
      repeat: -1
    })
  }

  scene.anims.create({
    key: `bubbleParticleDef`,
    frames: scene.anims.generateFrameNumbers('bubbleParticle', {
      start: 0,
      end: 5,
    }),
    frameRate: 5,
    repeat: 0
  })

  for (let i = 0; i < 4; i++) {
    scene.anims.create({
      key: `fishFood${i}`,
      frames: scene.anims.generateFrameNumbers('fishFood', {
        start: i*7,
        end: i*7 + 6,
      }),
      frameRate: 12,
      repeat: -1
    })
  }

  scene.anims.create({
    key: `genericSmokeDef`,
    frames: scene.anims.generateFrameNumbers('genericSmoke', {
      start: 0,
      end: 4,
    }),
    frameRate: 10,
    repeat: 0
  })
}
