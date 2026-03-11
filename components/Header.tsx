'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import RootLayoutClient from '@/app/components/RootLayoutClient';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showHamburger, setShowHamburger] = useState(false);

  const headerRef = useRef<HTMLDivElement | null>(null);
  const navRowRef = useRef<HTMLDivElement | null>(null);
  const measureNavRef = useRef<HTMLDivElement | null>(null);

  const closeMenu = () => setIsMenuOpen(false);

  const updateMenuMode = () => {
    const navRowEl = navRowRef.current;
    const measureEl = measureNavRef.current;

    if (!navRowEl || !measureEl) return;

    const navRowWidth = navRowEl.clientWidth;
    measureEl.style.width = `${navRowWidth}px`;

    const links = Array.from(measureEl.querySelectorAll('a')) as HTMLAnchorElement[];
    if (!links.length) return;

    const rows = new Set(links.map((link) => link.offsetTop));
    const shouldShowHamburger = rows.size > 2;

    setShowHamburger(shouldShowHamburger);

    if (!shouldShowHamburger) {
      setIsMenuOpen(false);
    }
  };

  useLayoutEffect(() => {
    updateMenuMode();
  }, []);

  useEffect(() => {
    const handleResize = () => updateMenuMode();
    window.addEventListener('resize', handleResize);

    let observer: ResizeObserver | null = null;
    if (headerRef.current) {
      observer = new ResizeObserver(() => updateMenuMode());
      observer.observe(headerRef.current);
    }

    const t1 = window.setTimeout(updateMenuMode, 50);
    const t2 = window.setTimeout(updateMenuMode, 250);

    return () => {
      window.removeEventListener('resize', handleResize);
      observer?.disconnect();
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, []);

  return (
    <header className="main-header">
      <div className="header-shell" ref={headerRef}>
        <div className="header-grid">
          <Link href="/" className="header-logo" onClick={closeMenu}>
            <Image
              src="/images/logo2.png"
              alt="EquiConnect logo"
              width={220}
              height={220}
              priority
              className="header-logo-img"
            />
          </Link>

          <div className="header-top-content">
            <div className="header-brand">
              <h1 className="header-title">
                <span className="header-title-main">EKI 360</span>
                <span className="header-title-sub"> – Łączymy się dla Koni</span>
              </h1>
            </div>

            <div className="header-account">
              <RootLayoutClient />
            </div>
          </div>

          <div className="header-nav-row" ref={navRowRef}>
            {!showHamburger ? (
              <nav className="desktop-nav">
                <Link href="/" onClick={closeMenu}>Strona główna</Link>
                <Link href="/ankieta" onClick={closeMenu}>Ocena zachowania konia</Link>
                <Link href="/znajdz" onClick={closeMenu}>Znajdź specjalistę</Link>
                <Link href="/zgloszenia/lista" onClick={closeMenu}>Zgłoszenia właścicieli koni</Link>
                <Link href="/wydarzenia" onClick={closeMenu}>Wydarzenia</Link>
                <Link href="/blog" onClick={closeMenu}>Blog</Link>
              </nav>
            ) : (
              <div className="nav-hamburger-row">
                <button
                  className="nav-hamburger"
                  onClick={() => setIsMenuOpen((prev) => !prev)}
                  aria-label="Otwórz menu"
                  aria-expanded={isMenuOpen}
                  type="button"
                >
                  ☰
                </button>
              </div>
            )}

            <nav
              className="desktop-nav desktop-nav-measure"
              ref={measureNavRef}
              aria-hidden="true"
            >
              <Link href="/" tabIndex={-1}>Strona główna</Link>
              <Link href="/ankieta" tabIndex={-1}>Ocena zachowania konia</Link>
              <Link href="/znajdz" tabIndex={-1}>Znajdź specjalistę</Link>
              <Link href="/zgloszenia/lista" tabIndex={-1}>Zgłoszenia właścicieli koni</Link>
              <Link href="/wydarzenia" tabIndex={-1}>Wydarzenia</Link>
              <Link href="/blog" tabIndex={-1}>Blog</Link>
            </nav>
          </div>
        </div>
      </div>

      {showHamburger && (
        <nav className={`mobile-nav ${isMenuOpen ? 'open' : ''}`}>
          <Link href="/" onClick={closeMenu}>Strona główna</Link>
          <Link href="/ankieta" onClick={closeMenu}>Ocena zachowania konia</Link>
          <Link href="/znajdz" onClick={closeMenu}>Znajdź specjalistę</Link>
          <Link href="/zgloszenia/lista" onClick={closeMenu}>Zgłoszenia właścicieli koni</Link>
          <Link href="/wydarzenia" onClick={closeMenu}>Wydarzenia</Link>
          <Link href="/blog" onClick={closeMenu}>Blog</Link>
        </nav>
      )}
    </header>
  );
}