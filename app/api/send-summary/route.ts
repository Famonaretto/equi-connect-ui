import { NextResponse } from 'next/server';
import PDFDocument from 'pdfkit';
import nodemailer from 'nodemailer';
import stream from 'stream';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, horseName, summaryText, answers } = body;

    if (!email || !horseName || !summaryText) {
      return NextResponse.json({ error: 'Brak wymaganych danych' }, { status: 400 });
    }

    const doc = new PDFDocument();
    const buffers: Buffer[] = [];

    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', async () => {
      const pdfBuffer = Buffer.concat(buffers);

      // Konfiguracja maila
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      await transporter.sendMail({
        from: `"Ocena konia" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `📋 Ocena konia: ${horseName}`,
        text: `W załączniku znajdziesz ocenę zachowania konia ${horseName}.`,
        attachments: [
          {
            filename: `ocena_${horseName}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf',
          },
        ],
      });
    });

    // Zawartość PDF
    doc.fontSize(18).text(`Ocena zachowania konia: ${horseName}`, { underline: true });
    doc.moveDown().fontSize(14).text(summaryText);
    doc.moveDown().fontSize(12).text('Zaznaczone odpowiedzi:');
    answers.forEach((ans: string) => {
      doc.text(`• ${ans}`);
    });
    doc.end();

    return NextResponse.json({ message: 'PDF wysłany na maila' }, { status: 200 });
  } catch (err) {
    console.error('Błąd wysyłki maila:', err);
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 });
  }
}
