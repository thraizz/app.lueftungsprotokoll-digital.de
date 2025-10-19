import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ArrowLeft, HelpCircle } from "lucide-react";
import { Link } from "react-router-dom";

const faqs = [
  {
    question: "Ist die Nutzung wirklich komplett kostenlos?",
    answer:
      "Ja, Lüftungsprotokoll Digital ist zu 100% kostenlos. Es gibt keine versteckten Kosten, keine Premium-Versionen und keine Abos. Alle Funktionen stehen Ihnen dauerhaft kostenfrei zur Verfügung.",
  },
  {
    question: "Muss ich mich registrieren oder anmelden?",
    answer:
      "Nein! Sie können sofort loslegen, ohne Account-Erstellung. Ihre Daten werden lokal in Ihrem Browser gespeichert. Kein Login, kein Passwort, keine E-Mail-Adresse erforderlich.",
  },
  {
    question: "Sind meine Protokolle rechtlich gültig?",
    answer:
      "Ja. Die App dokumentiert Ihre Nennlüftung und Intensivlüftung (DIN 1946-6 Stufen 2 & 3) gemäß deutscher Rechtsprechung. Nach Gerichtsurteilen müssen Mieter 2-4 mal täglich stoßlüften. Ihre Einträge sind mit Zeitstempeln versehen und unveränderlich. Die PDF-Exporte enthalten alle notwendigen Informationen für rechtliche Nachweise.",
  },
  {
    question: "Was ist die DIN 1946-6 und ist sie ein Gesetz?",
    answer:
      "Die DIN 1946-6 ist ein Planungs- und Baustandard für Lüftungskonzepte - kein Gesetz, sondern ein privates technisches Regelwerk. Sie wird aber rechtlich relevant als 'anerkannte Regel der Technik' durch: (1) Gebäudeenergiegesetz (GEG), (2) Landesbauordnungen (gesunde Wohnverhältnisse), (3) BGB § 535 (Vermieterpflichten). Die Norm definiert 3 Lüftungsstufen: (1) Feuchteschutz (nutzerunabhängig, Vermieterverantwortung), (2) Nennlüftung (tägliches Stoßlüften, Ihre Verantwortung), (3) Intensivlüftung (nach Duschen/Kochen, Ihre Verantwortung). Diese App dokumentiert Stufe 2 & 3.",
  },
  {
    question: "Welche rechtliche Bedeutung hat die DIN 1946-6?",
    answer:
      "DIN-Normen sind keine Gesetze, gelten aber als 'anerkannte Regeln der Technik'. Bei Nichteinhaltung können Gewährleistungsansprüche oder Schadensersatzforderungen entstehen. Das GEG (Gebäudeenergiegesetz) verweist auf solche Standards, und Landesbauordnungen fordern 'gesunde Wohnverhältnisse'. Im Streitfall (z.B. Schimmel) wird oft geprüft, ob beide Seiten - Vermieter (Stufe 1: Feuchteschutz) und Mieter (Stufe 2 & 3: Lüftung) - ihren Pflichten nachgekommen sind.",
  },
  {
    question: "Wo werden meine Daten gespeichert?",
    answer:
      "Ihre Daten bleiben ausschließlich lokal in Ihrem Browser (IndexedDB). Es erfolgt keine Übertragung an Server oder Cloud-Dienste. Sie haben die volle Kontrolle und können Ihre Daten jederzeit exportieren oder löschen.",
  },
  {
    question: "Kann ich meine Protokolle auf mehreren Geräten nutzen?",
    answer:
      "Da die Daten lokal im Browser gespeichert werden, sind sie gerätespezifisch. Sie können aber jederzeit ein PDF oder Backup exportieren und auf anderen Geräten importieren.",
  },
  {
    question: "Ist die App DSGVO-konform?",
    answer:
      "Absolut. Da Ihre Daten ausschließlich lokal gespeichert werden und keine Weitergabe stattfindet, sind Sie standardmäßig DSGVO-konform. Es werden nur technisch notwendige Cookies verwendet.",
  },
  {
    question: "Wie kann ich meine Protokolle exportieren?",
    answer:
      "Sie können jederzeit rechtsgültige PDF-Dokumente mit allen Einträgen, Zeitstempeln und Pflichtangaben exportieren. Diese PDFs können Sie Versicherungen, Vermietern oder Sachverständigen vorlegen.",
  },
  {
    question: "Was passiert bei Schimmelbefall?",
    answer:
      "Ein ordnungsgemäß geführtes Lüftungsprotokoll dient als Nachweis, dass Sie Ihrer Lüftungspflicht nachgekommen sind (2-4 Lüftungssitzungen täglich laut Rechtsprechung). Es kann bei Schimmelschäden als Beweismittel dienen. Bitte konsultieren Sie bei akuten Schäden einen Sachverständigen – die App ersetzt keine rechtliche Beratung.",
  },
  {
    question: "Wie oft muss ich täglich lüften?",
    answer:
      "Nach aktueller Rechtsprechung sollten Sie 2-4 Lüftungssitzungen täglich durchführen (Stoßlüften für 5-30 Min., je nach Jahreszeit), plus zusätzlich nach feuchteintensiven Tätigkeiten wie Duschen, Kochen oder Wäschetrocknen. Eine Sitzung kann mehrere Räume gleichzeitig erfassen (z.B. Querlüften).",
  },
  {
    question: "Was ist der Unterschied zwischen den Lüftungstypen?",
    answer:
      "Nennlüftung ist die tägliche reguläre Lüftung (2-4x täglich stoßlüften). Intensivlüftung erfolgt zusätzlich nach feuchteintensiven Tätigkeiten wie Duschen, Kochen oder Wäschetrocknen. Die App hilft Ihnen, beides systematisch zu dokumentieren.",
  },
  {
    question: "Kann ich die App auch offline nutzen?",
    answer:
      "Ja! Als Progressive Web App (PWA) funktioniert die Anwendung vollständig offline. Sie können sie auf Ihrem Gerät installieren und wie eine native App nutzen – auch ohne Internetverbindung.",
  },
];

const Hilfe = () => {
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
          <div className="flex items-center gap-3">
            <HelpCircle className="w-6 h-6 text-primary" />
            <CardTitle className="text-2xl">Hilfe & Häufige Fragen</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle className="text-base">Weitere Fragen?</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-3">
          <p>
            Bei technischen Fragen haben können Sie mich gerne kontaktieren. Ich biete keine rechtliche oder bauphysikalische Beratung.
          </p>
          <p>
            E-Mail:{" "}
            <a
              href="mailto:lueftungsprotokoll-digital@lakur.tech"
              className="text-primary hover:underline"
            >
              lueftungsprotokoll-digital@lakur.tech
            </a>
          </p>
          <p className="pt-2 font-medium text-foreground">
            Hinweis: Diese App ersetzt keine rechtliche oder bauphysikalische Beratung.
            Bei konkreten Schäden oder rechtlichen Fragen konsultieren Sie bitte einen Sachverständigen oder Rechtsanwalt.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Hilfe;
