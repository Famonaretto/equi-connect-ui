'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
} from 'firebase/auth';
import {
  getFirestore,
  setDoc,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { useDialog } from '../components/DialogProvider';
import { sendPasswordResetEmail } from 'firebase/auth'; 
import { checkConsultationsAfterLogin } from '@/utils/checkConsultations';


export default function ZalogujPage() {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [role, setRole] = useState<'specjalista' | 'wlasciciel'>('wlasciciel');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
    const router = useRouter();
const { showDialog, showDialogWithActions, showDatePicker } = useDialog();


console.log('✅ useDialog initialized', showDialog);



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("🔍 [handleSubmit] Wybrana rola w momencie wysyłki formularza:", role);

    const auth = getAuth(app);
    const db = getFirestore(app);

    if (!email || !password) {
      console.log('🔔 Dialog: Błąd logowania (invalid-credential)');

      showDialog('⚠️ Uzupełnij e-mail i hasło');

      return;
    }

    if (activeTab === 'register') {
      if (password.length < 6) {
        console.log('🔔 Dialog: Błąd logowania (invalid-credential)');

        showDialog('🔒 Hasło musi mieć co najmniej 6 znaków');
        return;
      }
      if (password !== confirmPassword) {
        console.log('🔔 Dialog: Błąd logowania (invalid-credential)');

        showDialog('❗ Hasła nie są takie same');
        return;
      }

      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        await sendEmailVerification(user);

        const [firstName = '', lastName = ''] = fullName.trim().split(' ');
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          roles: {
            [role]: {
              enabled: true,
              createdAt: serverTimestamp(),
              firstName,
              lastName,
              phone: '',
            },
          },
        });

        localStorage.setItem('user', JSON.stringify({ email, role }));
        localStorage.setItem('role', role); // 🆕 zapisujemy rolę do localStorage
        console.log("💾 [register] Zapisuję rolę do localStorage:", role);


        window.dispatchEvent(new Event('userChanged'));
      } catch (err: any) {
        if (err.code === 'auth/email-already-in-use') {
          try {
            const login = await signInWithEmailAndPassword(auth, email, password);
            const user = login.user;

            const userRef = doc(db, 'users', user.uid);
            const userSnap = await getDoc(userRef);

            if (!userSnap.exists()) {
              showDialog('❌ Konto istnieje w systemie auth, ale nie w bazie danych.');
              return;
            }

            const userData = userSnap.data();
            const roles = userData.roles || {};

            if (roles[role]?.enabled) {
              showDialog(`📌 Rola "${role}" została już przypisana temu kontu.`);
              return;
            }

            const [firstName = '', lastName = ''] = fullName.trim().split(' ');
            await updateDoc(userRef, {
              [`roles.${role}`]: {
                enabled: true,
                createdAt: serverTimestamp(),
                firstName,
                lastName,
                phone: '',
              },
            });

            localStorage.setItem('user', JSON.stringify({ email, role }));
            localStorage.setItem('role', role); // 🆕

            window.dispatchEvent(new Event('userChanged'));
          } catch (loginErr) {
            showDialog(
              '📛 Dla tego adresu e-mail istnieje już konto, ale podałeś błędne hasło. Aby dodać nową rolę, musisz użyć tego samego hasła.'
            );
          }
        } else {
          showDialog(err.message || '❌ Wystąpił błąd przy rejestracji.');
        }
      }
    } else {
      try {
        const login = await signInWithEmailAndPassword(auth, email, password);
        const user = login.user;

        if (!user.emailVerified) {
          showDialog('📬 Konto nieaktywne. Sprawdź skrzynkę mailową.');
          return;
        }

        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          showDialog('❌ Nie znaleziono konta w bazie danych.');
          return;
        }

        const userData = userSnap.data();
        const roles = userData.roles || {};

        // 🔄 PROMOCJA z "tymczasowy" → "wlasciciel"
if (userData.role === 'tymczasowy' && role === 'wlasciciel') {
  await updateDoc(userRef, {
    roles: {
      wlasciciel: {
        enabled: true,
        createdAt: serverTimestamp(),
        firstName: '',
        lastName: '',
        phone: '',
        uid: user.uid,
      },
    },
  });
  await updateDoc(userRef, {
    role: null, // lub: deleteField() jeśli chcesz trwale usunąć
  });

  console.log('✅ Konto tymczasowe zostało zaktualizowane do "wlasciciel".');
}

// ❌ Jeśli nadal brak roli po promocji
const refreshedSnap = await getDoc(userRef);
const refreshedData = refreshedSnap.data();
const updatedRoles = refreshedData?.roles || {};

if (!updatedRoles[role] || !updatedRoles[role].enabled) {
  showDialog(`⛔ Twoje konto nie ma przypisanej roli: "${role}".`);
  return;
}


        localStorage.setItem('user', JSON.stringify({ email, role }));
        localStorage.setItem('role', role); // 🆕
        console.log("💾 [login] Zapisuję rolę do localStorage:", role);
        
await checkConsultationsAfterLogin(
  user.uid,
  role,
  showDialogWithActions,
  showDatePicker
);

window.dispatchEvent(new Event('userChanged'));

const redirectPath = localStorage.getItem('redirectAfterLogin');
localStorage.removeItem('redirectAfterLogin');
router.push(redirectPath || (role === 'wlasciciel' ? '/wlasciciele' : '/specjalista'));

      } catch (err: any) {
        if (err.code === 'auth/invalid-credential') {
          showDialog(`📛 Niepoprawne dane logowania. Sprawdź e-mail i hasło.`);
        } else if (err.code === 'auth/too-many-requests') {
          showDialog('🚫 Zbyt wiele nieudanych prób logowania. Odczekaj chwilę i spróbuj ponownie.');
        } else if (err.code === 'auth/user-not-found') {
          showDialog('🔍 Nie znaleziono konta z tym adresem e-mail. Zarejestruj się.');
        } else {
          showDialog(`❌ Błąd logowania: ${err.message}`);
        }
      }
    }
  };

  const styles = {
    wrapper: {
      maxWidth: '500px',
      margin: '4rem auto',
      padding: '2rem',
      backgroundColor: '#fff',
      borderRadius: '1rem',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    },
    title: {
      textAlign: 'center' as const,
      color: '#0D1F40',
      marginBottom: '2rem',
    },
    roleSwitch: {
      display: 'flex',
      justifyContent: 'center',
      gap: '1rem',
      marginBottom: '2rem',
    },
    tabSwitch: {
      display: 'flex',
      justifyContent: 'center',
      gap: '2rem',
      marginBottom: '2rem',
    },
    form: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '1.2rem',
    },
    input: {
      padding: '0.9rem',
      borderRadius: '0.5rem',
      border: '1px solid #ccc',
      fontSize: '1rem',
    },
    submit: {
      backgroundColor: '#0D1F40',
      color: 'white',
      padding: '1rem',
      borderRadius: '0.5rem',
      fontWeight: 'bold',
      fontSize: '1.1rem',
      border: 'none',
      cursor: 'pointer',
    },
    roleLabel: {
      textAlign: 'center' as const,
      marginTop: '2rem',
      fontSize: '0.9rem',
      color: '#888',
    },
  };

  const buttonStyle = (isActive: boolean) => ({
    padding: '0.7rem 1.5rem',
    borderRadius: '0.5rem',
    border: isActive ? '2px solid #0D1F40' : '1px solid #ccc',
    backgroundColor: isActive ? '#0D1F40' : 'white',
    color: isActive ? 'white' : '#0D1F40',
    fontWeight: 'bold',
    cursor: 'pointer',
  });

  const tabStyle = (isActive: boolean) => ({
    border: 'none',
    background: 'none',
    fontWeight: isActive ? 'bold' : 'normal',
    fontSize: '1rem',
    color: isActive ? '#0D1F40' : '#888',
    borderBottom: isActive ? '2px solid #0D1F40' : 'none',
    paddingBottom: '0.5rem',
    cursor: 'pointer',
  });

  return (
    <div style={styles.wrapper}>
      <h2 style={styles.title}>
        {activeTab === 'login' ? 'Zaloguj się' : 'Zarejestruj się'}
      </h2>

      <div style={styles.roleSwitch}>
        <button onClick={() => setRole('wlasciciel')} style={buttonStyle(role === 'wlasciciel')}>
          Właściciel konia
        </button>
        <button onClick={() => setRole('specjalista')} style={buttonStyle(role === 'specjalista')}>
          Specjalista
        </button>
      </div>

      <div style={styles.tabSwitch}>
        <button onClick={() => setActiveTab('login')} style={tabStyle(activeTab === 'login')}>
          Zaloguj się
        </button>
        <button onClick={() => setActiveTab('register')} style={tabStyle(activeTab === 'register')}>
          Zarejestruj się
        </button>
      </div>

      <form onSubmit={handleSubmit} style={styles.form}>
        {activeTab === 'register' && (
          <input
            type="text"
            placeholder="Imię i nazwisko"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            style={styles.input}
          />
        )}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={styles.input}
        />
        <input
          type="password"
          placeholder="Hasło"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={styles.input}
        />
        {activeTab === 'register' && (
          <input
            type="password"
            placeholder="Powtórz hasło"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            style={styles.input}
          />
        )}
        <button type="submit" style={styles.submit}>
          {activeTab === 'login' ? 'Zaloguj się' : 'Zarejestruj się'}
        </button>
      </form>
{activeTab === 'login' && (
  <p style={{ textAlign: 'center', marginTop: '1rem' }}>
    <a
      href="#"
      onClick={async () => {
        if (!email) {
          showDialog('🔑 Podaj e-mail, aby zresetować hasło.');
          return;
        }
        const auth = getAuth(app);
        try {
          await sendPasswordResetEmail(auth, email);
          showDialog(`📨 Link resetujący został wysłany na adres: ${email}`);
        } catch (error: any) {
          showDialog(`❌ Błąd przy resetowaniu hasła: ${error.message}`);
        }
      }}
      style={{ color: '#0D1F40', textDecoration: 'underline' }}
    >
      Zapomniałeś hasła?
    </a>
  </p>
)}

      <p style={styles.roleLabel}>
        Wybrana rola: <strong>{role === 'specjalista' ? 'Specjalista' : 'Właściciel konia'}</strong>
      </p>

      </div>
  );
}
