// /pages/api/sendConsultationStatusUpdate.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import nodemailer from 'nodemailer';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { app } from '@/lib/firebase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { consultationId, status, cancelReason } = req.body;

  if (!consultationId || !status) {
    return res.status(400).json({ message: 'Missing parameters' });
  }

  try {
    const db = getFirestore(app);
    const consultationRef = doc(db, 'konsultacje', consultationId);
    const consultationSnap = await getDoc(consultationRef);

    if (!consultationSnap.exists()) {
      return res.status(404).json({ message: 'Consultation not found' });
    }

    const consultation = consultationSnap.data();

    // Ustal adres odbiorcy (wysyłamy do drugiej strony)
    let recipientEmail = '';
    let recipientName = '';

    if (status === 'odwołane') {
      // Jeśli odwołuje właściciel, wysyłamy do specjalisty
      // Jeśli odwołuje specjalista, wysyłamy do właściciela
      if (consultation.lastUpdatedBy === consultation.ownerEmail) {
        recipientEmail = consultation.specialistEmail;
        recipientName = consultation.specialistName || 'Specjalista';
      } else {
        recipientEmail = consultation.ownerEmail;
        recipientName = consultation.ownerName || 'Właściciel konia';
      }
    } else {
      // Dla innych zmian wysyłamy do obu (tu przykład)
      recipientEmail = consultation.ownerEmail;
      recipientName = consultation.ownerName || '';
    }

    if (!recipientEmail) {
      return res.status(400).json({ message: 'No recipient email found' });
    }

    // Konfiguracja transportu maila
    const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});


    // Treść wiadomości
    const subject = `Aktualizacja statusu konsultacji: ${status}`;
    const text = `Dzień dobry ${recipientName},

Status konsultacji "${consultation.temat || 'Konsultacja'}" został zmieniony na: ${status}.

Data: ${consultation.proponowanyTermin ? new Date(consultation.proponowanyTermin).toLocaleString() : ''}

${status === 'odwołane' ? `Powód odwołania: ${cancelReason || 'Nie podano'}` : ''}

Pozdrawiamy,
Zespół EquiConnect`;

    await transporter.sendMail({
      from: `"EquiConnect" <${process.env.SMTP_USER}>`,
      to: recipientEmail,
      subject,
      text,
    });

    res.status(200).json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error('Email sending error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
