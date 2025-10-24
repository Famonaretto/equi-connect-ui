import ChatBox from '@/components/ChatBox';
import Link from 'next/link';

interface Props {
  params: Promise<{ chatId: string }>;
}

export default async function Page({ params }: Props) {
  const { chatId } = await params;

  return (
    <div style={{ padding: '2rem' }}>
      <Link href="/specjalista?tab=czat" style={{ color: '#002F6C', fontWeight: 'bold' }}>
        ← Wróć do listy czatów
      </Link>
      <ChatBox chatId={chatId} role="specjalista" />
    </div>
  );
}

