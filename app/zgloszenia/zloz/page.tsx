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
  });

  const [attachments, setAttachments] = useState<File[]>([]);

  const contactOptions = ['On-line', 'W stajni konia', 'W ośrodku specjalisty'];

  const handleCheckboxChange = (value: string, group: 'specialization' | 'contactTypes') => {
    setForm((prev) => ({
      ...prev,
      [group]: prev[group].includes(value)
        ? prev[group].filter((item: string) => item !== value)
        : [...prev[group], value],
    }));
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

  // Uzupełnij brakujące checkboxy domyślnie wszystkimi opcjami
  const finalSpecializations = form.specialization.length > 0 ? form.specialization : allSpecializations;
  const finalContactTypes = form.contactTypes.length > 0 ? form.contactTypes : contactOptions;

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
    });
    setAttachments([]);
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


        <input
          type="text"
          placeholder="Temat zgłoszenia (np. Problemy z siodłaniem, nerwowość)"
          value={form.topic}
          onChange={(e) => setForm({ ...form, topic: e.target.value })}
          required
          style={inputStyle}
        />

        <div>
          <label style={{ fontWeight: 'bold' }}>Preferowane formy kontaktu:</label>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
            {contactOptions.map((type) => (
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

        <textarea
          rows={5}
          placeholder="Opisz szczegółowo problem lub zachowanie konia, które Cię niepokoi..."
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          style={{ ...inputStyle, resize: 'vertical' }}
        />

        <div>
          <label style={{ fontWeight: 'bold' }}>Załącz zdjęcia lub nagrania (opcjonalnie - widoczne tylko dla zalogowanych specjalistów):</label>
          <input type="file" multiple accept="image/*,video/*" onChange={handleFileChange} />
        </div>

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
};
