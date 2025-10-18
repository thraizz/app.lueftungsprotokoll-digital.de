import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { addEntry, getAllApartments, Apartment } from "@/lib/db";
import { Play, StopCircle, Wind } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ROOMS = [
  { value: "Wohnzimmer", label: "Wohnzimmer", icon: "🛋️" },
  { value: "Schlafzimmer", label: "Schlafzimmer", icon: "🛏️" },
  { value: "Küche", label: "Küche", icon: "🍳" },
  { value: "Bad", label: "Bad", icon: "🚿" },
  { value: "Flur", label: "Flur", icon: "🚪" },
  { value: "Arbeitszimmer", label: "Arbeitszimmer", icon: "💼" },
  { value: "Kinderzimmer", label: "Kinderzimmer", icon: "🧸" },
  { value: "Keller", label: "Keller", icon: "🏚️" },
  { value: "Dachboden", label: "Dachboden", icon: "🏠" },
  { value: "Sonstiges", label: "Sonstiges", icon: "📦" },
];

const VENTILATION_TYPES = [
  { value: "Stoßlüften", label: "Stoßlüften", description: "Fenster vollständig öffnen" },
  { value: "Querlüften", label: "Querlüften", description: "Gegenüberliegende Fenster öffnen" },
  { value: "Kipplüften", label: "Kipplüften", description: "Fenster gekippt" },
];

interface QuickStartData {
  apartmentId: string;
  room: string;
  ventilationType: string;
  tempBefore: number;
  humidityBefore: number;
  startTime: string;
  startDate: string;
}

export const QuickStartVentilation = ({ onEntryCreated }: { onEntryCreated?: () => void }) => {
  const [showStartDialog, setShowStartDialog] = useState(false);
  const [showActiveSession, setShowActiveSession] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [sessionData, setSessionData] = useState<QuickStartData | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const { toast } = useToast();

  // Form states
  const [selectedApartment, setSelectedApartment] = useState("");
  const [selectedRoom, setSelectedRoom] = useState("");
  const [selectedVentilationType, setSelectedVentilationType] = useState("");
  const [tempBefore, setTempBefore] = useState("");
  const [humidityBefore, setHumidityBefore] = useState("");

  // Completion form states
  const [tempAfter, setTempAfter] = useState("");
  const [humidityAfter, setHumidityAfter] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    loadApartments();
  }, []);

  // Timer for active session
  useEffect(() => {
    if (!showActiveSession || !sessionData) return;

    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [showActiveSession, sessionData]);

  const loadApartments = async () => {
    try {
      const data = await getAllApartments();
      setApartments(data);
      if (data.length === 1) {
        setSelectedApartment(data[0].id);
      }
    } catch (error) {
      console.error("Fehler beim Laden der Wohnungen:", error);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleStartVentilation = () => {
    // Validation
    if (!selectedApartment) {
      toast({
        title: "Fehler",
        description: "Bitte wählen Sie eine Wohnung aus",
        variant: "destructive",
      });
      return;
    }

    if (!selectedRoom) {
      toast({
        title: "Fehler",
        description: "Bitte wählen Sie einen Raum aus",
        variant: "destructive",
      });
      return;
    }

    if (!selectedVentilationType) {
      toast({
        title: "Fehler",
        description: "Bitte wählen Sie eine Lüftungsart aus",
        variant: "destructive",
      });
      return;
    }

    const tempValue = parseFloat(tempBefore);
    const humidityValue = parseFloat(humidityBefore);

    if (isNaN(tempValue)) {
      toast({
        title: "Fehler",
        description: "Bitte geben Sie eine gültige Temperatur ein",
        variant: "destructive",
      });
      return;
    }

    if (isNaN(humidityValue) || humidityValue < 0 || humidityValue > 100) {
      toast({
        title: "Fehler",
        description: "Bitte geben Sie eine gültige Luftfeuchtigkeit (0-100%) ein",
        variant: "destructive",
      });
      return;
    }

    const now = new Date();
    const sessionInfo: QuickStartData = {
      apartmentId: selectedApartment,
      room: selectedRoom,
      ventilationType: selectedVentilationType,
      tempBefore: tempValue,
      humidityBefore: humidityValue,
      startTime: now.toTimeString().slice(0, 5),
      startDate: now.toISOString().split("T")[0],
    };

    setSessionData(sessionInfo);
    setElapsedSeconds(0);
    setShowStartDialog(false);
    setShowActiveSession(true);

    toast({
      title: "Lüftung gestartet",
      description: `${selectedRoom} - ${selectedVentilationType}`,
    });
  };

  const handleCompleteVentilation = async () => {
    if (!sessionData) return;

    const durationMinutes = Math.round(elapsedSeconds / 60);

    if (durationMinutes < 1) {
      toast({
        title: "Hinweis",
        description: "Die Lüftungsdauer sollte mindestens 1 Minute betragen",
        variant: "destructive",
      });
      return;
    }

    if (durationMinutes > 60) {
      toast({
        title: "Hinweis",
        description: "Die Lüftungsdauer sollte maximal 60 Minuten betragen",
        variant: "destructive",
      });
      return;
    }

    try {
      const entry = {
        apartmentId: sessionData.apartmentId,
        date: sessionData.startDate,
        time: sessionData.startTime,
        room: sessionData.room,
        ventilationType: sessionData.ventilationType,
        duration: durationMinutes,
        tempBefore: sessionData.tempBefore,
        humidityBefore: sessionData.humidityBefore,
        tempAfter: tempAfter ? parseFloat(tempAfter) : undefined,
        humidityAfter: humidityAfter ? parseFloat(humidityAfter) : undefined,
        notes: notes || undefined,
        createdAt: Date.now(),
      };

      await addEntry(entry);

      toast({
        title: "Erfolgreich gespeichert",
        description: `Lüftungsvorgang (${durationMinutes} Min.) wurde dokumentiert`,
      });

      // Reset all states
      resetForm();
      setShowCompleteDialog(false);
      setShowActiveSession(false);

      if (onEntryCreated) {
        onEntryCreated();
      }
    } catch (error) {
      console.error("Fehler beim Speichern:", error);
      toast({
        title: "Fehler",
        description: "Eintrag konnte nicht gespeichert werden",
        variant: "destructive",
      });
    }
  };

  const handleCancelSession = () => {
    setShowActiveSession(false);
    setSessionData(null);
    setElapsedSeconds(0);
    resetForm();

    toast({
      title: "Abgebrochen",
      description: "Lüftungsvorgang wurde abgebrochen",
    });
  };

  const resetForm = () => {
    setSelectedRoom("");
    setSelectedVentilationType("");
    setTempBefore("");
    setHumidityBefore("");
    setTempAfter("");
    setHumidityAfter("");
    setNotes("");
  };

  const openCompleteDialog = () => {
    setShowActiveSession(false);
    setShowCompleteDialog(true);
  };

  return (
    <>
      {/* Quick Start Button */}
      <Button
        size="lg"
        onClick={() => setShowStartDialog(true)}
        className="w-full shadow-elegant bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
      >
        <Wind className="w-5 h-5 mr-2" />
        Lüften beginnen
      </Button>

      {/* Start Dialog */}
      <Dialog open={showStartDialog} onOpenChange={setShowStartDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Lüften beginnen</DialogTitle>
            <DialogDescription>
              Wählen Sie Raum und Lüftungsart aus und geben Sie die aktuellen Messwerte ein
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {apartments.length > 1 && (
              <div className="grid gap-2">
                <Label htmlFor="apartment">Wohnung</Label>
                <Select value={selectedApartment} onValueChange={setSelectedApartment}>
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

            <div className="grid gap-2">
              <Label htmlFor="room">Raum *</Label>
              <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                <SelectTrigger id="room">
                  <SelectValue placeholder="Raum auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {ROOMS.map((room) => (
                    <SelectItem key={room.value} value={room.value}>
                      {room.icon} {room.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="ventilationType">Lüftungsart *</Label>
              <Select value={selectedVentilationType} onValueChange={setSelectedVentilationType}>
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

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="tempBefore">Temperatur (°C) *</Label>
                <Input
                  id="tempBefore"
                  type="number"
                  step="0.1"
                  placeholder="z.B. 21.5"
                  value={tempBefore}
                  onChange={(e) => setTempBefore(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="humidityBefore">Luftfeuchtigkeit (%) *</Label>
                <Input
                  id="humidityBefore"
                  type="number"
                  step="1"
                  min="0"
                  max="100"
                  placeholder="z.B. 65"
                  value={humidityBefore}
                  onChange={(e) => setHumidityBefore(e.target.value)}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStartDialog(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleStartVentilation}>
              <Play className="w-4 h-4 mr-2" />
              Starten
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Active Session Overlay */}
      <Dialog open={showActiveSession} onOpenChange={setShowActiveSession}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wind className="w-5 h-5 animate-pulse text-primary" />
              Lüftung läuft
            </DialogTitle>
            <DialogDescription>
              {sessionData?.room} - {sessionData?.ventilationType}
            </DialogDescription>
          </DialogHeader>

          <div className="py-8">
            <div className="text-center">
              <div className="text-6xl font-bold text-primary mb-2">
                {formatTime(elapsedSeconds)}
              </div>
              <div className="text-sm text-muted-foreground">
                {Math.round(elapsedSeconds / 60)} Minuten
              </div>
            </div>

            <div className="mt-6 p-4 rounded-lg bg-muted/50 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Startzeit:</span>
                <span className="font-medium">{sessionData?.startTime} Uhr</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Temperatur vorher:</span>
                <span className="font-medium">{sessionData?.tempBefore}°C</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Luftfeuchtigkeit vorher:</span>
                <span className="font-medium">{sessionData?.humidityBefore}%</span>
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-col gap-2">
            <Button onClick={openCompleteDialog} className="w-full">
              <StopCircle className="w-4 h-4 mr-2" />
              Lüften beenden
            </Button>
            <Button variant="outline" onClick={handleCancelSession} className="w-full">
              Abbrechen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Completion Dialog */}
      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Lüftung abschließen</DialogTitle>
            <DialogDescription>
              Dauer: {Math.round(elapsedSeconds / 60)} Minuten - Optional: Nachher-Werte eintragen
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="p-4 rounded-lg bg-muted/50 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Raum:</span>
                <span className="font-medium">{sessionData?.room}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Lüftungsart:</span>
                <span className="font-medium">{sessionData?.ventilationType}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Dauer:</span>
                <span className="font-medium">{Math.round(elapsedSeconds / 60)} Minuten</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="tempAfter">Temperatur nachher (°C)</Label>
                <Input
                  id="tempAfter"
                  type="number"
                  step="0.1"
                  placeholder="Optional"
                  value={tempAfter}
                  onChange={(e) => setTempAfter(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="humidityAfter">Luftfeuchtigkeit nachher (%)</Label>
                <Input
                  id="humidityAfter"
                  type="number"
                  step="1"
                  min="0"
                  max="100"
                  placeholder="Optional"
                  value={humidityAfter}
                  onChange={(e) => setHumidityAfter(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Bemerkungen</Label>
              <Textarea
                id="notes"
                placeholder="Optional: Besondere Beobachtungen..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={500}
                rows={3}
              />
              <div className="text-xs text-muted-foreground text-right">
                {notes.length}/500 Zeichen
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCompleteDialog(false);
                setShowActiveSession(true);
              }}
            >
              Zurück
            </Button>
            <Button onClick={handleCompleteVentilation}>
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
