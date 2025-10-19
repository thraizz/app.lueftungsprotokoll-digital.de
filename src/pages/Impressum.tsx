import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const Impressum = () => {
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
          <CardTitle className="text-2xl">Impressum</CardTitle>
          <p className="text-sm text-muted-foreground italic">
            Angaben gemäß § 5 DDG (Digital Services Act)
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <section>
            <h3 className="font-semibold text-lg mb-2">Verantwortlich für den Inhalt:</h3>
            <address className="not-italic text-muted-foreground space-y-1">
              <p>Aron Schüler IT Services</p>
              <p>Karlstr. 17-19</p>
              <p>50679 Köln</p>
              <p>Deutschland</p>
            </address>
          </section>

          <section>
            <h3 className="font-semibold text-lg mb-2">Kontakt:</h3>
            <div className="text-muted-foreground space-y-1">
              <p>
                Per E-Mail:{" "}
                <a
                  href="mailto:lueftungsprotokoll-digital@lakur.tech"
                  className="text-primary hover:underline"
                >
                  lueftungsprotokoll-digital@lakur.tech
                </a>
              </p>
              <p>
                Website:{" "}
                <a
                  href="https://aronschueler.de"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  https://aronschueler.de
                </a>
              </p>
            </div>
          </section>

          <hr className="border-border" />

          <section>
            <h3 className="font-semibold text-lg mb-3">Urheberrechtserklärung</h3>
            <div className="space-y-4 text-muted-foreground">
              <p>
                Die Inhalte dieser Progressive Web App werden ausschließlich zu Informationszwecken bereitgestellt.
                Alle Texte, Bilder, Grafiken und andere Materialien unterliegen dem Urheberrecht und anderen
                geistigen Eigentumsrechten von Aron Schüler, sofern nicht anders angegeben.
              </p>

              <div>
                <h4 className="font-medium text-foreground mb-1">Berechtigungen:</h4>
                <p>
                  Sie dürfen die App ausschließlich zu persönlichen und nicht-kommerziellen Zwecken nutzen.
                  Jede andere Verwendung ohne die ausdrückliche schriftliche Zustimmung von Aron Schüler ist
                  strengstens untersagt.
                </p>
              </div>

              <div>
                <h4 className="font-medium text-foreground mb-1">Urheberrechtshinweis:</h4>
                <p>
                  Alle Rechte vorbehalten, sofern nicht anders ausdrücklich angegeben. Falls Sie der Meinung sind,
                  dass Inhalte dieser App Ihr Urheberrecht oder andere geistige Eigentumsrechte verletzen,
                  kontaktieren Sie uns bitte umgehend zur Klärung.
                </p>
              </div>

              <div>
                <h4 className="font-medium text-foreground mb-1">Keine Gewährleistung:</h4>
                <p>
                  Obwohl wir uns bemühen, die Genauigkeit und Aktualität der präsentierten Informationen sicherzustellen,
                  geben wir keinerlei ausdrückliche oder stillschweigende Zusicherungen oder Gewährleistungen hinsichtlich
                  der Vollständigkeit, Genauigkeit, Zuverlässigkeit, Eignung oder Verfügbarkeit der App oder der
                  Informationen für irgendeinen Zweck.
                </p>
              </div>

              <div>
                <h4 className="font-medium text-foreground mb-1">Hinweis zur Progressive Web App:</h4>
                <p>
                  Diese App funktioniert vollständig offline und speichert alle Daten ausschließlich lokal auf Ihrem Gerät.
                  Es erfolgt keine Datenübertragung an externe Server. Die Verantwortung für die Sicherheit der lokal
                  gespeicherten Daten liegt beim Nutzer.
                </p>
              </div>
            </div>
          </section>
        </CardContent>
      </Card>
    </div>
  );
};

export default Impressum;
