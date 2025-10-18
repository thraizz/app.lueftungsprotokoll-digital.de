# Vollständige Spezifikation: Webanwendung "Lüftungsprotokoll Digital" MVP

## Project info

**URL**: https://lovable.dev/projects/c74f282c-c1a9-4864-a4b6-a8153bfae80b

## 1. Projektübersicht

### 1.1 Zweck der Anwendung
Eine webbasierte Anwendung zur rechtssicheren Dokumentation des Lüftungsverhaltens in Wohnräumen gemäß deutschen Anforderungen und DIN 1946-6. Die App dient als Nachweisinstrument bei Schimmelproblemen, Versicherungsfällen und Mietstreitigkeiten.

### 1.2 Zielgruppen
- Mieter (Nachweis ordnungsgemäßen Lüftens)
- Vermieter/Hausverwaltungen (Kontrolle und Dokumentation)
- Sachverständige (Auswertung bei Schadensfällen)
- Versicherungen (Beweissicherung)

## 2. Funktionale Anforderungen

### 2.1 Kernfunktionen

#### 2.1.1 Protokollerfassung
**Pflichtfelder gemäß deutschen Standards:**
- Datum (automatisch vorausgefüllt, editierbar)
- Uhrzeit (automatisch vorausgefüllt, editierbar)
- Raumbezeichnung (Dropdown: Wohnzimmer, Schlafzimmer, Küche, Bad, Flur, Arbeitszimmer, Kinderzimmer, Keller, Dachboden, Sonstiges)
- Lüftungsart (Dropdown: Stoßlüften, Querlüften, Kipplüften)
- Lüftungsdauer (in Minuten, Eingabefeld mit Validierung 1-60 Min)
- Temperatur vor dem Lüften (°C, Dezimalzahl)
- Luftfeuchtigkeit vor dem Lüften (%, 0-100)
- Temperatur nach dem Lüften (°C, optional)
- Luftfeuchtigkeit nach dem Lüften (%, optional)
- Bemerkungsfeld (optional, Freitext max. 500 Zeichen)

**Zusatzfunktionen:**
- Foto-Upload (optional): Hygrometer-Anzeige, Fensterstellung, Zustand des Raums (max. 3 Fotos pro Eintrag, je max. 5 MB), Ablage über local-first Lösung. Kein Upload.
- Wetterdaten (automatisch): Außentemperatur und Luftfeuchtigkeit via API
- Schnelleingabe-Modus für wiederkehrende Einträge

#### 2.1.2 Wohnungsverwaltung
- Anlegen mehrerer Wohnungen/Objekte
- Raumverwaltung pro Wohnung
- Wohnungsgröße (m²) zur automatischen Lüftungsempfehlung
- Objektadresse (für rechtliche Zuordnung)

#### 2.1.3 Intelligente Assistenzfunktionen
**Lüftungsempfehlungen basierend auf:**
- Wohnungsgröße (kleine/mittlere/große Wohnung)
- Raumtyp (z.B. Bad nach Dusche, Küche nach Kochen)
- Aktuelle Luftfeuchtigkeit (Warnung bei >60% rel. Feuchte)
- Jahreszeit und Außentemperatur

**Erinnerungsfunktion:**
- Push-Benachrichtigungen zu empfohlenen Lüftungszeiten
- Individuelle Zeitpläne (z.B. morgens 7:00, mittags 12:00, abends 18:00, vor Schlafenszeit)
- Raumspezifische Erinnerungen

#### 2.1.4 Auswertung und Visualisierung
- Tabellarische Übersicht aller Einträge (filterbar, sortierbar)
- Zeitraum-Filter (heute, letzte 7 Tage, letzter Monat, benutzerdefiniert)
- Raum-Filter
#### 2.1.5 Export- und Berichtsfunktionen
**PDF-Export (rechtssicher):**
- Vollständiges Protokoll mit allen Pflichtangaben
- Zeitstempel und digitale Signatur (optional)
- Objektinformationen (Adresse, Zeitraum)
- Logo-Upload für Vermieter/Hausverwaltungen
- Unterschriftenfelder (Mieter/Vermieter)
- Fortlaufende Nummerierung der Einträge
- Wasserzeichen "Rechtsgültiges Dokument erstellt am [Datum]"


### 2.2 Datenverwaltung

#### 2.2.1 Datenspeicherung
- Lokale Speicherung im Browser (IndexedDB/LocalStorage) als Basis
- Optional: Cloud-Synchronisation (verschlüsselt, DSGVO-konform)
- Automatische Backups
- Datenexport vor Löschung

#### 2.2.2 Datensicherheit
- Ende-zu-Ende-Verschlüsselung (bei Cloud-Option)
- Keine Weitergabe an Dritte ohne explizite Zustimmung
- Datenhoheit beim Nutzer
- Möglichkeit zur vollständigen Datenlöschung (DSGVO Art. 17)

#### 2.2.3 Mehrbenutzerverwaltung
- Mehrere Nutzerkonten pro Wohnung (z.B. WG, Familie)
- Rollenkonzept:
  - **Administrator** (alle Rechte, Export, Löschung)
  - **Benutzer** (Eingabe, Ansicht eigener Einträge)
  - **Lesezugriff** (nur Ansicht, für Vermieter)
- Zugriffsprotokolle bei geteilten Accounts

### 2.3 Rechtssicherheit und Compliance

#### 2.3.1 Rechtliche Anforderungen
- **Unveränderbarkeit:** Einträge können nach Speicherung nicht mehr editiert werden (nur Löschung möglich mit Protokollierung)
- **Nachvollziehbarkeit:** Jeder Eintrag enthält Zeitstempel und Nutzer-ID
- **Revisionssicherheit:** Gelöschte Einträge werden im Löschprotokoll vermerkt
- **Beweiskraft:** PDF-Exporte mit Hash-Wert zur Integritätsprüfung

#### 2.3.2 DSGVO-Konformität
- Datenschutzerklärung (deutsch)
- Cookie-Banner (nur technisch notwendige Cookies ohne Zustimmung)
- Einwilligung für optionale Funktionen (Cloud, Analytics)
- Auskunftsrecht (Datenexport)
- Recht auf Vergessenwerden (vollständige Löschung)
- Datenminimierung (nur notwendige Daten)
- EU-Server-Standort (bei Cloud-Option)

#### 2.3.3 Impressum und AGB
- Vollständiges Impressum gemäß §5 TMG
- Allgemeine Geschäftsbedingungen
- Haftungsausschluss
- Hinweis: App ersetzt keine rechtliche Beratung

## 3. Technische Spezifikation

### 3.1 Architektur
**Progressive Web App (PWA):**
- Offline-Funktionalität
- Installation auf Smartphone/Desktop
- Responsive Design (Mobile First)
- Keine App-Store-Abhängigkeit

### 3.2 Technologie-Stack (Empfehlung)

**Frontend:**
- React (moderne UI-Komponenten)
- TailwindCSS (responsives Design)
- PWA-Manifest und Service Worker

**Datenspeicherung:**
- IndexedDB (lokale Datenbank)

**PDF-Generierung:**
- jsPDF oder PDFMake (clientseitig)
- Digitale Signatur via Web Crypto API

**Weitere Bibliotheken:**
- Day.js (Datumsformatierung)
- Zod oder Yup (Eingabevalidierung)
- React Hook Form (Formulare)

### 3.3 Benutzeroberfläche

#### 3.3.1 Hauptnavigation
1. **Dashboard** (Übersicht, Statistiken, letzte Einträge)
2. **Neuer Eintrag** (Schnellerfassung)
3. **Protokoll** (vollständige Liste)
4. **Auswertung** (Grafiken, Reports)
5. **Einstellungen** (Wohnungen, Nutzer, Erinnerungen)
6. **Export** (PDF/Excel)

#### 3.3.2 Workflow Neuer Eintrag
1. Raumauswahl (große Buttons mit Icons)
2. Automatische Vorausfüllung (Datum, Uhrzeit)
3. Lüftungsart-Auswahl (visualisiert mit Icons)
4. Messwerte eingeben (große Eingabefelder, Tastatur-optimiert)
5. Optional: Nachher-Werte und Foto
6. Speichern → Erfolgsbestätigung mit Lüftungsempfehlung

#### 3.3.3 Design-Prinzipien
- Klare, reduzierte Oberfläche
- Große Touch-Targets (min. 44x44px)
- Hoher Kontrast (WCAG 2.1 AA)
- Deutsche Sprache mit Fachbegriffen
- Tooltips mit Erklärungen
- Farbcodierung: Grün (gut), Gelb (grenzwertig), Rot (kritisch)

## 5. Rechtliche Hinweise in der App

### 5.1 Pflichthinweise
**Startseite/Onboarding:**
> "Diese App dient zur Dokumentation Ihres Lüftungsverhaltens gemäß deutscher Rechtsprechung und DIN 1946-6. Ein ordnungsgemäß geführtes Lüftungsprotokoll kann bei Schimmelproblemen, Versicherungsfällen und Mietstreitigkeiten als Nachweis dienen. Die App ersetzt keine rechtliche oder bauphysikalische Beratung. Bitte konsultieren Sie bei Schäden einen Sachverständigen."

**Bei jedem Export:**
> "Dieses Protokoll wurde elektronisch erstellt und ist auch ohne Unterschrift gültig. Es dient als Nachweis regelmäßigen Lüftens. Hash-Wert zur Integritätsprüfung: [Hash]. Erstellt am [Datum] um [Uhrzeit]."

### 5.2 Haftungsausschluss
- App bietet keine Gewähr für Richtigkeit der Empfehlungen
- Keine Haftung für Schäden durch fehlerhafte Nutzung
- Nutzer trägt Verantwortung für korrekte Dateneingabe
- Bei technischen Problemen: Backup-Empfehlung



## 10. Zusammenfassung der Rechtssicherheit

Die Anwendung gewährleistet Rechtssicherheit durch:

✅ **Vollständige Pflichtangaben** gemäß deutscher Standards  
✅ **Unveränderbarkeit** gespeicherter Einträge  
✅ **Zeitstempel und Revisionssicherheit**  
✅ **DSGVO-konforme Datenspeicherung**  
✅ **Beweiskräftige PDF-Exporte** mit Hash-Werten  
✅ **Transparente Datenhaltung** (Nutzer behält Kontrolle)  
✅ **Protokollierung von Änderungen/Löschungen**  
✅ **Compliance** mit DIN 1946-6 (Lüftungskonzepte)

## 6. Qualitätssicherung

### 6.1 Tests
- Unit-Tests (Eingabevalidierung, Berechnungen)
- E2E-Tests (kompletter Workflow)
- Browser-Kompatibilität (Chrome, Firefox, Safari, Edge)
- Mobile-Tests (iOS/Android)
- Accessibility-Tests (WCAG 2.1)

### 6.2 Dokumentation über Landing Page
- Benutzerhandbuch (PDF, in der App abrufbar)
- FAQ-Bereich
- Video-Tutorials
- Technische Dokumentation (für Entwickler)

## 7. Deployment und Wartung

### 7.1 Hosting
- HTTPS-Pflicht (SSL-Zertifikat)
- EU-Server (DSGVO)
- CDN für schnelle Ladezeiten
- 99,9% Verfügbarkeit

### 7.2 Updates
- Automatische Updates (PWA)
- Changelog in der App
- Keine Breaking Changes bei Datenformaten
- Migrations-Skripte bei Updates

### 7.3 Support (keine rechtliche Beratung, rein technisch)
- Kontaktformular
- E-Mail-Support
- FAQ-Bereich

Diese Spezifikation bildet die Grundlage für eine rechtssichere, benutzerfreundliche und zukunftsfähige Webanwendung zur Lüftungsdokumentation.



# V2
## Grafische Visualisierung
- Temperaturverlauf über Zeit
- Luftfeuchtigkeitsverlauf über Zeit
- Lüftungsfrequenz pro Raum
- Heatmap der kritischen Werte (>60% Luftfeuchtigkeit)
- Statistiken: Durchschnittswerte, Min/Max, Lüftungshäufigkeit
## Excel/CSV-Export:
- Maschinenlesbare Formate für Sachverständige
- Alle Datenfelder inklusive Metadaten

## Zusatzfunktionen (Premium/Pro-Version)

### 4.1 Erweiterte Features
- **Mehrere Wohnungen/Objekte verwalten** (für Vermieter)
- **Team-Funktionen** (Hausverwaltungen)
- **Schimmelerkennung via Foto-KI** (experimentell)
- **Integration mit Smart-Home-Sensoren** (Temperatur/Luftfeuchtigkeit automatisch)
- **Anwalt/Sachverständigen-Zugriff** (temporärer Lesezugriff)
- **Langzeitarchivierung** (über 2 Jahre)
- **White-Label-Lösung** (für Hausverwaltungen)

### 4.2 API-Integrationen
- Wetter-APIs (OpenWeatherMap, DWD)
- Smart-Home-Plattformen (Home Assistant, IFTTT)
- Versicherungsportale (automatische Übermittlung bei Schaden)

- Chart.js oder Recharts (Datenvisualisierung)
# V3

### 8.1 Freemium-Modell
**Kostenlos:**
- 1 Wohnung
- Unbegrenzte Einträge
- Basis-Export (PDF/Excel)
- 6 Monate Datenspeicherung

**Premium (4,99€/Monat oder 49,99€/Jahr):**
- Unbegrenzte Wohnungen
- Cloud-Synchronisation
- Erweiterte Auswertungen
- Unbegrenzte Speicherung
- Prioritäts-Support
- White-Label (auf Anfrage)

### 8.2 B2B-Angebot für Hausverwaltungen
- Lizenzmodell pro Wohneinheit
- Mandantenfähigkeit
- API-Zugriff
- Schulungen
- API für Drittanbieter
