// lib/ofertyHelpers.ts
import { doc, getDoc, getFirestore } from 'firebase/firestore';
import { Dispatch, SetStateAction } from 'react';
import { app } from '@/lib/firebase';

// Typ dla danych edycji oferty
type SetOfertaData = {
  setSelectedZgloszenie: Dispatch<SetStateAction<string | null>>;
  setEditingOfertaId: Dispatch<SetStateAction<string | null>>;
  setPriceFrom: Dispatch<SetStateAction<string>>;
  setPriceTo: Dispatch<SetStateAction<string>>;
  setTerminy: Dispatch<SetStateAction<{ date: string; time: string }[]>>;
  setShowDialog: Dispatch<SetStateAction<boolean>>;
};

export const handleEditOffer = async (
  ofertaId: string,
  {
    setSelectedZgloszenie,
    setEditingOfertaId,
    setPriceFrom,
    setPriceTo,
    setTerminy,
    setShowDialog,
  }: SetOfertaData
) => {
  try {
    const db = getFirestore(app);
    const ofertaRef = doc(db, 'ofertySpecjalistow', ofertaId);
    const ofertaSnap = await getDoc(ofertaRef);

    if (!ofertaSnap.exists()) {
      alert('❌ Nie znaleziono oferty.');
      return;
    }

    const oferta = ofertaSnap.data();

    // Ustaw dane w formularzu
    setSelectedZgloszenie(oferta.zgloszenieId || '');
    setEditingOfertaId(ofertaId);
    setPriceFrom(oferta.cena?.od || '');
    setPriceTo(oferta.cena?.do || '');

    setTerminy(
      Array.isArray(oferta.proponowaneTerminy)
        ? oferta.proponowaneTerminy.map((t: string) => {
            const [date, ...rest] = t.split(' ');
            const time = rest.join(' ') || '';
            return { date, time };
          })
        : [{ date: '', time: '' }]
    );

    // Pokaż formularz edycji
    setShowDialog(true);

  } catch (error) {
    console.error('❌ Błąd przy pobieraniu oferty:', error);
    alert('❌ Wystąpił błąd podczas edycji oferty.');
  }
};
