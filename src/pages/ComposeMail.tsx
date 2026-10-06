import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { Send, ArrowLeft, Eye, Edit3, Sparkles, Monitor, Smartphone, RefreshCw, CheckCircle2 } from 'lucide-react';
import useSWR from 'swr';
import api from '../lib/api';
import { toast } from 'sonner';

export const ComposeMail: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedParam = searchParams.get('selected');
  const initialSelectedIds = selectedParam ? selectedParam.split(',').filter(Boolean) : [];

  const [sending, setSending] = useState(false);
  const [targetOption, setTargetOption] = useState<'all' | 'selected'>(
    initialSelectedIds.length > 0 ? 'selected' : 'all'
  );
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');

  const [subject, setSubject] = useState('Thoughtful Celebrations & Gift Drops | Mora Moments');
  const [content, setContent] = useState(
`<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fffdfa; border: 1px solid #e7cfc4; padding: 32px; border-radius: 12px; color: #321e22;">
  <div style="text-align: center; margin-bottom: 24px;">
    <h1 style="color: #674a4f; font-family: Georgia, serif; font-size: 28px; margin: 0; letter-spacing: -0.5px;">Mora Moments</h1>
    <p style="color: #8c6d71; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; margin-top: 6px;">Artisanal Gift Studio</p>
  </div>
  <hr style="border: 0; border-top: 1px solid #e7cfc4; margin: 24px 0;" />
  <h2 style="color: #321e22; font-size: 20px; font-weight: normal; margin-top: 0;">Dear Gifting Enthusiast,</h2>
  <p style="color: #4a3b3d; line-height: 1.6; font-size: 15px;">
    We are delighted to share our latest curated gift hampers, handcrafted surprise boxes, and personalized keepsakes designed to bring joy to every celebration.
  </p>
  <div style="text-align: center; margin: 32px 0;">
    <a href="https://moramoments.in/shop" style="background-color: #674a4f; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: bold; font-size: 14px; display: inline-block; letter-spacing: 0.5px;">
      Explore New Gift Drops &rarr;
    </a>
  </div>
  <p style="color: #6b5558; font-size: 13px; line-height: 1.6; border-top: 1px border-line; pt: 16px;">
    Warmest regards,<br/>
    <strong style="color: #674a4f;">The Mora Moments Team</strong>
  </p>
</div>`
  );

  const { data } = useSWR('/subscribers', (url) => api.get(url).then((res) => res.data));
  const subscribers = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];

  const handleApplyTemplate = (templateType: string) => {
    if (templateType === 'discount') {
      setSubject('✨ Special Offer: Enjoy Exclusive Savings on Luxury Hampers | Mora Moments');
      setContent(
`<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fffdfa; border: 1px solid #e7cfc4; padding: 32px; border-radius: 12px; color: #321e22;">
  <div style="text-align: center; margin-bottom: 24px;">
    <span style="background-color: #674a4f; color: #ffffff; font-size: 11px; font-weight: bold; padding: 4px 12px; border-radius: 20px; text-transform: uppercase; letter-spacing: 1.5px;">VIP Exclusive</span>
    <h1 style="color: #674a4f; font-family: Georgia, serif; font-size: 28px; margin: 12px 0 0 0;">Mora Moments</h1>
  </div>
  <hr style="border: 0; border-top: 1px solid #e7cfc4; margin: 24px 0;" />
  <h2 style="color: #321e22; font-size: 22px; margin-top: 0;">Special Offer Inside! 🎁</h2>
  <p style="color: #4a3b3d; line-height: 1.6; font-size: 15px;">
    As a valued subscriber of Mora Moments, we are offering you an exclusive celebratory reward on your next order.
  </p>
  <div style="background-color: #f7eee6; border: 1px dashed #674a4f; border-radius: 8px; padding: 20px; text-align: center; margin: 24px 0;">
    <p style="margin: 0; font-size: 12px; color: #674a4f; uppercase; letter-spacing: 1px;">Use Code At Checkout</p>
    <p style="margin: 6px 0 0 0; font-size: 24px; font-weight: bold; color: #674a4f; letter-spacing: 2px;">MORA15</p>
  </div>
  <div style="text-align: center; margin: 28px 0;">
    <a href="https://moramoments.in/shop" style="background-color: #674a4f; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: bold; font-size: 14px; display: inline-block;">
      Claim Your Offer &rarr;
    </a>
  </div>
</div>`
      );
    } else if (templateType === 'festival') {
      setSubject('🎉 Festive Celebration Hampers Now Unveiled | Mora Moments');
      setContent(
`<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fffdfa; border: 1px solid #e7cfc4; padding: 32px; border-radius: 12px; color: #321e22;">
  <div style="text-align: center; margin-bottom: 24px;">
    <h1 style="color: #674a4f; font-family: Georgia, serif; font-size: 28px; margin: 0;">Festive Moments</h1>
    <p style="color: #8c6d71; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; margin-top: 6px;">Handcrafted With Love</p>
  </div>
  <p style="color: #4a3b3d; line-height: 1.6; font-size: 15px;">
    Celebrate the beauty of togetherness with our handcrafted festive gift sets. Designed with premium artisanal treats and keepsakes.
  </p>
  <div style="text-align: center; margin: 28px 0;">
    <a href="https://moramoments.in/shop" style="background-color: #674a4f; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: bold; font-size: 14px; display: inline-block;">
      Shop Festive Hampers
    </a>
  </div>
</div>`
      );
    }
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
      .filter((s: any) => initialSelectedIds.includes(s.id))
      .map((s: any) => s.email);

    if (targetOption === 'selected' && selectedEmails.length === 0) {
      toast.error('Please select subscriber recipients or send to all.');
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
      toast.success(res.data?.message || 'Mail broadcast successfully enqueued to Resend queue!');
      setTimeout(() => {
        navigate('/subscribers');
      }, 1200);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to enqueue mail broadcast.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fade-in" style={{ paddingBottom: '3rem' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <Link to="/subscribers" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-accent)', fontSize: '0.875rem', fontWeight: 600, textDecoration: 'none', marginBottom: '0.5rem' }}>
            <ArrowLeft size={16} /> Back to Subscribers
          </Link>
          <h1 style={{ fontSize: '2rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            Compose Resend Mail Broadcast
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Craft newsletter campaigns and enqueue background dispatch via Resend queue.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            type="button"
            onClick={handleSendMailBroadcast}
            disabled={sending}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.75rem 1.75rem', borderRadius: '8px',
              background: 'var(--primary-accent)', color: '#ffffff',
              border: 'none', cursor: sending ? 'not-allowed' : 'pointer', fontWeight: 600,
              boxShadow: '0 4px 14px rgba(103, 74, 79, 0.3)', opacity: sending ? 0.7 : 1
            }}
          >
            {sending ? <RefreshCw size={18} className="animate-spin" /> : <Send size={18} />}
            <span>{sending ? 'Queueing Broadcast...' : 'Enqueue & Send via Resend'}</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSendMailBroadcast} style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
        {/* Card 1: Configuration & Preset Templates */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={18} color="var(--primary-accent)" /> Campaign Setup
            </h3>

            {/* Quick Templates */}
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Preset Templates:</span>
              <button
                type="button"
                onClick={() => handleApplyTemplate('discount')}
                style={{ padding: '0.35rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', fontSize: '0.75rem', cursor: 'pointer' }}
              >
                🎁 Special Offer
              </button>
              <button
                type="button"
                onClick={() => handleApplyTemplate('festival')}
                style={{ padding: '0.35rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', fontSize: '0.75rem', cursor: 'pointer' }}
              >
                🎉 Festive Launch
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            {/* Target Selection */}
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                Target Recipients:
              </label>
              <div style={{ display: 'flex', gap: '1.25rem', background: 'var(--bg-color)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                  <input
                    type="radio"
                    name="targetOption"
                    checked={targetOption === 'all'}
                    onChange={() => setTargetOption('all')}
                  />
                  <span>All Active Subscribers ({subscribers.length})</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                  <input
                    type="radio"
                    name="targetOption"
                    checked={targetOption === 'selected'}
                    onChange={() => setTargetOption('selected')}
                  />
                  <span>Selected Subscribers ({initialSelectedIds.length})</span>
                </label>
              </div>
            </div>

            {/* Sender Address Info */}
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                Sender Address:
              </label>
              <div style={{ background: 'var(--bg-color)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={16} color="var(--success-accent)" />
                <span>Mora Moments Studio &lt;onboarding@resend.dev&gt;</span>
              </div>
            </div>
          </div>

          {/* Subject Line */}
          <div style={{ marginTop: '1.25rem' }}>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
              Email Subject Line:
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Exclusive Offer | Mora Moments Luxury Hampers"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              style={{
                width: '100%', padding: '0.75rem 1rem', borderRadius: '8px',
                border: '1px solid var(--border-color)', background: 'var(--bg-color)',
                outline: 'none', fontSize: '0.95rem', color: 'var(--text-primary)',
                boxSizing: 'border-box'
              }}
            />
          </div>
        </div>

        {/* Card 2: Editor & Live Responsive Preview */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setActiveTab('edit')}
                style={{
                  padding: '0.6rem 1.25rem', borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: activeTab === 'edit' ? 'var(--primary-accent)' : 'var(--bg-color)',
                  color: activeTab === 'edit' ? '#ffffff' : 'var(--text-primary)',
                  fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '0.4rem'
                }}
              >
                <Edit3 size={16} /> Edit HTML Content
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                style={{
                  padding: '0.6rem 1.25rem', borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: activeTab === 'preview' ? 'var(--primary-accent)' : 'var(--bg-color)',
                  color: activeTab === 'preview' ? '#ffffff' : 'var(--text-primary)',
                  fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '0.4rem'
                }}
              >
                <Eye size={16} /> Live Preview
              </button>
            </div>

            {activeTab === 'preview' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-color)', padding: '0.25rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <button
                  type="button"
                  onClick={() => setPreviewDevice('desktop')}
                  style={{
                    padding: '0.35rem 0.75rem', borderRadius: '6px', border: 'none',
                    background: previewDevice === 'desktop' ? 'var(--surface-color)' : 'transparent',
                    color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', fontWeight: 600
                  }}
                >
                  <Monitor size={14} /> Desktop
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice('mobile')}
                  style={{
                    padding: '0.35rem 0.75rem', borderRadius: '6px', border: 'none',
                    background: previewDevice === 'mobile' ? 'var(--surface-color)' : 'transparent',
                    color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', fontWeight: 600
                  }}
                >
                  <Smartphone size={14} /> Mobile
                </button>
              </div>
            )}
          </div>

          {activeTab === 'edit' ? (
            <div>
              <textarea
                rows={18}
                required
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Enter email HTML body content..."
                style={{
                  width: '100%', padding: '1.25rem', borderRadius: '10px',
                  border: '1px solid var(--border-color)', background: 'var(--bg-color)',
                  fontFamily: 'Consolas, Monaco, "Courier New", monospace', fontSize: '0.875rem',
                  lineHeight: '1.5', outline: 'none', color: 'var(--text-primary)',
                  boxSizing: 'border-box', resize: 'vertical'
                }}
              />
            </div>
          ) : (
            <div
              style={{
                display: 'flex', justifyContent: 'center', background: '#e2e8f0',
                padding: '2rem 1rem', borderRadius: '10px', minHeight: '500px'
              }}
            >
              <div
                style={{
                  width: previewDevice === 'mobile' ? '375px' : '100%',
                  maxWidth: previewDevice === 'mobile' ? '375px' : '650px',
                  background: '#ffffff', borderRadius: '12px',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.1)', overflow: 'hidden',
                  transition: 'all 0.3s ease-in-out'
                }}
              >
                {/* Simulated email header bar */}
                <div style={{ background: '#f8fafc', padding: '0.75rem 1rem', borderBottom: '1px solid #e2e8f0', fontSize: '0.75rem', color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Subject: <strong>{subject}</strong></span>
                  <span>Inbox Preview</span>
                </div>

                <div
                  style={{ padding: '1.5rem', background: '#ffffff' }}
                  dangerouslySetInnerHTML={{ __html: content }}
                />
              </div>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};
