import { Loader } from '../components/Loader';
import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, CheckCircle, XCircle, Ticket, Calendar, Percent, IndianRupee, X, LayoutList, LayoutGrid } from 'lucide-react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import api from '../lib/api';
import useSWR from 'swr';

export const Coupons: React.FC = () => {
  const { data: coupons = [], error, mutate, isLoading: loading } = useSWR('/coupons', url => api.get(url).then(res => res.data.data));

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<any>(null);
  const [view, setView] = useState<'list' | 'card'>(window.innerWidth < 768 ? 'card' : 'list');

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) setView('card');
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [formData, setFormData] = useState({
    code: '',
    type: 'PERCENTAGE',
    value: 0,
    minimumOrder: 0,
    maximumDiscount: 0,
    usageLimit: 100,
    startsAt: new Date().toISOString().slice(0, 16),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    active: true
  });



  const handleOpenModal = (coupon?: any) => {
    if (coupon) {
      setEditingCoupon(coupon);
      setFormData({
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        minimumOrder: coupon.minimumOrder || 0,
        maximumDiscount: coupon.maximumDiscount || 0,
        usageLimit: coupon.usageLimit || 0,
        startsAt: new Date(coupon.startsAt).toISOString().slice(0, 16),
        expiresAt: new Date(coupon.expiresAt).toISOString().slice(0, 16),
        active: coupon.active
      });
    } else {
      setEditingCoupon(null);
      setFormData({
        code: '',
        type: 'PERCENTAGE',
        value: 0,
        minimumOrder: 0,
        maximumDiscount: 0,
        usageLimit: 100,
        startsAt: new Date().toISOString().slice(0, 16),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
        active: true
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        value: Number(formData.value),
        minimumOrder: Number(formData.minimumOrder),
        maximumDiscount: Number(formData.maximumDiscount) || null,
        usageLimit: Number(formData.usageLimit) || null,
        startsAt: new Date(formData.startsAt).toISOString(),
        expiresAt: new Date(formData.expiresAt).toISOString(),
      };

      setIsModalOpen(false);
      
      const toastId = toast.loading(editingCoupon ? 'Updating coupon...' : 'Creating coupon...');
      
      if (editingCoupon) {
        const res = await api.patch(`/coupons/${editingCoupon.id}`, payload);
        mutate(coupons.map((c: any) => c.id === editingCoupon.id ? res.data.data : c), false);
        toast.success('Coupon updated successfully', { id: toastId });
      } else {
        const res = await api.post('/coupons', payload);
        mutate([res.data.data, ...coupons], false);
        toast.success('Coupon created successfully', { id: toastId });
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save coupon');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this coupon?')) return;
    const toastId = toast.loading('Deleting coupon...');
    try {
      await api.delete(`/coupons/${id}`);
      mutate(coupons.filter((c: any) => c.id !== id), false);
      toast.success('Coupon deleted successfully', { id: toastId });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete coupon', { id: toastId });
    }
  };

  const toggleStatus = async (coupon: any) => {
    // Optimistic update
    mutate(coupons.map((c: any) => c.id === coupon.id ? { ...c, active: !coupon.active } : c), false);
    
    try {
      await api.patch(`/coupons/${coupon.id}`, { active: !coupon.active });
      toast.success(`Coupon ${coupon.active ? 'deactivated' : 'activated'} successfully`);
    } catch (err: any) {
      // Revert on failure
      mutate(coupons.map((c: any) => c.id === coupon.id ? { ...c, active: coupon.active } : c), false);
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ fontSize: '2rem' }}>Coupons & Discounts</h1>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className="desktop-only" style={{ display: 'flex', background: 'var(--surface-color)', borderRadius: '8px', padding: '0.25rem' }}>
            <button onClick={() => setView('list')} style={{ background: view === 'list' ? 'var(--bg-color)' : 'transparent', border: 'none', padding: '0.5rem', borderRadius: '6px', cursor: 'pointer', color: view === 'list' ? 'var(--primary-accent)' : 'var(--text-secondary)', transition: 'all 0.2s' }}>
              <LayoutList size={20} />
            </button>
            <button onClick={() => setView('card')} style={{ background: view === 'card' ? 'var(--bg-color)' : 'transparent', border: 'none', padding: '0.5rem', borderRadius: '6px', cursor: 'pointer', color: view === 'card' ? 'var(--primary-accent)' : 'var(--text-secondary)', transition: 'all 0.2s' }}>
              <LayoutGrid size={20} />
            </button>
          </div>

          <button 
            onClick={() => handleOpenModal()}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.75rem 1.5rem', borderRadius: '8px',
              background: 'var(--primary-accent)', color: 'var(--bg-color)',
              border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '1rem'
          }}>
            <Plus size={20} />
            <span className="desktop-only">Create Coupon</span>
          </button>
        </div>
      </div>

      {error && <div style={{ color: 'var(--danger-accent)', marginBottom: '1rem' }}>{error}</div>}

      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        {loading ? (
          <Loader />
        ) : (
          <>
            {view === 'list' ? (
              <div className="table-container desktop-only">
                <table>
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Discount</th>
                      <th>Usage</th>
                      <th>Valid Until</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coupons.map((coupon: any) => (
                      <tr key={coupon.id}>
                        <td>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem 0.75rem', background: 'var(--surface-color)', borderRadius: '6px', fontWeight: 700, fontFamily: 'monospace', color: 'var(--primary-accent)', border: '1px dashed var(--primary-accent)' }}>
                            <Ticket size={16} />
                            {coupon.code}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>
                            {coupon.type === 'PERCENTAGE' ? `${coupon.value}% OFF` : `₹${coupon.value} OFF`}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            Min Order: ₹{coupon.minimumOrder}
                            {coupon.type === 'PERCENTAGE' && coupon.maximumDiscount ? ` • Max ₹${coupon.maximumDiscount}` : ''}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{coupon.usedCount}</div>
                          {coupon.usageLimit && <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>out of {coupon.usageLimit}</div>}
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Calendar size={14} color="var(--text-secondary)" />
                            {new Date(coupon.expiresAt).toLocaleDateString()}
                          </div>
                          {new Date(coupon.expiresAt) < new Date() && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--danger-accent)' }}>Expired</span>
                          )}
                        </td>
                        <td>
                          <button 
                            onClick={() => toggleStatus(coupon)}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'transparent', border: 'none', cursor: 'pointer', color: coupon.active ? 'var(--success-accent)' : 'var(--text-secondary)', fontSize: '0.875rem' }}
                          >
                            {coupon.active ? <CheckCircle size={16} /> : <XCircle size={16} />} 
                            {coupon.active ? 'Active' : 'Inactive'}
                          </button>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            <button 
                              onClick={() => handleOpenModal(coupon)}
                              style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }} 
                              title="Edit"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button 
                              onClick={() => handleDelete(coupon.id)}
                              style={{ background: 'transparent', border: 'none', color: 'var(--danger-accent)', cursor: 'pointer' }} 
                              title="Delete"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {coupons.length === 0 && (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                          No coupons found. Create your first promo code!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                {coupons.map((coupon: any) => (
                  <div key={coupon.id} style={{ border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.5rem', background: 'var(--bg-color)', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem 0.75rem', background: 'var(--surface-color)', borderRadius: '6px', fontWeight: 700, fontFamily: 'monospace', color: 'var(--primary-accent)', border: '1px dashed var(--primary-accent)' }}>
                        <Ticket size={16} />
                        {coupon.code}
                      </div>
                      <button 
                        onClick={() => toggleStatus(coupon)}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'transparent', border: 'none', cursor: 'pointer', color: coupon.active ? 'var(--success-accent)' : 'var(--text-secondary)', fontSize: '0.875rem' }}
                      >
                        {coupon.active ? <CheckCircle size={16} /> : <XCircle size={16} />} 
                      </button>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                      <div style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--primary-accent)' }}>
                        {coupon.type === 'PERCENTAGE' ? `${coupon.value}% OFF` : `₹${coupon.value} OFF`}
                      </div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        Min Order: ₹{coupon.minimumOrder}
                        {coupon.type === 'PERCENTAGE' && coupon.maximumDiscount ? ` • Max ₹${coupon.maximumDiscount}` : ''}
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
                      <div>Used: {coupon.usedCount} {coupon.usageLimit ? `/ ${coupon.usageLimit}` : ''}</div>
                      <div>
                        {new Date(coupon.expiresAt) < new Date() ? (
                           <span style={{ color: 'var(--danger-accent)' }}>Expired</span>
                        ) : (
                           `Expires: ${new Date(coupon.expiresAt).toLocaleDateString()}`
                        )}
                      </div>
                    </div>

                    <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                      <button 
                        onClick={() => handleOpenModal(coupon)}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0.5rem 1rem', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600 }}
                      >
                        <Edit2 size={16} /> Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(coupon.id)}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0.5rem 1rem', color: 'var(--danger-accent)', cursor: 'pointer', fontWeight: 600 }}
                      >
                        <Trash2 size={16} /> Delete
                      </button>
                    </div>
                  </div>
                ))}
                {coupons.length === 0 && (
                  <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                    No coupons found. Create your first promo code!
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {isModalOpen && createPortal(
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }} onClick={() => setIsModalOpen(false)}>
          <div className="glass-panel slide-up" style={{ width: '100%', maxWidth: '600px', background: 'var(--bg-color)', position: 'relative' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.25rem', margin: 0 }}>{editingCoupon ? 'Edit Coupon' : 'Create Coupon'}</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                <X size={20} color="var(--text-secondary)" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '80vh', overflowY: 'auto' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Coupon Code</label>
                  <input required type="text" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} placeholder="SUMMER20" style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', textTransform: 'uppercase' }} />
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Status</label>
                  <select value={formData.active.toString()} onChange={e => setFormData({...formData, active: e.target.value === 'true'})} style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none' }}>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Discount Type</label>
                  <div style={{ display: 'flex', border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
                    <button type="button" onClick={() => setFormData({...formData, type: 'PERCENTAGE'})} style={{ flex: 1, padding: '0.5rem', border: 'none', background: formData.type === 'PERCENTAGE' ? 'var(--primary-accent)' : 'transparent', color: formData.type === 'PERCENTAGE' ? 'white' : 'inherit', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.25rem', fontSize: '0.875rem' }}>
                      <Percent size={14} /> %
                    </button>
                    <button type="button" onClick={() => setFormData({...formData, type: 'FIXED'})} style={{ flex: 1, padding: '0.5rem', border: 'none', background: formData.type === 'FIXED' ? 'var(--primary-accent)' : 'transparent', color: formData.type === 'FIXED' ? 'white' : 'inherit', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.25rem', fontSize: '0.875rem' }}>
                      <IndianRupee size={14} /> Fixed
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Discount Value</label>
                  <input required type="number" min="0" step="0.01" value={formData.value} onChange={e => setFormData({...formData, value: e.target.value as any})} style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Min Order (₹)</label>
                  <input required type="number" min="0" value={formData.minimumOrder} onChange={e => setFormData({...formData, minimumOrder: e.target.value as any})} style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none' }} />
                </div>
                
                {formData.type === 'PERCENTAGE' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Max Discount (₹)</label>
                    <input type="number" min="0" value={formData.maximumDiscount} onChange={e => setFormData({...formData, maximumDiscount: e.target.value as any})} placeholder="No limit" style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none' }} />
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Valid From</label>
                  <input required type="datetime-local" value={formData.startsAt} onChange={e => setFormData({...formData, startsAt: e.target.value})} style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', fontSize: '0.875rem' }} />
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Valid Until</label>
                  <input required type="datetime-local" value={formData.expiresAt} onChange={e => setFormData({...formData, expiresAt: e.target.value})} style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', fontSize: '0.875rem' }} />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Total Usage Limit</label>
                <input type="number" min="1" value={formData.usageLimit} onChange={e => setFormData({...formData, usageLimit: e.target.value as any})} placeholder="Leave empty for unlimited" style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                <button type="submit" style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', background: 'var(--primary-accent)', color: 'white', cursor: 'pointer', fontWeight: 600 }}>{editingCoupon ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>, document.body
      )}
    </div>
  );
};