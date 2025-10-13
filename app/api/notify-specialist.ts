// pages/api/notify-specialist.ts
import nodemailer from 'nodemailer';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {

  if (req.method !== 'POST') return res.status(405).end('Method not allowed');

  const { specialistEmail } = req.body;

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  const mailOptions = {
    from: process.env.SMTP_EMAIL,
    to: specialistEmail,
    subject: 'Odpowiedź właściciela na Twoją ofertę',
    html: `
      <p>Otrzymałeś odpowiedź na swoją ofertę pomocy.</p>
      <p><a href="${process.env.BASE_URL}/panel-specjalisty">Zaloguj się i sprawdź</a></p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Email sent to specialist' });
  } catch (err) {
    console.error('Email error:', err);
    res.status(500).json({ error: 'Failed to send email' });
  }
}
