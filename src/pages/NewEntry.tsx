import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { addEntry, getAllApartments, Apartment, Room } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { VENTILATION_TYPES } from "@/lib/constants";
import { useVentilationRecommendations } from "@/hooks/use-ventilation-recommendations";
import { HumidityIndicator, CriticalAlert } from "@/components/VentilationRecommendation";

type FormStep = "initial" | "timer" | "after-measurements";

const NewEntry = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [loading, setLoading] = useState(false);
  const { checkCritical, getHumidityColor } = useVentilationRecommendations();
  const [step, setStep] = useState<FormStep>("initial");
  const [targetEndTime, setTargetEndTime] = useState<number | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);

  const now = new Date();
  const [formData, setFormData] = useState({
    apartmentId: "",
    date: now.toISOString().split("T")[0],
    time: now.toTimeString().slice(0, 5),
    rooms: [] as string[],
    ventilationType: "",
    duration: "",
    tempBefore: "",
    humidityBefore: "",
    tempAfter: "",
    humidityAfter: "",
    notes: "",
  });

  useEffect(() => {
    loadApartments();
  }, []);

  useEffect(() => {
    if (formData.apartmentId) {
      const apartment = apartments.find((apt) => apt.id === formData.apartmentId);
      if (apartment?.rooms) {
        setFormData((prev) => ({
          ...prev,
          rooms: apartment.rooms.map((room) => room.name),
        }));
      }
    }
  }, [formData.apartmentId, apartments]);

  useEffect(() => {
    if (step === "timer" && targetEndTime !== null) {
      const interval = setInterval(() => {
        const now = Date.now();
        const remaining = Math.max(0, targetEndTime - now);
        const seconds = Math.ceil(remaining / 1000);
        setRemainingSeconds(seconds);

        if (now >= targetEndTime) {
          setStep("after-measurements");
          setTargetEndTime(null);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [step, targetEndTime]);

  const loadApartments = async () => {
    const data = await getAllApartments();
    setApartments(data);
    if (data.length === 1) {
      setFormData((prev) => ({ ...prev, apartmentId: data[0].id }));
    }
  };

  const toggleRoom = (roomName: string) => {
    setFormData((prev) => ({
      ...prev,
      rooms: prev.rooms.includes(roomName)
        ? prev.rooms.filter((r) => r !== roomName)
        : [...prev.rooms, roomName],
    }));
  };

  const getCurrentApartmentRooms = (): Room[] => {
    const apartment = apartments.find((apt) => apt.id === formData.apartmentId);
    return apartment?.rooms || [];
  };

  const handleInitialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.apartmentId || formData.rooms.length === 0 || !formData.ventilationType) {
      toast({
        title: "Fehler",
        description: "Bitte füllen Sie alle Pflichtfelder aus.",
        variant: "destructive",
      });
      return;
    }

    const duration = parseInt(formData.duration);
    if (isNaN(duration) || duration < 1 || duration > 60) {
      toast({
        title: "Fehler",
        description: "Lüftungsdauer muss zwischen 1 und 60 Minuten liegen.",
        variant: "destructive",
      });
      return;
    }

    const tempBefore = parseFloat(formData.tempBefore);
    const humidityBefore = parseFloat(formData.humidityBefore);

    if (isNaN(tempBefore) || isNaN(humidityBefore)) {
      toast({
        title: "Fehler",
        description: "Bitte geben Sie gültige Werte für Temperatur und Luftfeuchtigkeit ein.",
        variant: "destructive",
      });
      return;
    }

    if (humidityBefore < 0 || humidityBefore > 100) {
      toast({
        title: "Fehler",
        description: "Luftfeuchtigkeit muss zwischen 0 und 100% liegen.",
        variant: "destructive",
      });
      return;
    }

    // Start timer - set target end time
    const endTime = Date.now() + duration * 60 * 1000;
    setTargetEndTime(endTime);
    setRemainingSeconds(duration * 60);
    setStep("timer");
  };

  const handleSkipTimer = () => {
    setStep("after-measurements");
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const duration = parseInt(formData.duration);
      const tempBefore = parseFloat(formData.tempBefore);
      const humidityBefore = parseFloat(formData.humidityBefore);

      // Create single entry with multiple rooms
      await addEntry({
        apartmentId: formData.apartmentId,
        date: formData.date,
        time: formData.time,
        rooms: formData.rooms,
        ventilationType: formData.ventilationType,
        duration,
        tempBefore,
        humidityBefore,
        tempAfter: formData.tempAfter ? parseFloat(formData.tempAfter) : undefined,
        humidityAfter: formData.humidityAfter ? parseFloat(formData.humidityAfter) : undefined,
        notes: formData.notes || undefined,
        createdAt: Date.now(),
      });

      const roomsText = formData.rooms.length === 1
        ? formData.rooms[0]
        : `${formData.rooms.length} Räume`;

      toast({
        title: "Erfolgreich gespeichert",
        description: `Lüftungsvorgang für ${roomsText} wurde dokumentiert.`,
      });

      navigate("/");
    } catch (error) {
      console.error("Fehler beim Speichern:", error);
      toast({
        title: "Fehler",
        description: "Eintrag konnte nicht gespeichert werden.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (apartments.length === 0) {
    return (
      <div className="space-y-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Bitte legen Sie zunächst eine Wohnung in den Einstellungen an.
          </AlertDescription>
        </Alert>
        <Button onClick={() => navigate("/settings")} className="w-full">
          Zu den Einstellungen
        </Button>
      </div>
    );
  }

  if (step === "timer") {
    return (
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-foreground mb-6">Lüftungsvorgang läuft</h2>

        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-6">
              <div className="text-6xl font-bold text-primary">
                {formatTime(remainingSeconds)}
              </div>
              <p className="text-muted-foreground text-center">
                Bitte lüften Sie jetzt die ausgewählten Räume.
              </p>
              <div className="w-full space-y-2">
                <p className="text-sm font-medium">Ausgewählte Räume:</p>
                <div className="flex flex-wrap gap-2">
                  {formData.rooms.map((roomName) => {
                    const room = getCurrentApartmentRooms().find((r) => r.name === roomName);
                    return (
                      <span key={roomName} className="px-3 py-1 bg-secondary rounded-full text-sm">
                        {room?.icon} {roomName}
                      </span>
                    );
                  })}
                </div>
              </div>
              <Button
                onClick={handleSkipTimer}
                variant="outline"
                className="w-full"
              >
                Timer überspringen
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === "after-measurements") {
    return (
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-foreground mb-6">Messwerte nach dem Lüften</h2>

        <form onSubmit={handleFinalSubmit} className="space-y-6">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Messwerte erfassen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tempAfter">Temperatur (°C)</Label>
                  <Input
                    id="tempAfter"
                    type="number"
                    step="0.1"
                    value={formData.tempAfter}
                    onChange={(e) =>
                      setFormData({ ...formData, tempAfter: e.target.value })
                    }
                    placeholder="z.B. 19.0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="humidityAfter">Luftfeuchtigkeit (%)</Label>
                  <Input
                    id="humidityAfter"
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={formData.humidityAfter}
                    onChange={(e) =>
                      setFormData({ ...formData, humidityAfter: e.target.value })
                    }
                    placeholder="z.B. 55"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/")}
              className="flex-1"
            >
              Abbrechen
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Speichert..." : "Eintrag speichern"}
            </Button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-foreground mb-6">Neuer Lüftungseintrag</h2>

      <form onSubmit={handleInitialSubmit} className="space-y-6">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Allgemeine Angaben</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {apartments.length > 1 && (
              <div className="space-y-2">
                <Label htmlFor="apartment">Wohnung *</Label>
                <Select
                  value={formData.apartmentId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, apartmentId: value })
                  }
                >
                  <SelectTrigger id="apartment">
                    <SelectValue placeholder="Wohnung auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {apartments.map((apt) => (
                      <SelectItem key={apt.id} value={apt.id}>
                        {apt.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Datum *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Uhrzeit *</Label>
                <Input
                  id="time"
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Räume * {formData.rooms.length > 0 && `(${formData.rooms.length} ausgewählt)`}</Label>
              <div className="grid grid-cols-2 gap-2 p-3 border rounded-md max-h-[200px] overflow-y-auto">
                {getCurrentApartmentRooms().map((room) => (
                  <div key={room.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`room-${room.id}`}
                      checked={formData.rooms.includes(room.name)}
                      onCheckedChange={() => toggleRoom(room.name)}
                    />
                    <label
                      htmlFor={`room-${room.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {room.icon} {room.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ventilationType">Lüftungsart *</Label>
              <Select
                value={formData.ventilationType}
                onValueChange={(value) =>
                  setFormData({ ...formData, ventilationType: value })
                }
              >
                <SelectTrigger id="ventilationType">
                  <SelectValue placeholder="Lüftungsart auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {VENTILATION_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{type.label}</span>
                        <span className="text-xs text-muted-foreground">{type.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Lüftungsdauer (Minuten) *</Label>
              <Input
                id="duration"
                type="number"
                min="1"
                max="60"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                placeholder="z.B. 10"
                required
              />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Messwerte vor dem Lüften</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tempBefore">Temperatur (°C) *</Label>
                <Input
                  id="tempBefore"
                  type="number"
                  step="0.1"
                  value={formData.tempBefore}
                  onChange={(e) =>
                    setFormData({ ...formData, tempBefore: e.target.value })
                  }
                  placeholder="z.B. 21.5"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="humidityBefore">Luftfeuchtigkeit (%) *</Label>
                <Input
                  id="humidityBefore"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={formData.humidityBefore}
                  onChange={(e) =>
                    setFormData({ ...formData, humidityBefore: e.target.value })
                  }
                  placeholder="z.B. 65"
                  required
                />
                {formData.humidityBefore && (
                  <div className="mt-2">
                    <HumidityIndicator
                      humidity={parseFloat(formData.humidityBefore)}
                      size="sm"
                    />
                  </div>
                )}
              </div>
            </div>

            {formData.humidityBefore && parseFloat(formData.humidityBefore) > 60 && (
              <div className="mt-4">
                <CriticalAlert
                  humidity={parseFloat(formData.humidityBefore)}
                  temp={formData.tempBefore ? parseFloat(formData.tempBefore) : undefined}
                />
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/")}
            className="flex-1"
          >
            Abbrechen
          </Button>
          <Button type="submit" className="flex-1">
            Timer starten
          </Button>
        </div>
      </form>
    </div>
  );
};

export default NewEntry;
