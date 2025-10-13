'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

interface ChatUnreadBadgeProps {
  role: 'wlasciciel' | 'specjalista';
}

export default function ChatUnreadBadge({ role }: ChatUnreadBadgeProps) {
  const [unreadCount, setUnreadCount] = useState(0);

  // 🔹 normalizacja ról (żeby nie było "specialista")
  const normalizeRole = (r: string) => {
    if (!r) return '';
    const lower = r.toLowerCase();
    if (lower === 'wlasciciel') return 'wlasciciel';
    if (lower === 'specjalista' || lower === 'specialista') return 'specjalista';
    return lower;
  };

  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user?.email || !user?.uid) return;

    // 🔹 pobieramy wszystkie czaty, w których uczestniczy user
    const q = query(
      collection(db, 'czaty'),
      where('participantEmails', 'array-contains', user.email)
    );

    const unsub = onSnapshot(q, async (snapshot) => {
      let count = 0;

      for (const chatDoc of snapshot.docs) {
        const chat = chatDoc.data();
        const chatId = chatDoc.id;

        const senderUid = chat?.lastMessageSender;
        const senderRole = normalizeRole(chat?.lastMessageRole);
        const senderIdentity = `${senderUid}_${senderRole}`;

        const myIdentity = `${user.uid}_${normalizeRole(role)}`;
        const rsRef = doc(db, 'czaty', chatId, 'readStatus', myIdentity);
        const rsSnap = await getDoc(rsRef);

        const lastReadAt =
          rsSnap.data()?.lastReadAt?.toMillis?.() ??
          rsSnap.data()?.lastReadAtLocal ??
          0;
        const lastMessageAt = chat?.lastMessageAt?.toMillis?.() ?? 0;

        // 🔹 czat ma nieprzeczytaną wiadomość, jeśli:
        // ostatnia wiadomość NIE ode mnie i została wysłana po moim "lastReadAt"
        const hasUnread =
          senderIdentity !== myIdentity && lastMessageAt > lastReadAt;

        if (hasUnread) count++;
      }

      setUnreadCount(count);
    });

    return () => unsub();
  }, [role]);

  if (unreadCount === 0) return null;

  return (
    <span
      style={{
        backgroundColor: '#c00',
        color: 'white',
        padding: '0.2rem 0.5rem',
        borderRadius: '999px',
        fontSize: '0.75rem',
        marginLeft: '6px',
      }}
    >
      {unreadCount}
    </span>
  );
}
