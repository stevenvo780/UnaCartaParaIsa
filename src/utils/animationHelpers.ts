import type Phaser from "phaser";

export const AnimationHelpers = {
  createInfiniteAnimation(
    scene: Phaser.Scene,
    config: Phaser.Types.Tweens.TweenBuilderConfig,
  ): Phaser.Tweens.Tween {
    const tween = scene.tweens.add({
      repeat: -1,
      yoyo: false,
      ...config,
    });
    return tween;
  },
};

export default AnimationHelpers;
