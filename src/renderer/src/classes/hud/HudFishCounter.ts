import Phaser from 'phaser'
import { MainScene } from '../../main'

const POP_HEIGHT = 4
const POP_DUR_MS = 100

export class HudFishCounter extends Phaser.GameObjects.Container {
  private digitCount = 4
  private value = 0;
  private digits: Phaser.GameObjects.Sprite[] = []

  constructor(scene: MainScene, x: number, y: number) {
    super(scene, x, y);

    this.setDepth(101)

    const frameWidth = 10
    const texture = 'bigNumbers'
    for (let i = 0; i < this.digitCount; i++) {
      const sprite = scene.add.sprite(i * frameWidth, 0, texture, 0);
      this.digits.push(sprite);
      this.add(sprite);
    }

    scene.add.existing(this);
    this.setValue(0, false); // initial value, no pop
  }

  format(value: number):string {
    const str = String(value).padStart(this.digitCount, '0');
    return str.length > this.digitCount ? '9'.repeat(this.digitCount) : str;
  }

  setValue(value: number, pop = true): HudFishCounter {
    const oldStr = this.format(this.value);
    this.value = Math.max(0, Math.floor(value));
    const newStr = this.format(this.value);

    // leftmost digit that changed (-1 if none)
    const firstChanged = [...newStr].findIndex((d, i) => d !== oldStr[i]);

    for (let i = 0; i < this.digitCount; i++) {
      this.digits[i].setFrame(Number(newStr[i]));
    }

    if (pop && firstChanged !== -1) {
      for (let i = firstChanged; i < this.digitCount; i++) {
        this.popDigit(this.digits[i]);
      }
    }
    return this;
  }

  popDigit(sprite: Phaser.GameObjects.Sprite): void {
    // cancel any pop in progress so rapid changes don't drift the y position
    this.scene.tweens.killTweensOf(sprite);

    sprite.y = -POP_HEIGHT;           // jump up instantly
    this.scene.tweens.add({
      targets: sprite,
      y: 0,                               // settle back to the original y
      duration: POP_DUR_MS,
      ease: 'Quad.easeOut'
    });
  }

  increment(amount = 1): HudFishCounter {
    return this.setValue(this.value + amount);
  }
}
