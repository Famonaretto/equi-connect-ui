'use client';
import { useState } from 'react';
import { getAuth, updateEmail, updatePassword, onAuthStateChanged } from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  collection,
  getDocs,
  query,
  where,
  getDoc,
  addDoc,
  Timestamp,
  onSnapshot,
  updateDoc,
  serverTimestamp,
  deleteDoc,
} from 'firebase/firestore';import { app } from '@/lib/firebase';
import { useEffect } from 'react';
import locations from '@/utils/locations';
import { contactOptions } from '@/utils/contactOptions';
import specializations from '@/utils/specializations';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useDialog } from '../components/DialogProvider';
import KalendarzPage from '@/components/KalendarzPage';
import { resetCalendarSubstatuses, useCalendarCounter } from '@/components/CalendarCounter';
import { useRouter } from "next/navigation";
import { handleOpenChat } from "@/utils/chatUtils";
import ChatSidebar from '@/components/ChatSidebar';
import { useSearchParams } from 'next/navigation'
import ChatBox from '@/components/ChatBox';
import dynamic from "next/dynamic";
import UmowioneKonsultacje from '@/components/UmowioneKonsultacje';
import SpecjalistaAnkieta from '@/components/SpecjalistaAnkieta';

const inputStyle: React.CSSProperties = {
  padding: '1rem',
  borderRadius: '0.5rem',
  border: '1px solid #ccc',
  fontSize: '1rem',
  width: '100%',
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  resize: 'vertical',
  minHeight: '100px',
};

const labelStyle: React.CSSProperties = {
  fontWeight: 'bold',
  marginBottom: '0.5rem',
  display: 'block',
};

// Style dla modala oferty
const inputOfertaStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.6rem',
  marginBottom: '0.8rem',
  border: '1px solid #ccc',
  borderRadius: '0.4rem',
};

const buttonOfertaPrimary: React.CSSProperties = {
  backgroundColor: '#0D1F40',
  color: 'white',
  padding: '0.6rem 1.2rem',
  borderRadius: '0.5rem',
  border: 'none',
  fontWeight: 'bold',
  cursor: 'pointer',
};

const buttonOfertaSecondary: React.CSSProperties = {
  backgroundColor: '#ccc',
  color: '#333',
  padding: '0.6rem 1.2rem',
  borderRadius: '0.5rem',
  border: 'none',
  fontWeight: 'bold',
  cursor: 'pointer',
};



type CollaboratorOption = {
  id: string;
  firstName?: string;
  lastName?: string;
  specialization?: string[];
  avatarUrl?: string;
};

type CollaborationInvite = {
  id: string;
  fromUid: string;
  toUid: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt?: any;
  updatedAt?: any;
  otherProfile?: CollaboratorOption;
};

export default function SpecjalistaPage({ activeTab, setActiveTab }: {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}) {
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [showChatList, setShowChatList] = useState(true); // Dla trybu "albo lista, albo okno"
  const ChatUnreadBadge = dynamic(() => import("@/components/ChatUnreadBadge"), { ssr: false });

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [totalOferty, setTotalOferty] = useState(0);
  const [newOferty, setNewOferty] = useState(0);
  const [prosby, setProsby] = useState<any[]>([]);
  const [opis, setOpis] = useState('');
  const [obszar, setObszar] = useState('');
  const [wojewodztwo, setWojewodztwo] = useState<string[]>([]);
  const [selectedForUI, setSelectedForUI] = useState<string[]>([]);
  const [cenaOnline, setCenaOnline] = useState('');
  const [cenaStacjonarna, setCenaStacjonarna] = useState('');
  const [contactTypes, setContactTypes] = useState<string[]>([]);
  const [specialization, setSpecialization] = useState<string[]>([]);
  const [doswiadczenie, setDoswiadczenie] = useState('');
  const [kursy, setKursy] = useState('');
  const [certyfikaty, setCertyfikaty] = useState('');
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const { showDialog } = useDialog();
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);

  const [shownInviteIds, setShownInviteIds] = useState<string[]>([]);

  const [collaboratorSearch, setCollaboratorSearch] = useState('');
  const [collaboratorOptions, setCollaboratorOptions] = useState<CollaboratorOption[]>([]);
  const [loadingCollaborators, setLoadingCollaborators] = useState(false);

  const [acceptedCollaborators, setAcceptedCollaborators] = useState<CollaboratorOption[]>([]);
  const [sentInvites, setSentInvites] = useState<CollaborationInvite[]>([]);
  const [receivedInvites, setReceivedInvites] = useState<CollaborationInvite[]>([]);

  const [ownerSuggestions, setOwnerSuggestions] = useState<string[]>([]);
  const [highlightOwnerIndex, setHighlightOwnerIndex] = useState(-1);

  const [pendingInvites, setPendingInvites] = useState<CollaboratorOption[]>([]);

  const [refreshKey, setRefreshKey] = useState(0);
  const calendarCount = useCalendarCounter("specjalista", refreshKey);

  const [confirmedForms, setConfirmedForms] = useState<string[]>([]);
  const [selectedRequestForms, setSelectedRequestForms] = useState<string[]>([]);

  const [showAnkietaModal, setShowAnkietaModal] = useState(false);
  const [ankietaFilled, setAnkietaFilled] = useState(false);

  const router = useRouter();
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  const [editingOfertaId, setEditingOfertaId] = useState<string | null>(null);
  const [selectedZgloszenie, setSelectedZgloszenie] = useState<string>('');
  const [priceFrom, setPriceFrom] = useState<string>('');
  const [priceTo, setPriceTo] = useState<string>('');
  const [terminy, setTerminy] = useState<{ date: string; time: string }[]>([
    { date: '', time: '' }
  ]);
  const [showOfertaDialog, setShowOfertaDialog] = useState<boolean>(false);

  // Sprawdzanie rozmiaru ekranu dla zwijania menu
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 1024);
      // Na desktopie menu zawsze widoczne
      if (window.innerWidth > 1024) {
        setShowMobileMenu(true);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Resetowanie widoku czatu przy zmianie zakładki
  useEffect(() => {
    if (activeTab !== 'czat') {
      setSelectedChatId(null);
      setShowChatList(true);
    }
  }, [activeTab]);

  const handleOpenKalendarz = async () => {
    const auth = getAuth(app);
    const user = auth.currentUser;
    if (!user) return;

    const db = getFirestore(app);

    const q = query(
      collection(db, "konsultacje"),
      where("specialistEmail", "==", user.email),
      where("substatusS", "in", ["NS", "NOS"])
    );

    const snap = await getDocs(q);

    const updates = snap.docs.map(docSnap => {
      const subS = docSnap.data().substatusS;
      let newSubS = subS;
      if (subS === "NS") newSubS = "SS";
      if (subS === "NOS") newSubS = "SOS";
      return updateDoc(docSnap.ref, { substatusS: newSubS });
    });

    await Promise.all(updates);

    setRefreshKey(prev => prev + 1);
    setActiveTab("kalendarz");

    await setDoc(
      doc(db, "users", user.uid),
      {
        lastCalendarView_specialist: Timestamp.now(),
      },
      { merge: true }
    );
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('');
    setError('');

    try {
      const auth = getAuth(app);
      const user = auth.currentUser;
      const db = getFirestore(app);

      if (!user) throw new Error('Brak zalogowanego użytkownika');

      if (newEmail && newEmail !== user.email) {
        await updateEmail(user, newEmail);
      }

      if (newPassword) {
        await updatePassword(user, newPassword);
      }

      let finalAvatarUrl = avatarPreview || '';

      if (avatar) {
        const storage = getStorage(app);
        const storageRef = ref(storage, `avatars/${user.uid}`);
        await uploadBytes(storageRef, avatar);
        finalAvatarUrl = await getDownloadURL(storageRef);
        setAvatarPreview(finalAvatarUrl);
      }

      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        uid: user.uid,
        roles: {
          specjalista: {
            enabled: true,
            firstName,
            lastName,
            location: wojewodztwo,
            specialization,
            experience: doswiadczenie,
            description: opis,
            contactTypes,
            cenaOnline,
            cenaStacjonarna,
            kursy,
            certyfikaty,
            avatarUrl: finalAvatarUrl || '',
          }
        }
      }, { merge: true });

      await showDialog('✅ Dane profilu zostały zapisane.');
      setStatus('Dane zostały zaktualizowane.');
    } catch (err: any) {
      setError(err.message || 'Wystąpił błąd przy aktualizacji.');
    }
  };

  const checkAnkietaStatus = async () => {
    const auth = getAuth(app);
    const user = auth.currentUser;
    if (!user) return;
    
    const db = getFirestore(app);
    const docRef = doc(db, 'specjalistaAnkiety', user.uid);
    const docSnap = await getDoc(docRef);
    setAnkietaFilled(docSnap.exists());
  };

  const menuItems = [
    { id: 'profil', label: 'Mój profil' },
    { id: 'umowioneKonsultacje', label: 'Umówione konsultacje' },
    {
      id: 'prosby', label: 'Prośby o pomoc',
      count: prosby.length
    },
    { id: 'oferty', label: 'Moje oferty pomocy' },
    { id: 'czat', label: 'Wiadomości (czat)' },
    {
      id: 'wydarzenia', label: 'Wydarzenia',
      submenu: [
        { id: 'planowanyUdzial', label: 'Planowany udział' },
        { id: 'historiaWydarzen', label: 'Historia wydarzeń' },
        { id: 'certyfikaty', label: 'Moje certyfikaty' },
        { id: 'dodajWydarzenie', label: 'Dodaj wydarzenie' },
        { id: 'anulowaneWydarzenia', label: 'Anulowane wydarzenia' },
      ]
    },
    { id: 'kalendarz', label: 'Mój kalendarz', onClick: handleOpenKalendarz },
    { id: 'platnosci', label: 'Płatności' },
    { id: 'ustawieniaSpecjalisty', label: 'Ustawienia' },
  ];

  const [infoModalMessage, setInfoModalMessage] = useState<string | null>(null);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);

  const toggleSubmenu = (menuId: string) => {
    setExpandedMenus((prev) =>
      prev.includes(menuId)
        ? prev.filter((id) => id !== menuId)
        : [...prev, menuId]
    );
  };

const handleSaveProfile = async (e: React.FormEvent) => {
  e.preventDefault();
  console.log('✅ handleSaveProfile uruchomione');
  setStatus('');
  setError('');

  const cenaOnlineNum = parseFloat(cenaOnline) || 0;
  const cenaStacjonarnaNum = parseFloat(cenaStacjonarna) || 0;

  const hasStationaryForm = contactTypes?.some(
    (type) => ["W stajni konia", "W ośrodku specjalisty"].includes(type)
  );

  if (cenaOnlineNum > 0 && !contactTypes.includes("On-line")) {
    await showDialog("❌ Podałeś cenę online, ale nie zaznaczyłeś formy kontaktu 'On-line'.");
    return;
  }

  if (cenaOnlineNum <= 0 && contactTypes.includes("On-line")) {
    await showDialog("❌ Zaznaczyłeś formę kontaktu 'On-line', ale nie podałeś ceny online.");
    return;
  }

  if (cenaStacjonarnaNum > 0 && !hasStationaryForm) {
    await showDialog("❌ Podałeś cenę stacjonarną, ale nie zaznaczyłeś formy kontaktu stacjonarnej.");
    return;
  }

  if (cenaStacjonarnaNum <= 0 && hasStationaryForm) {
    await showDialog("❌ Zaznaczyłeś formę kontaktu stacjonarną, ale nie podałeś ceny stacjonarnej.");
    return;
  }

  try {
    const auth = getAuth(app);
    const user = auth.currentUser;
    const db = getFirestore(app);
    const storage = getStorage(app);

    if (!user) throw new Error('Brak zalogowanego użytkownika');

    let avatarUrl = avatarPreview || '';

    if (avatar) {
      try {
        console.log('⬆️ Upload zdjęcia...');
        const storageRef = ref(storage, `avatars/${user.uid}/${avatar.name}`);
        const snapshot = await uploadBytes(storageRef, avatar);
        avatarUrl = await getDownloadURL(snapshot.ref);
        setAvatarPreview(avatarUrl);
      } catch (uploadError) {
        console.error('❌ Błąd uploadu zdjęcia:', uploadError);
        setError('Nie udało się załadować zdjęcia. Spróbuj ponownie.');
        return;
      }
    }

    const profileData = {
      email: user.email,
      firstName,
      lastName,
      wojewodztwo,
      cenaOnline,
      cenaStacjonarna,
      contactTypes,
      specialization,
      opis,
      doswiadczenie,
      kursy,
      certyfikaty,
      avatarUrl,
      kosztyDojazdu,
      czasTrwania,
    };

    const profileRef = doc(db, 'profile', user.uid);
    const profileSnap = await getDoc(profileRef);

    if (profileSnap.exists()) {
      await setDoc(profileRef, profileData, { merge: true });
    } else {
      await setDoc(profileRef, profileData);
    }

    for (const spec of pendingInvites) {
      const existingQ = query(
        collection(db, 'collaborationInvites'),
        where('fromUid', '==', user.uid),
        where('toUid', '==', spec.id)
      );

      const reverseQ = query(
        collection(db, 'collaborationInvites'),
        where('fromUid', '==', spec.id),
        where('toUid', '==', user.uid)
      );

      const [existingSnap, reverseSnap] = await Promise.all([
        getDocs(existingQ),
        getDocs(reverseQ),
      ]);

      const alreadyExists =
        !existingSnap.empty ||
        !reverseSnap.empty ||
        acceptedCollaborators.some((c) => c.id === spec.id);

if (!alreadyExists) {
  await addDoc(collection(db, 'collaborationInvites'), {
    fromUid: user.uid,
    toUid: spec.id,
    status: 'pending',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  const invitedProfileSnap = await getDoc(doc(db, 'profile', spec.id));
  const invitedProfileData = invitedProfileSnap.exists() ? invitedProfileSnap.data() : null;

  const invitedEmail = invitedProfileData?.email;

  const invitedByName = `${firstName || ''} ${lastName || ''}`.trim() || 'Inny specjalista';

  if (invitedEmail) {
    await sendCollaborationInviteEmail(invitedEmail, invitedByName);
  }
}
    }

    setPendingInvites([]);
    setShowSaveConfirmation(true);
  } catch (err: any) {
    console.error(err);
    setError(err.message || 'Wystąpił błąd przy zapisie profilu.');
  }
};

  const [filterOwner, setFilterOwner] = useState('');
  const [filterForma, setFilterForma] = useState('');
  const [filterTermin, setFilterTermin] = useState('');

  useEffect(() => {
    if (!filterOwner.trim()) {
      setOwnerSuggestions([]);
      return;
    }
    const lower = filterOwner.toLowerCase();
    const matches = Array.from(
      new Set(
        prosby
          .map((p) => p.ownerName || '')
          .filter((name) => name.toLowerCase().includes(lower))
      )
    );
    setOwnerSuggestions(matches);
  }, [filterOwner, prosby]);

  const handleOwnerKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (ownerSuggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightOwnerIndex((prev) => (prev + 1) % ownerSuggestions.length);
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightOwnerIndex((prev) =>
        prev <= 0 ? ownerSuggestions.length - 1 : prev - 1
      );
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightOwnerIndex >= 0) {
        setFilterOwner(ownerSuggestions[highlightOwnerIndex]);
      }
      setOwnerSuggestions([]);
      setHighlightOwnerIndex(-1);
    }
  };

  const [kosztyDojazdu, setKosztyDojazdu] = useState("");
  const [czasTrwania, setCzasTrwania] = useState("");

  useEffect(() => {
  checkAnkietaStatus();
}, []);

  useEffect(() => {
    const handleEditOferta = (event: any) => {
      const { ofertaId, oferta } = event.detail;

      setActiveTab("prosby");
      setEditingOfertaId(ofertaId);
      setSelectedZgloszenie(oferta.zgloszenieId || '');
      setPriceFrom(oferta.cena?.od || '');
      setPriceTo(oferta.cena?.do || '');
      setTerminy(
        oferta.proponowaneTerminy?.map((t: string) => {
          const [date, ...rest] = t.split(' ');
          const time = rest.join(' ') || '';
          return { date, time };
        }) || [{ date: '', time: '' }]
      );

      setShowOfertaDialog(true);
    };

    window.addEventListener('editOferta', handleEditOferta);
    return () => window.removeEventListener('editOferta', handleEditOferta);
  }, []);

  useEffect(() => {
    const loadUserAndProfileData = async () => {
      const auth = getAuth(app);
      const db = getFirestore(app);

      onAuthStateChanged(auth, async (user) => {
        if (!user) return;

        const userDocRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userDocRef);

        if (userSnap.exists()) {
          const data = userSnap.data();
          const spec = data?.roles?.specjalista;

          if (spec) {
            setFirstName(spec.firstName || '');
            setLastName(spec.lastName || '');
            setOpis(spec.description || '');
            setWojewodztwo(Array.isArray(spec.location) ? spec.location : []);
            setSpecialization(spec.specialization || []);
            setDoswiadczenie(spec.experience || '');
            setAvatarPreview(spec.avatarUrl || '');
            setContactTypes(spec.contactTypes || []);
            setCenaOnline(spec.cenaOnline || '');
            setCenaStacjonarna(spec.cenaStacjonarna || '');
            setKursy(spec.kursy || '');
            setCertyfikaty(spec.certyfikaty || '');
          }
        }

        const profileDocRef = doc(db, 'profile', user.uid);
        const profileSnap = await getDoc(profileDocRef);

        if (profileSnap.exists()) {
          const profile = profileSnap.data();

          setFirstName((prev) => prev || profile.firstName || '');
          setLastName((prev) => prev || profile.lastName || '');
          setOpis((prev) => prev || profile.opis || '');
          setWojewodztwo((prev) =>
            prev.length ? prev : Array.isArray(profile.wojewodztwo) ? profile.wojewodztwo : []
          );
          setSpecialization((prev) => prev.length ? prev : profile.specialization || []);
          setContactTypes((prev) => prev.length ? prev : profile.contactTypes || []);
          setDoswiadczenie((prev) => prev || profile.doswiadczenie || '');
          setKursy((prev) => prev || profile.kursy || '');
          setCenaOnline((prev) => prev || profile.cenaOnline || '');
          setCenaStacjonarna((prev) => prev || profile.cenaStacjonarna || '');
          setAvatarPreview((prev) => prev || profile.avatarUrl || '');
          setKosztyDojazdu((prev) => prev || profile.kosztyDojazdu || '');
          setCzasTrwania((prev) => prev || profile.czasTrwania || '');
        }
      });
    };

    loadUserAndProfileData();
  }, []);

  useEffect(() => {
  const auth = getAuth(app);
  const db = getFirestore(app);

  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    if (!user) return;

    try {
      setLoadingCollaborators(true);

      const sentQ = query(
        collection(db, 'collaborationInvites'),
        where('fromUid', '==', user.uid)
      );

      const receivedQ = query(
        collection(db, 'collaborationInvites'),
        where('toUid', '==', user.uid)
      );

      const [sentSnap, receivedSnap] = await Promise.all([
        getDocs(sentQ),
        getDocs(receivedQ),
      ]);

      const allDocs = [...sentSnap.docs, ...receivedSnap.docs];

      const allOtherUids = Array.from(
        new Set(
          allDocs.map((d) => {
            const data = d.data();
            return data.fromUid === user.uid ? data.toUid : data.fromUid;
          })
        )
      );

      const profilesMap = new Map<string, CollaboratorOption>();

      await Promise.all(
        allOtherUids.map(async (uid) => {
          const snap = await getDoc(doc(db, 'profile', uid));
          if (!snap.exists()) return;

          const data = snap.data();
          profilesMap.set(uid, {
            id: uid,
            firstName: data.firstName,
            lastName: data.lastName,
            specialization: data.specialization || [],
            avatarUrl: data.avatarUrl || '',
          });
        })
      );

      const sent: CollaborationInvite[] = sentSnap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          fromUid: data.fromUid,
          toUid: data.toUid,
          status: data.status,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          otherProfile: profilesMap.get(data.toUid),
        };
      });

      const received: CollaborationInvite[] = receivedSnap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          fromUid: data.fromUid,
          toUid: data.toUid,
          status: data.status,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          otherProfile: profilesMap.get(data.fromUid),
        };
      });

      const accepted = [...sent, ...received]
        .filter((invite) => invite.status === 'accepted')
        .map((invite) => invite.otherProfile)
        .filter((item): item is CollaboratorOption => !!item);

      const uniqueAccepted = Array.from(
        new Map(accepted.map((item) => [item.id, item])).values()
      );

      setAcceptedCollaborators(uniqueAccepted);
      setSentInvites(sent.filter((invite) => invite.status === 'pending'));
      setReceivedInvites(received.filter((invite) => invite.status === 'pending'));
    } catch (error) {
      console.error('Błąd pobierania współprac:', error);
      setAcceptedCollaborators([]);
      setSentInvites([]);
      setReceivedInvites([]);
    } finally {
      setLoadingCollaborators(false);
    }
  });

  return () => unsubscribe();
}, []);

useEffect(() => {
  const newInvites = receivedInvites.filter(
    (invite) =>
      invite.status === 'pending' && !shownInviteIds.includes(invite.id)
  );

  if (newInvites.length > 0) {
    const firstInvite = newInvites[0];
    const inviterName = `${firstInvite.otherProfile?.firstName || ''} ${firstInvite.otherProfile?.lastName || ''}`.trim();

    showDialog(
      `📩 Otrzymano nowe zaproszenie do współpracy od: ${inviterName || 'innego specjalisty'}.`
    );

    setShownInviteIds((prev) => [...prev, ...newInvites.map((invite) => invite.id)]);
  }
}, [receivedInvites, shownInviteIds, showDialog]);

  const [statusModalMessage, setStatusModalMessage] = useState<string | null>(null);



  const updateRequestStatus = async (
    id: string,
    status: 'zaakceptowane' | 'odrzucone',
    reason?: string
  ) => {
    try {
      const db = getFirestore(app);
      const docRef = doc(db, 'konsultacje', id);

      await setDoc(docRef, {
        status,
        ...(status === 'odrzucone' && reason ? { reason } : {}),
      }, { merge: true });

      const snapshot = await getDoc(docRef);
      const data = snapshot.data();
      const ownerEmail = data?.ownerEmail;
      const specialistName = data?.specjalista;

      await fetch('/api/sendConsultationStatusUpdate', {
        method: 'POST',
        body: JSON.stringify({
          to: ownerEmail,
          specialistName,
        }),
      });

      setProsby((prev) => prev.filter((p) => p.id !== id));
      setStatusModalMessage('✅ Status został pomyślnie zaktualizowany.');
    } catch (err) {
      console.error(err);
      setStatusModalMessage('❌ Wystąpił błąd przy zmianie statusu.');
    }
  };

  const terminyMap: Record<string, string> = {
    pilne: 'Pilne (jak najszybciej)',
    tydzien: 'W ciągu tygodnia',
    '14dni': 'W ciągu 14 dni',
    miesiac: 'W ciągu miesiąca',
    dluzszy: 'Mogę poczekać dłużej'
  };

  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [acceptDate, setAcceptDate] = useState('');
  const [acceptTime, setAcceptTime] = useState('');
  const [predefinedRejectReasons] = useState([
    "Brak wolnych terminów",
    "Nie mogę przyjąć w tej lokalizacji",
    "Problem nie w moim zakresie",
  ]);

  const acceptRequestWithDate = async (id: string) => {
    try {
      const db = getFirestore(app);
      const docRef = doc(db, 'konsultacje', id);

      await setDoc(docRef, {
        status: 'zaakceptowane',
        proponowanyTermin: `${acceptDate} ${acceptTime}`,
        potwierdzoneFormy: confirmedForms
      }, { merge: true });

      const snapshot = await getDoc(docRef);
      const data = snapshot.data();
      const ownerEmail = data?.ownerEmail;
      const specialistName = data?.specjalista;

      await fetch('/api/sendConsultationStatusUpdate', {
        method: 'POST',
        body: JSON.stringify({
          to: ownerEmail,
          specialistName,
          date: `${acceptDate} ${acceptTime}`,
          potwierdzoneFormy: confirmedForms
        }),
      });

      setProsby(prev => prev.filter(p => p.id !== id));
      setShowAcceptModal(false);
      setInfoModalMessage('✅ Prośba zaakceptowana z terminem!');
    } catch (err) {
      console.error(err);
      setInfoModalMessage('❌ Błąd podczas akceptacji.');
    }
  };

  const startChat = async (p: Prosba) => {
    try {
      const db = getFirestore(app);
      const auth = getAuth(app);
      const user = auth.currentUser;
      if (!user) return;

      const ownerUid = p.ownerUid;
      const specialistUid = user.uid;

      const chatDoc = await addDoc(collection(db, 'czaty'), {
        participants: [
          { uid: ownerUid, role: 'wlasciciel' },
          { uid: specialistUid, role: 'specjalista' },
        ],
        createdAt: Timestamp.now(),
        messages: [],
      });

      await fetch('/api/sendChatNotification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: p.ownerEmail,
          subject: 'Nowa wiadomość od specjalisty',
          text: `Specjalista ${user.displayName || ''} rozpoczął z Tobą czat. 
Zaloguj się, aby odpowiedzieć.`,
        }),
      });

      window.location.href = `/panel/wiadomosci/rozmowa?chatId=${chatDoc.id}`;
    } catch (err) {
      console.error(err);
      setInfoModalMessage('❌ Nie udało się rozpocząć czatu.');
    }
  };

  useEffect(() => {
    const fetchOfertaStats = async () => {
      const auth = getAuth(app);
      const user = auth.currentUser;
      if (!user?.email) return;

      const db = getFirestore(app);
      const q = query(collection(db, 'oferty'), where('specialistEmail', '==', user.email));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => doc.data());

      setTotalOferty(data.length);
      setNewOferty(data.filter(o => !o.oznaczonaJakoPrzeczytana).length);
    };

    fetchOfertaStats();
  }, []);

  interface Prosba {
    id: string;
    ownerName?: string;
    dataZgloszenia?: any;
    ownerEmail?: string;
    [key: string]: any;
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getAuth(app), async (user) => {
      if (!user?.email) return;

      const db = getFirestore(app);

      const q = query(
        collection(db, "konsultacje"),
        where("specialistEmail", "==", user.email),
        where("status", "==", "oczekujące")
      );

      const snapshot = await getDocs(q);

      const prosbyWithOwner: Prosba[] = await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const data = docSnap.data() as Prosba;
          let ownerName = data.ownerName || "";

          if (!ownerName && data.ownerEmail) {
            const qOwner = query(
              collection(db, "users"),
              where("email", "==", data.ownerEmail)
            );
            const ownerSnap = await getDocs(qOwner);
            if (!ownerSnap.empty) {
              const ownerData = ownerSnap.docs[0].data();
              const wlasciciel = ownerData?.roles?.wlasciciel;
              ownerName = `${wlasciciel?.firstName || ""} ${wlasciciel?.lastName || ""}`.trim();
            }
          }

          return {
            ...data,
            id: docSnap.id,
            ownerName
          };
        })
      );

      setProsby(
        prosbyWithOwner.sort((a, b) => {
          const dateA =
            typeof a.dataZgloszenia?.toDate === "function"
              ? a.dataZgloszenia.toDate()
              : new Date(a.dataZgloszenia || 0);

          const dateB =
            typeof b.dataZgloszenia?.toDate === "function"
              ? b.dataZgloszenia.toDate()
              : new Date(b.dataZgloszenia || 0);

          return dateB.getTime() - dateA.getTime();
        })
      );
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
  const fetchCollaboratorOptions = async () => {
    const auth = getAuth(app);
    const user = auth.currentUser;
    if (!user) return;

    const search = collaboratorSearch.trim().toLowerCase();

    if (search.length < 2) {
      setCollaboratorOptions([]);
      return;
    }

    try {
      const db = getFirestore(app);
      const snap = await getDocs(collection(db, 'profile'));

      const results: CollaboratorOption[] = snap.docs
        .map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            firstName: data.firstName,
            lastName: data.lastName,
            specialization: data.specialization || [],
            avatarUrl: data.avatarUrl || '',
          };
        })
        .filter((spec) => {
          if (spec.id === user.uid) return false;
          if (acceptedCollaborators.some((c) => c.id === spec.id)) return false;
          if (sentInvites.some((invite) => invite.otherProfile?.id === spec.id)) return false;
          if (receivedInvites.some((invite) => invite.otherProfile?.id === spec.id)) return false;
          const fullName = `${spec.firstName || ''} ${spec.lastName || ''}`.toLowerCase();
          return fullName.includes(search);
        })
        .slice(0, 10);

      setCollaboratorOptions(results);
    } catch (error) {
      console.error('Błąd wyszukiwania specjalistów:', error);
      setCollaboratorOptions([]);
    }
  };

  fetchCollaboratorOptions();
}, [collaboratorSearch, acceptedCollaborators, sentInvites, receivedInvites]);

  const handleZapiszOferte = async () => {
    const auth = getAuth(app);
    const db = getFirestore(app);
    const user = auth.currentUser;

    if (!user) {
      alert("❌ Musisz być zalogowany.");
      return;
    }

    const preparedTerminy = terminy.map(({ date, time }) =>
      date && time ? `${date} ${time}` : 'Do ustalenia'
    );

    const oferta = {
      zgloszenieId: selectedZgloszenie,
      specjalistaId: user.uid,
      specjalistaEmail: user.email,
      proponowaneTerminy: preparedTerminy,
      cena: { od: priceFrom, do: priceTo },
      status: 'oczekuje',
      updatedAt: serverTimestamp(),
    };

    try {
      if (editingOfertaId) {
        const ofertaRef = doc(db, 'ofertySpecjalistow', editingOfertaId);
        await updateDoc(ofertaRef, oferta);
      } else {
        await addDoc(collection(db, 'ofertySpecjalistow'), oferta);
      }

      alert('✅ Oferta została zapisana.');
      setShowOfertaDialog(false);
      setEditingOfertaId(null);
      setPriceFrom('');
      setPriceTo('');
      setTerminy([{ date: '', time: '' }]);
    } catch (error) {
      console.error('❌ Błąd zapisu oferty:', error);
      alert('Nie udało się zapisać oferty.');
    }
  };

const handleSelectChat = (chatId: string) => {
  setSelectedChatId(chatId);
  setShowChatList(false); // Po wybraniu czatu, pokaż tylko okno czatu
};

const handleBackToChatList = () => {
  setShowChatList(true); // Powrót do listy czatów
};

const handleCancelInvite = async (inviteId: string) => {
  try {
    const db = getFirestore(app);
    await deleteDoc(doc(db, 'collaborationInvites', inviteId));
    await showDialog('ℹ️ Zaproszenie zostało anulowane.');
  } catch (error) {
    console.error('Błąd anulowania zaproszenia:', error);
    await showDialog('❌ Nie udało się anulować zaproszenia.');
  }
};

const sendCollaborationInviteEmail = async (
  to: string,
  invitedByName: string
) => {
  try {
    await fetch('/api/sendCollaborationInviteNotification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to,
        invitedByName,
      }),
    });
  } catch (error) {
    console.error('Błąd wysyłki maila o zaproszeniu:', error);
  }
};

const handleSendCollaborationInvite = async (targetSpec: CollaboratorOption) => {
  try {
    const auth = getAuth(app);
    const user = auth.currentUser;
    if (!user) return;

    const db = getFirestore(app);

    const existingQ = query(
      collection(db, 'collaborationInvites'),
      where('fromUid', '==', user.uid),
      where('toUid', '==', targetSpec.id)
    );

    const reverseQ = query(
      collection(db, 'collaborationInvites'),
      where('fromUid', '==', targetSpec.id),
      where('toUid', '==', user.uid)
    );

    const [existingSnap, reverseSnap] = await Promise.all([
      getDocs(existingQ),
      getDocs(reverseQ),
    ]);

    // ❌ jeśli już zaakceptowani → blokuj
    const alreadyAccepted =
      acceptedCollaborators.some((c) => c.id === targetSpec.id);

    if (alreadyAccepted) {
      await showDialog('⚠️ Współpraca już istnieje.');
      return;
    }

    // 🔁 jeśli istnieje zaproszenie wysłane przez Ciebie → zaktualizuj
    if (!existingSnap.empty) {
      const docRef = existingSnap.docs[0].ref;

      await updateDoc(docRef, {
        status: 'pending',
        updatedAt: serverTimestamp(),
      });

      await showDialog('🔁 Zaproszenie zostało wysłane ponownie.');
    }

    // 🔁 jeśli istnieje zaproszenie od drugiej strony → też zaktualizuj
    else if (!reverseSnap.empty) {
      const docRef = reverseSnap.docs[0].ref;

      await updateDoc(docRef, {
        status: 'pending',
        updatedAt: serverTimestamp(),
      });

      await showDialog('🔁 Zaproszenie zostało ponownie aktywowane.');
    }

    // 🆕 jeśli nic nie istnieje → dodaj nowe
    else {
      await addDoc(collection(db, 'collaborationInvites'), {
        fromUid: user.uid,
        toUid: targetSpec.id,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await showDialog('✅ Zaproszenie do współpracy zostało wysłane.');
    }

    setCollaboratorSearch('');
    setCollaboratorOptions([]);
  } catch (error) {
    console.error('Błąd wysyłania zaproszenia:', error);
    await showDialog('❌ Nie udało się wysłać zaproszenia.');
  }
};

const handleAcceptInvite = async (inviteId: string) => {
  try {
    const db = getFirestore(app);
    await updateDoc(doc(db, 'collaborationInvites', inviteId), {
      status: 'accepted',
      updatedAt: serverTimestamp(),
    });
    await showDialog('✅ Współpraca została potwierdzona.');
  } catch (error) {
    console.error('Błąd akceptacji zaproszenia:', error);
    await showDialog('❌ Nie udało się zaakceptować zaproszenia.');
  }
};

const handleRejectInvite = async (inviteId: string) => {
  try {
    const db = getFirestore(app);
    await updateDoc(doc(db, 'collaborationInvites', inviteId), {
      status: 'rejected',
      updatedAt: serverTimestamp(),
    });
    await showDialog('ℹ️ Zaproszenie zostało odrzucone.');
  } catch (error) {
    console.error('Błąd odrzucenia zaproszenia:', error);
    await showDialog('❌ Nie udało się odrzucić zaproszenia.');
  }
};

const handleRemoveCollaboration = async (otherUid: string) => {
  try {
    const auth = getAuth(app);
    const user = auth.currentUser;
    if (!user) return;

    const db = getFirestore(app);

    const q1 = query(
      collection(db, 'collaborationInvites'),
      where('fromUid', '==', user.uid),
      where('toUid', '==', otherUid),
      where('status', '==', 'accepted')
    );

    const q2 = query(
      collection(db, 'collaborationInvites'),
      where('fromUid', '==', otherUid),
      where('toUid', '==', user.uid),
      where('status', '==', 'accepted')
    );

    const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);

    const docsToDelete = [...snap1.docs, ...snap2.docs];
    await Promise.all(docsToDelete.map((d) => deleteDoc(d.ref)));

    await showDialog('✅ Współpraca została usunięta.');
  } catch (error) {
    console.error('Błąd usuwania współpracy:', error);
    await showDialog('❌ Nie udało się usunąć współpracy.');
  }
};

  const renderContent = () => {
    switch (activeTab) {
case 'profil':
  return (
    <>
      {/* Nagłówek z przyciskiem ankiety */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        <h2 style={{ margin: 0 }}>Edytuj swój profil</h2>
        
        <button
          onClick={() => setShowAnkietaModal(true)}
          style={{
            backgroundColor: ankietaFilled ? '#2e7d32' : '#0D1F40',
            color: 'white',
            padding: '0.6rem 1.2rem',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.9rem',
          }}
        >
          📋 {ankietaFilled ? 'Edytuj ankietę' : 'Wypełnij ankietę'}
          {ankietaFilled && (
            <span style={{
              backgroundColor: '#4caf50',
              padding: '2px 8px',
              borderRadius: '20px',
              fontSize: '0.7rem',
            }}>
              ✓
            </span>
          )}
        </button>
      </div>

      <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <label style={labelStyle}>Imię:</label>
        <input
          type="text"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          style={inputStyle}
          placeholder="Imię"
        />
        <label style={labelStyle}>Nazwisko:</label>
        <input
          type="text"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          style={inputStyle}
          placeholder="Nazwisko"
        />
        <fieldset>
          <legend><strong>Obszar konsultacji stacjonarnych</strong></legend>
          {locations.map((loc) => {
            const isCalaPolska = loc === "Cała Polska";
            return (
              <label key={loc} style={{ display: 'block', marginBottom: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={selectedForUI.includes(loc)}
                  onChange={() => {
                    if (isCalaPolska) {
                      if (selectedForUI.includes("Cała Polska")) {
                        setSelectedForUI([]);
                        setWojewodztwo([]);
                      } else {
                        setSelectedForUI(locations);
                        setWojewodztwo(["Cała Polska"]);
                      }
                    } else {
                      let updatedUI;
                      if (selectedForUI.includes(loc)) {
                        updatedUI = selectedForUI.filter((w) => w !== loc);
                      } else {
                        updatedUI = [...selectedForUI, loc];
                      }

                      if (updatedUI.length !== locations.length) {
                        updatedUI = updatedUI.filter((w) => w !== "Cała Polska");
                      }

                      setSelectedForUI(updatedUI);

                      if (updatedUI.length === locations.length - 1 && !updatedUI.includes("Cała Polska")) {
                        setSelectedForUI([...updatedUI, "Cała Polska"]);
                        setWojewodztwo(["Cała Polska"]);
                      } else {
                        setWojewodztwo(updatedUI.includes("Cała Polska") ? ["Cała Polska"] : updatedUI);
                      }
                    }
                  }}
                />{" "}
                {isCalaPolska ? <strong>{loc}</strong> : loc}
              </label>
            );
          })}
        </fieldset>

        <label style={labelStyle}>Cena online (zł):</label>
        <input
          type="number"
          value={cenaOnline}
          onChange={(e) => setCenaOnline(e.target.value)}
          style={inputStyle}
          placeholder="Cena online"
        />
        <label style={labelStyle}>Cena stacjonarna (zł):</label>
        <small style={{ color: '#666', marginTop: '-1rem' }}>
          Cena nie obejmuje kosztów dojazdu.
        </small>
        <input
          type="number"
          value={cenaStacjonarna}
          onChange={(e) => setCenaStacjonarna(e.target.value)}
          style={inputStyle}
          placeholder="np. 200"
        />

        <label style={labelStyle}>Koszty dojazdu przy konsultacji stacjonarnej:</label>
        <input
          value={kosztyDojazdu}
          onChange={(e) => setKosztyDojazdu(e.target.value)}
          style={inputStyle}
          placeholder="Podaj informację, czy koszty dojazdu są wliczone w cenę, czy naliczane oddzielnie. Np.: 'Do 30 km w cenie konsultacji. Powyżej – 1 zł/km'."
        />

        <label style={labelStyle}>Czas trwania wizyty:</label>
        <input
          type="text"
          value={czasTrwania}
          onChange={(e) => setCzasTrwania(e.target.value)}
          style={inputStyle}
          placeholder="Np.: 60 minut"
        />

        <fieldset>
          <legend><strong>Formy kontaktu</strong></legend>
          {contactOptions.map((type) => (
            <label key={type} style={{ display: 'block' }}>
              <input
                type="checkbox"
                checked={contactTypes.includes(type)}
                onChange={() =>
                  setContactTypes((prev) =>
                    prev.includes(type)
                      ? prev.filter((t) => t !== type)
                      : [...prev, type]
                  )
                }
              /> {type}
            </label>
          ))}
        </fieldset>

        <fieldset>
          <legend><strong>Specjalizacje</strong></legend>
          {specializations.map((spec) => (
            <label key={spec} style={{ display: 'block' }}>
              <input
                type="checkbox"
                checked={specialization.includes(spec)}
                onChange={() =>
                  setSpecialization((prev) =>
                    prev.includes(spec)
                      ? prev.filter((s) => s !== spec)
                      : [...prev, spec]
                  )
                }
              /> {spec}
            </label>
          ))}
        </fieldset>

        <label style={labelStyle}>Opis / O mnie:</label>
        <textarea
          value={opis}
          onChange={(e) => setOpis(e.target.value)}
          style={textareaStyle}
          placeholder="To miejsce na przedstawienie się w sposób, który pokaże Twoją osobowość i doświadczenie. Możesz opisać swoją filozofię pracy, wartości, które Ci przyświecają, najważniejsze osiągnięcia, a także co motywuje Cię w codziennej pracy z końmi. Dodaj elementy, które wyróżniają Cię na tle innych specjalistów – np. unikalne metody, indywidualne podejście czy sukcesy Twoich podopiecznych."
        />
        <label style={labelStyle}>Doświadczenie:</label>
        <textarea
          value={doswiadczenie}
          onChange={(e) => setDoswiadczenie(e.target.value)}
          style={textareaStyle}
          placeholder="m.in.: ile lat pracujesz w tej specjalizacji, z jakimi końmi i problemami najczęściej się spotykasz, jakie metody stosujesz, jakie masz osiągnięcia."
        />

        <label style={labelStyle}>Kursy i uprawnienia:</label>
        <textarea
          value={kursy}
          onChange={(e) => setKursy(e.target.value)}
          style={textareaStyle}
          placeholder="Wymień certyfikaty, ukończone kursy, szkolenia i warsztaty związane z Twoją specjalizacją. Podaj nazwę organizatora, temat szkolenia i rok ukończenia. Możesz uwzględnić także międzynarodowe kwalifikacje oraz licencje."
        />

        <label>Zdjęcie profilowe:
          <input type="file" accept="image/*" onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              const file = e.target.files[0];
              setAvatar(file);
              setAvatarPreview(URL.createObjectURL(file));
            }
          }} />
        </label>

        {avatarPreview && (
          <img
            src={avatarPreview}
            alt="Podgląd zdjęcia"
            style={{ width: '150px', borderRadius: '0.5rem', marginTop: '1rem' }}
          />
        )}

        <div style={{ marginTop: '1.5rem' }}>
          <label style={labelStyle}>Współpraca z innymi specjalistami:</label>

          <input
            type="text"
            value={collaboratorSearch}
            onChange={(e) => setCollaboratorSearch(e.target.value)}
            style={inputStyle}
            placeholder="Wpisz imię i nazwisko specjalisty, którego chcesz zaprosić"
          />
          {pendingInvites.length > 0 && (
            <div style={{ marginTop: '1rem' }}>
              <h3 style={{ color: '#0D1F40' }}>Do zaproszenia</h3>
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                {pendingInvites.map((spec) => (
                  <div
                    key={spec.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      border: '1px solid #ddd',
                      borderRadius: '0.5rem',
                      padding: '0.5rem 0.75rem',
                      backgroundColor: '#fff',
                    }}
                  >
                    <div>
                      <strong>{spec.firstName} {spec.lastName}</strong>
                      <div style={{ fontSize: '0.85rem', color: '#666' }}>
                        {spec.specialization?.join(', ') || 'Specjalista'}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPendingInvites(prev => prev.filter(p => p.id !== spec.id))}
                      style={{
                        backgroundColor: '#c00',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '0.3rem',
                        padding: '0.3rem 0.6rem',
                        cursor: 'pointer',
                      }}
                    >
                      Usuń
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {collaboratorOptions.length > 0 && (
            <div style={{
              border: '1px solid #ccc',
              borderRadius: '0.5rem',
              marginTop: '0.5rem',
              backgroundColor: '#fff',
              overflow: 'hidden',
            }}>
              {collaboratorOptions.map((spec) => (
                <button
                  key={spec.id}
                  type="button"
                  onClick={() => {
                    setPendingInvites((prev) => {
                      if (prev.some(p => p.id === spec.id)) return prev;
                      return [...prev, spec];
                    });
                    setCollaboratorSearch('');
                    setCollaboratorOptions([]);
                  }}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '0.75rem 1rem',
                    border: 'none',
                    borderBottom: '1px solid #eee',
                    background: 'white',
                    cursor: 'pointer',
                  }}
                >
                  <strong>{spec.firstName} {spec.lastName}</strong>
                  <div style={{ fontSize: '0.9rem', color: '#666' }}>
                    {spec.specialization?.join(', ') || 'Specjalista'}
                  </div>
                </button>
              ))}
            </div>
          )}

          <div style={{ marginTop: '1.5rem' }}>
            <h3 style={{ color: '#0D1F40' }}>Potwierdzeni współpracownicy</h3>
            {loadingCollaborators && <p>Ładowanie...</p>}
            {!loadingCollaborators && acceptedCollaborators.length === 0 && (
              <p style={{ color: '#666' }}>Brak potwierdzonych współprac.</p>
            )}
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              {acceptedCollaborators.map((spec) => (
                <div
                  key={spec.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    border: '1px solid #ddd',
                    borderRadius: '0.75rem',
                    padding: '0.75rem 1rem',
                    backgroundColor: '#fafafa',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <img
                      src={spec.avatarUrl || '/images/placeholder.jpg'}
                      alt={`${spec.firstName || ''} ${spec.lastName || ''}`}
                      style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <div>
                      <div style={{ fontWeight: 'bold', color: '#0D1F40' }}>
                        {spec.firstName} {spec.lastName}
                      </div>
                      <div style={{ fontSize: '0.9rem', color: '#666' }}>
                        {spec.specialization?.join(', ') || 'Specjalista'}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveCollaboration(spec.id)}
                    style={{
                      backgroundColor: '#c00',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '0.4rem',
                      padding: '0.5rem 0.8rem',
                      cursor: 'pointer',
                    }}
                  >
                    Usuń
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: '1.5rem' }}>
            <h3 style={{ color: '#0D1F40' }}>Zaproszenia otrzymane</h3>
            {receivedInvites.length === 0 ? (
              <p style={{ color: '#666' }}>Brak oczekujących zaproszeń.</p>
            ) : (
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {receivedInvites.map((invite) => (
                  <div
                    key={invite.id}
                    style={{
                      border: '1px solid #ddd',
                      borderRadius: '0.75rem',
                      padding: '1rem',
                      backgroundColor: '#fffdf7',
                    }}
                  >
                    <div style={{ fontWeight: 'bold', color: '#0D1F40' }}>
                      {invite.otherProfile?.firstName} {invite.otherProfile?.lastName}
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.3rem' }}>
                      {invite.otherProfile?.specialization?.join(', ') || 'Specjalista'}
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                      <button
                        type="button"
                        onClick={() => handleAcceptInvite(invite.id)}
                        style={{
                          backgroundColor: '#0D1F40',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '0.4rem',
                          padding: '0.5rem 0.8rem',
                          cursor: 'pointer',
                        }}
                      >
                        Akceptuj
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRejectInvite(invite.id)}
                        style={{
                          backgroundColor: '#ccc',
                          color: '#333',
                          border: 'none',
                          borderRadius: '0.4rem',
                          padding: '0.5rem 0.8rem',
                          cursor: 'pointer',
                        }}
                      >
                        Odrzuć
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ marginTop: '1.5rem' }}>
            <h3 style={{ color: '#0D1F40' }}>Zaproszenia wysłane</h3>
            {sentInvites.length === 0 ? (
              <p style={{ color: '#666' }}>Brak oczekujących wysłanych zaproszeń.</p>
            ) : (
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {sentInvites.map((invite) => (
                  <div
                    key={invite.id}
                    style={{
                      border: '1px solid #ddd',
                      borderRadius: '0.75rem',
                      padding: '1rem',
                      backgroundColor: '#f7faff',
                    }}
                  >
                    <div style={{ fontWeight: 'bold', color: '#0D1F40' }}>
                      {invite.otherProfile?.firstName} {invite.otherProfile?.lastName}
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.3rem' }}>
                      {invite.otherProfile?.specialization?.join(', ') || 'Specjalista'}
                    </div>
                    <div style={{ marginTop: '0.7rem', color: '#777' }}>
                      Oczekuje na potwierdzenie.
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCancelInvite(invite.id)}
                      style={{
                        marginTop: '0.5rem',
                        backgroundColor: '#c00',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '0.4rem',
                        padding: '0.4rem 0.7rem',
                        cursor: 'pointer',
                      }}
                    >
                      Anuluj zaproszenie
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <button type="submit" style={buttonStyle}>💾 Zapisz zmiany</button>

        <button
          type="button"
          onClick={() => {
            const auth = getAuth(app);
            const user = auth.currentUser;
            if (user) {
              window.open(`/specjalista/profil/${user.uid}`, '_blank');
            }
          }}
          style={{
            marginTop: '1rem',
            backgroundColor: '#ccc',
            color: '#333',
            padding: '0.4rem 0.8rem',
            borderRadius: '0.3rem',
            fontSize: '0.9rem',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          👁️ Podgląd publicznego profilu
        </button>

        {status && <p style={{ color: 'green' }}>{status}</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </form>

      {/* Modal ankiety */}
      {showAnkietaModal && (
        <SpecjalistaAnkieta
          onClose={() => {
            setShowAnkietaModal(false);
            checkAnkietaStatus();
          }}
          onSaved={checkAnkietaStatus}
        />
      )}
    </>
  );

      case 'umowioneKonsultacje':
        return <UmowioneKonsultacje />;

      case 'prosby':
        return (
          <>
            <h2>Prośby o pomoc</h2>

            {prosby.length === 0 ? (
              <p>Brak oczekujących próśb o konsultację.</p>
            ) : (
              <>
                <div style={{ 
                  display: 'flex', 
                  flexDirection: isMobile ? 'column' : 'row',
                  gap: '1rem', 
                  marginBottom: '1rem', 
                  alignItems: isMobile ? 'stretch' : 'flex-start' 
                }}>
                  <select
                    value={filterOwner}
                    onChange={(e) => setFilterOwner(e.target.value)}
                    style={inputStyle}
                  >
                    <option value="">Wszyscy właściciele</option>
                    {Array.from(new Set(prosby.map(p => p.ownerName || 'Nieznany')))
                      .map(name => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                  </select>

                  <select
                    value={filterForma}
                    onChange={(e) => setFilterForma(e.target.value)}
                    style={inputStyle}
                  >
                    <option value="">Wszystkie formy</option>
                    <option value="online">Online</option>
                    <option value="stacjonarnie">Stacjonarnie</option>
                  </select>

                  <select
                    value={filterTermin}
                    onChange={(e) => setFilterTermin(e.target.value)}
                    style={inputStyle}
                  >
                    <option value="">Wszystkie terminy</option>
                    {Object.entries(terminyMap).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setFilterOwner('');
                    setFilterForma('');
                    setFilterTermin('');
                  }}
                  style={{
                    backgroundColor: '#ccc',
                    color: '#333',
                    padding: '0.8rem 1.2rem',
                    borderRadius: '0.5rem',
                    fontWeight: 'bold',
                    fontSize: '1rem',
                    border: 'none',
                    cursor: 'pointer',
                    marginBottom: '1rem'
                  }}
                >
                  Wyczyść filtry
                </button>

                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {prosby
                    .sort((a, b) => {
                      const dateA =
                        typeof a.dataZgloszenia?.toDate === 'function'
                          ? a.dataZgloszenia.toDate()
                          : new Date(a.dataZgloszenia);
                      const dateB =
                        typeof b.dataZgloszenia?.toDate === 'function'
                          ? b.dataZgloszenia.toDate()
                          : new Date(b.dataZgloszenia);
                      return dateB - dateA;
                    })
                    .filter(
                      (p) =>
                        (!filterOwner ||
                          p.ownerName?.toLowerCase().includes(filterOwner.toLowerCase())) &&
                        (!filterForma || p.forma === filterForma) &&
                        (!filterTermin || p.termin === filterTermin)
                    )
                    .map((p) => {
                      let date: Date | null = null;

                      if (p.dataZgloszenia) {
                        if (typeof p.dataZgloszenia.toDate === 'function') {
                          date = p.dataZgloszenia.toDate();
                        } else {
                          date = new Date(p.dataZgloszenia);
                        }
                      }

                      const formattedDate =
                        date && !isNaN(date.getTime())
                          ? `${date.toLocaleDateString()} (${date.toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })})`
                          : '—';

                      return (
                        <li
                          key={p.id}
                          style={{
                            marginBottom: '1rem',
                            padding: '1rem',
                            border: '1px solid #ccc',
                            borderRadius: '0.4rem',
                          }}
                        >
                          <p style={{ fontSize: "1.2rem", fontWeight: "bold" }}>Temat wiadomości: {p.temat || '—'}</p>
                          <p><strong>Data zgłoszenia:</strong> {formattedDate}</p>
                          <p><strong>Preferowany termin konsultacji:</strong> {terminyMap[p.termin] || p.termin}</p>
                          <p>
                            <strong>Forma kontaktu:</strong>{" "}
                            {Array.isArray(p.forma)
                              ? p.forma.join(", ")
                              : p.forma || "Brak"}
                          </p>
                          {(p.lokalizacja || p.potwierdzonaLokalizacja) && (
                            <p><strong>Lokalizacja stajni:</strong> {p.lokalizacja || p.potwierdzonaLokalizacja}</p>
                          )}

                          <p><strong>Opis:</strong> {p.opis}</p>
                          <p><strong>Właściciel:</strong> {p.ownerName || 'Nieznany'}</p>

                          <div style={{ 
                            display: 'flex', 
                            flexDirection: isMobile ? 'column' : 'row',
                            gap: '1rem', 
                            marginTop: '1rem' 
                          }}>
                            <button
                              onClick={() => {
                                setSelectedRequestId(p.id);
                                setAcceptDate('');
                                setAcceptTime('');
                                const forma = p.forma;
                                const formy = Array.isArray(forma)
                                  ? forma
                                  : typeof forma === 'string'
                                    ? [forma]
                                    : [];
                                setSelectedRequestForms(formy);
                                setConfirmedForms(formy);
                                setShowAcceptModal(true);
                              }}
                              style={{ 
                                padding: '0.5rem 1rem', 
                                backgroundColor: '#0D1F40', 
                                color: 'white', 
                                border: 'none', 
                                borderRadius: '0.3rem',
                                width: isMobile ? '100%' : 'auto'
                              }}
                            >
                              ✅ Zaakceptuj i podaj termin
                            </button>

                            <button
                              onClick={() => {
                                setSelectedRequestId(p.id);
                                setRejectReason('');
                                setShowReasonModal(true);
                              }}
                              style={{ 
                                padding: '0.5rem 1rem', 
                                backgroundColor: '#c00', 
                                color: 'white', 
                                border: 'none', 
                                borderRadius: '0.3rem',
                                width: isMobile ? '100%' : 'auto'
                              }}
                            >
                              ❌ Odrzuć
                            </button>

                            <button
                              onClick={() =>
                                handleOpenChat(
                                  router,
                                  p.ownerEmail ?? "",
                                  "specialista",
                                  p.temat ?? "Bez tematu",
                                  p.dataZgloszenia?.toDate
                                    ? p.dataZgloszenia.toDate().toISOString()
                                    : String(p.dataZgloszenia ?? ""),
                                  (chatId) => {
                                    setActiveTab("czat");
                                    setSelectedChatId(chatId);
                                    setShowChatList(false); // Po otwarciu czatu, pokaż okno czatu
                                  }
                                )
                              }
                              style={{
                                backgroundColor: "#0077cc",
                                color: "white",
                                padding: "0.5rem 1rem",
                                borderRadius: "0.3rem",
                                border: "none",
                                cursor: "pointer",
                                width: isMobile ? '100%' : 'auto'
                              }}
                            >
                              💬 Napisz do właściciela
                            </button>
                          </div>
                        </li>
                      );
                    })}
                </ul>
              </>
            )}
          </>
        );

      case "czat":
        return (
          <div style={{ 
            display: "flex", 
            height: "70vh",
            width: "100%",
            position: "relative",
          }}>
            {/* Lista czatów - widoczna tylko gdy showChatList jest true */}
            {showChatList && (
              <div style={{ 
                width: "100%", // Na każdym ekranie pełna szerokość
                height: "100%",
                overflowY: "auto", 
                position: "absolute",
                left: 0,
                top: 0,
                backgroundColor: "white",
                zIndex: 10,
              }}>
                <ChatSidebar
                  role="specjalista"
                  activeChatId={selectedChatId}
                  onSelectChat={handleSelectChat}
                />
              </div>
            )}

            {/* Okno czatu - widoczne gdy showChatList jest false */}
            {!showChatList && (
              <div style={{ 
                width: "100%", // Na każdym ekranie pełna szerokość
                height: "100%",
                overflowY: "auto",
                position: "absolute",
                left: 0,
                top: 0,
                backgroundColor: "white",
                zIndex: 10,
              }}>
                <button
                  onClick={handleBackToChatList}
                  style={{
                    backgroundColor: '#f0f0f0',
                    border: 'none',
                    padding: '0.5rem',
                    marginBottom: '0.5rem',
                    borderRadius: '0.3rem',
                    cursor: 'pointer',
                    width: '100%',
                  }}
                >
                  ← Powrót do listy czatów
                </button>
                <ChatBox
                  chatId={selectedChatId!}
                  role="specjalista"
                  onBack={handleBackToChatList}
                />
              </div>
            )}
          </div>
        );

      // ... reszta case'ów bez zmian ...
      case 'konsultacje':
        return <><h2>Planowane konsultacje</h2><p>Konsultacje zaplanowane na najbliższe dni...</p></>;
      case 'historia':
        return <><h2>Historia konsultacji</h2><p>Zakończone konsultacje...</p></>;
      case 'anulowaneKonsultacje':
        return <><h2>Anulowane konsultacje</h2><p>Konsultacje anulowane przez klientów lub specjalistę...</p></>;
      case 'zalecenia':
        return <><h2>Moje zalecenia</h2><p>Lista wykonanych konsultacji</p></>;

      case 'wariantKonta':
        return <><h2>Wybór wariantu konta</h2><p>Wybierz spośród dostępnych opcji: Basic, Pro, Premium.</p></>;

      case 'profilUstawienia':
        return <><h2>Ustawienia profilu</h2><p>Edytuj swoje dane kontaktowe i profil.</p></>;

      case 'bezpieczenstwo':
        return (
          <>
            <h2>Bezpieczeństwo konta</h2>
            <form onSubmit={handleUpdateProfile} style={{ maxWidth: '500px', display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              <label>
                Imię:
                <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              </label>
              <label>
                Nazwisko:
                <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </label>
              <label>
                Telefon:
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </label>
              <label>
                Nowy e-mail:
                <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
              </label>
              <label>
                Nowe hasło:
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                <small style={{ color: '#666' }}>
                  🔒 Hasło dotyczy całego konta (niezależnie od wybranej roli)
                </small>
              </label>

              <button style={buttonStyle} type="submit">Zapisz zmiany</button>
              {status && <p style={{ color: 'green' }}>{status}</p>}
              {error && <p style={{ color: 'red' }}>{error}</p>}
            </form>
          </>
        );

      case 'oczekujące':
        return <><h2>Oczekujące oferty</h2><p>Oferty złożone, które czekają na potwierdzenie przez właścicieli.</p></>;

      case 'zaakceptowane':
        return <><h2>Zaakceptowane oferty</h2><p>Lista ofert, które zostały zaakceptowane i są w trakcie realizacji.</p></>;

      case 'odrzucone':
        return <><h2>Odrzucone oferty</h2><p>Oferty, które nie zostały zaakceptowane przez klientów.</p></>;

      case 'anulowaneOferty':
        return <><h2>Anulowane oferty</h2><p>Oferty, które zostały anulowane przez jedną ze stron.</p></>;

      case 'aktualne':
        return <><h2>Rozpoczęte konwersacje</h2><p>Twoje aktywne rozmowy z klientami.</p></>;

      case 'historiaWiadomosci':
        return <><h2>Historia wiadomości</h2><p>Archiwalne konwersacje z właścicielami koni.</p></>;

      case 'planowanyUdzial':
        return <><h2>Planowany udział w wydarzeniach</h2><p>Lista wydarzeń, na które jesteś zapisany.</p></>;

      case 'historiaWydarzen':
        return <><h2>Historia wydarzeń</h2><p>Twoja historia udziału w poprzednich wydarzeniach.</p></>;

      case 'certyfikaty':
        return <><h2>Moje certyfikaty</h2><p>Lista certyfikatów potwierdzających udział w wydarzeniach</p></>;

      case 'dodajWydarzenie':
        return (
          <>
            <h2>Dodaj wydarzenie</h2>
            <form style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
              <input type="text" placeholder="Tytuł wydarzenia" required />
              <input type="text" placeholder="Data" required />
              <input type="text" placeholder="Lokalizacja" required />
              <input type="text" placeholder="Prowadzący" required />
              <textarea placeholder="Opis wydarzenia" required rows={4} />
              <button type="submit" style={buttonStyle}>Dodaj wydarzenie</button>
            </form>
          </>
        );

      case 'anulowaneWydarzenia':
        return <><h2>Anulowane wydarzenia</h2><p>Wydarzenia, które zostały odwołane lub anulowane przez organizatora.</p></>;

      case 'oczekujace':
        return <><h2>Oczekujące płatności</h2><p>Usługi lub konsultacje, które nie zostały jeszcze opłacone.</p></>;

      case 'zrealizowane':
        return <><h2>Opłaty zrealizowane</h2><p>Historia płatności za usługi, które już zostały opłacone.</p></>;

      case 'wydarzenia':
        return (
          <>
            <h2>Moje wydarzenia</h2>

            <section style={{ marginTop: '1.5rem', padding: '1rem', border: '1px solid #ccc', borderRadius: '0.6rem' }}>
              <h3>➕ Dodaj nowe wydarzenie</h3>
              <form style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
                <input type="text" placeholder="Tytuł wydarzenia" required />
                <input type="text" placeholder="Data (np. 10.09.2025)" required />
                <input type="text" placeholder="Lokalizacja (Online / Miasto)" required />
                <input type="text" placeholder="Prowadzący" required />
                <input type="text" placeholder="Cena (zł)" required />
                <textarea placeholder="Opis wydarzenia" rows={4} required />
                <button type="submit" style={buttonStyle}>Dodaj wydarzenie</button>
              </form>
            </section>

            <section style={{ marginTop: '2rem' }}>
              <h3>📅 Wydarzenia, na które jesteś zapisany</h3>
              <ul style={{ marginTop: '1rem', paddingLeft: '1rem' }}>
                <li><strong>Webinar:</strong> Zrozumienie stresu u koni – 22.08.2025 – Online</li>
                <li><strong>Warsztat:</strong> Dopasowanie siodła – 01.09.2025 – Stajnia Warszawa</li>
              </ul>
            </section>
          </>
        );

      case 'kalendarz':
        return <KalendarzPage role="specjalista" />;

      case 'oferty':
        const MojeOferty = dynamic(() => import('@/components/MojeOferty'), { ssr: false });
        return <MojeOferty />;

      case 'znajdzZgloszenie':
        return <><h2>Znajdź nowe zgłoszenie problemu</h2><p>Lista zgłoszeń</p></>;

      case 'wiadomosci':
        return (
          <>
            <h2>Wiadomości od klientów</h2>
            <p>Odpowiadaj na zapytania klientów:</p>
            <ul style={{ marginTop: '1rem' }}>
              <li><strong>o_grabowska@poczta.onet.pl</strong> – "Dziękuję za ofertę, czy możemy umówić się w sobotę?"</li>
              <li><strong>klient2@onet.pl</strong> – "Czy oferuje Pan konsultacje online?"</li>
            </ul>
          </>
        );

      case 'platnosci':
        return (
          <>
            <h2>Płatności</h2>
            <p>Podsumowanie dochodów i wystawionych faktur:</p>
            <ul style={{ marginTop: '1rem' }}>
              <li>01.07.2025 – 200 zł – Konsultacja online – Opłacone</li>
              <li>27.06.2025 – 250 zł – Konsultacja stacjonarna – Opłacone</li>
            </ul>
          </>
        );

      default:
        return <p>Wybierz zakładkę z menu po lewej.</p>;
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: isMobile ? 'column' : 'row',
      minHeight: '90vh' 
    }}>
      {/* Przycisk menu mobilnego - tylko na mobile */}
      {isMobile && (
        <button
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          style={{
            backgroundColor: '#0D1F40',
            color: 'white',
            padding: '1rem',
            border: 'none',
            borderRadius: '0.5rem',
            margin: '1rem',
            fontSize: '1rem',
            fontWeight: 'bold',
            cursor: 'pointer',
          }}
        >
          {showMobileMenu ? '▼ Ukryj menu' : '▶ Pokaż menu'}
        </button>
      )}

      {/* MENU - na desktop zawsze widoczne, na mobile tylko gdy showMobileMenu = true */}
      {(!isMobile || showMobileMenu) && (
        <aside
          style={{
            width: isMobile ? '100%' : '250px',
            backgroundColor: '#f2f2f2',
            padding: isMobile ? '1rem' : '2rem 1rem',
            borderRight: isMobile ? 'none' : '1px solid #ccc',
            borderBottom: isMobile ? '1px solid #ccc' : 'none',
          }}
        >
          <h3 style={{ marginBottom: '2rem', color: '#0D1F40', fontSize: '1.2rem' }}>Panel specjalisty</h3>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {menuItems.map((item) => (
              <div key={item.id}>
                <button
                  onClick={() => {
                    if (item.onClick) {
                      item.onClick();
                    } else if (item.submenu) {
                      toggleSubmenu(item.id);
                    } else {
                      setActiveTab(item.id);
                      if (isMobile) setShowMobileMenu(false); // Na mobile po wybraniu opcji, ukryj menu
                    }
                  }}
                  style={{
                    background: activeTab === item.id ? '#0D1F40' : 'transparent',
                    color: activeTab === item.id ? 'white' : '#0D1F40',
                    border: 'none',
                    padding: isMobile ? '0.6rem 0.8rem' : '0.8rem 1rem',
                    textAlign: 'left',
                    fontWeight: 'bold',
                    fontSize: '1rem',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    width: '100%',
                  }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                    {item.id === 'czat' ? (
                      <>
                        <span>Wiadomości (czat)</span>
                        <ChatUnreadBadge role="specjalista" />
                      </>
                    ) : (
                      item.label
                    )}

                    {item.id === 'prosby' && prosby.length > 0 && (
                      <span style={{
                        backgroundColor: '#c00',
                        color: 'white',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '999px',
                        fontSize: '0.75rem',
                        marginLeft: '0.5rem',
                      }}>
                        {prosby.length}
                      </span>
                    )}
                    {item.id === 'kalendarz' && calendarCount > 0 && (
                      <span style={{
                        backgroundColor: '#c00',
                        color: 'white',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '999px',
                        fontSize: '0.75rem',
                        marginLeft: '0.5rem',
                      }}>
                        {calendarCount}
                      </span>
                    )}

                    {item.id === 'oferty' && totalOferty > 0 && (
                      <span style={{
                        backgroundColor: '#0D1F40',
                        color: 'white',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '999px',
                        fontSize: '0.75rem',
                        marginLeft: '0.5rem',
                      }}>
                        {newOferty}/{totalOferty}
                      </span>
                    )}
                  </span>
                </button>

                {item.submenu && expandedMenus.includes(item.id) && (
                  <div style={{ marginLeft: '1rem', marginTop: '0.5rem' }}>
                    {item.submenu.map((subItem) => (
                      <button
                        key={subItem.id}
                        onClick={() => {
                          setActiveTab(subItem.id);
                          if (isMobile) setShowMobileMenu(false);
                        }}
                        style={{
                          background: activeTab === subItem.id ? '#0D1F40' : 'transparent',
                          color: activeTab === subItem.id ? 'white' : '#0D1F40',
                          border: 'none',
                          padding: isMobile ? '0.4rem 0.8rem' : '0.4rem 1rem',
                          textAlign: 'left',
                          fontSize: '0.95rem',
                          borderRadius: '0.4rem',
                          cursor: 'pointer',
                          width: '100%',
                          fontWeight: 'normal',
                          fontFamily: 'inherit',
                        }}
                      >
                        {subItem.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </aside>
      )}

      {/* WIDOK GŁÓWNY */}
      <main style={{ 
        flex: 1, 
        padding: isMobile ? '1rem' : '2rem',
        width: isMobile ? '100%' : 'auto',
        overflowX: 'hidden',
        fontSize: '1rem',
      }}>
        {renderContent()}
      </main>

      {/* Modale - bez zmian */}
      {showSaveConfirmation && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <h3>Dane zostały zapisane 🎉</h3>
            <p>Zmiany w Twoim profilu zostały pomyślnie zapisane.</p>
            <button
              onClick={() => setShowSaveConfirmation(false)}
              style={{
                marginTop: '1rem',
                padding: '0.5rem 1rem',
                backgroundColor: '#0D1F40',
                color: 'white',
                border: 'none',
                borderRadius: '0.3rem'
              }}
            >
              Zamknij
            </button>
          </div>
        </div>
      )}

      {infoModalMessage && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <p style={{ textAlign: 'justify' }}>{infoModalMessage}</p>
            <button
              onClick={() => setInfoModalMessage(null)}
              style={{
                marginTop: '1rem',
                padding: '0.5rem 1rem',
                backgroundColor: '#0D1F40',
                color: 'white',
                border: 'none',
                borderRadius: '0.3rem'
              }}
            >
              Zamknij
            </button>
          </div>
        </div>
      )}

      {statusModalMessage && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <p style={{ textAlign: 'justify' }}>{statusModalMessage}</p>
            <button
              onClick={() => setStatusModalMessage(null)}
              style={{
                marginTop: '1rem',
                padding: '0.5rem 1rem',
                backgroundColor: '#0D1F40',
                color: 'white',
                border: 'none',
                borderRadius: '0.3rem'
              }}
            >
              Zamknij
            </button>
          </div>
        </div>
      )}

      {showAcceptModal && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <h3>Podaj termin konsultacji</h3>

            <input
              type="date"
              value={acceptDate}
              onChange={(e) => setAcceptDate(e.target.value)}
              style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem' }}
            />

            <input
              type="time"
              value={acceptTime}
              onChange={(e) => setAcceptTime(e.target.value)}
              style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem' }}
            />

            <div style={{ marginBottom: '1rem' }}>
              <strong>Wybierz formę kontaktu:</strong>
              <div style={{ 
                display: 'flex', 
                flexDirection: isMobile ? 'column' : 'row',
                flexWrap: 'wrap', 
                gap: isMobile ? '0.5rem' : '1rem', 
                marginTop: '0.5rem' 
              }}>
                {Array.isArray(selectedRequestForms) &&
                  selectedRequestForms.map((forma: string, idx: number) => (
                    <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <input
                        type="checkbox"
                        value={forma}
                        checked={confirmedForms.includes(forma)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setConfirmedForms(prev => [...prev, forma]);
                          } else {
                            setConfirmedForms(prev => prev.filter(f => f !== forma));
                          }
                        }}
                      />
                      {forma}
                    </label>
                  ))}
              </div>
            </div>

            <div style={{ 
              display: 'flex', 
              flexDirection: isMobile ? 'column' : 'row',
              justifyContent: 'flex-end', 
              gap: isMobile ? '0.5rem' : '1rem' 
            }}>
              <button 
                onClick={() => setShowAcceptModal(false)}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#ccc',
                  border: 'none',
                  borderRadius: '0.3rem',
                  cursor: 'pointer',
                  width: isMobile ? '100%' : 'auto'
                }}
              >
                Anuluj
              </button>
              <button
                onClick={() => acceptRequestWithDate(selectedRequestId!)}
                style={{
                  backgroundColor: '#0D1F40',
                  color: 'white',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '0.3rem',
                  cursor: 'pointer',
                  width: isMobile ? '100%' : 'auto'
                }}
              >
                Potwierdź termin
              </button>
            </div>
          </div>
        </div>
      )}

      {showReasonModal && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <h3>Powód odrzucenia</h3>
            <select
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem' }}
            >
              <option value="">-- Wybierz powód --</option>
              {predefinedRejectReasons.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
              <option value="inny">Inny powód</option>
            </select>
            {rejectReason === 'inny' && (
              <textarea
                placeholder="Wpisz inny powód..."
                onChange={(e) => setRejectReason(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', minHeight: '80px', marginBottom: '1rem' }}
              />
            )}
            <div style={{ 
              display: 'flex', 
              flexDirection: isMobile ? 'column' : 'row',
              justifyContent: 'flex-end', 
              gap: isMobile ? '0.5rem' : '1rem' 
            }}>
              <button 
                onClick={() => setShowReasonModal(false)}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#ccc',
                  border: 'none',
                  borderRadius: '0.3rem',
                  cursor: 'pointer',
                  width: isMobile ? '100%' : 'auto'
                }}
              >
                Anuluj
              </button>
              <button
                onClick={() => {
                  if (selectedRequestId && rejectReason.trim()) {
                    updateRequestStatus(selectedRequestId, 'odrzucone', rejectReason.trim());
                    setShowReasonModal(false);
                  } else {
                    setInfoModalMessage('⚠️ Wybierz lub wpisz powód.');
                  }
                }}
                style={{
                  backgroundColor: '#c00',
                  color: 'white',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '0.3rem',
                  cursor: 'pointer',
                  width: isMobile ? '100%' : 'auto'
                }}
              >
                Potwierdź odrzucenie
              </button>
            </div>
          </div>
        </div>
      )}

      {showOfertaDialog && (
        <div style={modalOverlay}>
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '1rem',
            width: isMobile ? '90%' : '400px',
            maxWidth: '90%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h3 style={{ marginBottom: '1rem', color: '#0D1F40' }}>
              {editingOfertaId ? '✏️ Edytuj ofertę' : '💡 Zaproponuj pomoc'}
            </h3>

            <label>Proponowane terminy:</label>
            {terminy.map((t, index) => (
              <div key={index} style={{ marginBottom: '1rem', borderBottom: '1px dashed #ccc', paddingBottom: '1rem' }}>
                <label>Data konsultacji:</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.8rem' }}>
                  <input
                    type="date"
                    value={t.date}
                    onChange={(e) => {
                      const newTerminy = [...terminy];
                      newTerminy[index].date = e.target.value;
                      setTerminy(newTerminy);
                    }}
                    style={inputOfertaStyle}
                  />
                </div>

                <label>Godzina:</label>
                <input
                  type="time"
                  value={t.time}
                  onChange={(e) => {
                    const newTerminy = [...terminy];
                    newTerminy[index].time = e.target.value;
                    setTerminy(newTerminy);
                  }}
                  style={inputOfertaStyle}
                />

                {terminy.length > 1 && (
                  <button
                    onClick={() => setTerminy(terminy.filter((_, i) => i !== index))}
                    style={{ ...buttonOfertaSecondary, backgroundColor: '#eee', fontSize: '0.85rem', marginTop: '0.5rem', width: '100%' }}
                  >
                    Usuń ten termin
                  </button>
                )}
              </div>
            ))}

            <button
              onClick={() => setTerminy([...terminy, { date: '', time: '' }])}
              style={{ ...buttonOfertaSecondary, marginBottom: '1rem', width: '100%' }}
            >
              ➕ Dodaj kolejny termin
            </button>

            <label>Cena orientacyjna (od):</label>
            <input
              type="number"
              value={priceFrom}
              onChange={(e) => setPriceFrom(e.target.value)}
              style={inputOfertaStyle}
            />

            <label>Cena orientacyjna (do):</label>
            <input
              type="number"
              value={priceTo}
              onChange={(e) => setPriceTo(e.target.value)}
              style={inputOfertaStyle}
            />

            <div style={{ 
              marginTop: '1.5rem', 
              display: 'flex', 
              flexDirection: isMobile ? 'column' : 'row',
              gap: isMobile ? '0.5rem' : '1rem', 
              justifyContent: 'flex-end' 
            }}>
              <button 
                style={{ 
                  ...buttonOfertaSecondary, 
                  width: isMobile ? '100%' : 'auto' 
                }} 
                onClick={() => setShowOfertaDialog(false)}
              >
                Anuluj
              </button>
              <button 
                style={{ 
                  ...buttonOfertaPrimary, 
                  width: isMobile ? '100%' : 'auto' 
                }} 
                onClick={handleZapiszOferte}
              >
                {editingOfertaId ? '💾 Zapisz zmiany' : 'Potwierdź'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const buttonStyle: React.CSSProperties = {
  backgroundColor: '#0D1F40',
  color: 'white',
  padding: '0.4rem 0.8rem',
  borderRadius: '0.3rem',
  fontSize: '0.9rem',
  border: 'none',
  cursor: 'pointer',
};

const modalOverlay: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100vw',
  height: '100vh',
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  padding: '1rem',
};

const modalContent: React.CSSProperties = {
  backgroundColor: 'white',
  padding: '2rem',
  borderRadius: '1rem',
  maxWidth: '400px',
  width: '100%',
  boxShadow: '0 0 10px rgba(0,0,0,0.2)',
  textAlign: 'center',
  maxHeight: '90vh',
  overflowY: 'auto',
};