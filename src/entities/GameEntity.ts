import Phaser from 'phaser';
import type { Entity, EntityStats, ActivityType, MoodType } from '../types';
import { GAME_BALANCE } from '../constants/gameBalance';
import type { 
  IEntityServices, 
  IResonancePartner 
} from '../interfaces/EntityServices';
import { EntityServicesFactory } from '../interfaces/EntityServices';

export class GameEntity extends Phaser.Physics.Arcade.Sprite {
  private entityData: Entity;
  private lastUpdateTime: number;
  private activityStartTime: number;
  private resonance: number;
  private partnerEntity: GameEntity | null = null;
  private currentSprite: string = '';
  private services: IEntityServices;

  constructor(
    scene: Phaser.Scene, 
    x: number, 
    y: number, 
    entityId: 'isa' | 'stev',
    services?: IEntityServices
  ) {
    // Initialize services (use provided or create default)
    this.services = services || EntityServicesFactory.create();

    // Initialize with a default sprite based on entity type
    const initialSprite = entityId === 'isa' ? 'isa-happy' : 'stev-happy';
    super(scene, x, y, initialSprite);
    
    this.currentSprite = initialSprite;
    
    // Add to scene
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Initialize entity data using injected config
    this.entityData = {
      id: entityId,
      position: { x, y },
      state: 'idle',
      activity: 'WANDERING',
      stats: {
        hunger: this.services.config.entityInitialStats,
        sleepiness: this.services.config.entityInitialStats,
        loneliness: this.services.config.entityInitialStats,
        happiness: this.services.config.entityInitialStats,
        energy: this.services.config.entityInitialStats,
        boredom: this.services.config.entityInitialStats,
        money: this.services.config.entityInitialMoney,
        health: this.services.config.entityInitialHealth
      },
      lastStateChange: Date.now(),
      lastActivityChange: Date.now(),
      lastInteraction: Date.now(),
      pulsePhase: 0,
      colorHue: entityId === 'isa' ? 300 : 220, // Pink for Isa, Blue for Stev
      mood: '😊',
      thoughts: [],
      isDead: false,
      controlMode: 'autonomous'
    };

    this.lastUpdateTime = Date.now();
    this.activityStartTime = Date.now();
    this.resonance = this.services.config.initialResonance;

    // Create visual representation
    this.createVisuals();

    // Setup physics
    this.setupPhysics();

    this.services.logger.info(`Entity ${entityId} created`, this.entityData);
  }

  private createVisuals() {
    // Set initial sprite scale and properties using constants
    this.setScale(GAME_BALANCE.VISUALS.ENTITY_SCALE);
    this.setOrigin(0.5, 0.5);
    
    // Set depth for proper layering
    this.setDepth(GAME_BALANCE.VISUALS.ENTITY_DEPTH);
    
    // Update sprite based on initial mood
    this.updateVisualState();
    
    this.services.logger.info(`${this.entityData.id} visuals created`, {
      sprite: this.currentSprite,
      scale: GAME_BALANCE.VISUALS.ENTITY_SCALE
    });
  }

  private setupPhysics() {
    this.setCollideWorldBounds(true);
    this.setBounce(0.2);
    
    if (this.entityData.id === 'isa') {
      this.setCircle(GAME_BALANCE.MOVEMENT.ENTITY_COLLISION_RADIUS);
    } else {
      this.setSize(
        GAME_BALANCE.MOVEMENT.SQUARE_ENTITY_SIZE, 
        GAME_BALANCE.MOVEMENT.SQUARE_ENTITY_SIZE
      );
    }
  }

  public updateEntity(deltaTime: number) {
    const now = Date.now();
    const timeSinceLastUpdate = now - this.lastUpdateTime;
    
    // Apply autopoiesis systems
    this.applyAutopoiesis(timeSinceLastUpdate);
    
    // Update resonance with partner if available
    this.updateResonanceWithPartner(timeSinceLastUpdate);
    
    // Update AI decision making
    this.updateAI(deltaTime);
    
    // Update movement
    this.updateMovement(deltaTime);
    
    // Update visuals
    this.updateVisuals();
    
    this.lastUpdateTime = now;
  }

  private applyAutopoiesis(deltaTimeMs: number) {
    // Get current time of day (simplified for now)
    const hour = new Date().getHours();
    const getPhase = (): 'dawn' | 'day' | 'dusk' | 'night' => {
      if (hour < 6) return 'night';
      if (hour < 12) return 'dawn';
      if (hour < 18) return 'day';
      if (hour < 22) return 'dusk';
      return 'night';
    };
    
    const timeOfDay = {
      isNight: hour < 6 || hour >= 22,
      phase: getPhase(),
      hour
    };

    // Apply hybrid decay using service
    this.entityData.stats = this.services.activityCalculator.applyHybridDecay(
      this.entityData.stats,
      this.entityData.activity,
      deltaTimeMs
    );

    // Apply survival costs using service
    this.entityData.stats = this.services.activityCalculator.applySurvivalCosts(
      this.entityData.stats, 
      deltaTimeMs
    );

    // Apply activity effects with time modifiers using service
    this.entityData.stats = this.services.activityCalculator.applyActivityEffectsWithTimeModifiers(
      this.entityData.activity,
      this.entityData.stats,
      deltaTimeMs,
      timeOfDay
    );

    // Update mood based on stats
    this.updateMood();

    // Check for critical states
    this.checkCriticalStates();
  }

  private updateAI(_deltaTime: number) {
    // Intelligent AI decision making using personality, mood, and softmax
    const timeInCurrentActivity = Date.now() - this.activityStartTime;
    
    // Check if we should consider changing activity (every 3-5 seconds)
    const checkInterval = 3000 + Math.random() * 2000;
    if (timeInCurrentActivity > checkInterval) {
      
      // Get companion entity for social decisions
      const companion = this.partnerEntity ? this.partnerEntity.getEntityData() : null;
      
      // Use intelligent decision engine service
      const suggestedActivity = this.services.aiDecisionEngine.makeIntelligentDecision(
        this.entityData,
        companion,
        Date.now()
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
      timestamp: Date.now()
    });
  }

  private updateMovement(_deltaTime: number) {
    // Simple wandering movement using constants
    if (Math.random() < GAME_BALANCE.MOVEMENT.DIRECTION_CHANGE_PROBABILITY) {
      const angle = Math.random() * Math.PI * 2;
      const speed = this.services.config.movement.baseSpeed;
      
      this.setVelocity(
        Math.cos(angle) * speed,
        Math.sin(angle) * speed
      );
    }

    // Apply friction
    if (this.body) {
      this.setVelocity(
        this.body.velocity.x * this.services.config.movement.friction,
        this.body.velocity.y * this.services.config.movement.friction
      );
    }

    // Update position in entity data
    this.entityData.position.x = this.x;
    this.entityData.position.y = this.y;
  }

  private updateVisuals() {
    // Update sprite based on current state
    this.updateVisualState();
    
    // Update transparency based on health
    const healthRatio = this.entityData.stats.health / 100;
    const alpha = 0.5 + (healthRatio * 0.5); // Fade when low health
    this.setAlpha(alpha);

    // Pulse effect based on activity using constants
    this.entityData.pulsePhase += GAME_BALANCE.VISUALS.PULSE_SPEED;
    const basePulse = GAME_BALANCE.VISUALS.BASE_PULSE_SCALE;
    const pulse = basePulse + Math.sin(this.entityData.pulsePhase) * GAME_BALANCE.VISUALS.PULSE_AMPLITUDE;
    this.setScale(pulse);

    // Tint based on mood for additional visual feedback
    const tint = this.getMoodTint();
    this.setTint(tint);
  }

  private updateVisualState() {
    // Determine which sprite to use based on entity state
    let newSprite: string;
    const avgStat = (
      this.entityData.stats.happiness + 
      this.entityData.stats.energy + 
      (100 - this.entityData.stats.hunger) +
      (100 - this.entityData.stats.boredom)
    ) / 4;

    const prefix = this.entityData.id === 'isa' ? 'isa' : 'stev';
    
    if (avgStat < GAME_BALANCE.EFFECTS.DYING_THRESHOLD || 
        this.entityData.stats.health < GAME_BALANCE.EFFECTS.LOW_HEALTH_THRESHOLD) {
      newSprite = `${prefix}-dying`;
    } else if (avgStat < GAME_BALANCE.EFFECTS.SAD_THRESHOLD) {
      newSprite = `${prefix}-sad`;
    } else {
      newSprite = `${prefix}-happy`;
    }

    // Only change sprite if it's different to avoid unnecessary updates
    if (newSprite !== this.currentSprite) {
      this.currentSprite = newSprite;
      this.setTexture(newSprite);
      this.services.logger.info(`${this.entityData.id} sprite changed`, {
        from: this.currentSprite,
        to: newSprite,
        avgStat: avgStat.toFixed(1),
        health: this.entityData.stats.health
      });
    }
  }

  private getMoodTint(): number {
    // Tint based on overall wellbeing
    const avgStat = (
      this.entityData.stats.happiness + 
      this.entityData.stats.energy + 
      (100 - this.entityData.stats.hunger) +
      (100 - this.entityData.stats.boredom)
    ) / 4;

    if (avgStat > 70) return 0xffffff; // White (normal)
    if (avgStat > 40) return 0xffaa77; // Slight orange tint
    return 0xff7777; // Red tint (stressed)
  }

  private updateMood() {
    const stats = this.entityData.stats;
    
    if (stats.happiness > 70) this.entityData.mood = '😊';
    else if (stats.energy < 30) this.entityData.mood = '😴';
    else if (stats.loneliness > 70) this.entityData.mood = '😔';
    else if (stats.boredom > 70) this.entityData.mood = '😑';
    else if (stats.hunger > 80) this.entityData.mood = '😰';
    else this.entityData.mood = '😌';
  }

  private checkCriticalStates() {
    const stats = this.entityData.stats;
    
    // Check for death
    if (stats.health <= 0 && !this.entityData.isDead) {
      this.entityData.isDead = true;
      this.entityData.timeOfDeath = Date.now();
      this.entityData.state = 'dead';
      this.services.logger.warn(`${this.entityData.id} has died!`, { stats });
    }
    
    // Check for critical states using constants would be ideal
    const CRITICAL_HUNGER = 90;
    const CRITICAL_ENERGY = 10;
    
    if (stats.hunger > CRITICAL_HUNGER) {
      this.services.logger.warn(`${this.entityData.id} is starving!`, { 
        hunger: stats.hunger,
        threshold: CRITICAL_HUNGER
      });
    }
    
    if (stats.energy < CRITICAL_ENERGY) {
      this.services.logger.warn(`${this.entityData.id} is exhausted!`, { 
        energy: stats.energy,
        threshold: CRITICAL_ENERGY
      });
    }
  }

  // Public getters
  public getEntityData(): Entity {
    return { ...this.entityData };
  }

  public getStats(): EntityStats {
    return { ...this.entityData.stats };
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

  // Resonance system methods
  public setPartnerEntity(partner: GameEntity): void {
    this.partnerEntity = partner;
  }

  public updateResonanceWithPartner(deltaTime: number): void {
    if (!this.partnerEntity) return;

    const myPosition = this.getPosition();
    const partnerPosition = this.partnerEntity.getPosition();
    const myStats = this.getStats();
    const partnerStats = this.partnerEntity.getStats();

    const result = this.services.resonanceCalculator.calculateProximityResonanceChange(
      myPosition,
      partnerPosition,
      myStats,
      partnerStats,
      this.resonance,
      deltaTime
    );

    // Update resonance
    this.resonance = Math.max(0, Math.min(100, this.resonance + result.resonanceChange));

    // Apply resonance modifiers to stats
    const modifiers = this.services.resonanceCalculator.calculateResonanceModifiers(this.resonance, result.closeness);
    
    // Apply happiness boost
    this.entityData.stats.happiness = Math.min(100, 
      this.entityData.stats.happiness * modifiers.happinessMultiplier
    );
    
    // Apply energy boost
    this.entityData.stats.energy = Math.min(100, 
      this.entityData.stats.energy * modifiers.energyMultiplier
    );
    
    // Apply health boost
    this.entityData.stats.health = Math.min(100, 
      this.entityData.stats.health * modifiers.healthMultiplier
    );
    
    // Reduce loneliness
    this.entityData.stats.loneliness = Math.max(0, 
      this.entityData.stats.loneliness * modifiers.lonelinessPenalty
    );

    // Log significant resonance changes
    if (Math.abs(result.resonanceChange) > 0.5) {
      this.services.logger.info(`${this.entityData.id} resonance updated`, {
        effect: result.effect,
        resonanceChange: result.resonanceChange.toFixed(2),
        newResonance: this.resonance.toFixed(2),
        closeness: result.closeness.toFixed(2)
      });
    }
  }

  public isDead(): boolean {
    return this.entityData.isDead;
  }

  public destroy() {
    // Clean up sprite resources
    super.destroy();
  }
}
