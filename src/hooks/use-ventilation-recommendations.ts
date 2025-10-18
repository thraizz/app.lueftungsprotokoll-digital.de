import { useState, useEffect } from "react";
import { getAllApartments, getAllEntries, Apartment, VentilationEntry } from "@/lib/db";
import {
  recommendationEngine,
  VentilationRecommendation,
  Alert,
} from "@/lib/ventilation-recommendations";

export interface UseVentilationRecommendationsReturn {
  getRecommendation: (room: string, currentHumidity?: number, currentTemp?: number) => VentilationRecommendation;
  checkCritical: (humidity: number, temp?: number) => Alert | null;
  getNextRecommendedTime: (room: string) => Date | null;
  getHumidityColor: (humidity: number) => "green" | "yellow" | "red";
  getDINInfo: () => string;
  currentApartment: Apartment | null;
  recentEntries: VentilationEntry[];
  loading: boolean;
}

/**
 * Hook for ventilation recommendations throughout the app
 * Automatically loads current apartment and recent entries
 */
export const useVentilationRecommendations = (): UseVentilationRecommendationsReturn => {
  const [currentApartment, setCurrentApartment] = useState<Apartment | null>(null);
  const [recentEntries, setRecentEntries] = useState<VentilationEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const apartments = await getAllApartments();
      const entries = await getAllEntries();

      // Use first apartment (or could be from context/localStorage)
      if (apartments.length > 0) {
        setCurrentApartment(apartments[0]);
      }

      // Get entries from last 30 days for calculations
      const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
      const recent = entries.filter((e) => e.createdAt > thirtyDaysAgo);
      setRecentEntries(recent);
    } catch (error) {
      console.error("Error loading recommendation data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRecommendation = (
    room: string,
    currentHumidity?: number,
    currentTemp?: number
  ): VentilationRecommendation => {
    if (!currentApartment) {
      // Fallback recommendation if no apartment
      return {
        duration: 10,
        frequency: 3,
        ventilationType: "Stoßlüften",
        urgency: "normal",
        message: "Bitte legen Sie zunächst eine Wohnung in den Einstellungen an.",
        reasoning: ["Keine Wohnung konfiguriert"],
      };
    }

    // Get last ventilation for this room
    const roomEntries = recentEntries
      .filter((e) => e.rooms.includes(room) && e.apartmentId === currentApartment.id)
      .sort((a, b) => b.createdAt - a.createdAt);

    const lastVentilation = roomEntries.length > 0 ? new Date(roomEntries[0].createdAt) : undefined;

    return recommendationEngine.getRecommendation({
      apartmentSize: currentApartment.size,
      room,
      currentHumidity,
      currentTemp,
      season: recommendationEngine.getCurrentSeason(),
      lastVentilation,
    });
  };

  const checkCritical = (humidity: number, temp?: number): Alert | null => {
    return recommendationEngine.checkCriticalValues(humidity, temp);
  };

  const getNextRecommendedTime = (room: string): Date | null => {
    if (!currentApartment) return null;

    const roomEntries = recentEntries.filter(
      (e) => e.rooms.includes(room) && e.apartmentId === currentApartment.id
    );

    return recommendationEngine.getNextRecommendedTime(room, roomEntries);
  };

  const getHumidityColor = (humidity: number): "green" | "yellow" | "red" => {
    return recommendationEngine.getHumidityColor(humidity);
  };

  const getDINInfo = (): string => {
    return recommendationEngine.getDIN1946Info();
  };

  return {
    getRecommendation,
    checkCritical,
    getNextRecommendedTime,
    getHumidityColor,
    getDINInfo,
    currentApartment,
    recentEntries,
    loading,
  };
};
