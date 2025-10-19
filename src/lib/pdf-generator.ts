import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { VentilationEntry, Apartment } from './db';
import { VENTILATION_TYPES } from './constants';

interface PDFGenerationOptions {
  entries: VentilationEntry[];
  apartment: Apartment;
  dateRange?: {
    start: string;
    end: string;
  };
}

// Generate SHA-256 hash for document integrity
async function generateDocumentHash(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

// Format date for display
function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-');
  return `${day}.${month}.${year}`;
}

// Get ventilation type label from value
function getVentilationTypeLabel(value: string): string {
  const type = VENTILATION_TYPES.find(t => t.value === value);
  return type ? type.label : value;
}

export async function generateVentilationProtocolPDF(
  options: PDFGenerationOptions
): Promise<Blob> {
  const { entries, apartment, dateRange } = options;

  // Sort entries by date and time
  const sortedEntries = [...entries].sort((a, b) => {
    const dateCompare = a.date.localeCompare(b.date);
    if (dateCompare !== 0) return dateCompare;
    return a.time.localeCompare(b.time);
  });

  // Create PDF document
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPos = margin;

  // Helper function to add new page if needed
  const checkPageBreak = (requiredSpace: number) => {
    if (yPos + requiredSpace > pageHeight - margin) {
      doc.addPage();
      yPos = margin;
      return true;
    }
    return false;
  };

  // HEADER SECTION
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Lüftungsprotokoll', pageWidth / 2, yPos, { align: 'center' });
  yPos += 10;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Gemäß DIN 1946-6`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 15;

  // Apartment information
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Objektadresse:', margin, yPos);
  yPos += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(apartment.name, margin, yPos);
  yPos += 5;
  doc.text(apartment.address, margin, yPos);
  yPos += 5;
  doc.text(`Wohnungsgröße: ${apartment.size} m²`, margin, yPos);
  yPos += 10;

  // Date range
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Zeitraum des Protokolls:', margin, yPos);
  yPos += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  if (dateRange) {
    doc.text(
      `${formatDate(dateRange.start)} - ${formatDate(dateRange.end)}`,
      margin,
      yPos
    );
  } else if (sortedEntries.length > 0) {
    const firstDate = sortedEntries[0].date;
    const lastDate = sortedEntries[sortedEntries.length - 1].date;
    doc.text(`${formatDate(firstDate)} - ${formatDate(lastDate)}`, margin, yPos);
  } else {
    doc.text('Keine Einträge vorhanden', margin, yPos);
  }
  yPos += 10;

  // Creation timestamp
  const now = new Date();
  const creationDate = `${now.toLocaleDateString('de-DE')} ${now.toLocaleTimeString('de-DE')}`;
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(`Erstellt am: ${creationDate}`, margin, yPos);
  doc.setTextColor(0);
  yPos += 15;

  // TABLE SECTION
  if (sortedEntries.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Lüftungseinträge:', margin, yPos);
    yPos += 8;

    // Prepare table data
    const tableData = sortedEntries.map((entry, index) => {
      const tempChange =
        entry.tempAfter !== undefined
          ? `${entry.tempBefore}°C → ${entry.tempAfter}°C`
          : `${entry.tempBefore}°C`;
      const humidityChange =
        entry.humidityAfter !== undefined
          ? `${entry.humidityBefore}% → ${entry.humidityAfter}%`
          : `${entry.humidityBefore}%`;

      return [
        (index + 1).toString(),
        formatDate(entry.date),
        entry.time,
        entry.rooms?.join(', ') || '',
        tempChange,
        humidityChange,
        getVentilationTypeLabel(entry.ventilationType),
        `${entry.duration} min`,
      ];
    });

    autoTable(doc, {
      startY: yPos,
      head: [
        [
          'Nr.',
          'Datum',
          'Uhrzeit',
          'Räume',
          'Temperatur',
          'Luftfeuchte',
          'Lüftungsart',
          'Dauer',
        ],
      ],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [66, 66, 66],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
      },
      bodyStyles: {
        fontSize: 7,
        cellPadding: 2,
      },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 22 },
        2: { cellWidth: 17 },
        3: { cellWidth: 25 },
        4: { cellWidth: 25 },
        5: { cellWidth: 25 },
        6: { cellWidth: 25 },
        7: { cellWidth: 15 },
      },
      margin: { left: margin, right: margin },
      didDrawPage: (data) => {
        // Update yPos after table
        yPos = data.cursor?.y || yPos;
      },
    });

    // Get final Y position after table
    yPos = (doc as any).lastAutoTable.finalY + 10;
  } else {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('Keine Lüftungseinträge im ausgewählten Zeitraum.', margin, yPos);
    yPos += 15;
  }

  // FOOTER SECTION - Legal notices
  checkPageBreak(50);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Rechtliche Hinweise:', margin, yPos);
  yPos += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const legalText1 =
    'Dieses Protokoll wurde elektronisch erstellt und ist auch ohne Unterschrift gültig.';
  const legalText2 =
    'Es dient als Nachweis regelmäßigen Lüftens gemäß DIN 1946-6 und kann bei Schimmelproblemen, ' +
    'Versicherungsfällen und Mietstreitigkeiten als Beweismittel dienen.';

  const splitText1 = doc.splitTextToSize(legalText1, pageWidth - 2 * margin);
  doc.text(splitText1, margin, yPos);
  yPos += splitText1.length * 5;

  const splitText2 = doc.splitTextToSize(legalText2, pageWidth - 2 * margin);
  doc.text(splitText2, margin, yPos);
  yPos += splitText2.length * 5 + 10;

  checkPageBreak(30);

  // Signature fields
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Unterschriftenfelder:', margin, yPos);
  yPos += 10;

  const signatureY = yPos;
  const signatureWidth = (pageWidth - 3 * margin) / 2;

  // Tenant signature
  doc.setFont('helvetica', 'normal');
  doc.text('Mieter/Bewohner:', margin, signatureY);
  doc.line(margin, signatureY + 15, margin + signatureWidth, signatureY + 15);
  doc.setFontSize(7);
  doc.text('(Unterschrift)', margin, signatureY + 19);

  // Landlord signature
  doc.text('Vermieter/Eigentümer:', margin * 2 + signatureWidth, signatureY);
  doc.line(
    margin * 2 + signatureWidth,
    signatureY + 15,
    pageWidth - margin,
    signatureY + 15
  );
  doc.text('(Unterschrift)', margin * 2 + signatureWidth, signatureY + 19);

  yPos = signatureY + 25;

  // Generate document hash
  const documentContent = JSON.stringify({
    apartment,
    entries: sortedEntries,
    creationDate,
    dateRange,
  });
  const documentHash = await generateDocumentHash(documentContent);

  // Add hash to document
  checkPageBreak(20);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('Dokument-Integritätsprüfung (SHA-256):', margin, yPos);
  yPos += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  const hashLines = doc.splitTextToSize(documentHash, pageWidth - 2 * margin);
  doc.text(hashLines, margin, yPos);
  yPos += hashLines.length * 4 + 5;

  doc.setFontSize(7);
  doc.setTextColor(100);
  doc.text(
    'Dieser Hash-Wert kann zur Überprüfung der Dokumentenintegrität verwendet werden.',
    margin,
    yPos
  );
  doc.setTextColor(0);

  // Add watermark and page numbers on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Watermark
    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.setFont('helvetica', 'italic');
    const watermarkText = `Rechtsgültiges Dokument erstellt am ${creationDate.split(' ')[0]}`;
    const watermarkWidth = doc.getTextWidth(watermarkText);
    doc.text(watermarkText, (pageWidth - watermarkWidth) / 2, pageHeight - 15);

    // Page number
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Seite ${i} von ${totalPages}`, pageWidth / 2, pageHeight - 10, {
      align: 'center',
    });
    doc.setTextColor(0);
  }

  // Generate blob
  const pdfBlob = doc.output('blob');
  return pdfBlob;
}

// Helper function to download PDF
export function downloadPDF(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

// Generate filename for PDF
export function generatePDFFilename(apartment: Apartment, dateRange?: { start: string; end: string }): string {
  const date = new Date().toISOString().split('T')[0];
  const apartmentName = apartment.name.replace(/[^a-zA-Z0-9]/g, '_');

  if (dateRange) {
    return `Lueftungsprotokoll_${apartmentName}_${dateRange.start}_${dateRange.end}.pdf`;
  }

  return `Lueftungsprotokoll_${apartmentName}_${date}.pdf`;
}
