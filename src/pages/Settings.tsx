import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import {
  getAllApartments,
  addApartment,
  deleteApartment,
  updateApartment,
  getDefaultRooms,
  getMetadata,
  setMetadata,
  Apartment,
} from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Home, ChevronDown, ChevronUp, ClipboardCheck, Bell } from "lucide-react";
import { RoomManagement } from "@/components/RoomManagement";
import { NotificationSettings } from "@/components/NotificationSettings";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DataExportImport } from "@/components/DataExportImport";

interface ApartmentFormData {
  name: string;
  address: string;
  size: string;
}

const Settings = () => {
  const { toast } = useToast();
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [expandedRooms, setExpandedRooms] = useState<string | null>(null);
  const [checklistEnabled, setChecklistEnabled] = useState(true);

  const form = useForm<ApartmentFormData>({
    defaultValues: {
      name: "",
      address: "",
      size: "",
    },
  });

  useEffect(() => {
    loadApartments();
    loadSettings();
  }, []);

  const loadApartments = async () => {
    const data = await getAllApartments();
    setApartments(data);
    if (data.length === 0) {
      setShowAddForm(true);
    }
  };

  const loadSettings = async () => {
    const checklistSetting = await getMetadata("checklist-enabled");
    if (checklistSetting) {
      setChecklistEnabled(checklistSetting.value as boolean);
    }
  };

  const handleChecklistToggle = async (enabled: boolean) => {
    setChecklistEnabled(enabled);
    await setMetadata("checklist-enabled", enabled);
    toast({
      title: "Einstellung gespeichert",
      description: `Tägliche Checkliste ${enabled ? "aktiviert" : "deaktiviert"}.`,
    });
  };

  const handleSubmit = async (data: ApartmentFormData) => {
    if (!data.name || !data.address || !data.size) {
      toast({
        title: "Fehler",
        description: "Bitte füllen Sie alle Felder aus.",
        variant: "destructive",
      });
      return;
    }

    const size = parseFloat(data.size);
    if (isNaN(size) || size <= 0) {
      toast({
        title: "Fehler",
        description: "Bitte geben Sie eine gültige Wohnungsgröße ein.",
        variant: "destructive",
      });
      return;
    }

    try {
      const newApartment: Apartment = {
        id: `apt-${Date.now()}`,
        name: data.name,
        address: data.address,
        size,
        rooms: getDefaultRooms(),
        createdAt: Date.now(),
      };

      await addApartment(newApartment);
      await loadApartments();

      toast({
        title: "Erfolgreich",
        description: "Wohnung wurde hinzugefügt.",
      });

      form.reset();
      setShowAddForm(false);
    } catch (error) {
      console.error("Fehler beim Hinzufügen:", error);
      toast({
        title: "Fehler",
        description: "Wohnung konnte nicht hinzugefügt werden.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      await deleteApartment(deleteId);
      await loadApartments();

      toast({
        title: "Erfolgreich",
        description: "Wohnung wurde gelöscht.",
      });
    } catch (error) {
      console.error("Fehler beim Löschen:", error);
      toast({
        title: "Fehler",
        description: "Wohnung konnte nicht gelöscht werden.",
        variant: "destructive",
      });
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Einstellungen</h2>

      <Card className="shadow-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Home className="w-5 h-5" />
              Wohnungen verwalten
            </CardTitle>
            {!showAddForm && (
              <Button onClick={() => setShowAddForm(true)} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Hinzufügen
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {showAddForm && (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 p-4 bg-muted/50 rounded-lg">
                <h3 className="font-semibold text-foreground">Neue Wohnung hinzufügen</h3>

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bezeichnung *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="z.B. Hauptwohnung, Apartment 3.OG"
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
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Adresse *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="z.B. Musterstraße 123, 12345 Musterstadt"
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
                  name="size"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Wohnungsgröße (m²) *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="z.B. 75.5"
                          required
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowAddForm(false);
                      form.reset();
                    }}
                    className="flex-1"
                  >
                    Abbrechen
                  </Button>
                  <Button type="submit" className="flex-1">
                    Speichern
                  </Button>
                </div>
              </form>
            </Form>
          )}

          <div className="space-y-3">
            {apartments.length === 0 && !showAddForm ? (
              <p className="text-center text-muted-foreground py-8">
                Keine Wohnungen vorhanden. Fügen Sie Ihre erste Wohnung hinzu.
              </p>
            ) : (
              apartments.map((apt) => (
                <div
                  key={apt.id}
                  className="bg-card rounded-lg border border-border hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-center justify-between p-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{apt.name}</h3>
                      <p className="text-sm text-muted-foreground">{apt.address}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Größe: {apt.size} m² • {apt.rooms?.length || 0} Räume
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setExpandedRooms(expandedRooms === apt.id ? null : apt.id)}
                      >
                        {expandedRooms === apt.id ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setDeleteId(apt.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {expandedRooms === apt.id && (
                    <div className="px-4 pb-4 border-t border-border pt-4">
                      <h4 className="font-medium mb-3">Räume verwalten</h4>
                      <RoomManagement
                        rooms={apt.rooms || []}
                        onChange={async (newRooms) => {
                          const updatedApartment = { ...apt, rooms: newRooms };
                          await updateApartment(updatedApartment);
                          await loadApartments();
                          toast({
                            title: "Erfolgreich",
                            description: "Räume wurden aktualisiert.",
                          });
                        }}
                      />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            <CardTitle>Erinnerungen</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <NotificationSettings />
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5" />
            <CardTitle>Tägliche Checkliste</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium">Checkliste aktivieren</p>
              <p className="text-sm text-muted-foreground">
                Zeigt auf dem Dashboard eine Übersicht, welche Räume heute schon gelüftet wurden.
              </p>
            </div>
            <Switch
              checked={checklistEnabled}
              onCheckedChange={handleChecklistToggle}
            />
          </div>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>Die Checkliste hilft dabei:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Keine Räume beim Lüften zu vergessen</li>
              <li>Eine tägliche Lüftungsroutine zu etablieren</li>
              <li>Auf einen Blick zu sehen, was noch zu tun ist</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <DataExportImport />

      <Card className="shadow-card bg-muted/30">
        <CardHeader>
          <CardTitle className="text-base">Rechtlicher Hinweis & DIN 1946-6</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-3">
          <div>
            <p className="font-medium text-foreground mb-1">Was dokumentiert diese App?</p>
            <p>
              Diese App dokumentiert Ihre <strong>Nennlüftung</strong> und <strong>Intensivlüftung</strong> durch
              manuelles Stoßlüften (DIN 1946-6 Lüftungsstufen 2 & 3).
            </p>
          </div>

          <div>
            <p className="font-medium text-foreground mb-1">Was ist die DIN 1946-6?</p>
            <p>
              Die DIN 1946-6 ist ein <strong>Planungs- und Baustandard</strong> für Lüftungskonzepte, kein Gesetz.
              Sie wird aber rechtlich relevant durch:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2 mt-2">
              <li><strong>Gebäudeenergiegesetz (GEG):</strong> Verweist auf "anerkannte Regeln der Technik"</li>
              <li><strong>Landesbauordnungen:</strong> Fordern "gesunde Wohnverhältnisse" und ausreichende Lüftung</li>
              <li><strong>BGB § 535:</strong> Vermieter muss Mietsache in gebrauchsfähigem Zustand erhalten</li>
            </ul>
            <p className="mt-2">
              Bei Nichteinhaltung können Gewährleistungsansprüche oder Schadensersatzforderungen entstehen.
            </p>
          </div>

          <div>
            <p className="font-medium text-foreground mb-1">Ihre Lüftungspflicht als Mieter/Nutzer</p>
            <p>
              Nach aktueller Rechtsprechung müssen Mieter <strong>2-4 mal täglich</strong> stoßlüften,
              plus zusätzlich nach feuchteintensiven Tätigkeiten (Duschen, Kochen, Wäschetrocknen).
            </p>
          </div>

          <div>
            <p className="font-medium text-foreground mb-1">DIN 1946-6 Lüftungsstufen</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><strong>Stufe 1 - Feuchteschutz:</strong> Nutzerunabhängig (z.B. Fensterfalzlüfter) - Vermieterverantwortung</li>
              <li><strong>Stufe 2 - Nennlüftung:</strong> Tägliche Lüftung durch Stoßlüften - Ihre Verantwortung</li>
              <li><strong>Stufe 3 - Intensivlüftung:</strong> Nach Duschen, Kochen etc. - Ihre Verantwortung</li>
            </ul>
            <p className="mt-2">
              Diese App dokumentiert <strong>Stufe 2 & 3</strong> - Ihre aktive Lüftung.
            </p>
          </div>

          <div>
            <p className="font-medium text-foreground mb-1">Nutzen des Protokolls</p>
            <p>
              Ein ordnungsgemäß geführtes Lüftungsprotokoll kann bei Schimmelproblemen,
              Versicherungsfällen und Mietstreitigkeiten als Nachweis dienen, dass Sie
              Ihrer Lüftungspflicht nachgekommen sind.
            </p>
          </div>

          <p className="font-medium text-foreground pt-2">
            Die App ersetzt keine rechtliche oder bauphysikalische Beratung.
          </p>

          <div className="pt-3 border-t border-border">
            <Link
              to="/hilfe"
              className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
            >
              Weitere Informationen in der Hilfe
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Wohnung löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Sind Sie sicher, dass Sie diese Wohnung löschen möchten? Diese Aktion kann
              nicht rückgängig gemacht werden. Alle zugehörigen Lüftungseinträge bleiben
              erhalten.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Settings;
