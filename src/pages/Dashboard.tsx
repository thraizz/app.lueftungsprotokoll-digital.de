import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAllEntries, getAllApartments, getMetadata, VentilationEntry, Apartment } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, CheckCircle, TrendingUp, AlertTriangle, AlertCircle, CloudRain, Wind as WindIcon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { VentilationChecklist } from "@/components/VentilationChecklist";

const Dashboard = () => {
  const [entries, setEntries] = useState<VentilationEntry[]>([]);
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [checklistEnabled, setChecklistEnabled] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [entriesData, apartmentsData, checklistSetting] = await Promise.all([
        getAllEntries(),
        getAllApartments(),
        getMetadata("checklist-enabled"),
      ]);
      setEntries(entriesData);
      setApartments(apartmentsData);
      if (checklistSetting) {
        setChecklistEnabled(checklistSetting.value as boolean);
      }
    } catch (error) {
      console.error("Fehler beim Laden der Daten:", error);
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toISOString().split("T")[0];
  const todayEntries = entries.filter((e) => e.date === today);
  const last7Days = entries.filter((e) => {
    const entryDate = new Date(e.date);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return entryDate >= weekAgo;
  });

  // Calculate ventilation sessions (unique timestamps) vs total rooms ventilated
  const todaySessions = todayEntries.length;
  const todayRoomsVentilated = new Set(todayEntries.flatMap(e => e.rooms || [])).size;

  const avgHumidity = last7Days.length > 0
    ? Math.round(
        last7Days.reduce((sum, e) => sum + e.humidityBefore, 0) / last7Days.length
      )
    : 0;

  const getHumidityStatus = (humidity: number) => {
    if (humidity <= 60) return { text: "Optimal", color: "text-success", bg: "bg-success/10" };
    if (humidity <= 70) return { text: "Grenzwertig", color: "text-warning", bg: "bg-warning/10" };
    return { text: "Kritisch", color: "text-destructive", bg: "bg-destructive/10" };
  };

  const humidityStatus = getHumidityStatus(avgHumidity);

  // Check for critical humidity values
  const criticalEntries = entries.filter(e => e.humidityBefore > 70);
  const hasCriticalValues = criticalEntries.length > 0;

  // Check for inactivity
  const lastEntryDate = entries.length > 0
    ? new Date(entries[entries.length - 1].date)
    : null;
  const daysSinceLastEntry = lastEntryDate
    ? Math.floor((new Date().getTime() - lastEntryDate.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  // Weather-based and legal recommendations
  const getWeatherRecommendation = () => {
    const currentHour = new Date().getHours();
    const currentMonth = new Date().getMonth();

    // Winter months (Dec, Jan, Feb)
    if (currentMonth === 11 || currentMonth === 0 || currentMonth === 1) {
      if (currentHour >= 11 && currentHour <= 14) {
        return {
          icon: <CloudRain className="h-4 w-4" />,
          text: "Optimal: Mittags lüften während wärmster Tageszeit (Winter: 5-10 Min. Stoßlüften)",
          variant: "default" as const
        };
      }
      return {
        icon: <AlertCircle className="h-4 w-4" />,
        text: "Winter: Kurz und kräftig stoßlüften (5-10 Min. pro Sitzung)",
        variant: "default" as const
      };
    }

    // Summer months (Jun, Jul, Aug)
    if (currentMonth >= 5 && currentMonth <= 7) {
      if (currentHour >= 6 && currentHour <= 8) {
        return {
          icon: <WindIcon className="h-4 w-4" />,
          text: "Optimal: Morgens lüften bevor es heiß wird (Sommer: 25-30 Min. Querlüften)",
          variant: "default" as const
        };
      }
      if (currentHour >= 20 && currentHour <= 23) {
        return {
          icon: <WindIcon className="h-4 w-4" />,
          text: "Optimal: Abends lüften wenn es kühler wird (Sommer: 25-30 Min.)",
          variant: "default" as const
        };
      }
      return {
        icon: <AlertCircle className="h-4 w-4" />,
        text: "Sommer: Morgens/abends lüften (25-30 Min.), tagsüber Fenster geschlossen halten",
        variant: "default" as const
      };
    }

    // Default recommendation - Spring/Fall
    return {
      icon: <WindIcon className="h-4 w-4" />,
      text: "Empfohlen: 3-4 Lüftungssitzungen täglich (10-15 Min. Stoßlüften pro Sitzung)",
      variant: "default" as const
    };
  };

  const weatherRecommendation = getWeatherRecommendation();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Lade Daten...</div>
      </div>
    );
  }

  if (apartments.length === 0) {
    return (
      <div className="space-y-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Willkommen! Bitte legen Sie zunächst eine Wohnung in den Einstellungen an.
          </AlertDescription>
        </Alert>
        <Link to="/settings">
          <Button className="w-full">Zu den Einstellungen</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Übersicht</h2>
        <Link to="/new-entry">
          <Button size="lg" variant="outline" className="shadow-elegant">
            <Plus className="w-5 h-5 mr-2" />
            Neuer Eintrag
          </Button>
        </Link>
      </div>

      {/* Critical Alerts Only */}
      <div className="space-y-3">
        {/* Inactivity warning */}
        {daysSinceLastEntry !== null && daysSinceLastEntry >= 2 && (
          <Alert className="bg-destructive/10 border-destructive">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <AlertDescription className="text-destructive-foreground">
              Achtung: Seit {daysSinceLastEntry} Tagen keine Lüftung dokumentiert. Regelmäßige Dokumentation ist wichtig für den Nachweis ordnungsgemäßer Lüftung.
            </AlertDescription>
          </Alert>
        )}

        {/* Critical humidity warning */}
        {hasCriticalValues && (
          <Alert className="bg-destructive/10 border-destructive">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <AlertDescription className="text-destructive-foreground">
              Kritische Luftfeuchtigkeit erkannt! {criticalEntries.length} Messung(en) über 70%. Verstärkt lüften, um Schimmelbildung zu vermeiden.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {checklistEnabled && apartments.length > 0 && (
        <VentilationChecklist
          apartment={apartments[0]}
          entries={entries}
        />
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Heute
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{todaySessions}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {todaySessions === 1 ? 'Lüftungssitzung' : 'Lüftungssitzungen'}
            </p>
            {todayRoomsVentilated > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {todayRoomsVentilated} {todayRoomsVentilated === 1 ? 'Raum' : 'Räume'} gelüftet
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              7 Tage
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{last7Days.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {last7Days.length === 1 ? 'Sitzung' : 'Sitzungen'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Ø {Math.round(last7Days.length / 7 * 10) / 10} pro Tag
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ø Luftfeuchtigkeit
            </CardTitle>
            <div className={`h-2 w-2 rounded-full ${humidityStatus.bg}`} />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{avgHumidity}%</div>
            <p className={`text-xs mt-1 font-medium ${humidityStatus.color}`}>
              {humidityStatus.text}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Letzte 7 Tage
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Weather Recommendation - Only if actionable */}
      {(() => {
        const currentHour = new Date().getHours();
        const currentMonth = new Date().getMonth();
        let showWeather = false;

        // Winter optimal time window
        if ((currentMonth === 11 || currentMonth === 0 || currentMonth === 1) &&
            currentHour >= 11 && currentHour <= 14) {
          showWeather = true;
        }
        // Summer optimal time windows
        if ((currentMonth >= 5 && currentMonth <= 7) &&
            ((currentHour >= 6 && currentHour <= 8) || (currentHour >= 20 && currentHour <= 23))) {
          showWeather = true;
        }

        if (showWeather) {
          return (
            <Alert>
              {weatherRecommendation.icon}
              <AlertDescription>
                {weatherRecommendation.text}
              </AlertDescription>
            </Alert>
          );
        }
        return null;
      })()}

      {/* Last Entry - Compact */}
      {entries.length > 0 && (
        <div className="text-sm text-muted-foreground">
          {(() => {
            const lastEntry = entries[entries.length - 1];
            const status = getHumidityStatus(lastEntry.humidityBefore);
            return (
              <div className="flex items-center gap-2 flex-wrap">
                <span>Zuletzt:</span>
                <span className="font-medium text-foreground">
                  {lastEntry.rooms?.join(', ') || 'Unbekannter Raum'}
                </span>
                <span>•</span>
                <span>{lastEntry.date} {lastEntry.time}</span>
                <span>•</span>
                <span>{lastEntry.ventilationType}</span>
                <span>•</span>
                <span className={status.color}>{lastEntry.humidityBefore}%</span>
                <span>{lastEntry.tempBefore}°C</span>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
