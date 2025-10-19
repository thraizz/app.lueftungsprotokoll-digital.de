import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { addEntry, getAllApartments, Apartment, Room } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { VENTILATION_TYPES } from "@/lib/constants";
import { useVentilationRecommendations } from "@/hooks/use-ventilation-recommendations";
import { HumidityIndicator, CriticalAlert } from "@/components/VentilationRecommendation";

type FormStep = "initial" | "timer" | "after-measurements";

interface FormData {
  apartmentId: string;
  date: string;
  time: string;
  rooms: string[];
  ventilationType: string;
  duration: string;
  tempBefore: string;
  humidityBefore: string;
  tempAfter?: string;
  humidityAfter?: string;
  notes?: string;
}

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
  const form = useForm<FormData>({
    defaultValues: {
      apartmentId: "",
      date: now.toISOString().split("T")[0],
      time: now.toTimeString().slice(0, 5),
      rooms: [],
      ventilationType: "",
      duration: "",
      tempBefore: "",
      humidityBefore: "",
      tempAfter: "",
      humidityAfter: "",
      notes: "",
    },
  });

  useEffect(() => {
    loadApartments();
  }, []);

  useEffect(() => {
    const apartmentId = form.watch("apartmentId");
    if (apartmentId) {
      const apartment = apartments.find((apt) => apt.id === apartmentId);
      if (apartment?.rooms) {
        form.setValue("rooms", apartment.rooms.map((room) => room.name));
      }
    }
  }, [form.watch("apartmentId"), apartments, form]);

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
      form.setValue("apartmentId", data[0].id);
    }
  };

  const toggleRoom = (roomName: string) => {
    const currentRooms = form.getValues("rooms");
    const newRooms = currentRooms.includes(roomName)
      ? currentRooms.filter((r) => r !== roomName)
      : [...currentRooms, roomName];
    form.setValue("rooms", newRooms);
  };

  const getCurrentApartmentRooms = (): Room[] => {
    const apartment = apartments.find((apt) => apt.id === form.getValues("apartmentId"));
    return apartment?.rooms || [];
  };

  const handleInitialSubmit = (data: FormData) => {
    // Validation
    if (!data.apartmentId || data.rooms.length === 0 || !data.ventilationType) {
      toast({
        title: "Fehler",
        description: "Bitte füllen Sie alle Pflichtfelder aus.",
        variant: "destructive",
      });
      return;
    }

    const duration = parseInt(data.duration);
    if (isNaN(duration) || duration < 1 || duration > 60) {
      toast({
        title: "Fehler",
        description: "Lüftungsdauer muss zwischen 1 und 60 Minuten liegen.",
        variant: "destructive",
      });
      return;
    }

    const tempBefore = parseFloat(data.tempBefore);
    const humidityBefore = parseFloat(data.humidityBefore);

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

  const handleFinalSubmit = async (data: FormData) => {
    setLoading(true);

    try {
      const duration = parseInt(data.duration);
      const tempBefore = parseFloat(data.tempBefore);
      const humidityBefore = parseFloat(data.humidityBefore);

      // Create single entry with multiple rooms
      await addEntry({
        apartmentId: data.apartmentId,
        date: data.date,
        time: data.time,
        rooms: data.rooms,
        ventilationType: data.ventilationType,
        duration,
        tempBefore,
        humidityBefore,
        tempAfter: data.tempAfter ? parseFloat(data.tempAfter) : undefined,
        humidityAfter: data.humidityAfter ? parseFloat(data.humidityAfter) : undefined,
        notes: data.notes || undefined,
        createdAt: Date.now(),
      });

      const roomsText = data.rooms.length === 1
        ? data.rooms[0]
        : `${data.rooms.length} Räume`;

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
    const rooms = form.getValues("rooms");
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
                  {rooms.map((roomName) => {
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

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFinalSubmit)} className="space-y-6">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Messwerte erfassen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="tempAfter"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Temperatur (°C)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="z.B. 19.0"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="humidityAfter"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Luftfeuchtigkeit (%)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            min="0"
                            max="100"
                            placeholder="z.B. 55"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
        </Form>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-foreground mb-6">Neuer Lüftungseintrag</h2>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleInitialSubmit)} className="space-y-6">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Allgemeine Angaben</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {apartments.length > 1 && (
              <FormField
                control={form.control}
                name="apartmentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Wohnung *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Wohnung auswählen" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {apartments.map((apt) => (
                          <SelectItem key={apt.id} value={apt.id}>
                            {apt.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Datum *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} required />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Uhrzeit *</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} required />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="rooms"
              render={() => (
                <FormItem>
                  <FormLabel>
                    Räume * {form.watch("rooms").length > 0 && `(${form.watch("rooms").length} ausgewählt)`}
                  </FormLabel>
                  <div className="grid grid-cols-2 gap-2 p-3 border rounded-md max-h-[200px] overflow-y-auto">
                    {getCurrentApartmentRooms().map((room) => (
                      <div key={room.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`room-${room.id}`}
                          checked={form.watch("rooms").includes(room.name)}
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
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="ventilationType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lüftungsart *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Lüftungsart auswählen" />
                      </SelectTrigger>
                    </FormControl>
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
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="duration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lüftungsdauer (Minuten) *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      max="60"
                      placeholder="z.B. 10"
                      required
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Messwerte vor dem Lüften</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="tempBefore"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Temperatur (°C) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="z.B. 21.5"
                        required
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="humidityBefore"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Luftfeuchtigkeit (%) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        placeholder="z.B. 65"
                        required
                        {...field}
                      />
                    </FormControl>
                    {field.value && (
                      <div className="mt-2">
                        <HumidityIndicator
                          humidity={parseFloat(field.value)}
                          size="sm"
                        />
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {form.watch("humidityBefore") && parseFloat(form.watch("humidityBefore")) > 60 && (
              <div className="mt-4">
                <CriticalAlert
                  humidity={parseFloat(form.watch("humidityBefore"))}
                  temp={form.watch("tempBefore") ? parseFloat(form.watch("tempBefore")) : undefined}
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
      </Form>
    </div>
  );
};

export default NewEntry;
