
import React, { useState } from 'react';
import { supabase } from './supabase';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    setLoading(false);

    if (error) {
      setMessage(error.message);
    } else {
      setMessage('Login successful! Admin authentication is working.');
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#101820',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      fontFamily: 'Arial',
      color: 'white',
      padding: '20px'
    }}>
      <form onSubmit={handleLogin} style={{
        width: '100%',
        maxWidth: '380px',
        background: '#1c2933',
        padding: '30px',
        borderRadius: '12px'
      }}>
        <h1>The Daily Brief</h1>
        <h3>Admin Login</h3>

        <input
          type="email"
          placeholder="Admin Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          style={inputStyle}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          style={inputStyle}
        />

        <button type="submit" disabled={loading} style={{
          width: '100%',
          padding: '14px',
          background: '#c49a6c',
          border: 'none',
          borderRadius: '6px',
          fontWeight: 'bold'
        }}>
          {loading ? 'Please wait...' : 'Login'}
        </button>

        <p>{message}</p>
      </form>
    </div>
  );
}

const inputStyle = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '13px',
  marginBottom: '15px',
  borderRadius: '6px',
  border: '1px solid #52616b'
};
