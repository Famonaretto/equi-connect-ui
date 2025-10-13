'use client';

import { useEffect, useState } from 'react';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';
import { app } from '@/lib/firebase';

export default function MessageBadge({ role }: { role: 'specjalista' | 'wlasciciel' }) {
  const [total, setTotal] = useState(0);
  const [newCount, setNewCount] = useState(0);

  useEffect(() => {
    const fetchMessages = async () => {
      const auth = getAuth(app);
      const user = auth.currentUser;
      if (!user?.email) return;

      const db = getFirestore(app);

      const field = role === 'specjalista' ? 'specialistEmail' : 'ownerEmail';

      const q = query(collection(db, 'oferty'), where(field, '==', user.email));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => doc.data());

      setTotal(data.length);

      const unread = data.filter(d => !d.oznaczonaJakoPrzeczytana).length;
      setNewCount(unread);
    };

    fetchMessages();
  }, [role]);

  if (total === 0) return null;

  return (
    <span style={{
      marginLeft: '0.5rem',
      backgroundColor: '#0D1F40',
      color: 'white',
      padding: '0.15rem 0.5rem',
      borderRadius: '999px',
      fontSize: '0.75rem',
      fontWeight: 'bold',
    }}>
      {newCount}/{total}
    </span>
  );
}
