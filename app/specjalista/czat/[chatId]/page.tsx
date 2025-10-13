'use client'
import ChatBox from '@/components/ChatBox'
import Link from 'next/link'

export default function SpecialistChatPage({ params }: { params: { chatId: string } }) {
  return (
    <div style={{ padding: '16px', width: '100%' }}>
      <div style={{ marginBottom: '12px' }}>
        <Link href="/specjalista?tab=czat" style={{ color: '#002F6C', fontWeight: 'bold' }}>
  ← Wróć do listy czatów
</Link>

      </div>
      <ChatBox chatId={params.chatId} role="specjalista" />

    </div>
  )
}
