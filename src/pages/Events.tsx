import React, { useState } from 'react';
import useSWR from 'swr';
import { Plus, Edit2, Trash2, Calendar, UploadCloud, X, Star, Search, Check, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import api from '../lib/api';
import { Loader } from '../components/Loader';

export const Events: React.FC = () => {
  const { data: events = [], isLoading, mutate } = useSWR('/events', (url: string) =>
    api.get(url).then(res => res.data.data)
  );

  const { data: productsData } = useSWR('/products?limit=100', (url: string) =>
    api.get(url).then(res => res.data.data)
  );
  const allProducts: any[] = Array.isArray(productsData) ? productsData : [];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState('');
  const [activeTab, setActiveTab] = useState<'basic' | 'products' | 'seo'>('basic');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [productSearch, setProductSearch] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    image: '',
    bannerImage: '',
    featured: false,
    metaTitle: '',
    metaDescription: '',
    metaKeywords: '',
    productIds: [] as string[]
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData(prev => ({ ...prev, [name]: val }));

    if (name === 'name' && !isEditing) {
      const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      setFormData(prev => ({ ...prev, name: value, slug }));
    }
  };

  const handleFileUpload = async (file: File, type: 'image' | 'bannerImage') => {
    const fd = new FormData();
    fd.append('image', file);

    const isBanner = type === 'bannerImage';
    if (isBanner) setUploadingBanner(true);
    else setUploadingImage(true);

    const toastId = toast.loading(`Uploading ${isBanner ? 'banner' : 'image'}...`);
    try {
      const res = await api.post('/uploads', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFormData(prev => ({ ...prev, [type]: res.data.data.url }));
      toast.success('Uploaded successfully', { id: toastId });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to upload image', { id: toastId });
    } finally {
      if (isBanner) setUploadingBanner(false);
      else setUploadingImage(false);
    }
  };

  const toggleProduct = (productId: string) => {
    setFormData(prev => {
      const exists = prev.productIds.includes(productId);
      return {
        ...prev,
        productIds: exists
          ? prev.productIds.filter(id => id !== productId)
          : [...prev.productIds, productId]
      };
    });
  };

  const selectAllFiltered = (filteredIds: string[]) => {
    setFormData(prev => ({
      ...prev,
      productIds: Array.from(new Set([...prev.productIds, ...filteredIds]))
    }));
  };

  const deselectAllFiltered = (filteredIds: string[]) => {
    setFormData(prev => ({
      ...prev,
      productIds: prev.productIds.filter(id => !filteredIds.includes(id))
    }));
  };

  const handleCreate = () => {
    setIsEditing(false);
    setCurrentId('');
    setFormData({
      name: '',
      slug: '',
      description: '',
      image: '',
      bannerImage: '',
      featured: false,
      metaTitle: '',
      metaDescription: '',
      metaKeywords: '',
      productIds: []
    });
    setActiveTab('basic');
    setIsModalOpen(true);
  };

  const handleEdit = async (event: any) => {
    setIsEditing(true);
    setCurrentId(event.id);
    setActiveTab('basic');

    // Fetch full event details including grouped products
    try {
      const res = await api.get(`/events/${event.id}`);
      const fullEvent = res.data.data;
      setFormData({
        name: fullEvent.name || '',
        slug: fullEvent.slug || '',
        description: fullEvent.description || '',
        image: fullEvent.image || '',
        bannerImage: fullEvent.bannerImage || '',
        featured: Boolean(fullEvent.featured),
        metaTitle: fullEvent.metaTitle || '',
        metaDescription: fullEvent.metaDescription || '',
        metaKeywords: fullEvent.metaKeywords || '',
        productIds: fullEvent.products ? fullEvent.products.map((p: any) => p.id) : []
      });
    } catch (e) {
      setFormData({
        name: event.name || '',
        slug: event.slug || '',
        description: event.description || '',
        image: event.image || '',
        bannerImage: event.bannerImage || '',
        featured: Boolean(event.featured),
        metaTitle: event.metaTitle || '',
        metaDescription: event.metaDescription || '',
        metaKeywords: event.metaKeywords || '',
        productIds: []
      });
    }
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete the event "${name}"?`)) return;

    const toastId = toast.loading('Deleting event...');
    try {
      await api.delete(`/events/${id}`);
      mutate(events.filter((e: any) => e.id !== id), false);
      toast.success('Event deleted successfully', { id: toastId });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete event', { id: toastId });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Event name is required');
      return;
    }

    const toastId = toast.loading(isEditing ? 'Updating event...' : 'Creating event...');
    try {
      const payload: any = {
        ...formData,
        slug: formData.slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
        image: formData.image || undefined,
        bannerImage: formData.bannerImage || undefined,
      };

      if (isEditing) {
        const res = await api.patch(`/events/${currentId}`, payload);
        mutate(events.map((ev: any) => ev.id === currentId ? { ...ev, ...res.data.data } : ev), false);
        toast.success('Event updated successfully', { id: toastId });
      } else {
        const res = await api.post('/events', payload);
        mutate([res.data.data, ...events], false);
        toast.success('Event created successfully', { id: toastId });
      }
      setIsModalOpen(false);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to save event';
      toast.error(msg, { id: toastId });
    }
  };

  const filteredProducts = allProducts.filter((p: any) =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    (p.sku && p.sku.toLowerCase().includes(productSearch.toLowerCase()))
  );

  return (
    <div className="container" style={{ padding: '1rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>Occasions & Events</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Manage occasion pages (URL: /events/[slug]) and group products curated for each moment.
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
          <span>New Occasion</span>
        </button>
      </div>

      {isLoading ? (
        <Loader />
      ) : events.length === 0 ? (
        <div style={{ background: 'var(--surface-color)', padding: '3rem', textAlign: 'center', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <Calendar size={48} color="var(--primary-accent)" style={{ margin: '0 auto 1rem', opacity: 0.8 }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>No Events Yet</h3>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto 1.5rem', fontSize: '0.875rem' }}>
            Create special occasions like Birthdays, Anniversaries, Weddings, or Festivals and group products for each page.
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
            Create Your First Event
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {events.map((event: any) => (
            <div
              key={event.id}
              style={{
                background: 'var(--surface-color)',
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
                overflow: 'hidden',
                boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <div style={{ position: 'relative', height: '140px', background: '#f5ebe6' }}>
                <img
                  src={event.bannerImage || event.image || 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=700&q=80'}
                  alt={event.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                {event.featured && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '10px',
                      left: '10px',
                      background: 'rgba(107, 41, 57, 0.9)',
                      color: 'white',
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Star size={12} fill="white" /> Featured
                  </span>
                )}
                <div
                  style={{
                    position: 'absolute',
                    bottom: '10px',
                    right: '10px',
                    background: 'rgba(0,0,0,0.7)',
                    color: 'white',
                    fontSize: '11px',
                    padding: '3px 8px',
                    borderRadius: '20px'
                  }}
                >
                  {event._count?.products ?? 0} Products
                </div>
              </div>

              <div style={{ padding: '1.25rem', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                    {event.name}
                  </h3>
                  <a
                    href={`http://localhost:3000/events/${event.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: 'var(--primary-accent)', opacity: 0.8 }}
                    title="View public event page"
                  >
                    <ExternalLink size={16} />
                  </a>
                </div>

                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                  Path: <code style={{ background: '#f3e8ee', padding: '2px 6px', borderRadius: '4px', color: '#6b2939' }}>/events/{event.slug}</code>
                </div>

                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', flexGrow: 1, margin: '0 0 1.25rem 0', lineHeight: 1.4 }}>
                  {event.description || 'No description provided.'}
                </p>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                  <button
                    onClick={() => handleEdit(event)}
                    style={{
                      background: 'transparent',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      padding: '0.4rem 0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      color: 'var(--text-primary)'
                    }}
                  >
                    <Edit2 size={14} /> Edit & Group Products
                  </button>
                  <button
                    onClick={() => handleDelete(event.id, event.name)}
                    style={{
                      background: 'transparent',
                      border: '1px solid #ffccd5',
                      borderRadius: '6px',
                      padding: '0.4rem 0.6rem',
                      display: 'flex',
                      alignItems: 'center',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      color: '#d90429'
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
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
              maxWidth: '850px',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)'
            }}
          >
            {/* Modal Header */}
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                {isEditing ? `Edit Occasion: ${formData.name}` : 'Create New Occasion / Event'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', padding: '0 1.5rem', background: '#faf8f6' }}>
              <button
                onClick={() => setActiveTab('basic')}
                style={{
                  padding: '0.75rem 1rem',
                  border: 'none',
                  background: 'transparent',
                  borderBottom: activeTab === 'basic' ? '2px solid var(--primary-accent)' : '2px solid transparent',
                  color: activeTab === 'basic' ? 'var(--primary-accent)' : 'var(--text-secondary)',
                  fontWeight: activeTab === 'basic' ? 600 : 400,
                  cursor: 'pointer'
                }}
              >
                Basic Info
              </button>
              <button
                onClick={() => setActiveTab('products')}
                style={{
                  padding: '0.75rem 1rem',
                  border: 'none',
                  background: 'transparent',
                  borderBottom: activeTab === 'products' ? '2px solid var(--primary-accent)' : '2px solid transparent',
                  color: activeTab === 'products' ? 'var(--primary-accent)' : 'var(--text-secondary)',
                  fontWeight: activeTab === 'products' ? 600 : 400,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                Group Products
                <span
                  style={{
                    background: formData.productIds.length > 0 ? 'var(--primary-accent)' : '#e2d9d6',
                    color: formData.productIds.length > 0 ? 'white' : '#6b5c58',
                    borderRadius: '10px',
                    padding: '1px 7px',
                    fontSize: '11px',
                    fontWeight: 600
                  }}
                >
                  {formData.productIds.length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('seo')}
                style={{
                  padding: '0.75rem 1rem',
                  border: 'none',
                  background: 'transparent',
                  borderBottom: activeTab === 'seo' ? '2px solid var(--primary-accent)' : '2px solid transparent',
                  color: activeTab === 'seo' ? 'var(--primary-accent)' : 'var(--text-secondary)',
                  fontWeight: activeTab === 'seo' ? 600 : 400,
                  cursor: 'pointer'
                }}
              >
                SEO & Meta
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, overflow: 'hidden' }}>
              <div style={{ padding: '1.5rem', overflowY: 'auto', flexGrow: 1 }}>
                {activeTab === 'basic' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
                          Occasion Name *
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          placeholder="e.g. Birthday Gifts, Valentine's Day"
                          required
                          style={{
                            width: '100%',
                            padding: '0.6rem 0.8rem',
                            border: '1px solid var(--border-color)',
                            borderRadius: '6px',
                            outline: 'none',
                            fontSize: '0.9rem'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
                          URL Slug * (public: /events/[slug])
                        </label>
                        <input
                          type="text"
                          name="slug"
                          value={formData.slug}
                          onChange={handleChange}
                          placeholder="e.g. birthday, anniversary"
                          required
                          style={{
                            width: '100%',
                            padding: '0.6rem 0.8rem',
                            border: '1px solid var(--border-color)',
                            borderRadius: '6px',
                            outline: 'none',
                            fontSize: '0.9rem'
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
                        Description
                      </label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows={3}
                        placeholder="Describe the occasion feeling and gift curation..."
                        style={{
                          width: '100%',
                          padding: '0.6rem 0.8rem',
                          border: '1px solid var(--border-color)',
                          borderRadius: '6px',
                          outline: 'none',
                          fontSize: '0.9rem',
                          fontFamily: 'inherit'
                        }}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                      {/* Thumbnail Image */}
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
                          Card Thumbnail Image
                        </label>
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                          <input
                            type="text"
                            name="image"
                            value={formData.image}
                            onChange={handleChange}
                            placeholder="Image URL"
                            style={{
                              flexGrow: 1,
                              padding: '0.5rem 0.75rem',
                              border: '1px solid var(--border-color)',
                              borderRadius: '6px',
                              fontSize: '0.85rem'
                            }}
                          />
                          <label
                            style={{
                              padding: '0.5rem 0.75rem',
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
                              onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'image')}
                              style={{ display: 'none' }}
                            />
                          </label>
                        </div>
                        {formData.image && (
                          <div style={{ height: '80px', width: '120px', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                            <img src={formData.image} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                        )}
                      </div>

                      {/* Hero Banner Image */}
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
                          Page Hero Banner
                        </label>
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                          <input
                            type="text"
                            name="bannerImage"
                            value={formData.bannerImage}
                            onChange={handleChange}
                            placeholder="Banner Image URL"
                            style={{
                              flexGrow: 1,
                              padding: '0.5rem 0.75rem',
                              border: '1px solid var(--border-color)',
                              borderRadius: '6px',
                              fontSize: '0.85rem'
                            }}
                          />
                          <label
                            style={{
                              padding: '0.5rem 0.75rem',
                              background: '#f4ede9',
                              color: 'var(--primary-accent)',
                              border: '1px solid var(--border-color)',
                              borderRadius: '6px',
                              cursor: uploadingBanner ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '0.8rem',
                              fontWeight: 500
                            }}
                          >
                            <UploadCloud size={16} />
                            {uploadingBanner ? '...' : 'Upload'}
                            <input
                              type="file"
                              accept="image/*"
                              disabled={uploadingBanner}
                              onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'bannerImage')}
                              style={{ display: 'none' }}
                            />
                          </label>
                        </div>
                        {formData.bannerImage && (
                          <div style={{ height: '80px', width: '160px', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                            <img src={formData.bannerImage} alt="Banner Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <input
                        type="checkbox"
                        id="featured-evt"
                        name="featured"
                        checked={formData.featured}
                        onChange={handleChange}
                        style={{ width: '16px', height: '16px', accentColor: 'var(--primary-accent)' }}
                      />
                      <label htmlFor="featured-evt" style={{ fontSize: '0.9rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
                        Feature this event on homepage and header menus
                      </label>
                    </div>
                  </div>
                )}

                {activeTab === 'products' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div style={{ position: 'relative', width: '280px' }}>
                        <Search size={16} color="var(--text-secondary)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                        <input
                          type="text"
                          placeholder="Search products by name or SKU..."
                          value={productSearch}
                          onChange={(e) => setProductSearch(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '0.5rem 0.75rem 0.5rem 2rem',
                            border: '1px solid var(--border-color)',
                            borderRadius: '6px',
                            fontSize: '0.85rem'
                          }}
                        />
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          type="button"
                          onClick={() => selectAllFiltered(filteredProducts.map(p => p.id))}
                          style={{ background: '#f4ede9', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0.4rem 0.75rem', fontSize: '0.8rem', cursor: 'pointer' }}
                        >
                          Select All Visible
                        </button>
                        <button
                          type="button"
                          onClick={() => deselectAllFiltered(filteredProducts.map(p => p.id))}
                          style={{ background: '#f4ede9', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0.4rem 0.75rem', fontSize: '0.8rem', cursor: 'pointer' }}
                        >
                          Deselect All Visible
                        </button>
                      </div>
                    </div>

                    <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', maxHeight: '350px', overflowY: 'auto' }}>
                      {filteredProducts.length === 0 ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                          No products match "{productSearch}"
                        </div>
                      ) : (
                        filteredProducts.map((prod: any) => {
                          const isSelected = formData.productIds.includes(prod.id);
                          const imgUrl = prod.images?.[0]?.imageUrl || (typeof prod.images?.[0] === 'string' ? prod.images[0] : null);
                          return (
                            <div
                              key={prod.id}
                              onClick={() => toggleProduct(prod.id)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem',
                                padding: '0.75rem 1rem',
                                borderBottom: '1px solid var(--border-color)',
                                cursor: 'pointer',
                                background: isSelected ? '#fbf4f0' : 'transparent',
                                transition: 'background 0.15s'
                              }}
                            >
                              <div
                                style={{
                                  width: '20px',
                                  height: '20px',
                                  borderRadius: '4px',
                                  border: isSelected ? '2px solid var(--primary-accent)' : '2px solid #ccc',
                                  background: isSelected ? 'var(--primary-accent)' : 'transparent',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: 'white',
                                  flexShrink: 0
                                }}
                              >
                                {isSelected && <Check size={14} strokeWidth={3} />}
                              </div>

                              <div style={{ width: '40px', height: '40px', borderRadius: '4px', overflow: 'hidden', background: '#eee', flexShrink: 0 }}>
                                {imgUrl ? (
                                  <img src={imgUrl} alt={prod.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>No Img</div>
                                )}
                              </div>

                              <div style={{ flexGrow: 1 }}>
                                <div style={{ fontWeight: 500, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{prod.name}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                  SKU: {prod.sku} • ₹{prod.price} {prod.category?.name ? `• ${prod.category.name}` : ''}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'seo' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
                        Meta Title
                      </label>
                      <input
                        type="text"
                        name="metaTitle"
                        value={formData.metaTitle}
                        onChange={handleChange}
                        placeholder="e.g. Best Birthday Gift Hampers | Mora Moments"
                        style={{
                          width: '100%',
                          padding: '0.6rem 0.8rem',
                          border: '1px solid var(--border-color)',
                          borderRadius: '6px',
                          fontSize: '0.9rem'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
                        Meta Description
                      </label>
                      <textarea
                        name="metaDescription"
                        value={formData.metaDescription}
                        onChange={handleChange}
                        rows={3}
                        placeholder="SEO meta description summarizing gifts for this occasion..."
                        style={{
                          width: '100%',
                          padding: '0.6rem 0.8rem',
                          border: '1px solid var(--border-color)',
                          borderRadius: '6px',
                          fontSize: '0.9rem',
                          fontFamily: 'inherit'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
                        Meta Keywords
                      </label>
                      <input
                        type="text"
                        name="metaKeywords"
                        value={formData.metaKeywords}
                        onChange={handleChange}
                        placeholder="e.g. birthday gifts, birthday hamper, surprise gift"
                        style={{
                          width: '100%',
                          padding: '0.6rem 0.8rem',
                          border: '1px solid var(--border-color)',
                          borderRadius: '6px',
                          fontSize: '0.9rem'
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', background: '#faf8f6' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    background: 'white',
                    cursor: 'pointer',
                    fontSize: '0.875rem'
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
                    fontSize: '0.875rem'
                  }}
                >
                  {isEditing ? 'Save Changes' : 'Create Occasion'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
