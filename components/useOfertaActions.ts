import { deleteDoc, doc, getDoc, updateDoc, serverTimestamp, getFirestore } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { getAuth } from 'firebase/auth';
import { useState } from 'react';

export function useOfertaActions() {
  const [loading, setLoading] = useState(false);
  const db = getFirestore(app);
  const auth = getAuth(app);

  const handleCancelOffer = async (ofertaId: string, onSuccess?: () => void) => {
    const confirmed = window.confirm('Czy na pewno chcesz anulować tę ofertę?');
    if (!confirmed) return;

    setLoading(true);
    try {
      await deleteDoc(doc(db, 'ofertySpecjalistow', ofertaId));
      alert('✅ Oferta została anulowana.');
      onSuccess?.();
    } catch (error) {
      console.error('❌ Błąd przy anulowaniu oferty:', error);
      alert('❌ Nie udało się anulować oferty.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditOffer = async (
    ofertaId: string,
    onEdit: (data: any) => void
  ) => {
    const ofertaRef = doc(db, 'ofertySpecjalistow', ofertaId);
    const ofertaSnap = await getDoc(ofertaRef);

    if (!ofertaSnap.exists()) {
      alert('❌ Nie znaleziono oferty.');
      return;
    }

    const oferta = ofertaSnap.data();
    onEdit({ ofertaId, oferta });
  };

  return { handleCancelOffer, handleEditOffer, loading };
}
