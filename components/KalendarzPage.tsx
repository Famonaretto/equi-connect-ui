'use client';

import { useEffect, useState } from 'react';
import moment from 'moment';
import "moment/locale/pl"; 
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  DocumentData,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { app } from '@/lib/firebase';
import { contactOptions } from '@/utils/contactOptions';
import { Calendar, momentLocalizer, Event as RBCEvent } from 'react-big-calendar';
import { ToolbarProps } from "react-big-calendar";


moment.locale("pl");
const localizer = momentLocalizer(moment);

interface KalendarzPageProps {
  role: 'wlasciciel' | 'specjalista';
}

interface EventData extends RBCEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  resource: DocumentData & {
    status: string;
    temat?: string;
    opis?: string;
    ownerName?: string;
    specialistName?: string;
    forma?: string;
    proponowanyTermin?: string;
    cancelReason?: string;
    lastUpdatedBy?: string;
  };
  color: string;
}

function CustomToolbar({ label, onNavigate }: ToolbarProps<EventData, object>) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "1rem",
        position: "relative",
      }}
    >
      {/* Wyśrodkowany tytuł miesiąca */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          transform: "translateX(-50%)",
          fontSize: "1.2rem",
          fontWeight: "bold",
        }}
      >
        {label}
      </div>

      {/* Przyciski po prawej */}
      <div style={{ marginLeft: "auto", display: "flex", gap: "0.5rem" }}>
        <button onClick={() => onNavigate("TODAY")}>Dziś</button>
        <button onClick={() => onNavigate("PREV")}>◀</button>
        <button onClick={() => onNavigate("NEXT")}>▶</button>
      </div>
    </div>
  );
}



export default function KalendarzPage({ role }: KalendarzPageProps) {
  const [events, setEvents] = useState<EventData[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<EventData[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [filters, setFilters] = useState({ status: '', name: '', forma: '' });
  const [namesList, setNamesList] = useState<string[]>([]);
  const [showCancelAlert, setShowCancelAlert] = useState(false);

  const cancelReasonsList = [
    'Zmiana planów',
    'Choroba konia',
    'Problemy zdrowotne właściciela',
    'Zła pogoda',
    'Inne',
  ];

  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false);
const [showCancelDialog, setShowCancelDialog] = useState(false);
const [newDate, setNewDate] = useState('');
const [cancelReasonText, setCancelReasonText] = useState('');
const [currentDate, setCurrentDate] = useState(new Date());


  const fetchEvents = async () => {
    const auth = getAuth(app);
    const user = auth.currentUser;
    if (!user) return;

    const db = getFirestore(app);
    let q;

if (role === 'wlasciciel') {
  q = query(
    collection(db, 'konsultacje'),
    where('ownerEmail', '==', user.email)
    // bez filtrowania hideForOwner
  );
} else {
  q = query(
    collection(db, 'konsultacje'),
    where('specialistEmail', '==', user.email)
    // bez filtrowania hideForSpecialist
  );
}



    const snapshot = await getDocs(q);

    const data = snapshot.docs
  .map(docSnap => {
    const konsultacja = docSnap.data();

    let status = (konsultacja.status || '').trim().toLowerCase();

    if (status === 'potwierdzone') status = 'planowane';

    if (role === 'specjalista') {
      if (!['planowane', 'odwołane', 'odbyte', 'zaakceptowane'].includes(status)) {
        return null;
      }
    } else {
      if (!['planowane', 'odwołane', 'odbyte'].includes(status)) {
        return null;
      }
    }

    let startDate = new Date();
    if (konsultacja.proponowanyTermin) {
      startDate = new Date(konsultacja.proponowanyTermin);
    } else if (status === 'zaakceptowane') {
      if (konsultacja.createdAt?.toDate) {
        startDate = konsultacja.createdAt.toDate();
      } else if (typeof konsultacja.createdAt === 'string') {
        startDate = new Date(konsultacja.createdAt);
      } else if (konsultacja.createdAt?.seconds) {
        startDate = new Date(konsultacja.createdAt.seconds * 1000);
      }
    }

    const kolor =
      status === 'planowane' ? '#0D1F40' :
      status === 'odwołane' ? '#c00' :
      status === 'odbyte' ? '#28a745' :
      status === 'zaakceptowane' ? '#FFD700' : '#999';

    return {
      id: docSnap.id,
      title: `${konsultacja.temat || 'Konsultacja'} (${status})`,
      start: startDate,
      end: new Date(startDate.getTime() + 60 * 60 * 1000),
      allDay: false,
      resource: {
        ...konsultacja,
        status,
        forma: konsultacja.forma || '',
        ownerName: konsultacja.ownerName || '',
        specialistName: konsultacja.specialistName || konsultacja.specjalista ||'',
      },
      color: kolor,
    } as EventData;
  })
  .filter((e): e is EventData => e !== null)
  .filter(e => {
    // UWAGA: lokalne filtrowanie po `hideForSpecialist`
    if (role === 'specjalista') {
      return e.resource.hideForSpecialist !== true;
    } else {
      return e.resource.hideForOwner !== true;
    }
  });



    setEvents(data);
    setFilteredEvents(data);

    const uniqueNames = Array.from(
      new Set(
        data.map(ev =>
          role === 'wlasciciel' ? ev.resource.specialistName || '' : ev.resource.ownerName || ''
        )
      )
    ).filter(name => name.trim() !== '');
    setNamesList(uniqueNames);

    // komunikat o odwołaniu przez drugą stronę
    const hasCancelByOther = data.some(
      ev => ev.resource.status === 'odwołane' && ev.resource.lastUpdatedBy !== user.email
    );
    setShowCancelAlert(hasCancelByOther);
  };

  useEffect(() => {
    fetchEvents();
  }, [role]);

  useEffect(() => {
    let data = [...events];
    if (filters.status) {
      data = data.filter(ev => ev.resource.status === filters.status);
    }
    if (filters.name) {
      data = data.filter(ev =>
        (role === 'wlasciciel' ? ev.resource.specialistName || '' : ev.resource.ownerName || '')
          .toLowerCase()
          .includes(filters.name.toLowerCase())
      );
    }
    if (filters.forma) {
  data = data.filter(ev => {
    const formaVal = ev.resource.forma;
    if (Array.isArray(formaVal)) {
      return formaVal.includes(filters.forma);
    }
    return formaVal === filters.forma;
  });
}

    setFilteredEvents(data);
  }, [filters, events, role]);

  const eventStyleGetter = (event: EventData) => ({
    style: {
      backgroundColor: event.color,
      color: '#fff',
      borderRadius: '5px',
      border: 'none',
      padding: '4px',
    },
  });

  const handleCancel = async () => {
    if (!selectedEvent || !cancelReason.trim()) return;
    const auth = getAuth(app);
    const user = auth.currentUser;
    if (!user) return;

    const db = getFirestore(app);
await updateDoc(doc(db, 'konsultacje', selectedEvent.id), {
  status: 'odwołane',
  cancelReason: cancelReason,
  lastUpdatedBy: user.email,
  substatusW: role === 'wlasciciel' ? 'SOW' : 'NOW',
  substatusS: role === 'wlasciciel' ? 'NOS' : 'SOS',
});


    await fetch('/api/sendConsultationStatusUpdate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        consultationId: selectedEvent.id,
        status: 'odwołane',
        cancelReason: cancelReason,
      }),
    });

    setSelectedEvent(null);
    setCancelReason('');
    fetchEvents();
  };

  const handleDelete = async () => {
  if (!selectedEvent) return;
  const auth = getAuth(app);
  const user = auth.currentUser;
  if (!user) return;

  const db = getFirestore(app);
  await updateDoc(doc(db, 'konsultacje', selectedEvent.id), {
    ...(role === 'wlasciciel' ? { hideForOwner: true } : { hideForSpecialist: true })
  });

  setSelectedEvent(null);
  fetchEvents();
};


  return (
    <div style={{ height: '85vh', padding: '1rem' }}>
      <h2>Mój kalendarz konsultacji</h2>

      {showCancelAlert && (
        <div style={{ background: '#f8d7da', color: '#721c24', padding: '1rem', marginBottom: '1rem' }}>
          Konsultacja została odwołana przez drugą stronę.
          <button
            style={{ marginLeft: '1rem', background: '#721c24', color: '#fff', border: 'none', padding: '0.5rem' }}
            onClick={() => setShowCancelAlert(false)}
          >
            OK
          </button>
        </div>
      )}

      {/* Filtry */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        <select
          value={filters.status}
          onChange={e => setFilters({ ...filters, status: e.target.value })}
        >
          <option value="">Wszystkie statusy</option>
          <option value="planowane">Planowane</option>
          <option value="odbyte">Odbyte</option>
          <option value="odwołane">Odwołane</option>
          <option value="zaakceptowane">Zaakceptowane</option>

        </select>

        <select
          value={filters.name}
          onChange={e => setFilters({ ...filters, name: e.target.value })}
        >
          <option value="">Wszyscy</option>
          {namesList.map((name, idx) => (
            <option key={idx} value={name}>
              {name}
            </option>
          ))}
        </select>

        <select
          value={filters.forma}
          onChange={e => setFilters({ ...filters, forma: e.target.value })}
        >
          <option value="">Wszystkie formy kontaktu</option>
          {contactOptions.map((option, idx) => (
            <option key={idx} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      

<Calendar
  localizer={localizer}
  events={filteredEvents}
  startAccessor="start"
  endAccessor="end"
  style={{ height: "100%" }}
  eventPropGetter={eventStyleGetter}
  onSelectEvent={event => setSelectedEvent(event)}
  date={currentDate}
  onNavigate={(newDate) => setCurrentDate(newDate)}
  defaultView="month"
  views={["month"]}
  components={{
    toolbar: CustomToolbar,   // 👈 użyj swojego toolbara
  }}
  messages={{
    next: "Następny",
    previous: "Poprzedni",
    today: "Dziś",
    month: "Miesiąc",
  }}
/>




      {/* Modal szczegółów */}
      {selectedEvent && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
          }}
        >
          <div style={{ background: '#fff', padding: '2rem', borderRadius: '8px', minWidth: '320px' }}>
            <h3>{selectedEvent.title}</h3>
            <p><strong>Data:</strong> {moment(selectedEvent.start).format('YYYY-MM-DD HH:mm')}</p>
            <p><strong>Status:</strong> {selectedEvent.resource.status}</p>
            <p><strong>Temat:</strong> {selectedEvent.resource.temat}</p>
            <p><strong>Opis:</strong> {selectedEvent.resource.opis}</p>
<p>
  <strong>Forma kontaktu:</strong>{" "}
  {Array.isArray(selectedEvent.resource.forma)
    ? selectedEvent.resource.forma.join(", ")
    : selectedEvent.resource.forma || "Brak"}
</p>
<p>
  <strong>Proponowany termin:</strong>{" "}
  {selectedEvent.resource.proponowanyTermin
    ? moment(selectedEvent.resource.proponowanyTermin).format("[dzień: ]DD.MM.YYYY[, godzina: ]HH:mm")
    : "Brak"}
</p>


            {role === 'wlasciciel' ? (
              <p><strong>Specjalista:</strong> {selectedEvent.resource.specialistName}</p>
            ) : (
              <p><strong>Właściciel konia:</strong> {selectedEvent.resource.ownerName}</p>
            )}
            {role === 'specjalista' && selectedEvent.resource.status === 'zaakceptowane' && (
  <>
    {/* Zmień termin */}
    <button
      style={{ background: '#f0ad4e', color: '#fff', marginTop: '0.5rem' }}
      onClick={() => {
        setShowRescheduleDialog(prev => !prev);
        setShowCancelDialog(false); // ukryj drugą sekcję
      }}
    >
      Zmień proponowany termin
    </button>

    {showRescheduleDialog && (
      <div style={{ marginTop: '0.5rem' }}>
        <input
          type="datetime-local"
          value={newDate}
          onChange={e => setNewDate(e.target.value)}
          style={{ width: '100%', marginBottom: '0.5rem' }}
        />
        <button
          onClick={async () => {
            const db = getFirestore(app);
            await updateDoc(doc(db, 'konsultacje', selectedEvent.id), {
              proponowanyTermin: new Date(newDate).toISOString(),
            });
            setShowRescheduleDialog(false);
            setNewDate('');
            fetchEvents();
          }}
          style={{ background: '#28a745', color: '#fff', marginRight: '0.5rem' }}
        >
          Zapisz termin
        </button>
        <button onClick={() => setShowRescheduleDialog(false)}>Anuluj</button>
      </div>
    )}

    {/* Odwołaj konsultację */}
    <button
      style={{ background: 'red', color: '#fff', marginTop: '0.5rem' }}
      onClick={() => {
        setShowCancelDialog(prev => !prev);
        setShowRescheduleDialog(false); // ukryj drugą sekcję
      }}
    >
      Odwołaj konsultację
    </button>

    {showCancelDialog && (
      <>
        <select
          value={cancelReason}
          onChange={e => setCancelReason(e.target.value)}
          style={{ width: '100%', marginTop: '1rem' }}
        >
          <option value="">Wybierz powód odwołania</option>
          {cancelReasonsList.map((reason, idx) => (
            <option key={idx} value={reason}>
              {reason}
            </option>
          ))}
        </select>
        <button
          style={{ background: 'red', color: '#fff', marginTop: '0.5rem' }}
          onClick={async () => {
            if (!cancelReason.trim()) return;
            const auth = getAuth(app);
            const user = auth.currentUser;
            if (!user || !selectedEvent) return;

            const isOwner = (role as 'wlasciciel' | 'specjalista') === 'wlasciciel';

            const substatusW = isOwner ? 'SOW' : 'NOW';
            const substatusS = isOwner ? 'NOS' : 'SOS';

            const db = getFirestore(app);
            await updateDoc(doc(db, 'konsultacje', selectedEvent.id), {
              status: 'odwołane',
              cancelReason,
              lastUpdatedBy: user.email,
              substatusW,
              substatusS,
            });

            await fetch('/api/sendConsultationStatusUpdate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                consultationId: selectedEvent.id,
                status: 'odwołane',
                cancelReason,
              }),
            });

            setShowCancelDialog(false);
            setCancelReason('');
            setSelectedEvent(null);
            fetchEvents();
          }}
        >
          Odwołaj konsultację
        </button>
      </>
    )}
  </>
)}


            {selectedEvent.resource.status === 'planowane' && (
              <>
                <select
                  value={cancelReason}
                  onChange={e => setCancelReason(e.target.value)}
                  style={{ width: '100%', marginTop: '1rem' }}
                >
                  <option value="">Wybierz powód odwołania</option>
                  {cancelReasonsList.map((reason, idx) => (
                    <option key={idx} value={reason}>
                      {reason}
                    </option>
                  ))}
                </select>
                <button
                  style={{ background: 'red', color: '#fff', marginTop: '0.5rem' }}
                  onClick={handleCancel}
                >
                  Odwołaj konsultację
                </button>
              </>
            )}
            
            {['odwołane', 'odbyte'].includes(selectedEvent.resource.status) && (
              <button
                style={{ background: 'gray', color: '#fff', marginTop: '0.5rem' }}
                onClick={handleDelete}
              >
                Usuń z kalendarza
              </button>
            )}
            <button style={{ marginTop: '0.5rem' }} onClick={() => setSelectedEvent(null)}>
              Zamknij
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
