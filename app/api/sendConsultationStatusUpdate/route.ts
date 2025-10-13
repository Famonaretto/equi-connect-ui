import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: NextRequest) {
  try {
    const { to, specialistName } = await req.json();

    if (!to || !specialistName) {
      return NextResponse.json({ error: 'Brakuje danych' }, { status: 400 });
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: '"EquiConnect" <no-reply@equiconnect.pl>',
      to,
      subject: 'Zmiana statusu Twojej konsultacji',
      html: `
        <p>Twoja prośba o konsultację u <strong>${specialistName}</strong> zmieniła status.</p>
        <p>Wejdź na swoje konto, aby sprawdzić szczegóły.</p>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Błąd przy wysyłce maila:', error);
    return NextResponse.json({ error: 'Wysyłka nie powiodła się' }, { status: 500 });
  }
}
