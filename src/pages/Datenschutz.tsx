import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Shield } from "lucide-react";
import { Link } from "react-router-dom";

const Datenschutz = () => {
  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-8">
      <Link
        to="/settings"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Zurück zu Einstellungen
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Datenschutzerklärung</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <section>
            <h3 className="font-semibold text-lg mb-3">1. Datenschutz auf einen Blick</h3>
            <div className="space-y-3 text-muted-foreground">
              <p>
                Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen Daten passiert,
                wenn Sie diese Progressive Web App nutzen.
              </p>
              <p className="font-medium text-foreground">
                Verantwortliche Stelle für die Datenverarbeitung:
              </p>
              <address className="not-italic space-y-1">
                <p>Aron Schüler IT Services</p>
                <p>Karlstr. 17-19, 50679 Köln, Deutschland</p>
                <p>
                  E-Mail:{" "}
                  <a href="mailto:aron@schueler.io" className="text-primary hover:underline">
                    aron@schueler.io
                  </a>
                </p>
              </address>
            </div>
          </section>

          <section className="bg-primary/5 p-4 rounded-lg border border-primary/20">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p className="font-semibold text-foreground">Vollständig Offline-First und Lokal</p>
                <p className="text-sm text-muted-foreground">
                  Diese Progressive Web App (PWA) speichert ALLE Ihre Daten ausschließlich lokal auf Ihrem Gerät.
                  Es gibt KEINE Server-Übertragung, KEINE Cloud-Synchronisation und KEINE Weitergabe an Dritte.
                  Ihre Daten verlassen niemals Ihr Gerät.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h3 className="font-semibold text-lg mb-3">2. IndexedDB - Lokale Datenspeicherung</h3>
            <div className="space-y-3 text-muted-foreground">
              <p>Die App nutzt IndexedDB, eine Browser-Datenbank, um folgende Daten lokal zu speichern:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>
                  <strong className="text-foreground">Wohnungsdaten:</strong> Name, Adresse, Größe und Raumkonfigurationen
                  Ihrer Wohnungen
                </li>
                <li>
                  <strong className="text-foreground">Lüftungseinträge:</strong> Datum, Uhrzeit, Räume, Temperaturen,
                  Luftfeuchtigkeit und Lüftungsdauer
                </li>
                <li>
                  <strong className="text-foreground">App-Einstellungen:</strong> Theme-Präferenzen und
                  Checklisten-Einstellungen
                </li>
              </ul>
              <div className="pt-2 space-y-1">
                <p>
                  <strong className="text-foreground">Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. b DSGVO
                  (Bereitstellung der App-Funktionalität)
                </p>
                <p>
                  <strong className="text-foreground">Speicherdauer:</strong> Unbegrenzt, bis Sie die Daten manuell
                  löschen oder den Browser-Cache leeren
                </p>
              </div>
            </div>
          </section>

          <section>
            <h3 className="font-semibold text-lg mb-3">3. Service Worker - Offline-Funktionalität</h3>
            <div className="space-y-3 text-muted-foreground">
              <p>Die App nutzt einen Service Worker, um folgende Funktionen bereitzustellen:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>
                  <strong className="text-foreground">Offline-Verfügbarkeit:</strong> App-Dateien (HTML, CSS, JavaScript)
                  werden lokal gecacht
                </li>
                <li>
                  <strong className="text-foreground">Schnellere Ladezeiten:</strong> Wiederholte Besuche laden gecachte
                  Ressourcen
                </li>
                <li>
                  <strong className="text-foreground">Installierbarkeit:</strong> Ermöglicht Installation der App auf Ihrem
                  Gerät wie eine native App
                </li>
              </ul>
              <div className="pt-2 space-y-1">
                <p>
                  <strong className="text-foreground">Keine Tracking-Funktion:</strong> Der Service Worker wird ausschließlich
                  für technische Zwecke eingesetzt, nicht für Nutzeranalyse oder Tracking.
                </p>
                <p>
                  <strong className="text-foreground">Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. f DSGVO (Berechtigtes
                  Interesse an optimaler App-Performance)
                </p>
              </div>
            </div>
          </section>

          <section>
            <h3 className="font-semibold text-lg mb-3">4. Cookies und Local Storage</h3>
            <div className="space-y-3 text-muted-foreground">
              <p>Die App verwendet ausschließlich technisch notwendige Cookies und Local Storage für:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Theme-Präferenz (Hell-/Dunkelmodus)</li>
                <li>Checklisten-Status (aktiviert/deaktiviert)</li>
                <li>App-Metadaten (Datenbank-Version, Migrations-Status)</li>
              </ul>
              <div className="pt-2 space-y-1">
                <p>
                  <strong className="text-foreground">Keine Marketing- oder Tracking-Cookies:</strong> Es werden keine Cookies
                  für Nutzeranalyse, Werbung oder Tracking eingesetzt.
                </p>
                <p>
                  <strong className="text-foreground">Cookie-Consent-Banner nicht erforderlich:</strong> Da ausschließlich
                  technisch notwendige Cookies verwendet werden, ist gemäß DSGVO kein Cookie-Consent-Banner erforderlich.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h3 className="font-semibold text-lg mb-3">5. Datenhoheit und Kontrolle</h3>
            <div className="space-y-3 text-muted-foreground">
              <p>
                <strong className="text-foreground">Sie haben die volle Kontrolle:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>
                  <strong className="text-foreground">Export:</strong> Jederzeit vollständiger Datenexport als JSON-Datei
                  möglich
                </li>
                <li>
                  <strong className="text-foreground">Import:</strong> Daten-Wiederherstellung durch JSON-Import
                </li>
                <li>
                  <strong className="text-foreground">PDF-Export:</strong> Protokolle als PDF für Archivierung oder Weitergabe
                </li>
                <li>
                  <strong className="text-foreground">Löschung:</strong> Vollständige Datenlöschung über Browser-Einstellungen
                  oder App-Funktion
                </li>
              </ul>
              <div className="pt-3">
                <p>
                  <strong className="text-foreground">Geräte-Sicherheit:</strong> Die Verantwortung für die Sicherheit der
                  lokal gespeicherten Daten liegt beim Nutzer. Wir empfehlen:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2 mt-2">
                  <li>Gerätesperrung mit PIN/Passwort/Biometrie aktivieren</li>
                  <li>Regelmäßige Backups über die Export-Funktion erstellen</li>
                  <li>Bei Geräteverlust: Browser-Daten remote löschen (falls Gerätefinder-Funktion aktiv)</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h3 className="font-semibold text-lg mb-3">6. Keine Datenübertragung an Dritte</h3>
            <div className="space-y-3 text-muted-foreground">
              <p className="font-medium text-foreground">
                Transparenz: Diese App kontaktiert KEINE externen Server oder Dienste.
              </p>
              <p>Es gibt keine Integration von:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Analyse-Tools (kein Google Analytics, Matomo, etc.)</li>
                <li>Tracking-Pixeln oder Beacons</li>
                <li>Social-Media-Plugins</li>
                <li>Werbediensten</li>
                <li>Cloud-Speicher-Anbietern</li>
                <li>CDNs für externe Ressourcen (alle Assets sind lokal eingebunden)</li>
              </ul>
            </div>
          </section>

          <section>
            <h3 className="font-semibold text-lg mb-3">7. Ihre Rechte gemäß DSGVO</h3>
            <div className="space-y-3 text-muted-foreground">
              <p>Sie haben jederzeit folgende Rechte:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>
                  <strong className="text-foreground">Auskunft:</strong> Recht auf unentgeltliche Auskunft über Ihre
                  gespeicherten Daten
                </li>
                <li>
                  <strong className="text-foreground">Berichtigung:</strong> Recht auf Korrektur unrichtiger Daten
                </li>
                <li>
                  <strong className="text-foreground">Löschung:</strong> Recht auf Löschung Ihrer Daten
                </li>
                <li>
                  <strong className="text-foreground">Einschränkung:</strong> Recht auf Einschränkung der Verarbeitung
                </li>
                <li>
                  <strong className="text-foreground">Datenübertragbarkeit:</strong> Recht auf Erhalt Ihrer Daten in einem
                  strukturierten, gängigen Format
                </li>
                <li>
                  <strong className="text-foreground">Widerruf:</strong> Recht auf Widerruf erteilter Einwilligungen
                </li>
              </ul>
              <p className="pt-2">
                Da alle Daten ausschließlich lokal auf Ihrem Gerät gespeichert werden, haben Sie bereits die volle Kontrolle
                über Ihre Daten. Sie können diese jederzeit über die App-Funktionen exportieren oder löschen.
              </p>
            </div>
          </section>

          <section>
            <h3 className="font-semibold text-lg mb-3">8. DSGVO-Konformität</h3>
            <div className="space-y-3 text-muted-foreground">
              <p>
                Diese Anwendung wurde nach den Prinzipien der Datensparsamkeit (Privacy by Design) entwickelt und ist
                vollständig DSGVO-konform. Alle Datenverarbeitungen erfolgen auf Rechtsgrundlagen gemäß Art. 6 DSGVO:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>
                  <strong className="text-foreground">Art. 6 Abs. 1 lit. b DSGVO:</strong> Vertragserfüllung (Bereitstellung
                  der Web-App)
                </li>
                <li>
                  <strong className="text-foreground">Art. 6 Abs. 1 lit. f DSGVO:</strong> Berechtigtes Interesse (technische
                  Sicherheit und Performance)
                </li>
              </ul>
            </div>
          </section>

          <section className="pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground italic">Stand: Januar 2025</p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
};

export default Datenschutz;
