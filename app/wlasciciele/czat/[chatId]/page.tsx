'use client'
import { useParams, useRouter } from 'next/navigation'
import ChatBox from '@/components/ChatBox'

export default function ChatViewPage() {
  const { chatId } = useParams()
  const router = useRouter()

  return (
    <div>
      <button
        onClick={() => router.push('/wlasciciele/czat')}
        style={{
          marginBottom: '16px',
          backgroundColor: '#eee',
          border: '1px solid #ccc',
          padding: '8px 16px',
          borderRadius: '6px',
          cursor: 'pointer',
        }}
      >
        ← Wróć do listy czatów
      </button>

      <ChatBox chatId={chatId as string} role="wlasciciel" />
    </div>
  )
}
