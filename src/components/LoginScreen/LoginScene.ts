import Phaser from 'phaser';

export default class LoginScene extends Phaser.Scene {
  private doorContainer!: Phaser.GameObjects.Container;
  private neonBase!: Phaser.GameObjects.Text;
  private neonGlows: Phaser.GameObjects.Text[] = [];
  private lightFlare!: Phaser.GameObjects.Image;
  private fogParticles!: Phaser.GameObjects.Particles.ParticleEmitter;

  constructor() {
    super('LoginScene');
  }

  preload() {
    // Generate Raindrop texture
    const gRain = this.make.graphics({ x: 0, y: 0 });
    gRain.fillStyle(0xffffff, 0.6);
    gRain.fillRect(0, 0, 2, 25);
    gRain.generateTexture('raindrop', 2, 25);

    // Generate Solid Black Door texture
    const gMetal = this.make.graphics({ x: 0, y: 0 });
    gMetal.fillStyle(0x020202, 1);
    gMetal.fillRect(0, 0, 10, 10);
    gMetal.generateTexture('metal_stripe', 10, 10);

    // Generate Light Curtain Texture (Vertical rays for Curtain Effect)
    const gCurtain = this.make.graphics({ x: 0, y: 0 });
    for (let i = 0; i < 200; i++) {
        const alpha = 0.1 + Math.random() * 0.9;
        gCurtain.fillStyle(0xffffff, alpha);
        gCurtain.fillRect(i * 5, 0, 5, 100);
    }
    gCurtain.generateTexture('light_curtain', 1000, 100);
  }

  create() {
    const { width, height } = this.scale;
    const cx = width / 2;
    const cy = height / 2;

    // --- 1. DOOR ---
    this.doorContainer = this.add.container(0, 0);
    const doorSprite = this.add.tileSprite(cx, cy, width + 100, height + 100, 'metal_stripe');
    this.doorContainer.add(doorSprite);

    // Soft Purple Glow reflection on door (just around the text)
    const doorGlow = this.add.ellipse(cx, height * 0.2, 500, 150, 0xa855f7, 0.4);
    doorGlow.setBlendMode(Phaser.BlendModes.ADD);
    this.doorContainer.add(doorGlow);

    // --- 2. RAIN ---
    this.fogParticles = this.add.particles(0, 0, 'raindrop', {
      x: { min: -200, max: width + 200 },
      y: { min: -100, max: -50 },
      lifespan: 1200,
      speedY: { min: 600, max: 900 },
      speedX: { min: -150, max: -50 },
      alpha: { start: 0.3, end: 0 },
      scale: { start: 1, end: 1.5 },
      quantity: 5,
      blendMode: Phaser.BlendModes.SCREEN,
      rotate: 15
    });

    // --- 3. NEON SIGN ---
    const textStr = "SB-GARAGE";
    const fontStyle = { fontFamily: '"VT323", monospace', fontSize: '110px', color: '#ffffff' };

    const glowOffsets = [
      { x: -3, y: 0, c: 0x00e5ff, a: 0.8 },
      { x: 3, y: 0, c: 0x00e5ff, a: 0.8 },
      { x: 0, y: -3, c: 0x00e5ff, a: 0.8 },
      { x: 0, y: 3, c: 0x00e5ff, a: 0.8 },
      { x: -8, y: 0, c: 0xa855f7, a: 0.4 },
      { x: 8, y: 0, c: 0xa855f7, a: 0.4 },
      { x: 0, y: -8, c: 0xa855f7, a: 0.4 },
      { x: 0, y: 8, c: 0xa855f7, a: 0.4 },
    ];

    glowOffsets.forEach(off => {
      const glow = this.add.text(cx + off.x, height * 0.2 + off.y, textStr, fontStyle).setOrigin(0.5);
      glow.setTint(off.c);
      glow.setBlendMode(Phaser.BlendModes.ADD);
      glow.setAlpha(off.a);
      this.neonGlows.push(glow);
    });

    this.neonBase = this.add.text(cx, height * 0.2, textStr, fontStyle).setOrigin(0.5);

    // Flicker animation for Base neon to make it alive
    this.tweens.add({
        targets: this.neonBase,
        alpha: { min: 0.85, max: 1 },
        duration: 80,
        yoyo: true,
        repeat: -1
    });

    // --- 4. LIGHT FLARE (Curtin Effect Rays) ---
    this.lightFlare = this.add.image(cx, height, 'light_curtain') as any;
    this.lightFlare.setDisplaySize(width, 20);
    this.lightFlare.setOrigin(0.5, 1);
    this.lightFlare.setBlendMode(Phaser.BlendModes.SCREEN);
    this.lightFlare.setTint(0xffffff);
    this.lightFlare.setAlpha(0);

    // --- 5. EVENTS ---
    this.events.on('door-light-on', () => {
      this.tweens.add({
        targets: this.lightFlare,
        height: 150,
        alpha: 0.6,
        duration: 1000,
        ease: 'Power2'
      });
    });

    this.events.on('door-error', () => {
      // Shake door
      this.tweens.add({
        targets: this.doorContainer,
        y: { from: -10, to: 10 },
        duration: 50,
        yoyo: true,
        repeat: 5,
        onComplete: () => { this.doorContainer.setY(0); }
      });
      
      // Flicker neon red
      const originalColors = this.neonGlows.map(g => g.tintTopLeft);
      this.neonGlows.forEach(g => g.setTint(0xff0000));
      this.neonBase.setTint(0xff0000);

      this.time.delayedCall(400, () => {
        this.neonGlows.forEach((g, i) => g.setTint(originalColors[i]));
        this.neonBase.clearTint();
      });
    });

    this.events.on('door-open', () => {
      // Fast Roll up (1.2s -> 0.8s for impact)
      this.tweens.add({
        targets: this.doorContainer,
        y: -height - 200,
        duration: 900,
        ease: 'Cubic.easeIn'
      });

      // Curtain Light Effect - Tia sáng kéo lên như bức rèm lốm đốm tia sáng
      this.tweens.add({
        targets: this.lightFlare,
        displayHeight: height * 1.5,
        alpha: 1,
        duration: 900,
        ease: 'Quad.easeIn',
        onUpdate: (tween) => {
          if (tween.progress > 0.3) {
             const fadeOut = 1 - ((tween.progress - 0.3) / 0.7);
             this.neonBase.setAlpha(fadeOut);
             this.neonGlows.forEach(g => g.setAlpha(fadeOut));
             this.fogParticles.setAlpha(fadeOut);
          }
        }
      });
      
      // Thêm lốe sáng chung toàn màn hình trắng tinh khi vút lên hết cỡ
      const flashBg = this.add.rectangle(cx, cy, width, height, 0xffffff, 0);
      flashBg.setBlendMode(Phaser.BlendModes.SCREEN);
      this.tweens.add({
          targets: flashBg,
          alpha: { from: 0, to: 1 },
          duration: 600,
          ease: 'Expo.easeIn',
          delay: 300
      });
    });

    this.scale.on('resize', this.resize, this);
  }

  resize(gameSize: Phaser.Structs.Size) {
    if (this.cameras.main) {
       this.cameras.main.setSize(gameSize.width, gameSize.height);
    }
  }
}
