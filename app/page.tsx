'use client';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';
import { useState, useEffect } from 'react';

export default function Home() {
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedSpec, setSelectedSpec] = useState('');
  const [selectedContact, setSelectedContact] = useState('');
  const [selectedPrice, setSelectedPrice] = useState('');
  const [selectedRating, setSelectedRating] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth <= 768);
    
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Lista województw
  const locations = [
    'Cała Polska',
    'dolnośląskie',
    'kujawsko-pomorskie',
    'lubelskie',
    'lubuskie',
    'łódzkie',
    'małopolskie',
    'mazowieckie',
    'opolskie',
    'podkarpackie',
    'podlaskie',
    'pomorskie',
    'śląskie',
    'świętokrzyskie',
    'warmińsko-mazurskie',
    'wielkopolskie',
    'zachodniopomorskie'
  ];

  // Lista specjalizacji
  const specializations = [
    'Dopasowanie siodła',
    'Dopasowanie ogłowia',
    'Dopasowanie wędzidła',
    'Weterynarz – wrzody',
    'Weterynarz – oczy',
    'Weterynarz – behawior',
    'Weterynarz – rozród',
    'Weterynarz – układ oddechowy',
    'Weterynarz – wydolność / testy',
    'Dietetyk',
    'Behawiorysta',
    'Trener metodami naturalnymi',
    'Trener dyscypliny',
    'Fizjoterapeuta',
    'Biomechanika ruchu'
  ];

  // Formy kontaktu
  const contactOptions = [
    'On-line',
    'W stajni konia',
    'W ośrodku specjalisty'
  ];

  // Opcje cen
  const priceOptions = [
    { value: '', label: 'Dowolna cena' },
    { value: '100', label: 'do 100 zł' },
    { value: '200', label: 'do 200 zł' },
    { value: '300', label: 'do 300 zł' },
    { value: '400', label: 'do 400 zł' },
    { value: '500', label: 'do 500 zł' },
  ];

  // Opcje ocen
  const ratingOptions = [
    { value: '', label: 'Dowolna ocena' },
    { value: '3', label: '3+ gwiazdki' },
    { value: '4', label: '4+ gwiazdki' },
    { value: '4.5', label: '4.5+ gwiazdki' },
  ];

  // Generowanie parametrów URL
  const getSearchParams = () => {
    const params = new URLSearchParams();
    
    if (selectedLocation) params.append('location', selectedLocation);
    if (selectedSpec) params.append('specialization', selectedSpec);
    if (selectedContact) params.append('contactTypes', selectedContact);
    if (selectedPrice) params.append('maxPrice', selectedPrice);
    if (selectedRating) params.append('minRating', selectedRating);
    
    return params.toString();
  };

  return (
    <>
      {/* SEKCJA HERO — obraz po lewej, treść po prawej */}
      <section
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexWrap: 'wrap',
          padding: 'clamp(1rem, 5vw, 2rem) clamp(0.5rem, 3vw, 1rem)',
          maxWidth: '1200px',
          margin: '0 auto',
          gap: 'clamp(1rem, 4vw, 2rem)',
        }}
      >
        {/* Obraz po lewej */}
        <div
          style={{
            flex: '1 1 400px',
            textAlign: 'center',
            height: 'clamp(250px, 40vw, 400px)',
            overflow: 'hidden',
            position: 'relative',
            borderRadius: '1rem',
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
          }}
        >
          <img
            src="/images/elisa-photography-gjk_RegDTrM-unsplash.jpg"
            alt="Koń"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center 30%',
              transition: 'transform 0.3s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          />
        </div>

        {/* Tekst i przycisk po prawej */}
        <div style={{ flex: '1 1 500px', color: '#0D1F40' }}>
          <h1
            style={{
              fontSize: 'clamp(1.8rem, 5vw, 2.5rem)',
              fontWeight: 'bold',
              marginBottom: '1rem',
              lineHeight: '1.2',
            }}
          >
            Czy Twój koń potrzebuje pomocy?
          </h1>

          <p
            style={{
              fontSize: 'clamp(1rem, 2vw, 1.2rem)',
              color: '#444',
              marginBottom: 'clamp(1.5rem, 4vw, 2rem)',
            }}
          >
            Wypełnij krótki test i sprawdź, czy zachowania Twojego konia mogą wskazywać
            na problemy wymagające wsparcia specjalisty.
          </p>

          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <Link
              href="/ankieta"
              style={{
                backgroundColor: '#0D1F40',
                color: 'white',
                fontWeight: 'bold',
                padding: 'clamp(0.8rem, 2vw, 1rem) clamp(1.5rem, 4vw, 2rem)',
                borderRadius: '0.5rem',
                fontSize: 'clamp(1rem, 2vw, 1.1rem)',
                textDecoration: 'none',
                display: 'inline-block',
                transition: 'background-color 0.3s ease, transform 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#1a2f5e';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#0D1F40';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              Zrób test
            </Link>
          </div>
        </div>
      </section>

      {/* SEKCJA JAK DZIAŁA PORTAL - 4 IKONY */}
      <section
        style={{
          backgroundColor: '#f5f7fb',
          padding: 'clamp(2rem, 8vw, 4rem) 1rem',
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2
            style={{
              fontSize: 'clamp(1.8rem, 5vw, 2.5rem)',
              fontWeight: 'bold',
              color: '#0D1F40',
              marginBottom: '1rem',
            }}
          >
            Jak działa nasz portal?
          </h2>
          <p
            style={{
              fontSize: 'clamp(1rem, 2vw, 1.2rem)',
              color: '#444',
              marginBottom: 'clamp(2rem, 5vw, 3rem)',
              maxWidth: '800px',
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          >
            W czterech prostych krokach pomożemy Ci zadbać o dobrostan Twojego konia
          </p>

          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'stretch',
              gap: '1.5rem',
              flexWrap: 'wrap',
            }}
          >
            {/* Ikona 1 - Ocena */}
            <div
              style={{
                flex: '1 1 200px',
                maxWidth: '250px',
                backgroundColor: 'white',
                borderRadius: '1rem',
                padding: '2rem 1rem',
                boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-10px)';
                e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.05)';
              }}
            >
              <div
                style={{
                  width: '80px',
                  height: '80px',
                  backgroundColor: '#0D1F40',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.5rem',
                }}
              >
                <img src="/images/star.svg" alt="Ocena" width={40} height={40} style={{ filter: 'brightness(0) invert(1)' }} />
              </div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#0D1F40', marginBottom: '0.5rem' }}>
                Krok 1: Ocena
              </h3>
              <p style={{ color: '#444', fontSize: '0.95rem', lineHeight: '1.5' }}>
                Oceń zachowanie swojego konia za pomocą naszego testu behawioralnego
              </p>
            </div>

            {/* Ikona 2 - Szukaj */}
            <div
              style={{
                flex: '1 1 200px',
                maxWidth: '250px',
                backgroundColor: 'white',
                borderRadius: '1rem',
                padding: '2rem 1rem',
                boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-10px)';
                e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.05)';
              }}
            >
              <div
                style={{
                  width: '80px',
                  height: '80px',
                  backgroundColor: '#0D1F40',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.5rem',
                }}
              >
                <img src="/images/magnifying-glass.svg" alt="Szukaj" width={40} height={40} style={{ filter: 'brightness(0) invert(1)' }} />
              </div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#0D1F40', marginBottom: '0.5rem' }}>
                Krok 2: Szukaj
              </h3>
              <p style={{ color: '#444', fontSize: '0.95rem', lineHeight: '1.5' }}>
                Znajdź specjalistę dopasowanego do potrzeb Twojego konia
              </p>
            </div>

            {/* Ikona 3 - Rozwiąż */}
            <div
              style={{
                flex: '1 1 200px',
                maxWidth: '250px',
                backgroundColor: 'white',
                borderRadius: '1rem',
                padding: '2rem 1rem',
                boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-10px)';
                e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.05)';
              }}
            >
              <div
                style={{
                  width: '80px',
                  height: '80px',
                  backgroundColor: '#0D1F40',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.5rem',
                }}
              >
                <img src="/images/check-fat.svg" alt="Rozwiąż" width={40} height={40} style={{ filter: 'brightness(0) invert(1)' }} />
              </div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#0D1F40', marginBottom: '0.5rem' }}>
                Krok 3: Rozwiąż
              </h3>
              <p style={{ color: '#444', fontSize: '0.95rem', lineHeight: '1.5' }}>
                Rozwiąż problemy behawioralne pod okiem doświadczonych specjalistów
              </p>
            </div>

            {/* Ikona 4 - Relacja */}
            <div
              style={{
                flex: '1 1 200px',
                maxWidth: '250px',
                backgroundColor: 'white',
                borderRadius: '1rem',
                padding: '2rem 1rem',
                boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-10px)';
                e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.05)';
              }}
            >
              <div
                style={{
                  width: '80px',
                  height: '80px',
                  backgroundColor: '#0D1F40',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.5rem',
                }}
              >
                <img src="/images/heart.svg" alt="Relacja" width={40} height={40} style={{ filter: 'brightness(0) invert(1)' }} />
              </div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#0D1F40', marginBottom: '0.5rem' }}>
                Krok 4: Relacja
              </h3>
              <p style={{ color: '#444', fontSize: '0.95rem', lineHeight: '1.5' }}>
                Buduj lepszą relację ze swoim koniem dzięki profesjonalnemu wsparciu
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SEKCJA WYSZUKIWANIA Z DODATKOWYMI FILTRAMI */}
      <section
        style={{
          backgroundImage: 'linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url("/images/mathias-reding-5-u43jf_Q8c-unsplash.jpg")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: isMobile ? 'scroll' : 'fixed',
          minHeight: 'clamp(200px, 40vw, 300px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'clamp(1rem, 4vw, 2rem)',
        }}
      >
        <div
          style={{
            background: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(5px)',
            borderRadius: '1rem',
            padding: 'clamp(1.5rem, 5vw, 3rem)',
            maxWidth: '1000px',
            width: '100%',
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
          }}
        >
          <h3
            style={{
              fontSize: 'clamp(1.5rem, 4vw, 2.2rem)',
              fontWeight: 'bold',
              color: '#0D1F40',
              margin: '0 0 1.5rem 0',
              textAlign: 'center',
            }}
          >
            Potrzebujesz pomocy? Znajdź specjalistę
          </h3>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
            }}
          >
            {/* Lokalizacja */}
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              style={{
                padding: 'clamp(0.8rem, 2vw, 1rem)',
                borderRadius: '0.6rem',
                border: '2px solid #e0e0e0',
                fontSize: '1rem',
                outline: 'none',
                transition: 'border-color 0.3s ease',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#0D1F40')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#e0e0e0')}
            >
              <option value="">Województwo</option>
              {locations.map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>

            {/* Specjalizacja */}
            <select
              value={selectedSpec}
              onChange={(e) => setSelectedSpec(e.target.value)}
              style={{
                padding: 'clamp(0.8rem, 2vw, 1rem)',
                borderRadius: '0.6rem',
                border: '2px solid #e0e0e0',
                fontSize: '1rem',
                outline: 'none',
                transition: 'border-color 0.3s ease',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#0D1F40')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#e0e0e0')}
            >
              <option value="">Specjalizacja</option>
              {specializations.map((spec) => (
                <option key={spec} value={spec}>
                  {spec}
                </option>
              ))}
            </select>

            {/* Forma kontaktu */}
            <select
              value={selectedContact}
              onChange={(e) => setSelectedContact(e.target.value)}
              style={{
                padding: 'clamp(0.8rem, 2vw, 1rem)',
                borderRadius: '0.6rem',
                border: '2px solid #e0e0e0',
                fontSize: '1rem',
                outline: 'none',
                transition: 'border-color 0.3s ease',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#0D1F40')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#e0e0e0')}
            >
              <option value="">Forma kontaktu</option>
              {contactOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>

            {/* Cena */}
            <select
              value={selectedPrice}
              onChange={(e) => setSelectedPrice(e.target.value)}
              style={{
                padding: 'clamp(0.8rem, 2vw, 1rem)',
                borderRadius: '0.6rem',
                border: '2px solid #e0e0e0',
                fontSize: '1rem',
                outline: 'none',
                transition: 'border-color 0.3s ease',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#0D1F40')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#e0e0e0')}
            >
              {priceOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {/* Ocena */}
            <select
              value={selectedRating}
              onChange={(e) => setSelectedRating(e.target.value)}
              style={{
                padding: 'clamp(0.8rem, 2vw, 1rem)',
                borderRadius: '0.6rem',
                border: '2px solid #e0e0e0',
                fontSize: '1rem',
                outline: 'none',
                transition: 'border-color 0.3s ease',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#0D1F40')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#e0e0e0')}
            >
              {ratingOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {/* Przycisk szukaj */}
            <Link
              href={`/znajdz?${getSearchParams()}`}
              style={{
                backgroundColor: '#0D1F40',
                color: 'white',
                padding: 'clamp(0.8rem, 2vw, 1rem) clamp(1.2rem, 3vw, 1.8rem)',
                borderRadius: '0.5rem',
                fontWeight: 'bold',
                fontSize: '1rem',
                textDecoration: 'none',
                whiteSpace: 'nowrap',
                transition: 'background-color 0.3s ease, transform 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#1a2f5e';
                e.currentTarget.style.transform = 'scale(1.02)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#0D1F40';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              Szukaj
            </Link>
          </div>
        </div>
      </section>

      {/* Reszta sekcji bez zmian... */}
      {/* PROFILOWANI SPECJALIŚCI */}
      <section
        style={{
          backgroundColor: '#f9f9f9',
          padding: 'clamp(2rem, 8vw, 4rem) 1rem',
          textAlign: 'center',
        }}
      >
        <h2
          style={{
            fontSize: 'clamp(1.8rem, 5vw, 2.5rem)',
            fontWeight: 'bold',
            color: '#0D1F40',
            marginBottom: 'clamp(1.5rem, 4vw, 2rem)',
          }}
        >
          Nasi polecani specjaliści
        </h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '2rem',
            maxWidth: '1200px',
            margin: '0 auto',
          }}
        >
          {/* BEHAWIORYSTA */}
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '1rem',
              padding: '1.5rem',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-10px)';
              e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
            }}
          >
            <img
              src="/images/jake-nackos-IF9TK5Uy-KI-unsplash.jpg"
              alt="Behawiorysta"
              style={{
                width: '100%',
                height: '200px',
                objectFit: 'cover',
                borderRadius: '0.5rem',
                marginBottom: '1rem',
                transition: 'transform 0.5s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.1)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            />
            <h3
              style={{
                color: '#0D1F40',
                fontSize: '1.4rem',
                marginBottom: '0.5rem',
              }}
            >
              Anna Kowalska
            </h3>
            <p style={{ marginBottom: '1rem', color: '#444' }}>
              Behawiorystka koni
            </p>
            <Link
              href="/specjalista/anna-kowalska"
              style={{
                backgroundColor: '#0D1F40',
                color: 'white',
                padding: '0.8rem 1.8rem',
                borderRadius: '0.5rem',
                fontWeight: 'bold',
                fontSize: '1rem',
                textDecoration: 'none',
                display: 'inline-block',
                transition: 'background-color 0.3s ease, transform 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#1a2f5e';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#0D1F40';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              Zobacz profil
            </Link>
          </div>

          {/* SADDLE FITTER */}
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '1rem',
              padding: '1.5rem',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-10px)';
              e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
            }}
          >
            <img
              src="/images/cali-brutz-0YovAfvi2uU-unsplash.jpg"
              alt="Saddle fitter"
              style={{
                width: '100%',
                height: '200px',
                objectFit: 'cover',
                borderRadius: '0.5rem',
                marginBottom: '1rem',
                transition: 'transform 0.5s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.1)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            />
            <h3
              style={{
                color: '#0D1F40',
                fontSize: '1.4rem',
                marginBottom: '0.5rem',
              }}
            >
              Marek Nowak
            </h3>
            <p style={{ marginBottom: '1rem', color: '#444' }}>
              Saddle fitter
            </p>
            <Link
              href="/specjalista/profil"
              style={{
                backgroundColor: '#0D1F40',
                color: 'white',
                padding: '0.8rem 1.8rem',
                borderRadius: '0.5rem',
                fontWeight: 'bold',
                fontSize: '1rem',
                textDecoration: 'none',
                display: 'inline-block',
                transition: 'background-color 0.3s ease, transform 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#1a2f5e';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#0D1F40';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              Zobacz profil
            </Link>
          </div>

          {/* TRENER */}
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '1rem',
              padding: '1.5rem',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-10px)';
              e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
            }}
          >
            <img
              src="/images/daniel-schuh-8AqymJv-Sg4-unsplash.jpg"
              alt="Trener koni"
              style={{
                width: '100%',
                height: '200px',
                objectFit: 'cover',
                borderRadius: '0.5rem',
                marginBottom: '1rem',
                transition: 'transform 0.5s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.1)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            />
            <h3
              style={{
                color: '#0D1F40',
                fontSize: '1.4rem',
                marginBottom: '0.5rem',
              }}
            >
              Katarzyna Lewandowska
            </h3>
            <p style={{ marginBottom: '1rem', color: '#444' }}>
              Trenerka naturalna
            </p>
            <Link
              href="/specjalista/katarzyna-lewandowska"
              style={{
                backgroundColor: '#0D1F40',
                color: 'white',
                padding: '0.8rem 1.8rem',
                borderRadius: '0.5rem',
                fontWeight: 'bold',
                fontSize: '1rem',
                textDecoration: 'none',
                display: 'inline-block',
                transition: 'background-color 0.3s ease, transform 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#1a2f5e';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#0D1F40';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              Zobacz profil
            </Link>
          </div>
        </div>
      </section>

      {/* BLOK: DLA WŁAŚCICIELI I DLA SPECJALISTÓW */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 'clamp(1.5rem, 4vw, 2rem)',
          padding: 'clamp(1.5rem, 5vw, 3rem) 1rem',
          maxWidth: '1200px',
          margin: '0 auto',
        }}
      >
        {/* DLA WŁAŚCICIELI */}
        <section
          style={{
            backgroundColor: '#0D1F40',
            color: 'white',
            padding: 'clamp(1.5rem, 5vw, 2.5rem)',
            borderRadius: '1rem',
            textAlign: 'center',
            transition: 'transform 0.3s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <h2 style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 'bold', marginBottom: '1rem', color: 'white' }}>
            Twój koń ma problemy behawioralne?
          </h2>
          <p style={{ fontSize: 'clamp(1rem, 2vw, 1.1rem)', marginBottom: '1.5rem', opacity: 0.9, color: 'white' }}>
            Specjaliści z całej Polski są gotowi Wam pomóc.
          </p>
          <Link
            href="/zgloszenia/zloz"
            style={{
              backgroundColor: 'white',
              color: '#0D1F40',
              padding: 'clamp(0.8rem, 2vw, 1rem) clamp(1.5rem, 4vw, 2rem)',
              borderRadius: '0.5rem',
              fontWeight: 'bold',
              fontSize: 'clamp(0.9rem, 2vw, 1rem)',
              textDecoration: 'none',
              display: 'inline-block',
              transition: 'transform 0.2s ease, background-color 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f0f0f0';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'white';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            Opisz problem i złóż zgłoszenie
          </Link>
        </section>

        {/* DLA SPECJALISTÓW */}
        <section
          style={{
            backgroundColor: '#fff',
            color: '#0D1F40',
            padding: 'clamp(1.5rem, 5vw, 2.5rem)',
            borderRadius: '1rem',
            textAlign: 'center',
            boxShadow: '0 0 0 1px #ccc, 0 10px 30px rgba(0,0,0,0.05)',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.02)';
            e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 0 0 1px #ccc, 0 10px 30px rgba(0,0,0,0.05)';
          }}
        >
          <h2 style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 'bold', marginBottom: '1rem' }}>
            Jesteś specjalistą?
          </h2>
          <p style={{ fontSize: 'clamp(1rem, 2vw, 1.1rem)', marginBottom: '1.5rem', color: '#666' }}>
            Dodaj swój profil i pomóż poprawiać dobrostan koni w Polsce.
          </p>
          <Link
            href="/zaloguj"
            style={{
              backgroundColor: '#0D1F40',
              color: 'white',
              padding: 'clamp(0.8rem, 2vw, 1rem) clamp(1.5rem, 4vw, 2rem)',
              borderRadius: '0.5rem',
              fontWeight: 'bold',
              fontSize: 'clamp(0.9rem, 2vw, 1rem)',
              textDecoration: 'none',
              display: 'inline-block',
              transition: 'transform 0.2s ease, background-color 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#1a2f5e';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#0D1F40';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            Załóż konto
          </Link>
        </section>
      </div>

      {/* SEKCJA QUIZU */}
      <section
        style={{
          backgroundColor: '#fff',
          padding: 'clamp(2rem, 8vw, 4rem) 1rem',
          borderTop: '1px solid #eee',
          borderBottom: '1px solid #eee',
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            alignItems: 'center',
            gap: 'clamp(2rem, 5vw, 3rem)',
          }}
        >
          {/* Obrazek quizu */}
          <div style={{ textAlign: 'center', order: isMobile ? 2 : 1 }}>
            <img
              src="/images/quiz.png"
              alt="Quiz – sygnały konia"
              style={{
                maxWidth: 'min(60%, 300px)',
                height: 'auto',
                borderRadius: '0.75rem',
                transition: 'transform 0.3s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            />
          </div>

          {/* Tekst i przycisk */}
          <div style={{ textAlign: isMobile ? 'center' : 'left', order: 1 }}>
            <h2
              style={{
                fontSize: 'clamp(1.8rem, 5vw, 2.5rem)',
                fontWeight: 'bold',
                color: '#0D1F40',
                marginBottom: '1rem',
              }}
            >
              Jak dobrze znasz sygnały wysyłane przez konie?
            </h2>
            <p style={{ color: '#444', fontSize: 'clamp(1rem, 2vw, 1.1rem)', marginBottom: '2rem' }}>
              Rozwiąż quiz i przekonaj się, czy potrafisz rozpoznać emocje i potrzeby konia!
            </p>
            <div style={{ display: 'flex', justifyContent: isMobile ? 'center' : 'flex-start' }}>
              <Link
                href="/quiz"
                style={{
                  backgroundColor: '#0D1F40',
                  color: 'white',
                  fontWeight: 'bold',
                  padding: 'clamp(0.8rem, 2vw, 1rem) clamp(1.5rem, 4vw, 2rem)',
                  borderRadius: '0.5rem',
                  fontSize: 'clamp(1rem, 2vw, 1.1rem)',
                  textDecoration: 'none',
                  display: 'inline-block',
                  transition: 'background-color 0.3s ease, transform 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#1a2f5e';
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#0D1F40';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                Rozwiąż quiz
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SEKCJA WYDARZEŃ */}
      <section
        style={{
          backgroundColor: '#fff',
          padding: 'clamp(2rem, 8vw, 4rem) 1rem',
          borderBottom: '1px solid #eee',
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            alignItems: 'center',
            gap: 'clamp(2rem, 5vw, 3rem)',
          }}
        >
          {/* TEKST PO LEWEJ */}
          <div style={{ textAlign: isMobile ? 'center' : 'left' }}>
            <h2
              style={{
                fontSize: 'clamp(1.8rem, 5vw, 2.5rem)',
                fontWeight: 'bold',
                color: '#0D1F40',
                marginBottom: '1rem',
              }}
            >
              Chcesz lepiej rozumieć zachowania swojego konia?
            </h2>

            <p style={{ color: '#444', fontSize: 'clamp(1rem, 2vw, 1.1rem)', marginBottom: '2rem' }}>
              Weź udział w szkoleniach i wydarzeniach prowadzonych przez specjalistów.
            </p>

            <div style={{ display: 'flex', justifyContent: isMobile ? 'center' : 'flex-start' }}>
              <Link
                href="/wydarzenia"
                style={{
                  backgroundColor: '#0D1F40',
                  color: 'white',
                  fontWeight: 'bold',
                  padding: 'clamp(0.8rem, 2vw, 1rem) clamp(1.5rem, 4vw, 2rem)',
                  borderRadius: '0.5rem',
                  fontSize: 'clamp(1rem, 2vw, 1.1rem)',
                  textDecoration: 'none',
                  display: 'inline-block',
                  transition: 'background-color 0.3s ease, transform 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#1a2f5e';
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#0D1F40';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                Wybierz wydarzenie
              </Link>
            </div>
          </div>

          {/* OBRAZ PO PRAWEJ */}
          <div style={{ textAlign: 'center' }}>
            <img
              src="/images/event.png"
              alt="Wydarzenia edukacyjne"
              style={{
                maxWidth: 'min(60%, 300px)',
                height: 'auto',
                transition: 'transform 0.3s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            />
          </div>
        </div>
      </section>
    </>
  );
}