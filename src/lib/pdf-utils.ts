import type { jsPDF } from 'jspdf';
import type QRCodeType from 'qrcode';
import { format } from 'date-fns';

interface TicketData {
  bookingRef: string;
  eventTitle: string;
  eventDate: string;
  eventEndDate?: string;
  venueName: string;
  city: string;
  attendeeName: string;
  ticketTierName: string;
  ticketNumber: string;
  qrCodeData: string;
  terms?: string;
}

const COLORS = {
  PRIMARY_RED: '#8B0000', // Dark Red
  PRIMARY_BLUE: '#00008B', // Dark Blue
  PRIMARY_YELLOW: '#9B870C', // Darkened Yellow/Gold
  TEXT_MAIN: '#18181b', // zinc-900
  TEXT_MUTED: '#71717a', // zinc-500
  BORDER: '#e4e4e7', // zinc-200
  WHITE: '#ffffff',
};

/**
 * Draws a single ticket page onto the provided jsPDF instance.
 */
export async function drawTicketPage(pdf: jsPDF, data: TicketData) {
  const width = pdf.internal.pageSize.getWidth();
  const height = pdf.internal.pageSize.getHeight();

  // White Background
  pdf.setFillColor(COLORS.WHITE);
  pdf.rect(0, 0, width, height, 'F');

  // Helpers
  const addLabel = (text: string, x: number, y: number, size = 10, color = COLORS.TEXT_MUTED) => {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(size);
    pdf.setTextColor(color);
    pdf.text(text.toUpperCase(), x, y);
  };

  const addValue = (text: string, x: number, y: number, size = 16, color = COLORS.TEXT_MAIN) => {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(size);
    pdf.setTextColor(color);
    pdf.text(text, x, y);
  };

  // Header Section
  pdf.setFillColor(COLORS.PRIMARY_BLUE);
  pdf.roundedRect(50, 40, 40, 40, 8, 8, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(22);
  pdf.setTextColor(COLORS.WHITE);
  pdf.text('C', 62, 68);

  pdf.setFontSize(20);
  pdf.setTextColor(COLORS.TEXT_MAIN);
  pdf.text('CITY CULTURE', 100, 60);
  addLabel('Premium Event Access', 100, 75, 9, COLORS.PRIMARY_BLUE);

  // Booking Ref
  const refText = `REF: ${data.bookingRef}`;
  pdf.setFontSize(14);
  pdf.setTextColor(COLORS.TEXT_MAIN);
  const refWidth = pdf.getTextWidth(refText);
  pdf.text(refText, width - 50 - refWidth, 65);

  // Decorative Line
  pdf.setDrawColor(COLORS.BORDER);
  pdf.setLineWidth(1);
  pdf.line(50, 100, width - 50, 100);

  // Main Content Area
  pdf.setFontSize(36);
  pdf.setTextColor(COLORS.PRIMARY_RED);
  const splitTitle = pdf.splitTextToSize(data.eventTitle, width - 100);
  pdf.text(splitTitle, 50, 160);

  let currentY = 160 + (splitTitle.length * 40);

  const col1 = 50;
  const col2 = width / 2;

  // Row 1: Date & Time
  addLabel('Date', col1, currentY);
  addValue(format(new Date(data.eventDate), 'EEEE, MMMM do, yyyy'), col1, currentY + 25);

  addLabel('Time', col2, currentY);
  const timeStr = format(new Date(data.eventDate), 'p') + (data.eventEndDate ? ` – ${format(new Date(data.eventEndDate), 'p')}` : '');
  addValue(timeStr, col2, currentY + 25);

  currentY += 80;

  // Row 2: Venue & Attendee
  addLabel('Venue', col1, currentY);
  const venueLines = pdf.splitTextToSize(`${data.venueName}, ${data.city}`, width / 2 - 60);
  addValue(venueLines[0], col1, currentY + 25);
  if (venueLines.length > 1) {
    addValue(venueLines.slice(1).join(' '), col1, currentY + 45, 12, COLORS.TEXT_MUTED);
  }

  addLabel('Attendee', col2, currentY);
  addValue(data.attendeeName, col2, currentY + 25);
  addValue('Ticket Holder', col2, currentY + 45, 12, COLORS.TEXT_MUTED);

  currentY += 100;

  // Row 3: Ticket Type & QR Code
  addLabel('Ticket Type', col1, currentY);
  addValue(data.ticketTierName, col1, currentY + 25, 20, COLORS.PRIMARY_RED);
  addValue(data.ticketNumber, col1, currentY + 50, 12, COLORS.TEXT_MUTED);
  
  pdf.setFillColor(COLORS.PRIMARY_YELLOW);
  pdf.roundedRect(col1, currentY + 65, 100, 20, 5, 5, 'F');
  pdf.setFontSize(8);
  pdf.setTextColor(COLORS.WHITE);
  pdf.text('CONFIRMED ENTRY', col1 + 12, currentY + 78);

  // QR Code
  try {
    const QRCode = (await import('qrcode')).default as unknown as typeof QRCodeType;
    const qrDataUrl = await QRCode.toDataURL(data.qrCodeData, {
      margin: 1,
      width: 400,
      color: { dark: '#000000', light: '#ffffff' },
    });
    pdf.addImage(qrDataUrl, 'PNG', col2, currentY - 20, 150, 150);
  } catch (err) {
    console.error('QR Code Generation Error in PDF:', err);
    pdf.text('[QR CODE ERROR]', col2, currentY + 25);
  }

  // Footer Section
  const footerY = height - 100;
  pdf.setDrawColor(COLORS.BORDER);
  pdf.line(50, footerY - 20, width - 50, footerY - 20);

  addLabel('Support & Verification', 50, footerY);
  pdf.setFontSize(10);
  pdf.setTextColor(COLORS.TEXT_MUTED);
  pdf.text('Verified Secure Access • Managed via CityCulture.in', 50, footerY + 20);
  
  pdf.setFont('helvetica', 'italic');
  pdf.text('A Brand of Salty Media Production (opc) Pvt Ltd', 50, footerY + 35);

  pdf.setFillColor(COLORS.TEXT_MUTED);
  pdf.rect(width - 80, footerY - 10, 30, 30, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(18);
  pdf.setTextColor(COLORS.WHITE);
  pdf.text('C', width - 72, footerY + 12);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(COLORS.TEXT_MUTED);
  
  const baseInstructions = 'Instructions: • Present this ticket on your device or printed copy at the venue • Strictly one entry per scan • Tampering voids entry';
  let instructions = baseInstructions;
  
  if (data.terms) {
    instructions += ` • Terms: ${data.terms}`;
  }
  
  const splitInstructions = pdf.splitTextToSize(instructions, width - 100);
  pdf.text(splitInstructions, 50, height - 40);
}

/**
 * Generates a full lightweight PDF document.
 */
export async function generateTicketPDF(data: TicketData): Promise<jsPDF> {
  const { jsPDF } = await import('jspdf');
  
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: [810, 1012],
  });

  await drawTicketPage(pdf, data);
  return pdf;
}
