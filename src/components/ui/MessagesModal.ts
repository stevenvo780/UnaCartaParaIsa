import Phaser from "phaser";
import { UIDesignSystem as DS } from "../../config/uiDesignSystem";
import { DialogueCardUI } from "../DialogueCardUI";

interface MessageEntry {
  timestamp: number;
  type: "system" | "dialogue" | "action" | "warning";
  message: string;
}

export class MessagesModalContent {
    private scene: Phaser.Scene;
    private container: Phaser.GameObjects.Container;
    private dialogueUI: DialogueCardUI;
    private messagesText?: Phaser.GameObjects.Text;
    private messages: MessageEntry[] = [];
    private readonly maxMessages = 50;

    constructor(scene: Phaser.Scene, dialogueUI: DialogueCardUI) {
        this.scene = scene;
        this.dialogueUI = dialogueUI;
        this.container = this.scene.add.container(0, 0);
        this.setupEventListeners();
        this.build();
    }

    private setupEventListeners(): void {
    // Escuchar eventos de MainScene
        const mainScene = this.scene.scene.get("MainScene");
        if (mainScene) {
            // Eventos de sistemas
            mainScene.events.on(
                "systemEvent",
                (data: { message: string; type: string }) => {
                    this.addMessage(data.message, data.type as MessageEntry["type"]);
                },
            );

            // Eventos de entidades
            mainScene.events.on(
                "entityAction",
                (data: { entity: string; action: string }) => {
                    this.addMessage(`${data.entity}: ${data.action}`, "action");
                },
            );

            // Eventos de diálogos
            mainScene.events.on(
                "dialogueStart",
                (data: { character: string; dialogue: string }) => {
                    this.addMessage(`💬 ${data.character}: ${data.dialogue}`, "dialogue");
                },
            );
        }

        // Agregar algunos mensajes iniciales
        this.addMessage("🎮 UIScene iniciada correctamente", "system");
        this.addMessage("🌍 Mundo generado con éxito", "system");
        this.addMessage("⚡ Sistemas de juego activos", "system");
    }

    private addMessage(
        message: string,
        type: MessageEntry["type"] = "system",
    ): void {
        const entry: MessageEntry = {
            timestamp: Date.now(),
            type,
            message,
        };

        this.messages.push(entry);

        // Buffer circular - mantener solo los últimos N mensajes
        if (this.messages.length > this.maxMessages) {
            this.messages.shift();
        }

        // Actualizar display
        this.updateMessagesDisplay();
    }

    private updateMessagesDisplay(): void {
        if (!this.messagesText) return;

        const formattedMessages = this.messages
            .slice(-15) // Mostrar solo los últimos 15
            .map((entry) => {
                const time = new Date(entry.timestamp).toLocaleTimeString();
                const icon = this.getTypeIcon(entry.type);
                return `${time} ${icon} ${entry.message}`;
            })
            .join("\n");

        this.messagesText.setText(formattedMessages);
    }

    private getTypeIcon(type: MessageEntry["type"]): string {
        switch (type) {
        case "system":
            return "⚙️";
        case "dialogue":
            return "💬";
        case "action":
            return "🎯";
        case "warning":
            return "⚠️";
        default:
            return "📝";
        }
    }

    getContainer(): Phaser.GameObjects.Container {
        return this.container;
    }

    private build() {
    // Título de la sección
        const title = this.scene.add.text(
            10,
            10,
            "📜 Mensajes Recientes:",
            DS.getTextStyle("lg", DS.COLORS.text, "bold"),
        );
        this.container.add(title);

        // Área de mensajes scrollable
        this.messagesText = this.scene.add.text(10, 35, this.getRecentMessages(), {
            ...DS.getTextStyle("sm", DS.COLORS.textSecondary),
            wordWrap: { width: 320 },
            lineSpacing: 3,
        });
        this.container.add(this.messagesText);

        // Integrar diálogos del DialogueCardUI si están disponibles
        if (this.dialogueUI && typeof this.dialogueUI.getContainer === "function") {
            try {
                // Crear una versión compacta del diálogo para el modal
                const compactDialogue = this.scene.add.container(10, 120);

                // Información del diálogo actual
                const dialogueInfo = this.scene.add.text(
                    0,
                    0,
                    "💬 Diálogo Activo",
                    DS.getTextStyle("sm", 0x3498db as any, "bold"),
                );
                compactDialogue.add(dialogueInfo);

                this.container.add(compactDialogue);
            } catch (error) {
                // Manejo silencioso de errores
            }
        }

        // Botón para limpiar mensajes
        const clearBtn = this.scene.add.text(280, 190, "🗑️ Limpiar", {
            ...DS.getTextStyle("xs", 0xe74c3c as any),
        });
        clearBtn.setInteractive({ useHandCursor: true });
        clearBtn.on("pointerdown", () => this.clearMessages());
        this.container.add(clearBtn);
    }

    private getRecentMessages(): string {
    // Simular mensajes recientes del sistema
        const messages = [
            "[08:15] Sistema: Mundo generado exitosamente",
            "[08:16] Isa: Explorando nuevas tierras...",
            "[08:17] Stev: Buscando recursos cercanos",
            "[08:18] Sistema: Resonancia aumentando (+5)",
            "[08:19] Autopoiesis: Ciclo de vida activo",
            "[08:20] Isa: Encontrado: Seta Mística",
            "[08:21] Sistema: Conexión establecida",
        ];

        return messages.join("\n");
    }

    private clearMessages(): void {
        if (this.messagesText) {
            this.messagesText.setText("(Sin mensajes recientes)");
        }
    }

    public updateMessages(newMessages: string[]): void {
        if (this.messagesText && newMessages.length > 0) {
            this.messagesText.setText(newMessages.join("\n"));
        }
    }
}
