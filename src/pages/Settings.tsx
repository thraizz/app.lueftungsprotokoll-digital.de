import { useEffect, useState } from "react";
import {
  getAllApartments,
  addApartment,
  deleteApartment,
  Apartment,
} from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Home } from "lucide-react";
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

const Settings = () => {
  const { toast } = useToast();
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    size: "",
  });

  useEffect(() => {
    loadApartments();
  }, []);

  const loadApartments = async () => {
    const data = await getAllApartments();
    setApartments(data);
    if (data.length === 0) {
      setShowAddForm(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.address || !formData.size) {
      toast({
        title: "Fehler",
        description: "Bitte füllen Sie alle Felder aus.",
        variant: "destructive",
      });
      return;
    }

    const size = parseFloat(formData.size);
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
        name: formData.name,
        address: formData.address,
        size,
        createdAt: Date.now(),
      };

      await addApartment(newApartment);
      await loadApartments();

      toast({
        title: "Erfolgreich",
        description: "Wohnung wurde hinzugefügt.",
      });

      setFormData({ name: "", address: "", size: "" });
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
            <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-muted/50 rounded-lg">
              <h3 className="font-semibold text-foreground">Neue Wohnung hinzufügen</h3>

              <div className="space-y-2">
                <Label htmlFor="name">Bezeichnung *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="z.B. Hauptwohnung, Apartment 3.OG"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Adresse *</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  placeholder="z.B. Musterstraße 123, 12345 Musterstadt"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="size">Wohnungsgröße (m²) *</Label>
                <Input
                  id="size"
                  type="number"
                  step="0.1"
                  value={formData.size}
                  onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                  placeholder="z.B. 75.5"
                  required
                />
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddForm(false);
                    setFormData({ name: "", address: "", size: "" });
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
                  className="flex items-center justify-between p-4 bg-card rounded-lg border border-border hover:border-primary/50 transition-colors"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{apt.name}</h3>
                    <p className="text-sm text-muted-foreground">{apt.address}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Größe: {apt.size} m²
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setDeleteId(apt.id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <DataExportImport />

      <Card className="shadow-card bg-muted/30">
        <CardHeader>
          <CardTitle className="text-base">Rechtlicher Hinweis</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            Diese App dient zur Dokumentation Ihres Lüftungsverhaltens gemäß deutscher
            Rechtsprechung und DIN 1946-6.
          </p>
          <p>
            Ein ordnungsgemäß geführtes Lüftungsprotokoll kann bei Schimmelproblemen,
            Versicherungsfällen und Mietstreitigkeiten als Nachweis dienen.
          </p>
          <p className="font-medium text-foreground">
            Die App ersetzt keine rechtliche oder bauphysikalische Beratung.
          </p>
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
