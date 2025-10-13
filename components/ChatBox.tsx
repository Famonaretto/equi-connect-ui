'use client'

import { useEffect, useState } from 'react'
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  doc,
  updateDoc,
  getDoc,
  setDoc,
} from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import { app } from '@/lib/firebase'
import { useRouter } from 'next/navigation'

interface Message {
  id: string
  text: string
  senderUid: string
  senderEmail: string
  senderRole: string
  createdAt: any
}

interface UserProfile {
  firstName?: string
  lastName?: string
}

interface ChatBoxProps {
  chatId: string
  role: 'wlasciciel' | 'specjalista'
  onBack?: () => void
}

export default function ChatBox({ chatId, onBack, role }: ChatBoxProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [userProfiles, setUserProfiles] = useState<
    Record<string, Record<'specjalista' | 'wlasciciel', UserProfile>>
  >({})
  const [newMessage, setNewMessage] = useState('')
  const auth = getAuth(app)
  const db = getFirestore(app)
  const router = useRouter()
  const user = auth.currentUser

  // 🔄 Funkcje pomocnicze do ról
  const isOwner = (r: string) =>
    r?.toLowerCase() === 'wlasciciel' || r?.toLowerCase() === 'wlasciciel'
  const isSpecialist = (r: string) =>
    r?.toLowerCase() === 'specjalista' || r?.toLowerCase() === 'specjalista'

  const normalizeRole = (r: string) => {
    if (isOwner(r)) return 'wlasciciel'
    if (isSpecialist(r)) return 'specjalista'
    return r?.toLowerCase() ?? ''
  }

  const isMyMessage = (m: Message) => {
    return m.senderUid === user?.uid && normalizeRole(m.senderRole) === normalizeRole(role)
  }

  const getDisplayName = (uid: string, senderRole: string) => {
    const normalizedRole = isOwner(senderRole)
      ? 'wlasciciel'
      : isSpecialist(senderRole)
      ? 'specjalista'
      : senderRole

    const profile =
      userProfiles[uid]?.[normalizedRole as 'wlasciciel' | 'specjalista']

    const fullName = `${profile?.firstName || ''} ${profile?.lastName || ''}`.trim()
    const translatedRole =
      normalizedRole === 'wlasciciel' ? 'właściciel' : 'specjalista'

    return `${fullName || 'Nieznany użytkownik'} – ${translatedRole}`
  }

  const fetchUserProfiles = async (uids: string[]) => {
    const profiles: Record<string, Record<'specjalista' | 'wlasciciel', UserProfile>> = {}
    console.log('📥 Pobieram profile dla UID:', uids)

    for (const uid of uids) {
      const docRef = doc(db, 'users', uid)
      const snap = await getDoc(docRef)

      if (snap.exists()) {
        const data = snap.data()
        profiles[uid] = {
          specjalista: {
            firstName: data?.roles?.specjalista?.firstName || '',
            lastName: data?.roles?.specjalista?.lastName || '',
          },
          wlasciciel: {
            firstName: data?.roles?.wlasciciel?.firstName || '',
            lastName: data?.roles?.wlasciciel?.lastName || '',
          },
        }

        console.log(`✅ Profil użytkownika ${uid} załadowany`)
      } else {
        console.warn(`❌ Brak dokumentu użytkownika w Firestore dla UID: ${uid}`)
      }
    }

    setUserProfiles(profiles)
  }



  // ✅ Subskrypcja wiadomości
  useEffect(() => {
    const q = query(
      collection(db, 'czaty', chatId, 'messages'),
      orderBy('createdAt', 'asc')
    )

const unsub = onSnapshot(q, async (snap) => {
  const fetched = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Message))
  setMessages(fetched)

  // 🔹 pobierz profile
  const uniqueUids = Array.from(new Set(fetched.map((m) => m.senderUid)))
  await fetchUserProfiles(uniqueUids)

// Sprawdź, czy ostatnia wiadomość NIE pochodzi ode mnie
const lastMsg = fetched[fetched.length - 1]
const isLastFromMe = lastMsg?.senderUid === user?.uid && normalizeRole(lastMsg?.senderRole) === normalizeRole(role)

if (user?.uid && !isLastFromMe) {
  const normalizedRole = normalizeRole(role)
  const readStatusId = `${user.uid}_${normalizedRole}`
  const rsRef = doc(db, 'czaty', chatId, 'readStatus', readStatusId)
  await setDoc(rsRef, { lastReadAt: serverTimestamp() }, { merge: true })
}


  // 🔹 scroll na dół
  setTimeout(() => {
    const container = document.getElementById('chat-scroll')
    if (container) container.scrollTop = container.scrollHeight
  }, 100)
})


    return () => unsub()
  }, [chatId])

  // ✅ Wysyłanie wiadomości
  const handleSend = async () => {
    if (!user || !newMessage.trim() || !role) return

    const normalizedRole = normalizeRole(role)
    console.log(`✉️ Wysyłam wiadomość "${newMessage}" jako ${user.uid}_${normalizedRole}`)

    await addDoc(collection(db, 'czaty', chatId, 'messages'), {
      text: newMessage,
      senderUid: user.uid,
      senderEmail: user.email,
      senderRole: normalizedRole, // zapisujemy jako owner/specialist
      createdAt: serverTimestamp(),
    })

    await updateDoc(doc(db, 'czaty', chatId), {
      lastMessage: newMessage,
      lastMessageAt: serverTimestamp(),
      lastMessageSender: user.uid,
      lastMessageRole: normalizedRole,
      updatedAt: serverTimestamp(),
    })

    console.log(`✅ Czat ${chatId} zaktualizowany nową wiadomością`)
    setNewMessage('')
  }

  const formatTime = (timestamp: any) => {
    if (!timestamp?.toDate) return ''
    const date = timestamp.toDate()
    return `${date.getHours().toString().padStart(2, '0')}:${date
      .getMinutes()
      .toString()
      .padStart(2, '0')}`
  }

  const formatDate = (timestamp: any) => {
    if (!timestamp?.toDate) return ''
    const date = timestamp.toDate()
    return date.toLocaleDateString()
  }

  const isNewDay = (current: Message, previous?: Message) => {
    if (!previous) return true
    const d1 = current.createdAt?.toDate?.()?.toDateString?.()
    const d2 = previous.createdAt?.toDate?.()?.toDateString?.()
    return d1 !== d2
  }

  return (
    <>
      <style>{`
        .chat-container {
          max-height: 400px;
          overflow-y: auto;
          padding: 16px 24px;
          background: #f7f7f7;
          border: 1px solid #ddd;
          border-radius: 8px;
          max-width: 100%;
          margin-bottom: 16px;
        }

        .message-wrapper {
          display: flex;
          flex-direction: column;
          margin-bottom: 12px;
          width: fit-content;
          max-width: 80%;
        }

        .me {
          margin-left: auto;
          align-items: flex-end;
        }

        .other {
          margin-right: auto;
          align-items: flex-start;
        }

        .message-meta {
          font-size: 12px;
          color: #666;
          margin-bottom: 4px;
        }

        .message {
          max-width: 70%;
          padding: 10px 14px;
          border-radius: 20px;
          word-wrap: break-word;
          font-size: 14px;
          line-height: 1.4;
        }

        .me .message {
          background-color: #002F6C;
          color: white;
        }

        .other .message {
          background-color: #D0E6FF;
          color: black;
        }

        .message-time {
          font-size: 10px;
          color: #888;
          margin-top: 2px;
        }

        .input-wrapper {
          display: flex;
          flex-direction: row;
          gap: 8px;
          width: 100%;
        }

        .input-wrapper input {
          flex: 1;
          padding: 12px 16px;
          border-radius: 20px;
          border: 1px solid #ccc;
          font-size: 14px;
        }

        .input-wrapper button {
          background-color: #002F6C;
          color: white;
          border: none;
          padding: 12px 20px;
          border-radius: 20px;
          cursor: pointer;
          font-size: 14px;
          min-width: 100px;
        }

        .input-wrapper button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          .input-wrapper {
            flex-direction: column;
          }

          .input-wrapper button {
            width: 100%;
          }
        }

        .back-button {
          margin-bottom: 16px;
          display: inline-block;
          background: none;
          border: none;
          color: #002F6C;
          font-weight: bold;
          cursor: pointer;
          font-size: 14px;
        }

        .chat-date-separator {
          text-align: center;
          font-size: 12px;
          color: #aaa;
          margin: 12px 0;
        }
      `}</style>

      <div className="chat-container" id="chat-scroll">
        {messages.map((m, i) => {
          const me = isMyMessage(m)
          const showMeta =
            i === 0 ||
            messages[i - 1].senderEmail !== m.senderEmail ||
            messages[i - 1].senderRole !== m.senderRole

          const showDate = i === 0 || isNewDay(m, messages[i - 1])
          const displayName = getDisplayName(m.senderUid, m.senderRole)

          return (
            <div key={m.id}>
              {showDate && (
                <div className="chat-date-separator">{formatDate(m.createdAt)}</div>
              )}
              <div className={`message-wrapper ${me ? 'me' : 'other'}`}>
                {showMeta && <div className="message-meta">{displayName}</div>}
                <div className="message">{m.text}</div>
                <div className="message-time">{formatTime(m.createdAt)}</div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="input-wrapper">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Napisz wiadomość..."
        />
        <button onClick={handleSend} disabled={!role || !newMessage.trim()}>
          Wyślij
        </button>
      </div>
    </>
  )
}
