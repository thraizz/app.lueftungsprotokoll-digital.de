import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAllEntries, getAllApartments, VentilationEntry, Apartment } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, AlertCircle, CheckCircle, TrendingUp, Clock, AlertTriangle, CloudRain, Wind as WindIcon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { QuickStartVentilation } from "@/components/QuickStartVentilation";
import { useVentilationRecommendations } from "@/hooks/use-ventilation-recommendations";
import { VentilationRecommendationCard } from "@/components/VentilationRecommendation";
import { ROOMS } from "@/lib/constants";

const Dashboard = () => {
  const [entries, setEntries] = useState<VentilationEntry[]>([]);
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextVentilationTime, setNextVentilationTime] = useState<string>("");
  const { getRecommendation, currentApartment } = useVentilationRecommendations();
  const [selectedRoom, setSelectedRoom] = useState<string>("");

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Update countdown timer every minute
    const updateNextVentilation = () => {
      if (todayEntries.length === 0) {
        setNextVentilationTime("Heute noch nicht gelüftet");
        return;
      }

      // Get last entry time today
      const lastEntry = todayEntries[todayEntries.length - 1];
      const lastTime = new Date(`${lastEntry.date}T${lastEntry.time}`);

      // Recommend next ventilation 3 hours after last one
      const nextTime = new Date(lastTime.getTime() + 3 * 60 * 60 * 1000);
      const now = new Date();

      if (now >= nextTime) {
        setNextVentilationTime("Jetzt lüften empfohlen");
      } else {
        const diffMs = nextTime.getTime() - now.getTime();
        const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        setNextVentilationTime(`in ${diffHrs}h ${diffMins}min`);
      }
    };

    updateNextVentilation();
    const interval = setInterval(updateNextVentilation, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [entries]);

  const loadData = async () => {
    try {
      const [entriesData, apartmentsData] = await Promise.all([
        getAllEntries(),
        getAllApartments(),
      ]);
      setEntries(entriesData);
      setApartments(apartmentsData);
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

  // Weather-based recommendations
  const getWeatherRecommendation = () => {
    const currentHour = new Date().getHours();
    const currentMonth = new Date().getMonth();

    // Winter months (Dec, Jan, Feb)
    if (currentMonth === 11 || currentMonth === 0 || currentMonth === 1) {
      if (currentHour >= 11 && currentHour <= 14) {
        return {
          icon: <CloudRain className="h-4 w-4" />,
          text: "Optimal: Mittags lüften während wärmster Tageszeit",
          variant: "default" as const
        };
      }
      return {
        icon: <AlertCircle className="h-4 w-4" />,
        text: "Winter: Kurz und kräftig lüften (5-10 Min.)",
        variant: "default" as const
      };
    }

    // Summer months (Jun, Jul, Aug)
    if (currentMonth >= 5 && currentMonth <= 7) {
      if (currentHour >= 6 && currentHour <= 8) {
        return {
          icon: <WindIcon className="h-4 w-4" />,
          text: "Optimal: Morgens lüften bevor es heiß wird",
          variant: "default" as const
        };
      }
      if (currentHour >= 20 && currentHour <= 23) {
        return {
          icon: <WindIcon className="h-4 w-4" />,
          text: "Optimal: Abends lüften wenn es kühler wird",
          variant: "default" as const
        };
      }
      return {
        icon: <AlertCircle className="h-4 w-4" />,
        text: "Sommer: Morgens/abends lüften, tagsüber Fenster geschlossen halten",
        variant: "default" as const
      };
    }

    // Default recommendation
    return {
      icon: <WindIcon className="h-4 w-4" />,
      text: "Regelmäßig 3-4 mal täglich für 5-15 Min. lüften",
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

      {/* Quick Start Ventilation Button */}
      <QuickStartVentilation onEntryCreated={loadData} />

      {/* Current Hints Section */}
      <div className="space-y-3">
        {/* No ventilation today warning */}
        {todayEntries.length === 0 && (
          <Alert className="bg-warning/10 border-warning">
            <AlertCircle className="h-4 w-4 text-warning" />
            <AlertDescription className="text-warning-foreground">
              Heute wurde noch nicht gelüftet. Für ein gesundes Raumklima sollten Sie 3-4 mal täglich lüften.
            </AlertDescription>
          </Alert>
        )}

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

        {/* Weather-based recommendation */}
        <Alert>
          {weatherRecommendation.icon}
          <AlertDescription>
            {weatherRecommendation.text}
          </AlertDescription>
        </Alert>
      </div>

      {/* Smart Recommendation Card */}
      {currentApartment && selectedRoom && (
        <VentilationRecommendationCard
          recommendation={getRecommendation(selectedRoom)}
          onAction={() => window.location.href = `/new-entry?room=${selectedRoom}`}
          actionLabel="Jetzt lüften"
          showDINInfo={true}
        />
      )}

      {/* Room Selection for Recommendation */}
      {currentApartment && !selectedRoom && ROOMS.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Lüftungsempfehlung für Raum</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Wählen Sie einen Raum, um eine spezifische Lüftungsempfehlung zu erhalten:
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {ROOMS.slice(0, 6).map((room) => (
                <Button
                  key={room.value}
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedRoom(room.value)}
                  className="justify-start"
                >
                  <span className="mr-2">{room.icon}</span>
                  {room.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Heute
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{todayEntries.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Lüftungsvorgänge dokumentiert
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Nächste Lüftung
            </CardTitle>
            <Clock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{nextVentilationTime}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Empfohlener Zeitpunkt
            </p>
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
              Einträge in der letzten Woche
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
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {/* Total Entries Card */}
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Gesamt
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{entries.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Lüftungsvorgänge insgesamt
            </p>
          </CardContent>
        </Card>

        {/* Last Entry Card */}
        {entries.length > 0 && (
          <Card className="shadow-card md:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Letzter Eintrag
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const lastEntry = entries[entries.length - 1];
                const status = getHumidityStatus(lastEntry.humidityBefore);
                return (
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-foreground">{lastEntry.room}</div>
                      <div className="text-sm text-muted-foreground">
                        {lastEntry.date} • {lastEntry.time} • {lastEntry.ventilationType}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-medium ${status.color}`}>
                        {lastEntry.humidityBefore}%
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {lastEntry.tempBefore}°C
                      </div>
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        )}
      </div>

      {entries.length > 0 && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Letzte Einträge</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {entries
                .slice(-5)
                .reverse()
                .map((entry) => {
                  const status = getHumidityStatus(entry.humidityBefore);
                  return (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-foreground">{entry.room}</div>
                        <div className="text-sm text-muted-foreground">
                          {entry.date} • {entry.time} • {entry.ventilationType}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-medium ${status.color}`}>
                          {entry.humidityBefore}%
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {entry.tempBefore}°C
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;
