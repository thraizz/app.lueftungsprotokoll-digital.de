import { useEffect, useState } from "react";
import { getAllEntries, getAllApartments, VentilationEntry, Apartment } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter, Calendar } from "lucide-react";

const Protocol = () => {
  const [entries, setEntries] = useState<VentilationEntry[]>([]);
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<VentilationEntry[]>([]);
  const [filterRoom, setFilterRoom] = useState<string>("all");
  const [filterApartment, setFilterApartment] = useState<string>("all");
  const [searchDate, setSearchDate] = useState<string>("");

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [entries, filterRoom, filterApartment, searchDate]);

  const loadData = async () => {
    const [entriesData, apartmentsData] = await Promise.all([
      getAllEntries(),
      getAllApartments(),
    ]);
    setEntries(entriesData.reverse());
    setApartments(apartmentsData);
  };

  const applyFilters = () => {
    let filtered = [...entries];

    if (filterRoom !== "all") {
      filtered = filtered.filter((e) => e.room === filterRoom);
    }

    if (filterApartment !== "all") {
      filtered = filtered.filter((e) => e.apartmentId === filterApartment);
    }

    if (searchDate) {
      filtered = filtered.filter((e) => e.date === searchDate);
    }

    setFilteredEntries(filtered);
  };

  const resetFilters = () => {
    setFilterRoom("all");
    setFilterApartment("all");
    setSearchDate("");
  };

  const getHumidityColor = (humidity: number) => {
    if (humidity <= 60) return "text-success";
    if (humidity <= 70) return "text-warning";
    return "text-destructive";
  };

  const uniqueRooms = Array.from(new Set(entries.map((e) => e.room)));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Lüftungsprotokoll</h2>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="w-4 h-4" />
          {filteredEntries.length} Einträge
        </div>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filter
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Datum</label>
              <Input
                type="date"
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
                placeholder="Datum filtern"
              />
            </div>

            {apartments.length > 1 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Wohnung</label>
                <Select value={filterApartment} onValueChange={setFilterApartment}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Wohnungen</SelectItem>
                    {apartments.map((apt) => (
                      <SelectItem key={apt.id} value={apt.id}>
                        {apt.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Raum</label>
              <Select value={filterRoom} onValueChange={setFilterRoom}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Räume</SelectItem>
                  {uniqueRooms.map((room) => (
                    <SelectItem key={room} value={room}>
                      {room}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {(filterRoom !== "all" || filterApartment !== "all" || searchDate) && (
            <Button variant="outline" onClick={resetFilters} size="sm">
              Filter zurücksetzen
            </Button>
          )}
        </CardContent>
      </Card>

      <div className="space-y-3">
        {filteredEntries.length === 0 ? (
          <Card className="shadow-card">
            <CardContent className="py-12 text-center text-muted-foreground">
              Keine Einträge gefunden.
            </CardContent>
          </Card>
        ) : (
          filteredEntries.map((entry) => (
            <Card key={entry.id} className="shadow-card hover:shadow-elegant transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-lg text-foreground">
                        {entry.room}
                      </h3>
                      <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
                        {entry.ventilationType}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">Datum:</span>
                        <div className="font-medium text-foreground">{entry.date}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Uhrzeit:</span>
                        <div className="font-medium text-foreground">{entry.time}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Dauer:</span>
                        <div className="font-medium text-foreground">
                          {entry.duration} Min
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Temperatur:</span>
                        <div className="font-medium text-foreground">
                          {entry.tempBefore}°C
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          Luftfeuchtigkeit vorher:
                        </span>
                        <span
                          className={`text-sm font-bold ${getHumidityColor(
                            entry.humidityBefore
                          )}`}
                        >
                          {entry.humidityBefore}%
                        </span>
                      </div>
                      {entry.humidityAfter !== undefined && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">nachher:</span>
                          <span
                            className={`text-sm font-bold ${getHumidityColor(
                              entry.humidityAfter
                            )}`}
                          >
                            {entry.humidityAfter}%
                          </span>
                        </div>
                      )}
                    </div>

                    {entry.notes && (
                      <div className="pt-2 border-t border-border">
                        <span className="text-sm text-muted-foreground">Bemerkungen:</span>
                        <p className="text-sm text-foreground mt-1">{entry.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Protocol;
