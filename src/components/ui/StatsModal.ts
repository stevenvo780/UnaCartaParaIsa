import Phaser from "phaser";
import type { GameLogicUpdateData } from "../../types";

export class StatsModalContent {
    private scene: Phaser.Scene;
    private container: Phaser.GameObjects.Container;
    private statTexts: Phaser.GameObjects.Text[] = [];

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.container = this.scene.add.container(0, 0);
        this.build();
    }

    getContainer() {
        return this.container;
    }

    update(data: GameLogicUpdateData) {
        const map = new Map<string, number>();
        const isa = data.entities?.find((e) => e.id === "isa");
        const stev = data.entities?.find((e) => e.id === "stev");
        if (isa) {
            map.set("isa.health", Math.round(isa.stats.health));
            map.set("isa.energy", Math.round(isa.stats.energy));
            map.set("isa.hunger", Math.round(isa.stats.hunger));
        }
        if (stev) {
            map.set("stev.health", Math.round(stev.stats.health));
            map.set("stev.energy", Math.round(stev.stats.energy));
            map.set("stev.hunger", Math.round(stev.stats.hunger));
        }
        this.statTexts.forEach((t) => {
            const key = t.getData("statKey") as string;
            const label = t.getData("label") as string;
            const val = map.get(key) ?? 0;
            t.setText(`${label}: ${val}`);
        });
    }

    private build() {
        const mk = (x: number, y: number, label: string, key: string) => {
            const t = this.scene.add.text(x, y, `${label}: 0`, {
                fontSize: "11px",
                color: "#ecf0f1",
            });
            t.setData("statKey", key);
            t.setData("label", label);
            this.container.add(t);
            this.statTexts.push(t);
        };
        const isaTitle = this.scene.add.text(0, 0, "👩 Isa", {
            fontSize: "12px",
            color: "#e91e63",
            fontStyle: "bold",
        });
        this.container.add(isaTitle);
        mk(0, 16, "Salud", "isa.health");
        mk(0, 32, "Energía", "isa.energy");
        mk(0, 48, "Hambre", "isa.hunger");

        const stevTitle = this.scene.add.text(180, 0, "👨 Stev", {
            fontSize: "12px",
            color: "#3498db",
            fontStyle: "bold",
        });
        this.container.add(stevTitle);
        mk(180, 16, "Salud", "stev.health");
        mk(180, 32, "Energía", "stev.energy");
        mk(180, 48, "Hambre", "stev.hunger");
    }
}
