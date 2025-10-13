'use client';

import { useState } from 'react';
import { getAuth, updatePassword } from 'firebase/auth';

export default function ChangePasswordForm() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Hasła nie są takie same.');
      return;
    }

    const auth = getAuth();
    const user = auth.currentUser;

    if (user) {
      try {
        await updatePassword(user, newPassword);
        setMessage('Hasło zostało zmienione.');
        setNewPassword('');
        setConfirmPassword('');
      } catch (err: any) {
        if (err.code === 'auth/requires-recent-login') {
          setError('Zaloguj się ponownie, aby zmienić hasło.');
        } else {
          setError('Błąd: ' + err.message);
        }
      }
    } else {
      setError('Nie jesteś zalogowany.');
    }
  };

  return (
    <form onSubmit={handleChangePassword} style={{ maxWidth: '400px' }}>
      <h3>Zmień hasło</h3>

      <input
        type="password"
        placeholder="Nowe hasło"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        required
      />

      <input
        type="password"
        placeholder="Potwierdź nowe hasło"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        required
      />

      <button type="submit">Zapisz nowe hasło</button>

      {message && <p style={{ color: 'green' }}>{message}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </form>
  );
}
