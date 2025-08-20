/**
 * UI Component for System Status and Emergence Monitoring
 * Displays complex dynamics, autopoiesis levels, and emergent patterns
 */

import Phaser from "phaser";
import type {
  SystemMetrics,
  EmergentPattern,
  FeedbackLoop,
} from "../systems/EmergenceSystem";
import { logAutopoiesis } from "../utils/logger";

export class SystemStatusUI {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private isVisible: boolean = false; // Hidden by default - advanced info
  private isExpanded: boolean = false;

  // UI Elements
  private background: Phaser.GameObjects.Rectangle;
  private titleText: Phaser.GameObjects.Text;
  private metricsContainer: Phaser.GameObjects.Container;
  private patternsContainer: Phaser.GameObjects.Container;
  private feedbackContainer: Phaser.GameObjects.Container;

  // Data displays
  private metricsBars: Map<
    string,
    { bar: Phaser.GameObjects.Rectangle; text: Phaser.GameObjects.Text }
  > = new Map();
  private patternTexts: Phaser.GameObjects.Text[] = [];
  private feedbackTexts: Phaser.GameObjects.Text[] = [];

  // Current data
  private currentMetrics?: SystemMetrics;
  private currentPatterns: EmergentPattern[] = [];
  private currentFeedback: FeedbackLoop[] = [];

  // UI Configuration
  private config = {
    width: 320,
    height: 400,
    expandedHeight: 600,
    padding: 16,
    barWidth: 120,
    barHeight: 8,
    spacing: 20,
  };

  constructor(scene: Phaser.Scene, x: number = 20, y: number = 160) {
    this.scene = scene;

    this.container = this.scene.add.container(x, y);
    this.container.setScrollFactor(0);
    this.container.setDepth(999); // Below dialogue cards but above most UI
    this.container.setVisible(this.isVisible);

    this.createUI();
    this.setupEventListeners();

    logAutopoiesis.info("🌌 SystemStatusUI initialized", {
      position: { x, y },
      config: this.config,
    });
  }

  /**
   * Create UI elements
   */
  private createUI(): void {
    // Background
    this.background = this.scene.add.rectangle(
      this.config.width / 2,
      this.config.height / 2,
      this.config.width,
      this.config.height,
      0x1a1a2e,
      0.92,
    );
    this.background.setStrokeStyle(2, 0x16213e);
    this.container.add(this.background);

    // Title
    this.titleText = this.scene.add.text(
      this.config.padding,
      this.config.padding,
      "🌌 AUTOPOIESIS",
      {
        fontSize: "14px",
        fontFamily: "Arial",
        color: "#0f3460",
        fontStyle: "bold",
      },
    );
    this.container.add(this.titleText);

    // Metrics container
    this.metricsContainer = this.scene.add.container(0, 40);
    this.container.add(this.metricsContainer);
    this.createMetricsDisplay();

    // Patterns container
    this.patternsContainer = this.scene.add.container(0, 200);
    this.container.add(this.patternsContainer);
    this.createPatternsDisplay();

    // Feedback loops container
    this.feedbackContainer = this.scene.add.container(0, 320);
    this.container.add(this.feedbackContainer);
    this.createFeedbackDisplay();

    // Make background interactive
    this.background.setInteractive();
    this.background.on("pointerdown", () => {
      this.toggleExpanded();
    });
  }

  /**
   * Create metrics display
   */
  private createMetricsDisplay(): void {
    const metrics = [
      { key: "complexity", label: "Complexity", color: 0xe74c3c },
      { key: "coherence", label: "Coherence", color: 0x3498db },
      { key: "adaptability", label: "Adaptability", color: 0x2ecc71 },
      { key: "sustainability", label: "Sustainability", color: 0xf39c12 },
      { key: "autopoiesis", label: "Autopoiesis", color: 0x9b59b6 },
      { key: "entropy", label: "Entropy", color: 0x95a5a6 },
    ];

    metrics.forEach((metric, index) => {
      const y = index * (this.config.spacing + 2);

      // Label
      const label = this.scene.add.text(this.config.padding, y, metric.label, {
        fontSize: "11px",
        fontFamily: "Arial",
        color: "#ecf0f1",
      });
      this.metricsContainer.add(label);

      // Bar background
      const barBg = this.scene.add.rectangle(
        this.config.padding + 100,
        y + 6,
        this.config.barWidth,
        this.config.barHeight,
        0x2c3e50,
      );
      this.metricsContainer.add(barBg);

      // Bar fill
      const bar = this.scene.add.rectangle(
        this.config.padding + 100 - this.config.barWidth / 2,
        y + 6,
        0,
        this.config.barHeight,
        metric.color,
      );
      bar.setOrigin(0, 0.5);
      this.metricsContainer.add(bar);

      // Value text
      const valueText = this.scene.add.text(
        this.config.padding + 100 + this.config.barWidth / 2 + 10,
        y,
        "0%",
        {
          fontSize: "10px",
          fontFamily: "Arial",
          color: "#bdc3c7",
        },
      );
      this.metricsContainer.add(valueText);

      this.metricsBars.set(metric.key, { bar, text: valueText });
    });
  }

  /**
   * Create patterns display
   */
  private createPatternsDisplay(): void {
    const sectionTitle = this.scene.add.text(
      this.config.padding,
      0,
      "🌟 Emergent Patterns",
      {
        fontSize: "12px",
        fontFamily: "Arial",
        color: "#e8c547",
        fontStyle: "bold",
      },
    );
    this.patternsContainer.add(sectionTitle);
  }

  /**
   * Create feedback loops display
   */
  private createFeedbackDisplay(): void {
    const sectionTitle = this.scene.add.text(
      this.config.padding,
      0,
      "🔄 Feedback Loops",
      {
        fontSize: "12px",
        fontFamily: "Arial",
        color: "#52c234",
        fontStyle: "bold",
      },
    );
    this.feedbackContainer.add(sectionTitle);
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    // Listen for emergence metrics updates
    this.scene.events.on("emergenceMetricsUpdated", (data: any) => {
      this.updateDisplay(data.metrics, data.patterns, data.feedbackLoops);
    });

    // Listen for new emergent patterns
    this.scene.events.on("emergentPatternDetected", (data: any) => {
      this.showPatternNotification(data);
    });

    // Toggle visibility with 'E' key (Emergence)
    this.scene.input.keyboard?.on("keydown-E", () => {
      this.toggleVisibility();
    });

    // Toggle expanded view with 'X' key
    this.scene.input.keyboard?.on("keydown-X", () => {
      if (this.isVisible) {
        this.toggleExpanded();
      }
    });
  }

  /**
   * Update display with new data
   */
  private updateDisplay(
    metrics: SystemMetrics,
    patterns: EmergentPattern[],
    feedbackLoops: FeedbackLoop[],
  ): void {
    this.currentMetrics = metrics;
    this.currentPatterns = patterns;
    this.currentFeedback = feedbackLoops;

    this.updateMetricsDisplay(metrics);
    this.updatePatternsDisplay(patterns);
    this.updateFeedbackDisplay(feedbackLoops);
  }

  /**
   * Update metrics bars
   */
  private updateMetricsDisplay(metrics: SystemMetrics): void {
    Object.entries(metrics).forEach(([key, value]) => {
      const display = this.metricsBars.get(key);
      if (display) {
        // Update bar width
        const targetWidth = value * this.config.barWidth;
        this.scene.tweens.add({
          targets: display.bar,
          width: targetWidth,
          duration: 300,
          ease: "Power2.easeOut",
        });

        // Update text
        display.text.setText(`${Math.round(value * 100)}%`);

        // Color based on value
        if (key === "entropy") {
          // Entropy: lower is better
          display.text.setColor(
            value < 0.3 ? "#27ae60" : value < 0.7 ? "#f39c12" : "#e74c3c",
          );
        } else {
          // Other metrics: higher is better
          display.text.setColor(
            value > 0.7 ? "#27ae60" : value > 0.4 ? "#f39c12" : "#e74c3c",
          );
        }
      }
    });
  }

  /**
   * Update patterns display
   */
  private updatePatternsDisplay(patterns: EmergentPattern[]): void {
    // Clear existing pattern texts
    this.patternTexts.forEach((text) => text.destroy());
    this.patternTexts = [];

    // Add new pattern texts
    patterns.slice(0, 4).forEach((pattern, index) => {
      const y = 20 + index * 18;

      const strengthIcon = this.getStrengthIcon(pattern.strength);
      const typeColor = this.getPatternTypeColor(pattern.type);

      const patternText = this.scene.add.text(
        this.config.padding,
        y,
        `${strengthIcon} ${pattern.name}`,
        {
          fontSize: "10px",
          fontFamily: "Arial",
          color: typeColor,
          wordWrap: { width: this.config.width - this.config.padding * 2 },
        },
      );

      this.patternsContainer.add(patternText);
      this.patternTexts.push(patternText);

      // Add strength indicator
      if (this.isExpanded) {
        const strengthText = this.scene.add.text(
          this.config.padding,
          y + 12,
          `Strength: ${Math.round(pattern.strength * 100)}% | Duration: ${Math.round(pattern.duration / 1000)}s`,
          {
            fontSize: "8px",
            fontFamily: "Arial",
            color: "#7f8c8d",
          },
        );

        this.patternsContainer.add(strengthText);
        this.patternTexts.push(strengthText);
      }
    });

    if (patterns.length === 0) {
      const noPatterns = this.scene.add.text(
        this.config.padding,
        20,
        "No active patterns",
        {
          fontSize: "10px",
          fontFamily: "Arial",
          color: "#7f8c8d",
          fontStyle: "italic",
        },
      );

      this.patternsContainer.add(noPatterns);
      this.patternTexts.push(noPatterns);
    }
  }

  /**
   * Update feedback loops display
   */
  private updateFeedbackDisplay(feedbackLoops: FeedbackLoop[]): void {
    // Clear existing feedback texts
    this.feedbackTexts.forEach((text) => text.destroy());
    this.feedbackTexts = [];

    // Add active feedback loops
    const activeLoops = feedbackLoops.filter((loop) => loop.active);
    activeLoops.slice(0, 3).forEach((loop, index) => {
      const y = 20 + index * 18;

      const loopIcon = loop.type === "positive" ? "⬆️" : "⬇️";
      const strengthIcon = this.getStrengthIcon(loop.strength);

      const loopText = this.scene.add.text(
        this.config.padding,
        y,
        `${loopIcon}${strengthIcon} ${loop.elements.join(" → ")}`,
        {
          fontSize: "9px",
          fontFamily: "Arial",
          color: loop.type === "positive" ? "#e74c3c" : "#3498db",
          wordWrap: { width: this.config.width - this.config.padding * 2 },
        },
      );

      this.feedbackContainer.add(loopText);
      this.feedbackTexts.push(loopText);
    });

    if (activeLoops.length === 0) {
      const noLoops = this.scene.add.text(
        this.config.padding,
        20,
        "No active feedback loops",
        {
          fontSize: "10px",
          fontFamily: "Arial",
          color: "#7f8c8d",
          fontStyle: "italic",
        },
      );

      this.feedbackContainer.add(noLoops);
      this.feedbackTexts.push(noLoops);
    }
  }

  /**
   * Get strength icon based on value
   */
  private getStrengthIcon(strength: number): string {
    if (strength > 0.8) return "●●●";
    if (strength > 0.6) return "●●○";
    if (strength > 0.4) return "●○○";
    return "○○○";
  }

  /**
   * Get color for pattern type
   */
  private getPatternTypeColor(type: EmergentPattern["type"]): string {
    const colors = {
      behavioral: "#e74c3c",
      social: "#3498db",
      environmental: "#2ecc71",
      systemic: "#9b59b6",
    };
    return colors[type];
  }

  /**
   * Show pattern notification
   */
  private showPatternNotification(patternData: any): void {
    // Create floating notification
    const notification = this.scene.add.container(
      this.container.x + this.config.width + 10,
      this.container.y,
    );
    notification.setScrollFactor(0);
    notification.setDepth(1001);

    const notifBg = this.scene.add.rectangle(0, 0, 200, 60, 0x2c3e50, 0.95);
    notifBg.setStrokeStyle(2, 0xe8c547);
    notification.add(notifBg);

    const notifText = this.scene.add.text(
      -90,
      -20,
      `🌟 New Pattern!\n${patternData.name}`,
      {
        fontSize: "11px",
        fontFamily: "Arial",
        color: "#e8c547",
        align: "center",
      },
    );
    notification.add(notifText);

    // Animate in
    notification.setScale(0);
    this.scene.tweens.add({
      targets: notification,
      scale: 1,
      duration: 300,
      ease: "Back.easeOut",
    });

    // Auto-hide after 4 seconds
    this.scene.time.delayedCall(4000, () => {
      this.scene.tweens.add({
        targets: notification,
        scale: 0,
        alpha: 0,
        duration: 300,
        ease: "Power2.easeIn",
        onComplete: () => notification.destroy(),
      });
    });
  }

  /**
   * Toggle UI visibility
   */
  public toggleVisibility(): void {
    this.isVisible = !this.isVisible;
    this.container.setVisible(this.isVisible);

    if (this.isVisible) {
      // Animate in
      this.container.setAlpha(0);
      this.scene.tweens.add({
        targets: this.container,
        alpha: 1,
        duration: 300,
        ease: "Power2.easeOut",
      });
    }

    logAutopoiesis.info(
      `System Status UI ${this.isVisible ? "shown" : "hidden"}`,
    );
  }

  /**
   * Toggle expanded view
   */
  public toggleExpanded(): void {
    this.isExpanded = !this.isExpanded;

    const targetHeight = this.isExpanded
      ? this.config.expandedHeight
      : this.config.height;

    this.scene.tweens.add({
      targets: this.background,
      height: targetHeight,
      duration: 300,
      ease: "Power2.easeOut",
    });

    // Update displays to show more/less detail
    if (this.currentMetrics && this.currentPatterns && this.currentFeedback) {
      this.updateDisplay(
        this.currentMetrics,
        this.currentPatterns,
        this.currentFeedback,
      );
    }
  }

  /**
   * Show system summary in console
   */
  public showSystemSummary(): void {
    if (!this.currentMetrics) return;

    const summary = {
      autopoiesisLevel: Math.round(this.currentMetrics.autopoiesis * 100),
      systemComplexity: Math.round(this.currentMetrics.complexity * 100),
      systemCoherence: Math.round(this.currentMetrics.coherence * 100),
      activePatterns: this.currentPatterns.length,
      activeFeedbackLoops: this.currentFeedback.length,
      emergentBehaviors: this.currentPatterns.map((p) => ({
        name: p.name,
        type: p.type,
        strength: Math.round(p.strength * 100),
      })),
    };

    logAutopoiesis.info("🌌 System Autopoiesis Summary", summary);
  }

  /**
   * Get current stats for debugging
   */
  public getStats(): {
    visible: boolean;
    expanded: boolean;
    patterns: number;
    feedbackLoops: number;
    autopoiesisLevel?: number;
  } {
    return {
      visible: this.isVisible,
      expanded: this.isExpanded,
      patterns: this.currentPatterns.length,
      feedbackLoops: this.currentFeedback.length,
      autopoiesisLevel: this.currentMetrics
        ? Math.round(this.currentMetrics.autopoiesis * 100)
        : undefined,
    };
  }

  /**
   * Cleanup when UI is destroyed
   */
  public destroy(): void {
    this.container.destroy();
    this.scene.events.off("emergenceMetricsUpdated");
    this.scene.events.off("emergentPatternDetected");

    logAutopoiesis.info("SystemStatusUI destroyed");
  }
}
