import { logAutopoiesis } from "../utils/logger";

export default class MainSceneSimple extends Phaser.Scene {
  private progressManager?: any;

  constructor() {
    super({ key: "MainScene" });
    logAutopoiesis.info("🎮 MainSceneSimple initialized");
  }

  async init() {
    logAutopoiesis.info("🔧 MainSceneSimple initializing...");
    this.scale.on("resize", this.resize, this);
    this.input.keyboard?.createCursorKeys();
  }

  async create() {
    logAutopoiesis.info("🎯 MainSceneSimple.create() iniciado");

    // Obtener LoadingProgressManager
    this.progressManager = this.registry.get("progressManager");
    
    // Completar todas las fases de carga rápidamente
    if (this.progressManager) {
      this.progressManager.startPhase("world_generation", "Creando mundo simple...");
      this.progressManager.completePhase("world_generation", "Mundo simple creado");
      
      this.progressManager.startPhase("world_composition", "Preparando mundo...");
      this.progressManager.completePhase("world_composition", "Mundo preparado");
      
      this.progressManager.startPhase("world_rendering", "Renderizando...");
      this.progressManager.completePhase("world_rendering", "Render completado");
      
      this.progressManager.startPhase("entities", "Configurando...");
      this.progressManager.completePhase("entities", "Listo para jugar");
      
      // Ocultar barra de progreso
      if (this.progressManager.isComplete()) {
        this.progressManager.hideProgressBar();
      }
    }

    // Crear un mundo simple con césped de fondo
    this.add.rectangle(400, 300, 800, 600, 0x228b22).setOrigin(0.5);
    
    // Agregar árboles visibles usando sprites reales del juego
    const treePositions = [
      {x: 150, y: 250}, {x: 350, y: 180}, {x: 550, y: 300},
      {x: 200, y: 400}, {x: 450, y: 450}, {x: 650, y: 200},
      {x: 100, y: 350}, {x: 700, y: 380}, {x: 300, y: 320}
    ];
    
    treePositions.forEach((pos, i) => {
      // Intentar usar sprites de árboles reales
      const treeKeys = ['oak_tree1', 'tree_emerald_1', 'birch_tree1', 'pine_tree1'];
      let treeSprite = null;
      
      // Probar diferentes claves de árboles hasta encontrar una que exista
      for (const treeKey of treeKeys) {
        if (this.textures.exists(treeKey)) {
          treeSprite = this.add.sprite(pos.x, pos.y, treeKey);
          break;
        }
      }
      
      // Si no hay sprites de árboles, crear árboles simples con formas
      if (!treeSprite) {
        // Tronco
        this.add.rectangle(pos.x, pos.y + 10, 8, 30, 0x8B4513);
        // Copa
        this.add.circle(pos.x, pos.y - 10, 25, 0x228B22);
        // Destacar con un borde más claro
        this.add.circle(pos.x, pos.y - 10, 20, 0x32CD32);
      } else {
        // Configurar el sprite de árbol
        treeSprite.setScale(0.8 + Math.random() * 0.4); // Variación en tamaño
        treeSprite.setDepth(1); // Asegurar que esté visible
      }
    });
    
    // Añadir algunos arbustos y vegetación menor
    for (let i = 0; i < 15; i++) {
      const x = 50 + Math.random() * 700;
      const y = 150 + Math.random() * 300;
      
      // Probar sprites de arbustos
      const bushKeys = ['bush_emerald_1', 'grass_middle', 'flowers_1'];
      let bushSprite = null;
      
      for (const bushKey of bushKeys) {
        if (this.textures.exists(bushKey)) {
          bushSprite = this.add.sprite(x, y, bushKey);
          bushSprite.setScale(0.5 + Math.random() * 0.3);
          bushSprite.setDepth(0.5);
          break;
        }
      }
      
      // Si no hay sprites, crear arbustos simples
      if (!bushSprite) {
        this.add.circle(x, y, 8 + Math.random() * 8, 0x90EE90);
      }
    }

    // Texto de estado
    this.add.text(400, 100, "🌍 Mundo Simple + Árboles\n9 árboles y 15 arbustos visibles", {
      fontSize: "24px",
      color: "#ffffff",
      align: "center"
    }).setOrigin(0.5);

    this.add.text(400, 500, "TAB: Controles | H: Ayuda", {
      fontSize: "16px", 
      color: "#ffff00",
      align: "center"
    }).setOrigin(0.5);

    // Configurar cámara básica
    this.cameras.main.setBounds(0, 0, 800, 600);
    this.cameras.main.setZoom(1);

    // Controles básicos
    this.input.keyboard?.on("keydown-H", () => {
      logAutopoiesis.info("🎮 MainSceneSimple - Mundo básico sin WorldComposer");
    });

    // Iniciar UIScene
    this.scene.launch("UIScene");

    logAutopoiesis.info("✅ MainSceneSimple creado exitosamente");
  }

  private resize(gameSize: Phaser.Structs.Size) {
    const width = gameSize.width;
    const height = gameSize.height;
    this.cameras.resize(width, height);
  }
}