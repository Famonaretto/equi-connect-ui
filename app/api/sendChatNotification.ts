import type { NextApiRequest, NextApiResponse } from 'next';
import nodemailer from 'nodemailer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { to, subject, text } = JSON.parse(req.body);

    if (!to) {
      return res.status(400).json({ error: 'Brak adresu e-mail odbiorcy' });
    }

    // 📬 Transport poczty (tu ustaw dane SMTP lub SendGrid)
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Equi Connect" <${process.env.SMTP_USER}>`,
      to,
      subject: subject || 'Nowa wiadomość w czacie',
      text: text || 'Otrzymałeś nową wiadomość w czacie.',
    });

    res.status(200).json({ success: true });
  } catch (err) {
    console.error('❌ Błąd wysyłki maila:', err);
    res.status(500).json({ error: 'Nie udało się wysłać e-maila' });
  }
}
