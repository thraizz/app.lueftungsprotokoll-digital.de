import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAllEntries, getAllApartments, VentilationEntry, Apartment } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, AlertCircle, CheckCircle, TrendingUp } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Dashboard = () => {
  const [entries, setEntries] = useState<VentilationEntry[]>([]);
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

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
          <Button size="lg" className="shadow-elegant">
            <Plus className="w-5 h-5 mr-2" />
            Neuer Eintrag
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
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

      {last7Days.length < 7 && (
        <Alert className="bg-warning/10 border-warning">
          <AlertCircle className="h-4 w-4 text-warning" />
          <AlertDescription className="text-warning-foreground">
            Tipp: Dokumentieren Sie täglich mindestens 3-4 Lüftungsvorgänge für ein
            rechtssicheres Protokoll gemäß DIN 1946-6.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default Dashboard;
