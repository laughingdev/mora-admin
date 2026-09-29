import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import api from '../lib/api';
import { Lock, Mail } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/admin/login', {
        email,
        password
      });

      if (res.data.success) {
        localStorage.setItem('adminToken', res.data.data.tokens.accessToken);
        navigate('/');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to login. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-color)'
    }}>
      <div className="glass-panel fade-in" style={{
        padding: '3rem 2.5rem',
        width: '100%',
        maxWidth: '440px',
        textAlign: 'center'
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' }}>
          <img src="/mora-logo.png" alt="Mora Moments" style={{ height: '50px', objectFit: 'contain' }} />
        </div>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem' }}>Enter your credentials to access the portal</p>

        {error && (
          <div style={{
            background: 'var(--danger-accent)',
            color: 'white',
            padding: '0.75rem',
            borderRadius: '8px',
            marginBottom: '1.5rem',
            fontSize: '0.875rem'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ position: 'relative' }}>
            <Mail size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input 
              type="email" 
              placeholder="Email Address" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '1rem 1rem 1rem 3rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-color)',
                color: 'var(--text-primary)',
                outline: 'none',
                fontFamily: 'var(--font-sans)',
                fontSize: '0.95rem'
              }}
            />
          </div>

          <div style={{ position: 'relative' }}>
            <Lock size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input 
              type="password" 
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '1rem 1rem 1rem 3rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-color)',
                color: 'var(--text-primary)',
                outline: 'none',
                fontFamily: 'var(--font-sans)',
                fontSize: '0.95rem'
              }}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{
              marginTop: '1rem',
              padding: '1rem',
              borderRadius: '8px',
              border: 'none',
              background: 'var(--primary-accent)',
              color: 'var(--bg-color)',
              fontWeight: 600,
              fontSize: '1rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s',
              fontFamily: 'var(--font-sans)'
            }}
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};