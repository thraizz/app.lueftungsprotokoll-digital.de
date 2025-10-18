import { VentilationEntry } from "./db";

export type VentilationType = "Stoßlüften" | "Querlüften" | "Kipplüften";
export type Season = "winter" | "summer" | "transition";
export type Urgency = "normal" | "warning" | "critical";

export interface VentilationRecommendation {
  duration: number; // minutes
  frequency: number; // times per day
  ventilationType: VentilationType;
  urgency: Urgency;
  message: string;
  reasoning: string[];
}

export interface Alert {
  level: "warning" | "critical";
  title: string;
  message: string;
  action: string;
}

export interface RecommendationParams {
  apartmentSize: number; // m²
  room: string;
  currentHumidity?: number;
  currentTemp?: number;
  outsideTemp?: number;
  season?: Season;
  lastVentilation?: Date;
}

export class VentilationRecommendationEngine {
  /**
   * Get the current season based on month
   */
  getCurrentSeason(): Season {
    const month = new Date().getMonth();
    if (month >= 11 || month <= 2) return "winter"; // Dec, Jan, Feb
    if (month >= 5 && month <= 8) return "summer"; // Jun, Jul, Aug, Sep
    return "transition"; // Mar, Apr, May, Oct, Nov
  }

  /**
   * Get base recommendation based on apartment size
   */
  private getBaseDuration(apartmentSize: number): { min: number; max: number } {
    if (apartmentSize <= 50) {
      return { min: 5, max: 10 };
    } else if (apartmentSize <= 100) {
      return { min: 10, max: 15 };
    } else {
      return { min: 10, max: 20 };
    }
  }

  /**
   * Get base frequency based on apartment size
   */
  private getBaseFrequency(apartmentSize: number): number {
    if (apartmentSize <= 50) {
      return 4; // 3-4x daily
    } else if (apartmentSize <= 100) {
      return 3; // min 3x daily
    } else {
      return 3; // 3x daily + after activities
    }
  }

  /**
   * Adjust duration based on season and outside temperature
   */
  private adjustForSeason(baseDuration: { min: number; max: number }, season: Season, outsideTemp?: number): number {
    let duration = (baseDuration.min + baseDuration.max) / 2;

    if (season === "winter" || (outsideTemp !== undefined && outsideTemp < 5)) {
      // Shorter ventilation in winter
      duration = baseDuration.min;
    } else if (season === "summer" || (outsideTemp !== undefined && outsideTemp > 20)) {
      // Longer ventilation in summer
      duration = baseDuration.max;
    }

    return Math.round(duration);
  }

  /**
   * Get room-specific recommendations
   */
  private getRoomSpecificAdvice(room: string): { frequency?: number; timing?: string } {
    const roomLower = room.toLowerCase();

    if (roomLower.includes("bad") || roomLower.includes("dusche")) {
      return {
        frequency: 2,
        timing: "Nach jeder Nutzung (Dusche/Bad)",
      };
    }

    if (roomLower.includes("küche")) {
      return {
        frequency: 3,
        timing: "Nach jedem Kochen",
      };
    }

    if (roomLower.includes("schlaf")) {
      return {
        frequency: 2,
        timing: "Morgens nach dem Aufstehen und vor dem Schlafengehen",
      };
    }

    if (roomLower.includes("wohn") || roomLower.includes("arbeits")) {
      return {
        frequency: 3,
        timing: "3x täglich (morgens, mittags, abends)",
      };
    }

    return { frequency: 3 };
  }

  /**
   * Determine ventilation type based on apartment size and season
   */
  private getVentilationType(apartmentSize: number, season: Season): VentilationType {
    if (apartmentSize > 100 && season !== "winter") {
      return "Querlüften";
    }
    return "Stoßlüften";
  }

  /**
   * Check for critical humidity or temperature values
   */
  checkCriticalValues(humidity: number, temp?: number): Alert | null {
    if (humidity > 70) {
      return {
        level: "critical",
        title: "WARNUNG: Kritische Luftfeuchtigkeit!",
        message: `Luftfeuchtigkeit bei ${humidity}% - Akute Schimmelgefahr!`,
        action: "Sofort 15-20 Min Querlüften und regelmäßig wiederholen",
      };
    }

    if (humidity > 60) {
      return {
        level: "warning",
        title: "Erhöhte Luftfeuchtigkeit",
        message: `Luftfeuchtigkeit bei ${humidity}% liegt im Grenzbereich.`,
        action: "Längeres Lüften empfohlen (15 Min)",
      };
    }

    return null;
  }

  /**
   * Main recommendation function
   */
  getRecommendation(params: RecommendationParams): VentilationRecommendation {
    const {
      apartmentSize,
      room,
      currentHumidity,
      currentTemp,
      outsideTemp,
      season = this.getCurrentSeason(),
      lastVentilation,
    } = params;

    const reasoning: string[] = [];
    let urgency: Urgency = "normal";

    // Base duration from apartment size
    const baseDuration = this.getBaseDuration(apartmentSize);
    reasoning.push(
      `Wohnungsgröße: ${apartmentSize}m² → empfohlene Dauer: ${baseDuration.min}-${baseDuration.max} Min`
    );

    // Adjust for season
    let duration = this.adjustForSeason(baseDuration, season, outsideTemp);
    if (season === "winter") {
      reasoning.push("Winter: Kürzere Stoßlüftung empfohlen");
    } else if (season === "summer") {
      reasoning.push("Sommer: Längere Lüftungszeit möglich");
    }

    // Base frequency
    let frequency = this.getBaseFrequency(apartmentSize);

    // Room-specific adjustments
    const roomAdvice = this.getRoomSpecificAdvice(room);
    if (roomAdvice.frequency) {
      frequency = Math.max(frequency, roomAdvice.frequency);
    }
    if (roomAdvice.timing) {
      reasoning.push(`${room}: ${roomAdvice.timing}`);
    }

    // Ventilation type
    const ventilationType = this.getVentilationType(apartmentSize, season);
    reasoning.push(`Empfohlene Art: ${ventilationType}`);

    // Check humidity
    if (currentHumidity !== undefined) {
      if (currentHumidity > 70) {
        urgency = "critical";
        duration = Math.max(duration, 15);
        frequency = Math.max(frequency, 4);
        reasoning.push(`⚠️ KRITISCH: ${currentHumidity}% Luftfeuchtigkeit - Schimmelgefahr!`);
      } else if (currentHumidity > 60) {
        urgency = "warning";
        duration = Math.max(duration, 12);
        reasoning.push(`⚠️ Erhöhte Luftfeuchtigkeit: ${currentHumidity}%`);
      } else {
        reasoning.push(`✓ Luftfeuchtigkeit im Normalbereich: ${currentHumidity}%`);
      }
    }

    // Check last ventilation
    if (lastVentilation) {
      const hoursSince = (Date.now() - lastVentilation.getTime()) / (1000 * 60 * 60);
      if (hoursSince > 24) {
        urgency = urgency === "critical" ? "critical" : "warning";
        reasoning.push(`⚠️ Zuletzt vor ${Math.round(hoursSince)}h gelüftet`);
      } else if (hoursSince > 12) {
        reasoning.push(`Letztes Lüften vor ${Math.round(hoursSince)}h`);
      }
    }

    // Generate message
    let message = this.generateMessage(urgency, duration, ventilationType, frequency, room);

    return {
      duration,
      frequency,
      ventilationType,
      urgency,
      message,
      reasoning,
    };
  }

  /**
   * Generate user-friendly message
   */
  private generateMessage(
    urgency: Urgency,
    duration: number,
    ventilationType: VentilationType,
    frequency: number,
    room: string
  ): string {
    if (urgency === "critical") {
      return `Sofort handeln! ${room} benötigt dringend ${duration} Min ${ventilationType}. Wiederholung empfohlen.`;
    }

    if (urgency === "warning") {
      return `${room} sollte zeitnah ${duration} Min gelüftet werden (${ventilationType}).`;
    }

    return `${room}: ${duration} Min ${ventilationType}, ${frequency}x täglich empfohlen.`;
  }

  /**
   * Get next recommended ventilation time
   */
  getNextRecommendedTime(room: string, lastEntries: VentilationEntry[]): Date | null {
    const roomAdvice = this.getRoomSpecificAdvice(room);
    const roomEntries = lastEntries.filter((e) => e.rooms.includes(room));

    if (roomEntries.length === 0) {
      // Never ventilated, recommend now
      return new Date();
    }

    // Get last ventilation for this room
    const lastEntry = roomEntries.sort((a, b) => b.createdAt - a.createdAt)[0];
    const lastVentilation = new Date(lastEntry.createdAt);

    // Calculate next time based on frequency (roughly every 8 hours for 3x daily)
    const hoursUntilNext = 24 / (roomAdvice.frequency || 3);
    const nextTime = new Date(lastVentilation.getTime() + hoursUntilNext * 60 * 60 * 1000);

    return nextTime > new Date() ? nextTime : new Date();
  }

  /**
   * Get color for humidity level (for UI)
   */
  getHumidityColor(humidity: number): "green" | "yellow" | "red" {
    if (humidity > 70) return "red";
    if (humidity > 60) return "yellow";
    return "green";
  }

  /**
   * Get DIN 1946-6 info text
   */
  getDIN1946Info(): string {
    return `Diese Empfehlungen basieren auf DIN 1946-6 (Lüftung von Wohnungen) und allgemeinen Richtlinien zur Vermeidung von Feuchteschäden. Bei baulichen Besonderheiten, bestehenden Schimmelproblemen oder Unsicherheiten konsultieren Sie bitte einen Sachverständigen.`;
  }
}

// Singleton instance
export const recommendationEngine = new VentilationRecommendationEngine();
