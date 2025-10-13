// pages/api/notify-owner.ts
import nodemailer from 'nodemailer';

import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {


  if (req.method !== 'POST') return res.status(405).end('Method not allowed');

  const { ownerEmail } = req.body;

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  const mailOptions = {
    from: process.env.SMTP_EMAIL,
    to: ownerEmail,
    subject: 'Nowa oferta pomocy od specjalisty',
    html: `
      <p>Otrzymałeś nową ofertę pomocy od specjalisty.</p>
      <p><a href="${process.env.BASE_URL}/panel-wlasciciela">Zaloguj się i zobacz szczegóły</a></p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Email sent to owner' });
  } catch (err) {
    console.error('Email error:', err);
    res.status(500).json({ error: 'Failed to send email' });
  }
}
