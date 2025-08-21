import { logAutopoiesis } from "../utils/logger";

// Imports para tipos básicos
import type {
  DayNightUI,
  DialogueSystem,
  EntityManager,
  FoodSystem,
  GameEntity,
  GameLogicManager,
  InputManager,
  QuestController,
  QuestSystem,
  QuestUI,
  UnifiedAssetManager,
  WorldRenderer,
} from "../types";

export default class MainScene extends Phaser.Scene {
  // Propiedades básicas de escena
  public unifiedAssetManager!: UnifiedAssetManager;
  public entities!: Phaser.GameObjects.Group;

  // Entidades principales
  public isaEntity!: GameEntity;
  public stevEntity!: GameEntity;

  // Sistemas principales (temporalmente opcionales)
  public gameLogicManager?: GameLogicManager;
  public worldRenderer?: WorldRenderer;
  public entityManager?: EntityManager;
  public inputManager?: InputManager;
  public foodSystem?: FoodSystem;
  public dialogueSystem?: DialogueSystem;
  public questSystem?: QuestSystem;
  public questController?: QuestController;
  public questUI?: QuestUI;
  public dayNightUI?: DayNightUI;

  constructor() {
    super({ key: "MainScene" });
    logAutopoiesis.info("🎮 MainScene initialized");
  }

  async init() {
    logAutopoiesis.info("🔧 MainScene initializing...");

    // Configuración muy básica
    this.scale.on("resize", this.resize, this);
    this.input.keyboard?.createCursorKeys();

    logAutopoiesis.info("✅ MainScene init complete");
  }

  async create() {
    logAutopoiesis.info("🌍 Creating basic game world...");

    // Verificar asset manager
    this.unifiedAssetManager = this.registry.get("unifiedAssetManager");
    if (!this.unifiedAssetManager) {
      logAutopoiesis.error("❌ UnifiedAssetManager no encontrado");
      return;
    }

    // Solo crear un grupo básico de entidades
    this.entities = this.add.group();

    // Agregar un texto de debug para verificar que la escena funciona
    this.add
      .text(
        400,
        300,
        "🎮 MainScene Activa\n(Sistemas deshabilitados para debug)",
        {
          fontSize: "24px",
          color: "#ffffff",
          align: "center",
        },
      )
      .setOrigin(0.5);

    logAutopoiesis.info("✅ MainScene básico creado exitosamente");
  }

  update(time: number, delta: number) {
    // Update loop muy básico
    // Temporalmente sin sistemas complejos
  }

  private resize(gameSize: Phaser.Structs.Size) {
    // Resize handler básico
    const width = gameSize.width;
    const height = gameSize.height;

    this.cameras.resize(width, height);
  }

  private handleEntityAction() {
    // Handler básico para acciones
    logAutopoiesis.info("🎯 Action triggered (sistemas deshabilitados)");
  }
}
