import { Loader } from '../components/Loader';
import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Folder, FolderTree, UploadCloud, X, Star } from 'lucide-react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import api from '../lib/api';
import useSWR from 'swr';

export const Categories: React.FC = () => {
  const { data: categories = [], isLoading: loading, mutate } = useSWR('/categories', url => api.get(url).then(res => res.data.data));

  const [uploadingImage, setUploadingImage] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState('');
  const [activeTab, setActiveTab] = useState<'basic' | 'seo'>('basic');

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    parentId: '',
    image: '',
    featured: false,
    metaTitle: '',
    metaDescription: '',
    metaKeywords: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData(prev => ({ ...prev, [name]: val }));

    if (name === 'name' && !isEditing) {
      const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      setFormData(prev => ({ ...prev, name: value, slug }));
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const fd = new FormData();
    fd.append('image', e.target.files[0]);

    setUploadingImage(true);
    const toastId = toast.loading('Uploading image...');
    try {
      const res = await api.post('/uploads', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFormData(prev => ({ ...prev, image: res.data.data.url }));
      toast.success('Image uploaded', { id: toastId });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to upload image', { id: toastId });
    } finally {
      setUploadingImage(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dataToSubmit: any = { ...formData };
      if (!dataToSubmit.parentId) dataToSubmit.parentId = null;
      if (!dataToSubmit.image) dataToSubmit.image = undefined;
      if (dataToSubmit.slug) {
        dataToSubmit.slug = dataToSubmit.slug.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      }

      closeModal();
      const toastId = toast.loading(isEditing ? 'Updating category...' : 'Creating category...');

      if (isEditing) {
        const res = await api.patch(`/categories/${currentId}`, dataToSubmit);
        mutate(categories.map((c: any) => c.id === currentId ? res.data.data : c), false);
        toast.success('Category updated', { id: toastId });
      } else {
        const res = await api.post('/categories', dataToSubmit);
        mutate([...categories, res.data.data], false);
        toast.success('Category created', { id: toastId });
      }
    } catch (err: any) {
      const msg = err.response?.data?.error?.details?.[0]?.message || err.response?.data?.message || 'Failed to save category';
      toast.error(msg);
    }
  };

  const handleEdit = (cat: any) => {
    setIsEditing(true);
    setCurrentId(cat.id);
    setFormData({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || '',
      parentId: cat.parentId || '',
      image: cat.image || '',
      featured: Boolean(cat.featured),
      metaTitle: cat.metaTitle || '',
      metaDescription: cat.metaDescription || '',
      metaKeywords: cat.metaKeywords || ''
    });
    setIsModalOpen(true);
  };

  const handleToggleFeatured = async (cat: any) => {
    const nextStatus = !cat.featured;
    try {
      mutate(
        categories.map((c: any) => (c.id === cat.id ? { ...c, featured: nextStatus } : c)),
        false
      );
      await api.patch(`/categories/${cat.id}`, { featured: nextStatus });
      toast.success(nextStatus ? `"${cat.name}" marked as Featured` : `"${cat.name}" unfeatured`);
      mutate();
    } catch (err: any) {
      const msg = err.response?.data?.error?.details?.[0]?.message || err.response?.data?.message || 'Failed to update featured status';
      toast.error(msg);
      mutate();
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this category? Products might be affected.')) return;
    const toastId = toast.loading('Deleting category...');
    try {
      await api.delete(`/categories/${id}`);
      mutate(categories.filter((c: any) => c.id !== id), false);
      toast.success('Category deleted', { id: toastId });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete category', { id: toastId });
    }
  };

  const openAddModal = () => {
    setIsEditing(false);
    setActiveTab('basic');
    setFormData({ name: '', slug: '', description: '', parentId: '', image: '', featured: false, metaTitle: '', metaDescription: '', metaKeywords: '' });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setTimeout(() => {
      setIsEditing(false);
      setCurrentId('');
      setFormData({ name: '', slug: '', description: '', parentId: '', image: '', featured: false, metaTitle: '', metaDescription: '', metaKeywords: '' });
    }, 300);
  };

  // Helper to visually build tree
  const buildTree = (cats: any[], parentId: string | null = null, depth = 0): any[] => {
    const result: any[] = [];
    for (const cat of cats) {
      if (cat.parentId === parentId) {
        result.push({ ...cat, depth });
        result.push(...buildTree(cats, cat.id, depth + 1));
      }
    }
    return result;
  };

  const categoryTree = buildTree(categories);

  return (
    <div className="fade-in" style={{ position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ fontSize: '2rem' }}>Categories</h1>

        <button
          onClick={openAddModal}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.75rem 1.5rem', borderRadius: '8px',
            background: 'var(--primary-accent)', color: 'var(--bg-color)',
            border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '1rem'
          }}>
          <Plus size={20} />
          Add Category
        </button>
      </div>

      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FolderTree size={20} /> Category Hierarchy
        </h2>

        {loading ? (
          <Loader />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {categoryTree.map(cat => (
              <div
                key={cat.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem 1rem',
                  paddingLeft: `calc(1rem + ${cat.depth * 2}rem)`,
                  background: 'var(--bg-color)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  flexWrap: 'wrap',
                  gap: '1rem'
                }}
              >
                {/* Left side: Icon, Image, Name, Slug */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: '1 1 min-content' }}>
                  {cat.depth > 0 ? (
                    <div style={{ display: 'flex', alignItems: 'center', color: 'var(--border-color)' }}>
                      <div style={{ width: '12px', height: '12px', borderBottom: '2px solid', borderLeft: '2px solid', borderRadius: '0 0 0 4px', transform: 'translateY(-6px)' }} />
                    </div>
                  ) : (
                    <Folder size={20} color="var(--primary-accent)" style={{ flexShrink: 0 }} />
                  )}

                  {cat.image && (
                    <img src={cat.image} alt={cat.name} style={{ width: 32, height: 32, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />
                  )}

                  <div>
                    <div style={{ fontWeight: cat.depth === 0 ? 600 : 500, color: 'var(--text-primary)' }}>{cat.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>/{cat.slug}</div>
                  </div>
                </div>

                {/* Right side: Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => handleToggleFeatured(cat)}
                    title={cat.featured ? "Featured on Home (Click to remove)" : "Click to feature on Home"}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.4rem 0.75rem',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: cat.featured ? '1px solid rgba(234, 179, 8, 0.4)' : '1px solid var(--border-color)',
                      background: cat.featured ? 'rgba(234, 179, 8, 0.15)' : 'var(--surface-color)',
                      color: cat.featured ? '#ca8a04' : 'var(--text-secondary)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <Star size={13} fill={cat.featured ? "#ca8a04" : "none"} strokeWidth={cat.featured ? 0 : 2} color={cat.featured ? "#ca8a04" : "currentColor"} />
                    {cat.featured ? 'Featured' : 'Not Featured'}
                  </button>
                  <button onClick={() => handleEdit(cat)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-secondary)', cursor: 'pointer' }} title="Edit">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => handleDelete(cat.id)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--danger-accent)', cursor: 'pointer' }} title="Delete">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}

            {categories.length === 0 && (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)', background: 'var(--bg-color)', borderRadius: '8px', border: '1px dashed var(--border-color)' }}>
                No categories found. Create your first category!
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal Overlay Rendered in Portal */}
      {isModalOpen && createPortal(
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={closeModal}>
          <div
            className="glass-panel slide-up"
            style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', padding: '1.5rem 2rem', background: 'var(--bg-color)', position: 'relative' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={closeModal} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
              <X size={24} />
            </button>

            <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>{isEditing ? 'Edit Category' : 'Add New Category'}</h2>

            <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
              <button
                onClick={() => setActiveTab('basic')}
                style={{ background: 'transparent', border: 'none', padding: '0.75rem 1rem', cursor: 'pointer', fontWeight: 600, borderBottom: activeTab === 'basic' ? '2px solid var(--primary-accent)' : '2px solid transparent', color: activeTab === 'basic' ? 'var(--primary-accent)' : 'var(--text-secondary)' }}
              >
                Basic Details
              </button>
              <button
                onClick={() => setActiveTab('seo')}
                style={{ background: 'transparent', border: 'none', padding: '0.75rem 1rem', cursor: 'pointer', fontWeight: 600, borderBottom: activeTab === 'seo' ? '2px solid var(--primary-accent)' : '2px solid transparent', color: activeTab === 'seo' ? 'var(--primary-accent)' : 'var(--text-secondary)' }}
              >
                SEO Settings
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {activeTab === 'basic' && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>Name *</label>
                      <input type="text" name="name" required value={formData.name} onChange={handleChange} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--surface-color)', outline: 'none', color: 'var(--text-primary)' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>Slug *</label>
                      <input type="text" name="slug" required value={formData.slug} onChange={handleChange} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--surface-color)', outline: 'none', color: 'var(--text-primary)' }} />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>Parent Category</label>
                      <select name="parentId" value={formData.parentId} onChange={handleChange} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--surface-color)', outline: 'none', color: 'var(--text-primary)' }}>
                        <option value="">None (Top Level)</option>
                        {categoryTree.filter(c => c.id !== currentId).map(c => (
                          <option key={c.id} value={c.id}>
                            {'\u00A0'.repeat(c.depth * 4)}{c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>Category Image</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        {formData.image && (
                          <img src={formData.image} alt="Preview" style={{ width: '42px', height: '42px', borderRadius: '8px', objectFit: 'cover' }} />
                        )}
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', background: 'var(--surface-color)', borderRadius: '8px', cursor: 'pointer', border: '1px solid var(--border-color)', flex: 1, justifyContent: 'center', fontSize: '0.875rem' }}>
                          <UploadCloud size={16} /> {uploadingImage ? '...' : formData.image ? 'Change' : 'Upload Image'}
                          <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} disabled={uploadingImage} />
                        </label>
                      </div>
                    </div>
                  </div>

                  <div style={{ marginBottom: '1.25rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>Description</label>
                    <textarea name="description" value={formData.description} onChange={handleChange} rows={2} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--surface-color)', outline: 'none', resize: 'none', color: 'var(--text-primary)' }} />
                  </div>

                  <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'var(--surface-color)', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Star size={16} color="#ca8a04" fill={formData.featured ? "#ca8a04" : "none"} />
                        Feature on Homepage
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        Show this category under "Gifts for every moment" and in "Made to make them feel special" category tabs on the home page.
                      </div>
                    </div>
                    <label style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer', flexShrink: 0 }}>
                      <input
                        type="checkbox"
                        name="featured"
                        checked={formData.featured}
                        onChange={handleChange}
                        style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: 'var(--primary-accent)' }}
                      />
                    </label>
                  </div>
                </>
              )}

              {activeTab === 'seo' && (

                <div style={{ padding: '1rem', background: 'var(--surface-color)', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid var(--border-color)' }}>
                  <h3 style={{ fontSize: '1rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>SEO Settings</h3>

                  <div style={{ display: 'grid', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>Meta Title</label>
                      <input type="text" name="metaTitle" value={formData.metaTitle} onChange={handleChange} placeholder="Custom SEO title" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', outline: 'none', color: 'var(--text-primary)' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>Meta Keywords</label>
                      <input type="text" name="metaKeywords" value={formData.metaKeywords} onChange={handleChange} placeholder="e.g. customized, gifts" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', outline: 'none', color: 'var(--text-primary)' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>Meta Description</label>
                      <textarea name="metaDescription" value={formData.metaDescription} onChange={handleChange} rows={2} placeholder="Description for search engines" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', outline: 'none', resize: 'vertical', color: 'var(--text-primary)' }} />
                    </div>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="button" onClick={closeModal} style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', cursor: 'pointer', fontWeight: 600, color: 'var(--text-primary)' }}>Cancel</button>
                <button type="submit" style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: 'none', background: 'var(--primary-accent)', color: 'white', cursor: 'pointer', fontWeight: 600 }}>
                  {isEditing ? 'Save Changes' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};