import React, { useState } from 'react';
import { Mail, Send, RefreshCw, Trash2, CheckSquare, Square, Eye, Edit3, X, Sparkles } from 'lucide-react';
import useSWR from 'swr';
import api from '../lib/api';
import { Loader } from '../components/Loader';
import { toast } from 'sonner';

export const Subscribers: React.FC = () => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sending, setSending] = useState(false);

  // Email form state
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [targetOption, setTargetOption] = useState<'all' | 'selected'>('all');
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');

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

  const handleOpenComposeModal = (preselectSelected: boolean = false) => {
    if (preselectSelected && selectedIds.length > 0) {
      setTargetOption('selected');
    } else {
      setTargetOption('all');
    }
    if (!subject) setSubject('Thoughtful Celebrations & Gift Drops | Mora Moments');
    if (!content) {
      setContent(
`<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fffdfa; border: 1px solid #e7cfc4; padding: 30px; border-radius: 12px;">
  <div style="text-align: center; margin-bottom: 24px;">
    <h1 style="color: #674a4f; font-family: Georgia, serif; font-size: 28px; margin: 0;">Mora Moments</h1>
    <p style="color: #8c6d71; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; margin-top: 4px;">Artisanal Gift Studio</p>
  </div>
  <hr style="border: 0; border-top: 1px solid #e7cfc4; margin: 20px 0;" />
  <h2 style="color: #321e22; font-size: 20px;">Dear Gifting Enthusiast,</h2>
  <p style="color: #4a3b3d; line-height: 1.6; font-size: 15px;">
    We are thrilled to share our latest curated hampers and handcrafted surprise collections designed to bring warmth and delight to every celebration.
  </p>
  <div style="text-align: center; margin: 30px 0;">
    <a href="https://moramoments.in/shop" style="background-color: #674a4f; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-weight: bold; font-size: 14px; display: inline-block;">
      Explore New Gift Drops
    </a>
  </div>
  <p style="color: #6b5558; font-size: 13px; line-height: 1.5;">
    Warmest regards,<br/>
    <strong>The Mora Moments Team</strong>
  </p>
</div>`
      );
    }
    setIsModalOpen(true);
  };

  const handleSendMailBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) {
      toast.error('Please enter an email subject.');
      return;
    }
    if (!content.trim()) {
      toast.error('Please enter email content.');
      return;
    }

    const selectedEmails = subscribers
      .filter((s: any) => selectedIds.includes(s.id))
      .map((s: any) => s.email);

    if (targetOption === 'selected' && selectedEmails.length === 0) {
      toast.error('Please select at least one subscriber recipient.');
      return;
    }

    setSending(true);
    try {
      const payload = {
        subject: subject.trim(),
        content: content.trim(),
        sendToAll: targetOption === 'all',
        recipientEmails: targetOption === 'selected' ? selectedEmails : undefined,
      };

      const res = await api.post('/subscribers/send-email', payload);
      toast.success(res.data?.message || 'Mail sending enqueued successfully via Resend queue!');
      setIsModalOpen(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to enqueue mail sending campaign.');
    } finally {
      setSending(false);
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
            onClick={() => handleOpenComposeModal(false)}
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
                onClick={() => handleOpenComposeModal(true)}
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

      {/* Resend Email Campaign Compose Modal */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
            backdropFilter: 'blur(4px)', padding: '1rem'
          }}
        >
          <div
            style={{
              background: 'var(--bg-color)', width: '100%', maxWidth: '750px',
              borderRadius: '16px', border: '1px solid var(--border-color)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)', overflow: 'hidden',
              display: 'flex', flexDirection: 'column', maxHeight: '90vh'
            }}
          >
            {/* Modal Header */}
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Send size={20} color="var(--primary-accent)" />
                <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Compose Resend Mail Broadcast</h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
              >
                <X size={22} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSendMailBroadcast} style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto', padding: '1.5rem', gap: '1.25rem' }}>
              {/* Target Selection */}
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                  Recipients Target:
                </label>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem' }}>
                    <input
                      type="radio"
                      name="targetOption"
                      checked={targetOption === 'all'}
                      onChange={() => setTargetOption('all')}
                    />
                    <span>All Subscribers ({subscribers.length})</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem' }}>
                    <input
                      type="radio"
                      name="targetOption"
                      checked={targetOption === 'selected'}
                      onChange={() => setTargetOption('selected')}
                    />
                    <span>Selected Subscribers Only ({selectedIds.length})</span>
                  </label>
                </div>
              </div>

              {/* Subject */}
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.35rem' }}>
                  Email Subject Line:
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Exclusive Offer | Mora Moments Luxury Hampers"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  style={{
                    width: '100%', padding: '0.65rem 1rem', borderRadius: '8px',
                    border: '1px solid var(--border-color)', background: 'var(--surface-color)',
                    outline: 'none', fontSize: '0.9rem', color: 'var(--text-primary)'
                  }}
                />
              </div>

              {/* Tabs for Edit / Preview */}
              <div>
                <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', marginBottom: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => setActiveTab('edit')}
                    style={{
                      padding: '0.5rem 1rem', background: 'none', border: 'none',
                      borderBottom: activeTab === 'edit' ? '2px solid var(--primary-accent)' : '2px solid transparent',
                      fontWeight: activeTab === 'edit' ? 600 : 400,
                      color: activeTab === 'edit' ? 'var(--primary-accent)' : 'var(--text-secondary)',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem'
                    }}
                  >
                    <Edit3 size={16} /> Edit HTML / Body
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('preview')}
                    style={{
                      padding: '0.5rem 1rem', background: 'none', border: 'none',
                      borderBottom: activeTab === 'preview' ? '2px solid var(--primary-accent)' : '2px solid transparent',
                      fontWeight: activeTab === 'preview' ? 600 : 400,
                      color: activeTab === 'preview' ? 'var(--primary-accent)' : 'var(--text-secondary)',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem'
                    }}
                  >
                    <Eye size={16} /> Live Preview
                  </button>
                </div>

                {activeTab === 'edit' ? (
                  <textarea
                    rows={12}
                    required
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Enter email HTML body content..."
                    style={{
                      width: '100%', padding: '1rem', borderRadius: '8px',
                      border: '1px solid var(--border-color)', background: 'var(--surface-color)',
                      fontFamily: 'monospace', fontSize: '0.85rem', outline: 'none',
                      color: 'var(--text-primary)', resize: 'vertical'
                    }}
                  />
                ) : (
                  <div
                    style={{
                      border: '1px solid var(--border-color)', borderRadius: '8px',
                      padding: '1rem', minHeight: '250px', maxHeight: '350px',
                      overflowY: 'auto', background: '#ffffff'
                    }}
                    dangerouslySetInnerHTML={{ __html: content }}
                  />
                )}
              </div>

              {/* Modal Footer / Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={sending}
                  style={{
                    padding: '0.65rem 1.25rem', borderRadius: '8px',
                    border: '1px solid var(--border-color)', background: 'var(--surface-color)',
                    cursor: 'pointer', fontWeight: 500
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={sending}
                  style={{
                    padding: '0.65rem 1.5rem', borderRadius: '8px',
                    border: 'none', background: 'var(--primary-accent)', color: '#ffffff',
                    cursor: sending ? 'not-allowed' : 'pointer', fontWeight: 600,
                    display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: sending ? 0.7 : 1
                  }}
                >
                  <Send size={18} />
                  <span>{sending ? 'Queueing in Resend...' : 'Enqueue & Send via Resend'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
