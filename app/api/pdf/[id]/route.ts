import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import PDFDocument from 'pdfkit';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const db = getFirestore(app);
  const ref = doc(db, 'oceny_zachowania', params.id);
  const snapshot = await getDoc(ref);

  if (!snapshot.exists()) {
    return new NextResponse('Nie znaleziono dokumentu.', { status: 404 });
  }

  const data = snapshot.data();

  const docPdf = new PDFDocument({ font: 'Times-Roman' });
  const buffers: Buffer[] = [];

  docPdf.on('data', buffers.push.bind(buffers));
  docPdf.on('end', () => {});

  docPdf.fontSize(20).text('Ocena zachowania konia', { underline: true });
  docPdf.moveDown();

  docPdf.fontSize(14).text(`ID: ${params.id}`);
  docPdf.moveDown();
  docPdf.text(`Email: ${data.email || 'brak'}`);
  docPdf.text(`Data: ${data.createdAt?.toDate?.().toLocaleString?.() || 'brak daty'}`);
  docPdf.moveDown();

  docPdf.text('Dane formularza:', { underline: true });
  docPdf.moveDown();

  const formData = data.formData || {};
  for (const [key, value] of Object.entries(formData)) {
    docPdf.text(`${key}: ${typeof value === 'string' ? value : value ? '✔️' : '❌'}`);
  }

  docPdf.end();

  const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
    docPdf.on('end', () => resolve(Buffer.concat(buffers)));
    docPdf.on('error', reject);
  });

  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="ocena-${params.id}.pdf"`,
    },
  });
}
