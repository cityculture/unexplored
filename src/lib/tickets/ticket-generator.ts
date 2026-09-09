import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';

export interface TicketItem {
  ticket_tier_name: string;
  quantity: number;
}

export interface TicketBookingData {
  booking_ref: string;
  attendee_name: string;
  event_title: string;
  event_date: string;
  venue_name: string;
  items: TicketItem[];
}

export async function generateTicketPdf(data: TicketBookingData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // Strip emojis and characters outside Latin-1
  const safeText = (text: string) => {
    if (!text) return '';
    return text.replace(/[^\x00-\xFF]/g, '');
  };

  // Attempt to load City Culture Logo if available
  let logoImage;
  try {
    const logoPath = path.join(process.cwd(), 'public', 'logo.png');
    if (fs.existsSync(/*turbopackIgnore: true*/ logoPath)) {
      const logoBytes = fs.readFileSync(/*turbopackIgnore: true*/ logoPath);
      logoImage = await pdfDoc.embedPng(logoBytes);
    }
  } catch (err) {
    console.warn('Non-critical: Logo loading skipped for PDF ticket:', err);
  }

  const totalTickets = data.items.reduce((sum, item) => sum + item.quantity, 0);
  let ticketNumber = 1;

  for (const item of data.items) {
    for (let q = 1; q <= item.quantity; q++) {
      // Horizontal Ticket layout: 800 width, 300 height
      const page = pdfDoc.addPage([800, 300]);
      const { width, height } = page.getSize();
      const stubWidth = 220;
      const mainWidth = width - stubWidth;

      // Outer Background (Subtle warm gray)
      page.drawRectangle({
        x: 0,
        y: 0,
        width,
        height,
        color: rgb(0.97, 0.98, 1.0),
      });

      // Main Ticket Body Background
      page.drawRectangle({
        x: 0,
        y: 0,
        width: mainWidth,
        height,
        color: rgb(1, 1, 1),
      });

      // Decorative Notches (Cutouts)
      const notchRadius = 15;
      const notchX = mainWidth;

      page.drawCircle({
        x: notchX,
        y: height,
        size: notchRadius,
        color: rgb(0.92, 0.93, 0.95),
      });
      page.drawCircle({
        x: notchX,
        y: 0,
        size: notchRadius,
        color: rgb(0.92, 0.93, 0.95),
      });

      // Perforation Line
      for (let y = 10; y < height; y += 10) {
        page.drawLine({
          start: { x: mainWidth, y },
          end: { x: mainWidth, y: y + 5 },
          thickness: 1,
          color: rgb(0.82, 0.84, 0.88),
        });
      }

      // --- MAIN TICKET SECTION ---
      // Top Header Bar
      page.drawRectangle({
        x: 0,
        y: height - 60,
        width: mainWidth,
        height: 60,
        color: rgb(0.18, 0.16, 0.45), // City Culture Indigo
      });

      page.drawText(safeText('CITY CULTURE ADMISSION TICKET'), {
        x: 30,
        y: height - 35,
        size: 10,
        font: fontBold,
        color: rgb(1, 1, 1),
      });

      // Event Title
      const title = safeText(data.event_title.toUpperCase());
      page.drawText(title.length > 35 ? title.substring(0, 33) + '...' : title, {
        x: 30,
        y: height - 100,
        size: 20,
        font: fontBold,
        color: rgb(0.08, 0.08, 0.12),
      });

      // Information Grid
      const drawInfo = (label: string, value: string, x: number, y: number) => {
        page.drawText(safeText(label), {
          x,
          y,
          size: 8,
          font: fontRegular,
          color: rgb(0.5, 0.5, 0.55),
        });
        const safeVal = safeText(value);
        page.drawText(safeVal.length > 25 ? safeVal.substring(0, 23) + '..' : safeVal, {
          x,
          y: y - 18,
          size: 12,
          font: fontBold,
          color: rgb(0.08, 0.08, 0.12),
        });
      };

      drawInfo('DATE & TIME', data.event_date, 30, height - 140);
      drawInfo('VENUE', data.venue_name, 30, height - 200);
      drawInfo('ATTENDEE', data.attendee_name, 30, height - 260);

      drawInfo('TICKET TIER', item.ticket_tier_name, 310, height - 140);
      drawInfo('BOOKING REF', data.booking_ref, 310, height - 200);
      drawInfo('TICKET NUMBER', `${data.booking_ref}-${ticketNumber}`, 310, height - 260);

      // --- STUB AREA ---
      // Logo or Branding in Stub
      if (logoImage) {
        const logoDims = logoImage.scale(0.12);
        page.drawImage(logoImage, {
          x: mainWidth + stubWidth / 2 - logoDims.width / 2,
          y: height - 55,
          width: logoDims.width,
          height: logoDims.height,
        });
      } else {
        page.drawText(safeText('CITY CULTURE'), {
          x: mainWidth + stubWidth / 2 - 45,
          y: height - 45,
          size: 11,
          font: fontBold,
          color: rgb(0.18, 0.16, 0.45),
        });
      }

      // High-Resolution QR Code
      try {
        const qrContent = `https://www.cityculture.in/members/tickets/${data.booking_ref}`;
        const qrCodeDataUrl = await QRCode.toDataURL(qrContent, { margin: 1, width: 200 });
        const qrCodeBase64 = qrCodeDataUrl.split(',')[1];
        const qrCodeImage = await pdfDoc.embedPng(Buffer.from(qrCodeBase64, 'base64'));

        page.drawImage(qrCodeImage, {
          x: mainWidth + stubWidth / 2 - 60,
          y: 50,
          width: 120,
          height: 120,
        });

        page.drawText(safeText(`${ticketNumber} OF ${totalTickets}`), {
          x: mainWidth + stubWidth / 2 - 25,
          y: 28,
          size: 9,
          font: fontBold,
          color: rgb(0.4, 0.45, 0.5),
        });
      } catch (qrErr) {
        console.error('QR code embedding error in ticket PDF:', qrErr);
      }

      ticketNumber++;
    }
  }

  return await pdfDoc.save();
}
