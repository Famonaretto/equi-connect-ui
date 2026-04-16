'use client';

import React, { useState } from 'react';
import { useDialog } from '../../components/DialogProvider';
import { getAuth, createUserWithEmailAndPassword, fetchSignInMethodsForEmail } from 'firebase/auth';
import { getFirestore, collection, addDoc, setDoc, doc, serverTimestamp } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import specializations from '@/utils/specializations';
import locations from '@/utils/locations';
import { contactOptions } from '@/utils/contactOptions';
import { allSpecializations } from '@/utils/specializations';

// Podkategorie problemów behawioralnych (z ankiety pełnej)
const problemSubcategories = [
  { id: 'karmienie', label: 'Podczas karmienia', category: 'Sytuacje codzienne' },
  { id: 'narowy', label: 'Narowy', category: 'Sytuacje codzienne' },
  { id: 'odejscie', label: 'Odejście od koni', category: 'Sytuacje codzienne' },
  { id: 'uwiaz', label: 'Prowadzenie na uwiązie', category: 'Sytuacje codzienne' },
  { id: 'vaa', label: 'Test VAA (kontakt dobrowolny)', category: 'Przed treningiem' },
  { id: 'fha', label: 'Test FHA (kontakt wymuszony)', category: 'Przed treningiem' },
  { id: 'czyszczenie', label: 'Podczas czyszczenia', category: 'Przed treningiem' },
  { id: 'ubieranie', label: 'Podczas ubierania', category: 'Przed treningiem' },
  { id: 'pysk', label: 'Zachowania pyska', category: 'Podczas treningu' },
  { id: 'glowa', label: 'Głowa i szyja', category: 'Podczas treningu' },
  { id: 'ogon', label: 'Ogon', category: 'Podczas treningu' },
  { id: 'chod', label: 'Chód', category: 'Podczas treningu' },
  { id: 'opor', label: 'Opór', category: 'Podczas treningu' },
  { id: 'oddech', label: 'Oddech', category: 'Po treningu' },
  { id: 'spocenie', label: 'Spocenie', category: 'Po treningu' },
  { id: 'otoczenie', label: 'Reakcja na otoczenie', category: 'Po treningu' },
  { id: 'interakcja', label: 'Interakcja z człowiekiem', category: 'Po treningu' },
  { id: 'apetyt', label: 'Apetyt', category: 'Po treningu' },
  { id: 'transport', label: 'Transport', category: 'Sytuacje dodatkowe' },
  { id: 'kowal', label: 'Wizyta kowala', category: 'Sytuacje dodatkowe' },
  { id: 'zawody', label: 'Stajnia domowa a zawody zewnętrzne', category: 'Sytuacje dodatkowe' },
];

// Grupowanie podkategorii według kategorii głównych
const groupedSubcategories = problemSubcategories.reduce((acc, subcat) => {
  if (!acc[subcat.category]) {
    acc[subcat.category] = [];
  }
  acc[subcat.category].push(subcat);
  return acc;
}, {} as Record<string, typeof problemSubcategories>);

export default function ZlozZgloszeniePage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    location: '',
    contactTypes: [] as string[],
    topic: '',
    description: '',
    includeSurvey: false,
    specialization: [] as string[],
    problemSubcategories: [] as string[], // Dodane pole dla podkategorii problemów
  });

  const [attachments, setAttachments] = useState<File[]>([]);
  const [subcategoryError, setSubcategoryError] = useState('');

  const contactOptionsList = ['On-line', 'W stajni konia', 'W ośrodku specjalisty'];

  const handleCheckboxChange = (value: string, group: 'specialization' | 'contactTypes' | 'problemSubcategories') => {
    setForm((prev) => ({
      ...prev,
      [group]: prev[group].includes(value)
        ? prev[group].filter((item: string) => item !== value)
        : [...prev[group], value],
    }));
    // Wyczyść błąd gdy użytkownik zaznaczy coś
    if (group === 'problemSubcategories' && subcategoryError) {
      setSubcategoryError('');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments(Array.from(e.target.files));
    }
  };

  const { showDialog } = useDialog();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const db = getFirestore(app);
    const auth = getAuth(app);

    // Walidacja podkategorii problemów - obowiązkowa!
    if (form.problemSubcategories.length === 0) {
      setSubcategoryError('❌ Musisz wybrać co najmniej jedną kategorię problemu behawioralnego konia.');
      await showDialog('❌ Musisz wybrać co najmniej jedną kategorię problemu behawioralnego konia.');
      return;
    }

    // Uzupełnij brakujące checkboxy domyślnie wszystkimi opcjami
    const finalSpecializations = form.specialization.length > 0 ? form.specialization : allSpecializations;
    const finalContactTypes = form.contactTypes.length > 0 ? form.contactTypes : contactOptionsList;

    // Walidacja pól obowiązkowych
    if (!form.name || !form.email || !form.topic || !form.location) {
      await showDialog('⚠️ Wypełnij wszystkie obowiązkowe pola: imię i nazwisko, e-mail, lokalizacja, temat.');
      return;
    }

    try {
      await addDoc(collection(db, 'zgloszenia'), {
        name: form.name,
        email: form.email,
        location: form.location,
        contactTypes: finalContactTypes,
        topic: form.topic,
        description: form.description,
        specialization: finalSpecializations,
        problemSubcategories: form.problemSubcategories, // Zapisanie wybranych podkategorii
        includeSurvey: form.includeSurvey,
        createdAt: serverTimestamp(),
        status: 'oczekujące',
      });

      const currentUser = auth.currentUser;
      if (!currentUser) {
        const tempUserRef = doc(db, 'users', form.email);
        await setDoc(tempUserRef, {
          email: form.email,
          name: form.name,
          role: 'tymczasowy',
          createdAt: serverTimestamp(),
        });
      }

      await showDialog('✅ Zgłoszenie zostało wysłane!');
      setForm({
        name: '',
        email: '',
        location: '',
        contactTypes: [],
        topic: '',
        description: '',
        includeSurvey: false,
        specialization: [],
        problemSubcategories: [],
      });
      setAttachments([]);
      setSubcategoryError('');
    } catch (err: any) {
      console.error('❌ Błąd przy wysyłaniu zgłoszenia:', err);
      await showDialog(`❌ Błąd: ${err.message}`);
    }
  };

  return (
    <section style={{ maxWidth: '850px', margin: '4rem auto', padding: '2rem' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem', color: '#0D1F40' }}>
        Zgłoszenie właściciela konia
      </h1>
      <p style={{ marginBottom: '2rem' }}>
        Uzupełnij zgłoszenie, abyśmy mogli dopasować najlepszego specjalistę do potrzeb Twojego konia.
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Dane podstawowe */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
          <input
            type="text"
            placeholder="Imię i nazwisko"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            style={inputStyle}
          />
          <small style={{ color: '#666', fontSize: '0.85rem' }}>
            Te dane będą widoczne tylko dla zalogowanych specjalistów.
          </small>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
          <input
            type="email"
            placeholder="Adres email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
            style={inputStyle}
          />
          <small style={{ color: '#666', fontSize: '0.85rem' }}>
            Te dane będą widoczne tylko dla zalogowanych specjalistów.
          </small>
        </div>

        {/* Lokalizacja */}
        <label style={{ fontWeight: 'bold' }}>
          Lokalizacja (województwo):
        </label>
        <select
          value={form.location}
          onChange={(e) => setForm({ ...form, location: e.target.value })}
          required
          style={{
            ...inputStyle,
            padding: '1rem',
            borderRadius: '0.5rem',
            border: '1px solid #ccc',
            fontSize: '1rem',
          }}
        >
          <option value="">-- Wybierz województwo --</option>
          {locations.map((loc) => (
            <option key={loc} value={loc}>
              {loc}
            </option>
          ))}
        </select>

        {/* Temat */}
        <input
          type="text"
          placeholder="Temat zgłoszenia (np. Problemy z siodłaniem, nerwowość)"
          value={form.topic}
          onChange={(e) => setForm({ ...form, topic: e.target.value })}
          required
          style={inputStyle}
        />

        {/* PROBLEMY BEHAWIORALNE KONIA - NOWA SEKCJA OBOWIĄZKOWA */}
        <div style={{
          border: subcategoryError ? '2px solid #c62828' : '1px solid #ccc',
          borderRadius: '0.5rem',
          padding: '1rem',
          backgroundColor: subcategoryError ? '#ffebee' : 'transparent'
        }}>
          <label style={{ fontWeight: 'bold', marginBottom: '0.5rem', display: 'block' }}>
            Problemy behawioralne konia <span style={{ color: '#c62828' }}>*</span>
          </label>
          <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '1rem' }}>
            Zaznacz kategorie problemów, które występują u Twojego konia. To pomoże nam dopasować odpowiedniego specjalistę.
          </p>
          
          {Object.entries(groupedSubcategories).map(([category, subcategories]) => (
            <fieldset key={category} style={{
              border: '1px solid #e0e0e0',
              borderRadius: '0.5rem',
              padding: '1rem',
              marginBottom: '1rem',
              backgroundColor: '#fafafa'
            }}>
              <legend style={{
                fontWeight: 'bold',
                fontSize: '1rem',
                color: '#0D1F40',
                padding: '0 0.5rem'
              }}>
                {category}
              </legend>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                gap: '0.75rem'
              }}>
                {subcategories.map((subcat) => (
                  <label key={subcat.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem',
                    borderRadius: '0.3rem',
                    cursor: 'pointer',
                    backgroundColor: form.problemSubcategories.includes(subcat.id) ? '#e8f0fe' : 'transparent'
                  }}>
                    <input
                      type="checkbox"
                      value={subcat.id}
                      checked={form.problemSubcategories.includes(subcat.id)}
                      onChange={() => handleCheckboxChange(subcat.id, 'problemSubcategories')}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '0.9rem' }}>{subcat.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
          
          {subcategoryError && (
            <p style={{ color: '#c62828', fontSize: '0.85rem', marginTop: '0.5rem' }}>
              {subcategoryError}
            </p>
          )}
        </div>

        {/* Formy kontaktu */}
        <div>
          <label style={{ fontWeight: 'bold' }}>Preferowane formy kontaktu:</label>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
            {contactOptionsList.map((type) => (
              <label key={type} style={{ width: 'auto' }}>
                <input
                  type="checkbox"
                  value={type}
                  checked={form.contactTypes.includes(type)}
                  onChange={() => handleCheckboxChange(type, 'contactTypes')}
                />{' '}
                {type}
              </label>
            ))}
          </div>
        </div>

        {/* Specjalizacje */}
        <div>
          <label style={{ fontWeight: 'bold', marginBottom: '0.5rem', display: 'block' }}>
            Wybierz potrzebne specjalizacje:
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
            {specializations.map((spec) => (
              <label key={spec} style={{ width: '45%' }}>
                <input
                  type="checkbox"
                  value={spec}
                  checked={form.specialization.includes(spec)}
                  onChange={() => handleCheckboxChange(spec, 'specialization')}
                />{' '}
                {spec}
              </label>
            ))}
          </div>
        </div>

        {/* Opis */}
        <textarea
          rows={5}
          placeholder="Opisz szczegółowo problem lub zachowanie konia, które Cię niepokoi..."
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          style={{ ...inputStyle, resize: 'vertical' }}
        />

        {/* Załączniki */}
        <div>
          <label style={{ fontWeight: 'bold' }}>Załącz zdjęcia lub nagrania (opcjonalnie - widoczne tylko dla zalogowanych specjalistów):</label>
          <input type="file" multiple accept="image/*,video/*" onChange={handleFileChange} />
        </div>

        {/* Ankieta */}
        <div>
          <label style={{ fontWeight: 'bold' }}>
            Czy chcesz dołączyć wypełnioną ocenę zachowania?
          </label>
          <div style={{ marginTop: '0.5rem' }}>
            <label>
              <input
                type="checkbox"
                checked={form.includeSurvey}
                onChange={() => setForm({ ...form, includeSurvey: !form.includeSurvey })}
              />{' '}
              Tak, dołączam ankietę (do pobrania <a href="/ankieta" target="_blank">tutaj</a>)
            </label>
          </div>
        </div>

        {/* Przycisk wysyłki */}
        <button
          type="submit"
          style={{
            backgroundColor: '#0D1F40',
            color: 'white',
            padding: '1rem',
            borderRadius: '0.5rem',
            fontWeight: 'bold',
            fontSize: '1.1rem',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Wyślij zgłoszenie
        </button>
      </form>
    </section>
  );
}

const inputStyle = {
  padding: '1rem',
  borderRadius: '0.5rem',
  border: '1px solid #ccc',
  fontSize: '1rem',
  width: '100%',
  boxSizing: 'border-box' as const,
};