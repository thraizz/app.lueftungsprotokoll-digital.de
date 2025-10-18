import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, Upload, AlertCircle, FileText } from "lucide-react";
import {
  exportDataAsJSON,
  exportDataAsCSV,
  importData,
  getAllEntries,
  getEntriesByApartment,
  getAllApartments,
  Apartment,
} from "@/lib/db";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  generateVentilationProtocolPDF,
  downloadPDF,
  generatePDFFilename,
} from "@/lib/pdf-generator";

export function DataExportImport() {
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [pdfDialogOpen, setPdfDialogOpen] = useState(false);
  const [importMode, setImportMode] = useState<"merge" | "replace">("merge");
  const [importFile, setImportFile] = useState<File | null>(null);
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [selectedApartmentId, setSelectedApartmentId] = useState<string>("");
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const { toast } = useToast();

  // Load apartments when PDF dialog opens
  const handleOpenPdfDialog = async () => {
    const apts = await getAllApartments();
    setApartments(apts);
    if (apts.length === 1) {
      setSelectedApartmentId(apts[0].id);
    }
    setPdfDialogOpen(true);
  };

  const handleExportJSON = async () => {
    try {
      const jsonData = await exportDataAsJSON();
      const blob = new Blob([jsonData], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `lueftungsprotokoll-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Export erfolgreich",
        description: "Ihre Daten wurden als JSON exportiert.",
      });
    } catch (error) {
      toast({
        title: "Export fehlgeschlagen",
        description: "Es ist ein Fehler beim Exportieren aufgetreten.",
        variant: "destructive",
      });
    }
  };

  const handleExportCSV = async () => {
    try {
      const csvData = await exportDataAsCSV();
      const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `lueftungsprotokoll-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Export erfolgreich",
        description: "Ihre Daten wurden als CSV exportiert.",
      });
    } catch (error) {
      toast({
        title: "Export fehlgeschlagen",
        description: "Es ist ein Fehler beim Exportieren aufgetreten.",
        variant: "destructive",
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImportFile(file);
    }
  };

  const handleImport = async () => {
    if (!importFile) {
      toast({
        title: "Keine Datei ausgewählt",
        description: "Bitte wählen Sie eine Datei zum Importieren aus.",
        variant: "destructive",
      });
      return;
    }

    try {
      const fileContent = await importFile.text();
      const data = JSON.parse(fileContent);

      // Validate data structure
      if (!data.version || !data.data || !data.data.entries || !data.data.apartments) {
        throw new Error("Invalid file format");
      }

      const result = await importData(data, importMode);

      toast({
        title: "Import erfolgreich",
        description: `${result.imported.entries} Einträge und ${result.imported.apartments} Wohnungen importiert.`,
      });

      setImportDialogOpen(false);
      setImportFile(null);
      window.location.reload();
    } catch (error) {
      toast({
        title: "Import fehlgeschlagen",
        description: error instanceof Error ? error.message : "Ungültiges Dateiformat.",
        variant: "destructive",
      });
    }
  };

  const handleExportPDF = async () => {
    if (!selectedApartmentId) {
      toast({
        title: "Fehler",
        description: "Bitte wählen Sie eine Wohnung aus.",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingPDF(true);

    try {
      const apartment = apartments.find((a) => a.id === selectedApartmentId);
      if (!apartment) {
        throw new Error("Wohnung nicht gefunden");
      }

      const entries = await getEntriesByApartment(selectedApartmentId);

      if (entries.length === 0) {
        toast({
          title: "Keine Einträge",
          description: "Für diese Wohnung sind keine Lüftungseinträge vorhanden.",
          variant: "destructive",
        });
        setIsGeneratingPDF(false);
        return;
      }

      const pdfBlob = await generateVentilationProtocolPDF({
        entries,
        apartment,
      });

      const filename = generatePDFFilename(apartment);
      downloadPDF(pdfBlob, filename);

      toast({
        title: "PDF erfolgreich erstellt",
        description: `Das Lüftungsprotokoll wurde als "${filename}" heruntergeladen.`,
      });

      setPdfDialogOpen(false);
      setSelectedApartmentId("");
    } catch (error) {
      console.error("PDF generation error:", error);
      toast({
        title: "PDF-Erstellung fehlgeschlagen",
        description: error instanceof Error ? error.message : "Es ist ein Fehler aufgetreten.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Datenexport & Import</CardTitle>
          <CardDescription>
            Exportieren Sie Ihre Daten als Backup oder importieren Sie vorhandene Daten
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="text-sm font-medium mb-2">Rechtssicheres PDF-Protokoll</h3>
            <Button onClick={handleOpenPdfDialog} className="w-full" variant="default">
              <FileText className="mr-2 h-4 w-4" />
              PDF-Protokoll erstellen
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Erstellt ein rechtsgültiges Lüftungsprotokoll mit Integritätsprüfung gemäß DIN 1946-6
            </p>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-2">Daten exportieren</h3>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button onClick={handleExportJSON} className="flex-1" variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Als JSON exportieren
              </Button>
              <Button onClick={handleExportCSV} className="flex-1" variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Als CSV exportieren
              </Button>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-2">Daten importieren</h3>
            <Button onClick={() => setImportDialogOpen(true)} variant="outline" className="w-full">
              <Upload className="mr-2 h-4 w-4" />
              Daten importieren
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={pdfDialogOpen} onOpenChange={setPdfDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rechtssicheres PDF-Protokoll erstellen</DialogTitle>
            <DialogDescription>
              Erstellen Sie ein rechtsgültiges Lüftungsprotokoll gemäß DIN 1946-6
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {apartments.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Keine Wohnungen vorhanden. Bitte legen Sie zunächst eine Wohnung in den
                  Einstellungen an.
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="apartment-select">Wohnung auswählen</Label>
                  <Select value={selectedApartmentId} onValueChange={setSelectedApartmentId}>
                    <SelectTrigger id="apartment-select">
                      <SelectValue placeholder="Wohnung auswählen..." />
                    </SelectTrigger>
                    <SelectContent>
                      {apartments.map((apt) => (
                        <SelectItem key={apt.id} value={apt.id}>
                          {apt.name} - {apt.address}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Das PDF enthält alle Lüftungseinträge der ausgewählten Wohnung mit
                    SHA-256-Hash zur Integritätsprüfung. Das Dokument ist rechtsgültig und
                    kann als Nachweis verwendet werden.
                  </AlertDescription>
                </Alert>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPdfDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button
              onClick={handleExportPDF}
              disabled={!selectedApartmentId || isGeneratingPDF}
            >
              {isGeneratingPDF ? "Erstelle PDF..." : "PDF erstellen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Daten importieren</DialogTitle>
            <DialogDescription>
              Importieren Sie Daten aus einer JSON-Backup-Datei
            </DialogDescription>
          </DialogHeader>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Ein Backup Ihrer aktuellen Daten wird vor dem Import automatisch erstellt.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div>
              <Label htmlFor="file-upload">Datei auswählen</Label>
              <input
                id="file-upload"
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="mt-2 w-full text-sm file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90"
              />
              {importFile && (
                <p className="mt-2 text-sm text-muted-foreground">
                  Ausgewählt: {importFile.name}
                </p>
              )}
            </div>

            <div>
              <Label>Import-Modus</Label>
              <RadioGroup value={importMode} onValueChange={(v) => setImportMode(v as "merge" | "replace")}>
                <div className="flex items-center space-x-2 mt-2">
                  <RadioGroupItem value="merge" id="merge" />
                  <Label htmlFor="merge" className="font-normal">
                    Zusammenführen - Neue Daten zu bestehenden hinzufügen
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="replace" id="replace" />
                  <Label htmlFor="replace" className="font-normal">
                    Ersetzen - Alle bestehenden Daten löschen
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleImport}>Importieren</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
