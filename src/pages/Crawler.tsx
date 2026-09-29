import React, { useState } from 'react';
import useSWR from 'swr';
import { Plus, Edit2, Trash2, SlidersHorizontal, UploadCloud, X, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import api from '../lib/api';
import { Loader } from '../components/Loader';

export const Crawler: React.FC = () => {
  const { data: items = [], isLoading, mutate } = useSWR('/crawler-items?all=true', (url: string) =>
    api.get(url).then(res => res.data.data)
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    image: '',
    link: '',
    sortOrder: 0,
    active: true
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData(prev => ({ ...prev, [name]: val }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const fd = new FormData();
    fd.append('image', e.target.files[0]);

    setUploadingImage(true);
    const toastId = toast.loading('Uploading crawler image...');
    try {
      const res = await api.post('/uploads', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFormData(prev => ({ ...prev, image: res.data.data.url }));
      toast.success('Image uploaded successfully', { id: toastId });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to upload image', { id: toastId });
    } finally {
      setUploadingImage(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleCreate = () => {
    setIsEditing(false);
    setCurrentId('');
    setFormData({
      title: '',
      image: '',
      link: '/shop',
      sortOrder: (items.length || 0) + 1,
      active: true
    });
    setIsModalOpen(true);
  };

  const handleEdit = (item: any) => {
    setIsEditing(true);
    setCurrentId(item.id);
    setFormData({
      title: item.title || '',
      image: item.image || '',
      link: item.link || '',
      sortOrder: item.sortOrder ?? 0,
      active: Boolean(item.active)
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this crawler card?')) return;
    const toastId = toast.loading('Deleting...');
    try {
      await api.delete(`/crawler-items/${id}`);
      mutate(items.filter((it: any) => it.id !== id), false);
      toast.success('Deleted successfully', { id: toastId });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete', { id: toastId });
    }
  };

  const handleToggleActive = async (item: any) => {
    try {
      const newActive = !item.active;
      await api.patch(`/crawler-items/${item.id}`, { active: newActive });
      mutate(items.map((it: any) => it.id === item.id ? { ...it, active: newActive } : it), false);
      toast.success(newActive ? 'Item activated' : 'Item paused');
    } catch (e) {
      toast.error('Failed to update status');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.image.trim()) {
      toast.error('Image URL is required');
      return;
    }
    if (!formData.link.trim()) {
      toast.error('Clickable link is required');
      return;
    }

    const toastId = toast.loading(isEditing ? 'Updating crawler card...' : 'Adding crawler card...');
    try {
      const payload = {
        ...formData,
        sortOrder: Number(formData.sortOrder) || 0
      };

      if (isEditing) {
        const res = await api.patch(`/crawler-items/${currentId}`, payload);
        mutate(items.map((it: any) => it.id === currentId ? res.data.data : it), false);
        toast.success('Crawler item updated', { id: toastId });
      } else {
        const res = await api.post('/crawler-items', payload);
        mutate([...items, res.data.data], false);
        toast.success('Crawler item added', { id: toastId });
      }
      setIsModalOpen(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save crawler item', { id: toastId });
    }
  };

  return (
    <div className="container" style={{ padding: '1rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>Hero Banner Crawler</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Control the visual marquee gliding directly beneath the hero section (image + clickable link).
          </p>
        </div>
        <button
          onClick={handleCreate}
          style={{
            background: 'var(--primary-accent)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '0.625rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            cursor: 'pointer',
            fontWeight: 500,
            fontSize: '0.875rem'
          }}
        >
          <Plus size={18} />
          <span>Add Crawler Item</span>
        </button>
      </div>

      {isLoading ? (
        <Loader />
      ) : items.length === 0 ? (
        <div style={{ background: 'var(--surface-color)', padding: '3rem', textAlign: 'center', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <SlidersHorizontal size={48} color="var(--primary-accent)" style={{ margin: '0 auto 1rem', opacity: 0.8 }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>No Crawler Items</h3>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto 1.5rem', fontSize: '0.875rem' }}>
            Add visual cards with image and clickable link to display in the marquee below the hero section.
          </p>
          <button
            onClick={handleCreate}
            style={{
              background: 'var(--primary-accent)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '0.5rem 1rem',
              cursor: 'pointer',
              fontWeight: 500
            }}
          >
            Create First Item
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.25rem' }}>
          {items.map((item: any) => (
            <div
              key={item.id}
              style={{
                background: 'var(--surface-color)',
                borderRadius: '10px',
                border: '1px solid var(--border-color)',
                overflow: 'hidden',
                boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                display: 'flex',
                flexDirection: 'column',
                opacity: item.active ? 1 : 0.6
              }}
            >
              <div style={{ position: 'relative', height: '160px', background: '#ece5e2' }}>
                <img
                  src={item.image}
                  alt={item.title || 'Crawler Image'}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <button
                  onClick={() => handleToggleActive(item)}
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    background: item.active ? 'rgba(40, 167, 69, 0.9)' : 'rgba(108, 117, 125, 0.9)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '20px',
                    padding: '3px 8px',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  title={item.active ? 'Click to Pause' : 'Click to Activate'}
                >
                  {item.active ? <Eye size={12} /> : <EyeOff size={12} />}
                  {item.active ? 'Active' : 'Paused'}
                </button>
                <div
                  style={{
                    position: 'absolute',
                    bottom: '8px',
                    left: '8px',
                    background: 'rgba(0,0,0,0.7)',
                    color: 'white',
                    fontSize: '11px',
                    padding: '2px 6px',
                    borderRadius: '4px'
                  }}
                >
                  Order: #{item.sortOrder}
                </div>
              </div>

              <div style={{ padding: '1rem', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                <h4 style={{ margin: '0 0 0.4rem 0', fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {item.title || '(No Title Label)'}
                </h4>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: 'var(--primary-accent)', marginBottom: '1rem', wordBreak: 'break-all' }}>
                  <ArrowRight size={13} style={{ flexShrink: 0 }} />
                  <span>{item.link}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: 'auto', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                  <button
                    onClick={() => handleEdit(item)}
                    style={{
                      background: 'transparent',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      padding: '0.35rem 0.6rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      fontSize: '0.75rem',
                      cursor: 'pointer'
                    }}
                  >
                    <Edit2 size={13} /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    style={{
                      background: 'transparent',
                      border: '1px solid #ffccd5',
                      borderRadius: '6px',
                      padding: '0.35rem 0.5rem',
                      color: '#d90429',
                      cursor: 'pointer'
                    }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(2px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}
        >
          <div
            style={{
              background: 'var(--surface-color)',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '560px',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
            }}
          >
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 600 }}>
                {isEditing ? 'Edit Crawler Item' : 'New Crawler Item'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.4rem' }}>
                  Image *
                </label>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <input
                    type="text"
                    name="image"
                    value={formData.image}
                    onChange={handleChange}
                    placeholder="https://... or upload"
                    required
                    style={{
                      flexGrow: 1,
                      padding: '0.55rem 0.75rem',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      fontSize: '0.85rem'
                    }}
                  />
                  <label
                    style={{
                      padding: '0.55rem 0.75rem',
                      background: '#f4ede9',
                      color: 'var(--primary-accent)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      cursor: uploadingImage ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.8rem',
                      fontWeight: 500
                    }}
                  >
                    <UploadCloud size={16} />
                    {uploadingImage ? '...' : 'Upload'}
                    <input
                      type="file"
                      accept="image/*"
                      disabled={uploadingImage}
                      onChange={handleImageUpload}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>
                {formData.image && (
                  <div style={{ height: '100px', width: '160px', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                    <img src={formData.image} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.4rem' }}>
                  Clickable Destination Link *
                </label>
                <input
                  type="text"
                  name="link"
                  value={formData.link}
                  onChange={handleChange}
                  placeholder="e.g. /events/birthday or /shop or /builder"
                  required
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    fontSize: '0.85rem'
                  }}
                />
                <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Presets:</span>
                  {['/shop', '/events/birthday', '/events/anniversary', '/builder', '/men', '/women'].map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, link: p }))}
                      style={{
                        background: '#f2f0ed',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '1px 6px',
                        fontSize: '11px',
                        cursor: 'pointer',
                        color: 'var(--text-primary)'
                      }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.4rem' }}>
                  Label / Title (Optional)
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g. Birthday Magic, Curated Hampers"
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    fontSize: '0.85rem'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', alignItems: 'center' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.4rem' }}>
                    Sort Order
                  </label>
                  <input
                    type="number"
                    name="sortOrder"
                    value={formData.sortOrder}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.75rem',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      fontSize: '0.85rem'
                    }}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1.2rem' }}>
                  <input
                    type="checkbox"
                    id="active-chk"
                    name="active"
                    checked={formData.active}
                    onChange={handleChange}
                    style={{ width: '16px', height: '16px', accentColor: 'var(--primary-accent)' }}
                  />
                  <label htmlFor="active-chk" style={{ fontSize: '0.85rem', cursor: 'pointer' }}>
                    Active in Crawler
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.8rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    background: 'white',
                    cursor: 'pointer',
                    fontSize: '0.85rem'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '0.5rem 1.25rem',
                    borderRadius: '6px',
                    border: 'none',
                    background: 'var(--primary-accent)',
                    color: 'white',
                    fontWeight: 500,
                    cursor: 'pointer',
                    fontSize: '0.85rem'
                  }}
                >
                  {isEditing ? 'Save Changes' : 'Add to Crawler'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
