import Phaser from 'phaser';
import type { Entity, EntityStats, ActivityType, MoodType } from '../types';
import { gameConfig } from '../config/gameConfig';
import { 
  applyHybridDecay, 
  applySurvivalCosts, 
  applyActivityEffectsWithTimeModifiers
} from '../utils/activityDynamics';
import { 
  calculateProximityResonanceChange,
  calculateResonanceModifiers
} from '../utils/resonanceCalculations';
import { makeIntelligentDecision } from '../utils/aiDecisionEngine';
import { logAutopoiesis } from '../utils/logger';

export class GameEntity extends Phaser.Physics.Arcade.Sprite {
  private entityData: Entity;
  private lastUpdateTime: number;
  private activityStartTime: number;
  private resonance: number;
  private partnerEntity: GameEntity | null = null;
  private currentSprite: string = '';

  constructor(scene: Phaser.Scene, x: number, y: number, entityId: 'isa' | 'stev') {
    // Initialize with a default sprite based on entity type
    const initialSprite = entityId === 'isa' ? 'isa-happy' : 'stev-happy';
    super(scene, x, y, initialSprite);
    
    this.currentSprite = initialSprite;
    
    // Add to scene
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Initialize entity data
    this.entityData = {
      id: entityId,
      position: { x, y },
      state: 'idle',
      activity: 'WANDERING',
      stats: {
        hunger: gameConfig.entityInitialStats,
        sleepiness: gameConfig.entityInitialStats,
        loneliness: gameConfig.entityInitialStats,
        happiness: gameConfig.entityInitialStats,
        energy: gameConfig.entityInitialStats,
        boredom: gameConfig.entityInitialStats,
        money: gameConfig.entityInitialMoney,
        health: gameConfig.entityInitialHealth
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
    this.resonance = gameConfig.initialResonance;

    // Create visual representation
    this.createVisuals();

    // Setup physics
    this.setupPhysics();

    logAutopoiesis.info(`Entity ${entityId} created`, this.entityData);
  }

  private createVisuals() {
    // Set initial sprite scale and properties
    this.setScale(1.5); // Make entities a bit larger
    this.setOrigin(0.5, 0.5); // Center the sprite
    
    // Set depth for proper layering
    this.setDepth(10);
    
    // Update sprite based on initial mood
    this.updateVisualState();
    
    logAutopoiesis.info(`${this.entityData.id} visuals created with sprite: ${this.currentSprite}`);
  }

  private setupPhysics() {
    this.setCollideWorldBounds(true);
    this.setBounce(0.2);
    
    if (this.entityData.id === 'isa') {
      this.setCircle(15);
    } else {
      this.setSize(30, 30);
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

    // Apply hybrid decay
    this.entityData.stats = applyHybridDecay(
      this.entityData.stats,
      this.entityData.activity,
      deltaTimeMs
    );

    // Apply survival costs
    this.entityData.stats = applySurvivalCosts(this.entityData.stats, deltaTimeMs);

    // Apply activity effects with time modifiers
    this.entityData.stats = applyActivityEffectsWithTimeModifiers(
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
      
      // Use intelligent decision engine
      const suggestedActivity = makeIntelligentDecision(
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

    logAutopoiesis.info(`${this.entityData.id} changed activity: ${oldActivity} → ${newActivity}`);
  }

  private updateMovement(_deltaTime: number) {
    // Simple wandering movement
    if (Math.random() < 0.02) { // 2% chance per frame to change direction
      const angle = Math.random() * Math.PI * 2;
      const speed = gameConfig.movement.baseSpeed;
      
      this.setVelocity(
        Math.cos(angle) * speed,
        Math.sin(angle) * speed
      );
    }

    // Apply friction
    if (this.body) {
      this.setVelocity(
        this.body.velocity.x * gameConfig.movement.friction,
        this.body.velocity.y * gameConfig.movement.friction
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

    // Pulse effect based on activity
    this.entityData.pulsePhase += 0.1;
    const basePulse = 1.5; // Base scale
    const pulse = basePulse + Math.sin(this.entityData.pulsePhase) * 0.1;
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
    
    if (avgStat < 20 || this.entityData.stats.health < 15) {
      newSprite = `${prefix}-dying`;
    } else if (avgStat < 50) {
      newSprite = `${prefix}-sad`;
    } else {
      newSprite = `${prefix}-happy`;
    }

    // Only change sprite if it's different to avoid unnecessary updates
    if (newSprite !== this.currentSprite) {
      this.currentSprite = newSprite;
      this.setTexture(newSprite);
      logAutopoiesis.info(`${this.entityData.id} sprite changed to: ${newSprite}`);
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
      logAutopoiesis.warn(`${this.entityData.id} has died!`, stats);
    }
    
    // Check for critical states
    if (stats.hunger > 90) {
      logAutopoiesis.warn(`${this.entityData.id} is starving!`, { hunger: stats.hunger });
    }
    
    if (stats.energy < 10) {
      logAutopoiesis.warn(`${this.entityData.id} is exhausted!`, { energy: stats.energy });
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

    const result = calculateProximityResonanceChange(
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
    const modifiers = calculateResonanceModifiers(this.resonance, result.closeness);
    
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
      logAutopoiesis.info(`${this.entityData.id} resonance ${result.effect}`, {
        resonanceChange: result.resonanceChange,
        newResonance: this.resonance,
        closeness: result.closeness,
        effect: result.effect
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
