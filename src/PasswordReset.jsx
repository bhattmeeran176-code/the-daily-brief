
import React, { useState } from 'react';
import { supabase } from './supabase';

export default function PasswordReset() {
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleReset(e) {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const { error } = await supabase.auth.updateUser({
      password
    });

    setLoading(false);

    if (error) {
      setMessage(error.message);
    } else {
      setMessage('Password updated successfully! You can now login.');
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#101820',
      color: 'white',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      fontFamily: 'Arial',
      padding: '20px'
    }}>
      <form onSubmit={handleReset} style={{
        background: '#1c2933',
        padding: '30px',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '380px'
      }}>
        <h2>The Daily Brief</h2>
        <h3>Reset Password</h3>
        <input
          type="password"
          placeholder="Enter new password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          minLength={6}
          required
          style={{
            width: '100%',
            boxSizing: 'border-box',
            padding: '14px',
            marginBottom: '15px'
          }}
        />
        <button type="submit" disabled={loading} style={{
          width: '100%',
          padding: '14px',
          background: '#c49a6c',
          border: 'none',
          borderRadius: '6px'
        }}>
          {loading ? 'Updating...' : 'Update Password'}
        </button>
        <p>{message}</p>
      </form>
    </div>
  );
}
