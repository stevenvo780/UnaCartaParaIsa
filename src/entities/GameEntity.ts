import Phaser from "phaser";
import { GAME_BALANCE } from "../constants/gameBalance";
import {
  EntityServicesFactory,
  type IEntityServices,
} from "../interfaces/EntityServices";
import type { ActivityType, Entity, EntityStats, MoodType } from "../types";
import {
  randomBool,
  randomFloat,
  randomInt,
} from "../utils/deterministicRandom";

export class GameEntity extends Phaser.Physics.Arcade.Sprite {
  private entityData: Entity;
  private lastUpdateTime: number;
  private activityStartTime: number;
  private resonance: number;
  private partnerEntity: GameEntity | null = null;
  private currentSprite = "";
  private services: IEntityServices;
  private colorHue: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    entityId: "isa" | "stev",
    services?: IEntityServices,
  ) {
    // Use fallback sprites since main entity sprites are now handled by AnimatedGameEntity
    const initialSprite = entityId === "isa" ? "woman" : "man";
    super(scene, x, y, initialSprite);

    this.services = services || EntityServicesFactory.create();
    this.colorHue = entityId === "isa" ? 300 : 220;

    this.currentSprite = initialSprite;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.entityData = {
      id: entityId,
      position: { x, y },
      state: "idle",
      activity: "WANDERING",
      stats: {
        hunger: this.services.config.entityInitialStats,
        sleepiness: this.services.config.entityInitialStats,
        loneliness: this.services.config.entityInitialStats,
        happiness: this.services.config.entityInitialStats,
        energy: this.services.config.entityInitialStats,
        boredom: this.services.config.entityInitialStats,
        money: this.services.config.entityInitialMoney,
        health: this.services.config.entityInitialHealth,
        stress: this.services.config.entityInitialStats,
        comfort: this.services.config.entityInitialStats,
        creativity: this.services.config.entityInitialStats,
        resonance: this.services.config.initialResonance,
        courage: this.services.config.entityInitialStats,
      },
      lastActivityChange: Date.now(),
      pulsePhase: 0,
      mood: "😊",
      isDead: false,
      resonance: this.services.config.initialResonance,
    };

    this.lastUpdateTime = Date.now();
    this.activityStartTime = Date.now();
    this.resonance = this.services.config.initialResonance;

    this.createVisuals();

    this.setupPhysics();

    this.services.logger.info(`Entity ${entityId} created`, {
      entityId: this.entityData.id,
      position: this.entityData.position,
      activity: this.entityData.activity,
    });
  }

  private createVisuals() {
    this.setScale(GAME_BALANCE.VISUALS.ENTITY_SCALE);
    this.setOrigin(0.5, 0.5);

    this.setDepth(GAME_BALANCE.VISUALS.ENTITY_DEPTH);

    this.updateVisualState();

    this.services.logger.info(`${this.entityData.id} visuals created`, {
      sprite: this.currentSprite,
      scale: GAME_BALANCE.VISUALS.ENTITY_SCALE,
    });
  }

  private setupPhysics() {
    this.setCollideWorldBounds(true);
    this.setBounce(0.2);

    if (this.entityData.id === "isa") {
      this.setCircle(GAME_BALANCE.MOVEMENT.ENTITY_COLLISION_RADIUS);
    } else {
      this.setSize(
        GAME_BALANCE.MOVEMENT.SQUARE_ENTITY_SIZE,
        GAME_BALANCE.MOVEMENT.SQUARE_ENTITY_SIZE,
      );
    }
  }

  public updateEntity(deltaTime: number) {
    const now = Date.now();
    const timeSinceLastUpdate = now - this.lastUpdateTime;

    // Log each 5 seconds to see if updateEntity is working
    if (now % 5000 < 100) {
      this.services.logger.info(
        `updateEntity called for ${this.entityData.id}`,
        {
          deltaTime,
          timeSinceLastUpdate,
          stats: this.entityData.stats,
        },
      );
    }

    this.applyAutopoiesis(timeSinceLastUpdate);

    this.updateResonanceWithPartner(timeSinceLastUpdate);

    this.updateAI(deltaTime);

    this.updateMovement(deltaTime);

    this.updateVisuals();

    this.lastUpdateTime = now;
  }

  private applyAutopoiesis(deltaTimeMs: number) {
    const hour = new Date().getHours();
    const getPhase = (): "dawn" | "day" | "dusk" | "night" => {
      if (hour < 6) return "night";
      if (hour < 12) return "dawn";
      if (hour < 18) return "day";
      if (hour < 22) return "dusk";
      return "night";
    };

    const timeOfDay = {
      isNight: hour < 6 || hour >= 22,
      isDay: hour >= 6 && hour < 22,
      phase: getPhase(),
      hour,
      lightLevel: hour >= 6 && hour < 22 ? 1 : 0.3,
      modifier: 1,
    };

    this.entityData.stats = this.services.activityCalculator.applyHybridDecay(
      this.entityData.stats,
      this.entityData.activity,
      deltaTimeMs,
    );

    this.entityData.stats = this.services.activityCalculator.applySurvivalCosts(
      this.entityData.stats,
      deltaTimeMs,
    );

    this.entityData.stats =
      this.services.activityCalculator.applyActivityEffectsWithTimeModifiers(
        this.entityData.activity,
        this.entityData.stats,
        deltaTimeMs,
        timeOfDay,
      );

    this.updateMood();

    this.checkCriticalStates();
  }

  private updateAI(_deltaTime: number) {
    const timeInCurrentActivity = Date.now() - this.activityStartTime;

    const checkInterval = 3000 + randomInt(0, 2000);
    if (timeInCurrentActivity > checkInterval) {
      const companion = this.partnerEntity
        ? this.partnerEntity.getEntityData()
        : null;

      const suggestedActivity =
        this.services.aiDecisionEngine.makeIntelligentDecision(
          this.entityData,
          companion,
          Date.now(),
        );

      if (suggestedActivity !== this.entityData.activity) {
        this.changeActivity(suggestedActivity);
      }
    }
  }

  private changeActivity(newActivity: ActivityType) {
    const oldActivity = this.entityData.activity;
    this.entityData.activity = newActivity;
    this.entityData.lastActivityChange = Date.now();
    this.activityStartTime = Date.now();

    this.services.logger.info(`${this.entityData.id} changed activity`, {
      from: oldActivity,
      to: newActivity,
      timestamp: Date.now(),
    });
  }

  private updateMovement(_deltaTime: number) {
    // Get current game state and zones from scene registry
    const gameState = this.scene.registry.get("gameState");
    if (gameState?.zones) {
      // Find best zone target based on needs
      const target = this.findBestZoneTarget(gameState.zones);

      if (target) {
        // Navigate towards target zone
        this.navigateToTarget(target);
      } else {
        // Fall back to random movement
        this.randomMovement();
      }
    } else {
      // Fall back to random movement if no zones available
      this.randomMovement();
    }

    // Apply friction to velocity
    if (this.body) {
      this.setVelocity(
        this.body.velocity.x * this.services.config.movement.friction,
        this.body.velocity.y * this.services.config.movement.friction,
      );
    }

    // Update position data
    this.entityData.position.x = this.x;
    this.entityData.position.y = this.y;
  }

  private randomMovement() {
    if (randomBool(GAME_BALANCE.MOVEMENT.DIRECTION_CHANGE_PROBABILITY)) {
      const angle = randomFloat(0, Math.PI * 2);
      const speed = this.services.config.movement.baseSpeed;

      this.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
    }
  }

  private findBestZoneTarget(zones: any[]): { x: number; y: number } | null {
    const { stats } = this.entityData;

    // Determine current highest need
    let highestNeed = 0;
    let targetZone = null;

    for (const zone of zones) {
      let needScore = 0;

      // Calculate need score based on zone type and entity stats
      switch (zone.type) {
        case "food":
          needScore = stats.hunger;
          break;
        case "rest":
          needScore = stats.sleepiness;
          break;
        case "social":
          needScore = stats.loneliness;
          break;
        case "play":
          needScore = stats.boredom;
          break;
        case "work":
          needScore = 100 - stats.money; // Higher need if low money
          break;
        case "energy":
          needScore = 100 - stats.energy; // Higher need if low energy
          break;
        default:
          needScore = (stats.boredom + stats.loneliness) / 2;
          break;
      }

      // Add some randomness to prevent deterministic behavior
      needScore += randomFloat(0, 10);

      if (needScore > highestNeed && needScore > 30) {
        highestNeed = needScore;
        targetZone = zone;
      }
    }

    if (targetZone) {
      // Return center of target zone with some variation
      const centerX = targetZone.bounds.x + targetZone.bounds.width / 2;
      const centerY = targetZone.bounds.y + targetZone.bounds.height / 2;

      // Add variation to avoid clustering
      const variationX = randomFloat(-0.5, 0.5) * targetZone.bounds.width * 0.3;
      const variationY =
        randomFloat(-0.5, 0.5) * targetZone.bounds.height * 0.3;

      return {
        x: centerX + variationX,
        y: centerY + variationY,
      };
    }

    return null;
  }

  private navigateToTarget(target: { x: number; y: number }) {
    const currentX = this.x;
    const currentY = this.y;

    const deltaX = target.x - currentX;
    const deltaY = target.y - currentY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // Only move if we're not too close to target
    if (distance > 20) {
      const speed = this.services.config.movement.baseSpeed;
      const normalizedX = deltaX / distance;
      const normalizedY = deltaY / distance;

      // Add some smoothing to movement
      const currentVelX = this.body ? this.body.velocity.x : 0;
      const currentVelY = this.body ? this.body.velocity.y : 0;

      const targetVelX = normalizedX * speed;
      const targetVelY = normalizedY * speed;

      // Smooth interpolation towards target velocity
      const lerpFactor = 0.1;
      const newVelX = currentVelX + (targetVelX - currentVelX) * lerpFactor;
      const newVelY = currentVelY + (targetVelY - currentVelY) * lerpFactor;

      this.setVelocity(newVelX, newVelY);
    } else {
      // Slow down when near target
      if (this.body) {
        this.setVelocity(
          this.body.velocity.x * 0.8,
          this.body.velocity.y * 0.8,
        );
      }
    }
  }

  private updateVisuals() {
    this.updateVisualState();

    const healthRatio = this.entityData.stats.health / 100;
    const alpha = 0.5 + healthRatio * 0.5;
    this.setAlpha(alpha);

    if (this.entityData.pulsePhase !== undefined) {
      this.entityData.pulsePhase += GAME_BALANCE.VISUALS.PULSE_SPEED;
      const basePulse = GAME_BALANCE.VISUALS.BASE_PULSE_SCALE ?? 1.5;
      const pulse =
        basePulse +
        Math.sin(this.entityData.pulsePhase) *
          (GAME_BALANCE.VISUALS.PULSE_AMPLITUDE ?? 0.1);
      this.setScale(pulse);
    }

    const tint = this.getMoodTint();
    this.setTint(tint);
  }

  private updateVisualState() {
    // Base GameEntity uses simple fallback sprites
    // AnimatedGameEntity will override this method for animation handling
    const avgStat =
      (this.entityData.stats.happiness +
        this.entityData.stats.energy +
        (100 - this.entityData.stats.hunger) +
        (100 - this.entityData.stats.boredom)) /
      4;

    // For base GameEntity, just use simple fallback sprites
    const newSprite = this.entityData.id === "isa" ? "woman" : "man";

    if (newSprite !== this.currentSprite) {
      this.currentSprite = newSprite;
      if (this.scene.textures.exists(newSprite)) {
        this.setTexture(newSprite);
      }
      this.services.logger.info(`${this.entityData.id} sprite updated`, {
        sprite: newSprite,
        avgStat: avgStat.toFixed(1),
        health: this.entityData.stats.health,
      });
    }
  }

  private getMoodTint(): number {
    const avgStat =
      (this.entityData.stats.happiness +
        this.entityData.stats.energy +
        (100 - this.entityData.stats.hunger) +
        (100 - this.entityData.stats.boredom)) /
      4;

    if (avgStat > 70) return 0xffffff;
    if (avgStat > 40) return 0xffaa77;
    return 0xff7777;
  }

  private updateMood() {
    const { stats } = this.entityData;

    if (stats.happiness > 70) this.entityData.mood = "😊";
    else if (stats.energy < 30) this.entityData.mood = "😴";
    else if (stats.loneliness > 70) this.entityData.mood = "😔";
    else if (stats.boredom > 70) this.entityData.mood = "😑";
    else if (stats.hunger > 80) this.entityData.mood = "😰";
    else this.entityData.mood = "😌";
  }

  private checkCriticalStates() {
    const { stats } = this.entityData;

    if (stats.health <= 0 && !this.entityData.isDead) {
      this.entityData.isDead = true;
      this.entityData.timeOfDeath = Date.now();
      this.entityData.state = "dead";
      this.services.logger.warn(`${this.entityData.id} has died!`, { stats });
    }

    const CRITICAL_HUNGER = 90;
    const CRITICAL_ENERGY = 10;

    if (stats.hunger > CRITICAL_HUNGER) {
      this.services.logger.warn(`${this.entityData.id} is starving!`, {
        hunger: stats.hunger,
        threshold: CRITICAL_HUNGER,
      });
    }

    if (stats.energy < CRITICAL_ENERGY) {
      this.services.logger.warn(`${this.entityData.id} is exhausted!`, {
        energy: stats.energy,
        threshold: CRITICAL_ENERGY,
      });
    }
  }

  public getEntityData(): Entity {
    return { ...this.entityData };
  }

  public getStats(): EntityStats {
    return { ...this.entityData.stats };
  }

  public updateStats(newStats: Partial<EntityStats>): void {
    this.entityData.stats = { ...this.entityData.stats, ...newStats };
  }

  public setStats(newStats: EntityStats): void {
    this.entityData.stats = { ...newStats };
  }

  public getCurrentActivity(): ActivityType {
    return this.entityData.activity;
  }

  public getMood(): MoodType {
    return this.entityData.mood;
  }

  public getResonance(): number {
    return this.resonance;
  }

  public getPosition(): { x: number; y: number } {
    return { x: this.x, y: this.y };
  }

  public setPartnerEntity(partner: GameEntity): void {
    this.partnerEntity = partner;
  }

  public updateResonanceWithPartner(deltaTime: number): void {
    if (!this.partnerEntity) return;

    const myPosition = this.getPosition();
    const partnerPosition = this.partnerEntity.getPosition();
    const myStats = this.getStats();
    const partnerStats = this.partnerEntity.getStats();

    const result =
      this.services.resonanceCalculator.calculateProximityResonanceChange(
        myPosition,
        partnerPosition,
        myStats,
        partnerStats,
        this.resonance,
        deltaTime,
      );

    this.resonance = Math.max(
      0,
      Math.min(100, this.resonance + result.resonanceChange),
    );

    // Sync resonance with entity data stats
    this.entityData.stats.resonance = this.resonance;
    this.entityData.resonance = this.resonance;

    const modifiers =
      this.services.resonanceCalculator.calculateResonanceModifiers(
        this.resonance,
        result.closeness,
      );

    this.entityData.stats.happiness = Math.min(
      100,
      this.entityData.stats.happiness * modifiers.happinessMultiplier,
    );

    this.entityData.stats.energy = Math.min(
      100,
      this.entityData.stats.energy * modifiers.energyMultiplier,
    );

    this.entityData.stats.health = Math.min(
      100,
      this.entityData.stats.health * modifiers.healthMultiplier,
    );

    this.entityData.stats.loneliness = Math.max(
      0,
      this.entityData.stats.loneliness * modifiers.lonelinessPenalty,
    );

    if (Math.abs(result.resonanceChange) > 0.5) {
      this.services.logger.info(`${this.entityData.id} resonance updated`, {
        effect: result.effect,
        resonanceChange: result.resonanceChange.toFixed(2),
        newResonance: this.resonance.toFixed(2),
        closeness: result.closeness.toFixed(2),
      });
    }
  }

  public isDead(): boolean {
    return this.entityData.isDead;
  }

  public getEntity(): Entity {
    return this.entityData;
  }

  public override destroy(): void {
    super.destroy();
  }
}
