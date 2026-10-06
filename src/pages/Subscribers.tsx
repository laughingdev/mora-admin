import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { Mail, Send, RefreshCw, Trash2, CheckSquare, Square, Sparkles } from 'lucide-react';
import useSWR from 'swr';
import api from '../lib/api';
import { Loader } from '../components/Loader';
import { toast } from 'sonner';

export const Subscribers: React.FC = () => {
  const navigate = useNavigate();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const { data, error, mutate, isLoading } = useSWR('/subscribers', (url) =>
    api.get(url).then((res) => res.data)
  );

  const subscribers = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];

  const filteredSubscribers = subscribers.filter((s: any) =>
    s.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredSubscribers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredSubscribers.map((s: any) => s.id));
    }
  };

  const handleDelete = async (id: string, email: string) => {
    if (!window.confirm(`Are you sure you want to remove subscriber ${email}?`)) return;
    try {
      await api.delete(`/subscribers/${id}`);
      toast.success(`Subscriber ${email} removed.`);
      mutate();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to remove subscriber');
    }
  };

  const handleOpenCompose = (preselectSelected: boolean = false) => {
    if (preselectSelected && selectedIds.length > 0) {
      navigate(`/subscribers/compose?selected=${selectedIds.join(',')}`);
    } else {
      navigate('/subscribers/compose');
    }
  };

  return (
    <div className="fade-in">
      {/* Top Bar Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Mail size={28} color="var(--primary-accent)" />
            Subscribers & Resend Mail Queue
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Manage newsletter subscribers and send bulk emails via Resend with BullMQ background queue processing.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => mutate()}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.75rem 1.25rem', borderRadius: '8px',
              background: 'var(--surface-color)', color: 'var(--primary-accent)',
              border: '1px solid var(--border-color)', cursor: 'pointer', fontWeight: 600
            }}
          >
            <RefreshCw size={18} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => handleOpenCompose(false)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.75rem 1.5rem', borderRadius: '8px',
              background: 'var(--primary-accent)', color: '#ffffff',
              border: 'none', cursor: 'pointer', fontWeight: 600, boxShadow: '0 4px 12px rgba(103, 74, 79, 0.25)'
            }}
          >
            <Send size={18} />
            <span>Compose Mail Broadcast</span>
          </button>
        </div>
      </div>

      {/* Main Panel */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        {/* Search & Actions Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ position: 'relative', width: '300px' }}>
            <input
              type="text"
              placeholder="Search subscriber email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%', padding: '0.6rem 1rem 0.6rem 2.5rem', borderRadius: '8px',
                border: '1px solid var(--border-color)', background: 'var(--bg-color)',
                outline: 'none', color: 'var(--text-primary)', fontSize: '0.875rem'
              }}
            />
            <Mail size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          </div>

          {selectedIds.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'var(--surface-color)', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--primary-accent)' }}>
                {selectedIds.length} subscriber(s) selected
              </span>
              <button
                onClick={() => handleOpenCompose(true)}
                style={{
                  background: 'var(--primary-accent)', color: 'white', border: 'none',
                  padding: '0.4rem 0.85rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem',
                  display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600
                }}
              >
                <Send size={14} /> Send Mail to Selected
              </button>
            </div>
          )}
        </div>

        {error && (
          <div style={{ color: 'var(--danger-accent)', marginBottom: '1rem', padding: '1rem', background: '#fff5f5', borderRadius: '8px' }}>
            {error?.response?.data?.message || 'Failed to load subscribers.'}
          </div>
        )}

        {isLoading ? (
          <Loader />
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>
                    <button
                      onClick={toggleSelectAll}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--text-secondary)' }}
                    >
                      {selectedIds.length > 0 && selectedIds.length === filteredSubscribers.length ? (
                        <CheckSquare size={18} color="var(--primary-accent)" />
                      ) : (
                        <Square size={18} />
                      )}
                    </button>
                  </th>
                  <th>Subscriber Email</th>
                  <th>Status</th>
                  <th>Subscribed Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubscribers.map((subscriber: any) => {
                  const isSelected = selectedIds.includes(subscriber.id);
                  return (
                    <tr key={subscriber.id} style={{ background: isSelected ? 'rgba(103, 74, 79, 0.05)' : undefined }}>
                      <td>
                        <button
                          onClick={() => toggleSelect(subscriber.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--text-secondary)' }}
                        >
                          {isSelected ? <CheckSquare size={18} color="var(--primary-accent)" /> : <Square size={18} />}
                        </button>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--surface-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-accent)', fontWeight: 'bold', fontSize: '0.8rem' }}>
                            {subscriber.email?.charAt(0).toUpperCase() || 'M'}
                          </div>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{subscriber.email}</span>
                        </div>
                      </td>
                      <td>
                        <span className="badge" style={{ background: '#e6fffa', color: '#234e52', border: '1px solid #b2f5ea', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Sparkles size={12} /> Active Subscriber
                        </span>
                      </td>
                      <td>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                          {subscriber.createdAt ? new Date(subscriber.createdAt).toLocaleDateString() : 'N/A'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          onClick={() => handleDelete(subscriber.id, subscriber.email)}
                          style={{ background: 'none', border: 'none', color: 'var(--danger-accent)', cursor: 'pointer', padding: '0.5rem', borderRadius: '6px' }}
                          title="Delete Subscriber"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {filteredSubscribers.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                      No subscribers found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

