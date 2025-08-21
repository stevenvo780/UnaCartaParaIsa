/**
 * UI Component for Day/Night and Weather Information
 * Displays current time, weather, and environmental conditions
 */

import Phaser from "phaser";
import type { TimeOfDay, WeatherCondition } from "../systems/DayNightSystem";
import { logAutopoiesis } from "../utils/logger";

export class DayNightUI {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private isVisible: boolean = true;

  // UI Elements
  private background: Phaser.GameObjects.Rectangle;
  private timeText: Phaser.GameObjects.Text;
  private phaseText: Phaser.GameObjects.Text;
  private weatherText: Phaser.GameObjects.Text;
  private temperatureText: Phaser.GameObjects.Text;
  private weatherIcon: Phaser.GameObjects.Text;
  private lightIndicator: Phaser.GameObjects.Arc;

  // Current data
  private currentTime?: TimeOfDay;
  private currentWeather?: WeatherCondition;

  // UI Configuration
  private config = {
    width: 200,
    height: 120,
    padding: 12,
    fontSize: {
      time: "16px",
      phase: "12px",
      weather: "11px",
      temperature: "11px",
    },
  };

  constructor(scene: Phaser.Scene, x: number = 20, y: number = 20) {
    this.scene = scene;

    this.container = this.scene.add.container(x, y);
    this.container.setScrollFactor(0); // UI should not scroll with camera
    this.container.setDepth(1000); // Always on top

    this.createUI();
    this.setupEventListeners();

    logAutopoiesis.info("🌅 DayNightUI initialized", {
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
      0x2c3e50,
      0.85,
    );
    this.background.setStrokeStyle(2, 0x34495e);
    this.container.add(this.background);

    // Time display
    this.timeText = this.scene.add.text(
      this.config.padding,
      this.config.padding,
      "06:00",
      {
        fontSize: this.config.fontSize.time,
        fontFamily: "Arial",
        color: "#ecf0f1",
        fontStyle: "bold",
      },
    );
    this.container.add(this.timeText);

    // Phase display
    this.phaseText = this.scene.add.text(
      this.config.padding,
      this.config.padding + 22,
      "Dawn",
      {
        fontSize: this.config.fontSize.phase,
        fontFamily: "Arial",
        color: "#bdc3c7",
      },
    );
    this.container.add(this.phaseText);

    // Weather icon
    this.weatherIcon = this.scene.add.text(
      this.config.width - 40,
      this.config.padding,
      "☀️",
      {
        fontSize: "20px",
      },
    );
    this.container.add(this.weatherIcon);

    // Light level indicator
    this.lightIndicator = this.scene.add.circle(
      this.config.width - 20,
      this.config.padding + 30,
      8,
      0xffd700,
    );
    this.container.add(this.lightIndicator);

    // Weather description
    this.weatherText = this.scene.add.text(
      this.config.padding,
      this.config.padding + 40,
      "Clear",
      {
        fontSize: this.config.fontSize.weather,
        fontFamily: "Arial",
        color: "#95a5a6",
      },
    );
    this.container.add(this.weatherText);

    // Temperature
    this.temperatureText = this.scene.add.text(
      this.config.padding,
      this.config.padding + 55,
      "20°C",
      {
        fontSize: this.config.fontSize.temperature,
        fontFamily: "Arial",
        color: "#e67e22",
      },
    );
    this.container.add(this.temperatureText);

    // Additional info (comfort, visibility)
    const comfortText = this.scene.add.text(
      this.config.padding,
      this.config.padding + 75,
      "Comfort: Good",
      {
        fontSize: "10px",
        fontFamily: "Arial",
        color: "#7f8c8d",
      },
    );
    this.container.add(comfortText);

    const visibilityText = this.scene.add.text(
      this.config.padding,
      this.config.padding + 90,
      "Visibility: 100%",
      {
        fontSize: "10px",
        fontFamily: "Arial",
        color: "#7f8c8d",
      },
    );
    this.container.add(visibilityText);

    // Store references for updates
    this.container.setData("comfortText", comfortText);
    this.container.setData("visibilityText", visibilityText);
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    // Listen for time changes
    this.scene.events.on("timeChanged", (timeData: TimeOfDay) => {
      this.updateTimeDisplay(timeData);
    });

    // Listen for weather changes
    this.scene.events.on("weatherChanged", (weatherData: WeatherCondition) => {
      this.updateWeatherDisplay(weatherData);
    });

    // Toggle visibility with 'T' key (Time)
    this.scene.input.keyboard?.on("keydown-T", () => {
      this.toggleVisibility();
    });

    // Click to show detailed info
    this.background.setInteractive();
    this.background.on("pointerdown", () => {
      this.showDetailedInfo();
    });
  }

  /**
   * Update time display
   */
  private updateTimeDisplay(timeData: TimeOfDay): void {
    this.currentTime = timeData;

    // Update time text
    const timeString = `${timeData.hour.toString().padStart(2, "0")}:${timeData.minute.toString().padStart(2, "0")}`;
    this.timeText.setText(timeString);

    // Update phase
    const phaseNames = {
      dawn: "Dawn",
      morning: "Morning",
      midday: "Midday",
      afternoon: "Afternoon",
      dusk: "Dusk",
      night: "Night",
      deep_night: "Deep Night",
    };
    this.phaseText.setText(phaseNames[timeData.phase]);

    // Update light indicator
    const lightAlpha = Math.max(0.2, timeData.lightLevel);
    const lightColor = this.getLightColor(timeData.phase);
    this.lightIndicator.setFillStyle(lightColor, lightAlpha);
    this.lightIndicator.setRadius(4 + timeData.lightLevel * 6);

    // Update temperature color
    this.updateTemperatureColor(timeData.temperature);
  }

  /**
   * Update weather display
   */
  private updateWeatherDisplay(weatherData: WeatherCondition): void {
    this.currentWeather = weatherData;

    // Update weather icon
    const weatherIcons = {
      clear: "☀️",
      cloudy: "☁️",
      rainy: "🌧️",
      stormy: "⛈️",
      foggy: "🌫️",
      snowy: "❄️",
    };
    this.weatherIcon.setText(weatherIcons[weatherData.type]);

    // Update weather text
    const weatherNames = {
      clear: "Clear",
      cloudy: "Cloudy",
      rainy: "Rainy",
      stormy: "Stormy",
      foggy: "Foggy",
      snowy: "Snowy",
    };
    this.weatherText.setText(weatherNames[weatherData.type]);

    // Update comfort and visibility
    const comfortText = this.container.getData(
      "comfortText",
    ) as Phaser.GameObjects.Text;
    const visibilityText = this.container.getData(
      "visibilityText",
    ) as Phaser.GameObjects.Text;

    if (comfortText) {
      const comfortLevel = this.getComfortDescription(weatherData.comfort);
      comfortText.setText(`Comfort: ${comfortLevel}`);
      comfortText.setColor(this.getComfortColor(weatherData.comfort));
    }

    if (visibilityText) {
      const visibilityPercent = Math.round(weatherData.visibility * 100);
      visibilityText.setText(`Visibility: ${visibilityPercent}%`);
      visibilityText.setColor(this.getVisibilityColor(weatherData.visibility));
    }
  }

  /**
   * Get light color based on time phase
   */
  private getLightColor(phase: TimeOfDay["phase"]): number {
    const colors = {
      dawn: 0xffd700, // Gold
      morning: 0xffeb3b, // Yellow
      midday: 0xffffff, // White
      afternoon: 0xffc107, // Amber
      dusk: 0xff9800, // Orange
      night: 0x3f51b5, // Indigo
      deep_night: 0x1a237e, // Dark blue
    };
    return colors[phase];
  }

  /**
   * Update temperature color based on value
   */
  private updateTemperatureColor(temperature: number): void {
    this.temperatureText.setText(`${temperature}°C`);

    let color = "#e67e22"; // Default orange

    if (temperature < 0) {
      color = "#3498db"; // Blue - freezing
    } else if (temperature < 10) {
      color = "#5dade2"; // Light blue - cold
    } else if (temperature < 18) {
      color = "#85c1e9"; // Very light blue - cool
    } else if (temperature > 30) {
      color = "#e74c3c"; // Red - hot
    } else if (temperature > 25) {
      color = "#f39c12"; // Orange - warm
    }

    this.temperatureText.setColor(color);
  }

  /**
   * Get comfort description
   */
  private getComfortDescription(comfort: number): string {
    if (comfort > 0.7) return "Excellent";
    if (comfort > 0.4) return "Good";
    if (comfort > 0.1) return "Fair";
    if (comfort > -0.3) return "Poor";
    return "Harsh";
  }

  /**
   * Get comfort color
   */
  private getComfortColor(comfort: number): string {
    if (comfort > 0.7) return "#27ae60";
    if (comfort > 0.4) return "#f39c12";
    if (comfort > 0.1) return "#e67e22";
    if (comfort > -0.3) return "#e74c3c";
    return "#8e44ad";
  }

  /**
   * Get visibility color
   */
  private getVisibilityColor(visibility: number): string {
    if (visibility > 0.8) return "#27ae60";
    if (visibility > 0.6) return "#f39c12";
    if (visibility > 0.4) return "#e67e22";
    return "#e74c3c";
  }

  /**
   * Show detailed environmental information
   */
  private showDetailedInfo(): void {
    if (!this.currentTime || !this.currentWeather) return;

    const details = [
      `🕐 Time: ${this.timeText.text} (${this.phaseText.text})`,
      `🌡️ Temperature: ${this.currentTime.temperature}°C`,
      `💡 Light Level: ${Math.round(this.currentTime.lightLevel * 100)}%`,
      `${this.weatherIcon.text} Weather: ${this.weatherText.text}`,
      `👁️ Visibility: ${Math.round(this.currentWeather.visibility * 100)}%`,
      `😌 Comfort: ${this.getComfortDescription(this.currentWeather.comfort)}`,
      `💨 Intensity: ${Math.round(this.currentWeather.intensity * 100)}%`,
    ];

    logAutopoiesis.info("🌍 Environmental Status", {
      time: this.currentTime,
      weather: this.currentWeather,
      summary: details,
    });

    // Could also show a modal or expanded panel here
    this.showFloatingInfo(details);
  }

  /**
   * Show floating information panel
   */
  private showFloatingInfo(details: string[]): void {
    // Create temporary info panel
    const infoPanel = this.scene.add.container(
      this.container.x,
      this.container.y + this.config.height + 10,
    );
    infoPanel.setScrollFactor(0);
    infoPanel.setDepth(1001);

    const panelBg = this.scene.add.rectangle(
      100,
      0,
      200,
      details.length * 20 + 20,
      0x2c3e50,
      0.95,
    );
    panelBg.setStrokeStyle(2, 0x3498db);
    infoPanel.add(panelBg);

    details.forEach((detail, index) => {
      const text = this.scene.add.text(
        10,
        -(details.length * 10 - index * 20),
        detail,
        {
          fontSize: "11px",
          fontFamily: "Arial",
          color: "#ecf0f1",
        },
      );
      infoPanel.add(text);
    });

    // Auto-hide after 3 seconds
    this.scene.time.delayedCall(3000, () => {
      infoPanel.destroy();
    });

    // Hide on click
    panelBg.setInteractive();
    panelBg.on("pointerdown", () => {
      infoPanel.destroy();
    });
  }

  /**
   * Toggle UI visibility
   */
  public toggleVisibility(): void {
    this.isVisible = !this.isVisible;
    this.container.setVisible(this.isVisible);

    logAutopoiesis.info(`Day/Night UI ${this.isVisible ? "shown" : "hidden"}`);
  }

  /**
   * Set position
   */
  public setPosition(x: number, y: number): void {
    this.container.setPosition(x, y);
  }

  /**
   * Get current stats for debugging
   */
  public getStats(): {
    visible: boolean;
    currentTime?: TimeOfDay;
    currentWeather?: WeatherCondition;
  } {
    return {
      visible: this.isVisible,
      currentTime: this.currentTime,
      currentWeather: this.currentWeather,
    };
  }

  /**
   * Cleanup when UI is destroyed
   */
  public destroy(): void {
    this.container.destroy();
    this.scene.events.off("timeChanged");
    this.scene.events.off("weatherChanged");

    logAutopoiesis.info("DayNightUI destroyed");
  }
}
