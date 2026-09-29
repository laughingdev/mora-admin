import { Loader } from '../components/Loader';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, UploadCloud } from 'lucide-react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import api from '../lib/api';

export const ProductForm: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEdit);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [_, setBrands] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    sku: '',
    description: '',
    price: 0,
    salePrice: 0,
    stock: 0,
    gender: 'both',
    categoryId: '',
    categoryIds: [] as string[],
    brandId: '',
    active: true,
    featured: false,
    isCustomizable: false,
    images: [] as string[],
    variants: [] as any[],
    metaTitle: '',
    metaDescription: '',
    metaKeywords: ''
  });

  const [activeTab, setActiveTab] = useState<'basic' | 'variants' | 'seo'>('basic');
  const [variantModalOpen, setVariantModalOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState<any>(null);
  const [variantForm, setVariantForm] = useState({ name: '', sku: '', price: 0, stock: 0, image: '' });
  const [uploadingVariantImage, setUploadingVariantImage] = useState(false);

  useEffect(() => {
    // Fetch dependencies
    const fetchDependencies = async () => {
      try {
        const [catsRes, brandsRes] = await Promise.all([
          api.get('/categories'),
          api.get('/brands') // Assuming these exist
        ]);
        setCategories(catsRes.data.data || []);
        setBrands(brandsRes.data.data || []);
      } catch (err) {
        console.warn('Failed to load dependencies', err);
      }
    };

    fetchDependencies();

    if (isEdit) {
      api.get(`/products/${id}`)
        .then(res => {
          const p = res.data.data;
          setFormData({
            name: p.name || '',
            slug: p.slug || '',
            sku: p.sku || '',
            description: p.description || '',
            price: p.price || 0,
            salePrice: p.salePrice || 0,
            stock: p.stock || 0,
            gender: p.gender || 'both',
            categoryId: p.categoryId || '',
            categoryIds: Array.isArray(p.categories) && p.categories.length > 0
              ? p.categories.map((c: any) => c.id)
              : (p.categoryId ? [p.categoryId] : []),
            brandId: p.brandId || '',
            active: p.active !== undefined ? p.active : true,
            featured: p.featured || false,
            isCustomizable: p.isCustomizable || false,
            images: p.images ? p.images.map((img: any) => img.imageUrl) : [],
            variants: p.variants || [],
            metaTitle: p.metaTitle || '',
            metaDescription: p.metaDescription || '',
            metaKeywords: p.metaKeywords || ''
          });
        })
        .finally(() => setInitialLoading(false));
    }
  }, [id, isEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let finalValue: any = value;

    if (type === 'checkbox') {
      finalValue = (e.target as HTMLInputElement).checked;
    } else if (type === 'number') {
      finalValue = Number(value);
    }

    setFormData(prev => ({ ...prev, [name]: finalValue }));

    // Auto-generate slug and SKU from name if creating new
    if (!isEdit && name === 'name') {
      const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      const sku = 'SKU-' + Math.random().toString(36).substring(2, 8).toUpperCase();
      setFormData(prev => ({ ...prev, name: value, slug, sku }));
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const files = Array.from(e.target.files);
    const fd = new FormData();
    files.forEach(file => fd.append('images', file));

    setUploadingImage(true);
    try {
      const res = await api.post('/uploads/multiple', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const urls = res.data.data.map((item: any) => item.url);
      setFormData(prev => ({ ...prev, images: [...prev.images, ...urls] }));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to upload images');
    } finally {
      setUploadingImage(false);
      if (e.target) e.target.value = ''; // clear input
    }
  };

  const removeImage = (urlToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter(url => url !== urlToRemove)
    }));
  };

  const toggleCategory = (catId: string) => {
    setFormData(prev => {
      const exists = prev.categoryIds.includes(catId);
      const newIds = exists ? prev.categoryIds.filter(id => id !== catId) : [...prev.categoryIds, catId];
      return {
        ...prev,
        categoryIds: newIds,
        categoryId: newIds.length > 0 ? newIds[0] : ''
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { variants, ...payload } = formData as any;
      if (payload.categoryIds && payload.categoryIds.length > 0) {
        payload.categoryId = payload.categoryIds[0];
      } else if (payload.categoryId) {
        payload.categoryIds = [payload.categoryId];
      } else {
        toast.error('Please select at least one category');
        setLoading(false);
        return;
      }

      if (payload.brandId === '') {
        payload.brandId = null;
      }
      if (payload.salePrice === 0 || payload.salePrice === '') {
        payload.salePrice = null;
      }
      if (payload.slug) {
        payload.slug = payload.slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      }

      if (isEdit) {
        await api.patch(`/products/${id}`, payload);
        toast.success('Product updated successfully');
      } else {
        const res = await api.post('/products', payload);
        const newProductId = res.data.data.id;

        // Create variants for new product
        if (variants && variants.length > 0) {
          for (const v of variants) {
            try {
              await api.post(`/products/${newProductId}/variants`, {
                name: v.name, sku: v.sku, price: v.price, stock: v.stock, image: v.image
              });
            } catch (err: any) {
              toast.error(`Failed to create variant ${v.name}: ${err.response?.data?.message || 'Error'}`);
            }
          }
        }

        toast.success('Product created successfully');
      }
      navigate('/products');
    } catch (err: any) {
      if (err.response?.data?.error?.details && Array.isArray(err.response.data.error.details)) {
        // Display detailed Zod validation errors
        err.response.data.error.details.forEach((error: any) => {
          const field = error.field ? error.field.replace('body.', '') : '';
          toast.error(`${field}: ${error.message}`);
        });
      } else {
        toast.error(err.response?.data?.message || 'Error saving product');
      }
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) return <Loader />;

  return (
    <div className="fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <button onClick={() => navigate('/products')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--text-secondary)' }}>
          <ArrowLeft size={24} />
        </button>
        <h1 style={{ fontSize: '2rem', margin: 0 }}>{isEdit ? 'Edit Product' : 'Add New Product'}</h1>
      </div>

      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
        <button
          onClick={() => setActiveTab('basic')}
          style={{ background: 'transparent', border: 'none', padding: '0.75rem 1rem', cursor: 'pointer', fontWeight: 600, borderBottom: activeTab === 'basic' ? '2px solid var(--primary-accent)' : '2px solid transparent', color: activeTab === 'basic' ? 'var(--primary-accent)' : 'var(--text-secondary)' }}
        >
          Basic Details
        </button>
        <button
          onClick={() => setActiveTab('variants')}
          style={{ background: 'transparent', border: 'none', padding: '0.75rem 1rem', cursor: 'pointer', fontWeight: 600, borderBottom: activeTab === 'variants' ? '2px solid var(--primary-accent)' : '2px solid transparent', color: activeTab === 'variants' ? 'var(--primary-accent)' : 'var(--text-secondary)' }}
        >
          Product Variants
        </button>
        <button
          onClick={() => setActiveTab('seo')}
          style={{ background: 'transparent', border: 'none', padding: '0.75rem 1rem', cursor: 'pointer', fontWeight: 600, borderBottom: activeTab === 'seo' ? '2px solid var(--primary-accent)' : '2px solid transparent', color: activeTab === 'seo' ? 'var(--primary-accent)' : 'var(--text-secondary)' }}
        >
          SEO Settings
        </button>
      </div>

      {activeTab === 'basic' && (
        <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: '2rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Product Name *</label>
              <input
                type="text" name="name" required value={formData.name} onChange={handleChange}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Slug *</label>
              <input
                type="text" name="slug" required value={formData.slug} onChange={handleChange}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>SKU *</label>
              <input
                type="text" name="sku" required value={formData.sku} onChange={handleChange}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Price (₹) *</label>
              <input
                type="number" name="price" required min="0" value={formData.price} onChange={handleChange}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Sale Price (₹)</label>
              <input
                type="number" name="salePrice" min="0" value={formData.salePrice} onChange={handleChange}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Stock Quantity *</label>
              <input
                type="number" name="stock" required min="0" value={formData.stock} onChange={handleChange}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Target Gender</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {[
                  { value: 'both', label: 'Unisex / Both' },
                  { value: 'male', label: 'Male / Men' },
                  { value: 'female', label: 'Female / Women' },
                ].map((g) => {
                  const isSelected = formData.gender === g.value;
                  return (
                    <button
                      key={g.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, gender: g.value }))}
                      style={{
                        flex: 1,
                        padding: '0.75rem 0.25rem',
                        borderRadius: '8px',
                        border: isSelected ? '2px solid var(--primary-accent)' : '1px solid var(--border-color)',
                        background: isSelected ? 'rgba(107, 41, 57, 0.08)' : 'var(--bg-color)',
                        color: isSelected ? 'var(--primary-accent)' : 'var(--text-primary)',
                        fontWeight: isSelected ? 600 : 400,
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        transition: 'all 0.2s',
                        textAlign: 'center'
                      }}
                    >
                      {g.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label style={{ fontWeight: 600 }}>Categories * (Select one or multiple)</label>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {formData.categoryIds.length} categories selected (First selected is primary for URL)
                </span>
              </div>

              {formData.categoryIds.length > 0 && (
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                  {formData.categoryIds.map((cid, idx) => {
                    const cat = categories.find(c => c.id === cid);
                    return (
                      <span
                        key={cid}
                        style={{
                          background: idx === 0 ? 'var(--primary-accent)' : '#f4ede9',
                          color: idx === 0 ? 'white' : 'var(--primary-accent)',
                          padding: '3px 10px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: 500,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        {cat?.name || 'Category'} {idx === 0 && <small style={{ opacity: 0.8 }}>(Primary)</small>}
                        <button
                          type="button"
                          onClick={() => toggleCategory(cid)}
                          style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0, fontSize: '14px', lineHeight: 1 }}
                        >
                          ✕
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}

              <div
                style={{
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  background: 'var(--bg-color)',
                  padding: '0.75rem',
                  maxHeight: '180px',
                  overflowY: 'auto',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                  gap: '0.5rem'
                }}
              >
                {categories.map((c: any) => {
                  const isChecked = formData.categoryIds.includes(c.id);
                  return (
                    <label
                      key={c.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.875rem',
                        padding: '0.35rem 0.5rem',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        background: isChecked ? 'rgba(107, 41, 57, 0.08)' : 'transparent',
                        color: isChecked ? 'var(--primary-accent)' : 'var(--text-primary)',
                        fontWeight: isChecked ? 600 : 400
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleCategory(c.id)}
                        style={{ accentColor: 'var(--primary-accent)', width: '16px', height: '16px' }}
                      />
                      <span>{c.name}</span>
                      {c.parentId && <span style={{ fontSize: '10px', opacity: 0.6 }}>(sub)</span>}
                    </label>
                  );
                })}
              </div>
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Description</label>
              <textarea
                name="description" rows={4} value={formData.description} onChange={handleChange}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', outline: 'none', resize: 'vertical' }}
              />
            </div>

            <div style={{ gridColumn: '1 / -1', marginTop: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Product Images</label>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                {formData.images.map((url, i) => (
                  <div key={i} style={{ position: 'relative', width: '100px', height: '100px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                    <img src={url} alt="Product preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button type="button" onClick={() => removeImage(url)} style={{ position: 'absolute', top: '4px', right: '4px', background: 'var(--danger-accent)', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>✕</button>
                  </div>
                ))}
                <label style={{ width: '100px', height: '100px', borderRadius: '8px', border: '2px dashed var(--border-color)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: uploadingImage ? 'not-allowed' : 'pointer', color: 'var(--text-secondary)' }}>
                  {uploadingImage ? (
                    <span style={{ fontSize: '0.75rem' }}>Uploading...</span>
                  ) : (
                    <>
                      <UploadCloud size={24} />
                      <span style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>Upload</span>
                    </>
                  )}
                  <input type="file" multiple accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} disabled={uploadingImage} />
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '2rem', gridColumn: '1 / -1', marginTop: '1rem', flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 600 }}>
                <input type="checkbox" name="active" checked={formData.active} onChange={handleChange} style={{ width: '1.25rem', height: '1.25rem', accentColor: 'var(--primary-accent)' }} />
                Active (Visible on Store)
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 600 }}>
                <input type="checkbox" name="featured" checked={formData.featured} onChange={handleChange} style={{ width: '1.25rem', height: '1.25rem', accentColor: 'var(--primary-accent)' }} />
                Featured Product
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 600, color: 'var(--primary-accent)' }}>
                <input type="checkbox" name="isCustomizable" checked={(formData as any).isCustomizable} onChange={handleChange} style={{ width: '1.25rem', height: '1.25rem', accentColor: 'var(--primary-accent)' }} />
                🎁 Customizable (Available in Gift Hamper Builder)
              </label>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
            <button type="button" onClick={() => navigate('/products')} style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', cursor: 'pointer', fontWeight: 600 }}>
              Cancel
            </button>
            <button type="submit" disabled={loading} style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', border: 'none', background: 'var(--primary-accent)', color: 'white', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 600 }}>
              {loading ? 'Saving...' : 'Save Product'}
            </button>
          </div>
        </form>
      )}

      {activeTab === 'seo' && (
        <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Search Engine Optimization</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
            Configure how this product appears in search engine results and social media shares.
          </p>

          <div style={{ display: 'grid', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Meta Title</label>
              <input
                type="text" name="metaTitle" value={formData.metaTitle} onChange={handleChange} placeholder="Optional custom meta title"
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Meta Description</label>
              <textarea
                name="metaDescription" rows={3} value={formData.metaDescription} onChange={handleChange} placeholder="Optional meta description for search engines"
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', outline: 'none', resize: 'vertical' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Meta Keywords</label>
              <input
                type="text" name="metaKeywords" value={formData.metaKeywords} onChange={handleChange} placeholder="e.g. gift, customized, mug (comma separated)"
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', outline: 'none' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
            <button type="button" onClick={() => navigate('/products')} style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', cursor: 'pointer', fontWeight: 600 }}>
              Cancel
            </button>
            <button type="submit" disabled={loading} style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', border: 'none', background: 'var(--primary-accent)', color: 'white', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 600 }}>
              {loading ? 'Saving...' : 'Save Product'}
            </button>
          </div>
        </form>
      )}

      {activeTab === 'variants' && (
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Manage Variants</h2>
            <button
              onClick={() => {
                setEditingVariant(null);
                setVariantForm({ name: '', sku: `VAR-${Math.random().toString(36).substring(2, 6).toUpperCase()}`, price: formData.price, stock: 0, image: '' });
                setVariantModalOpen(true);
              }}
              style={{ background: 'var(--primary-accent)', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
            >
              + Add Variant
            </button>
          </div>

          {formData.variants.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No variants created yet.</div>
          ) : (
            <div className="table-container">
              <table style={{ width: '100%', textAlign: 'left' }}>
                <thead>
                  <tr>
                    <th style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>Image</th>
                    <th style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>Variant Name</th>
                    <th style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>SKU</th>
                    <th style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>Price</th>
                    <th style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>Stock</th>
                    <th style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-color)', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.variants.map((v: any) => (
                    <tr key={v.id}>
                      <td style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
                        {v.image ? <img src={v.image} alt={v.name} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} /> : <div style={{ width: '40px', height: '40px', background: 'var(--surface-color)', borderRadius: '4px' }} />}
                      </td>
                      <td style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-color)', fontWeight: 600 }}>{v.name}</td>
                      <td style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-color)', fontFamily: 'monospace' }}>{v.sku}</td>
                      <td style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>₹{v.price}</td>
                      <td style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>{v.stock}</td>
                      <td style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-color)', textAlign: 'right' }}>
                        <button
                          onClick={() => {
                            setEditingVariant(v);
                            setVariantForm({ name: v.name, sku: v.sku, price: v.price, stock: v.stock, image: v.image || '' });
                            setVariantModalOpen(true);
                          }}
                          style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', marginRight: '1rem' }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={async () => {
                            if (!window.confirm('Delete this variant?')) return;

                            if (!isEdit) {
                              setFormData(prev => ({ ...prev, variants: prev.variants.filter(va => va.id !== v.id) }));
                              return;
                            }

                            const toastId = toast.loading('Deleting variant...');
                            try {
                              await api.delete(`/products/${id}/variants/${v.id}`);
                              setFormData(prev => ({ ...prev, variants: prev.variants.filter(va => va.id !== v.id) }));
                              toast.success('Variant deleted', { id: toastId });
                            } catch (e: any) {
                              toast.error(e.response?.data?.message || 'Failed to delete', { id: toastId });
                            }
                          }}
                          style={{ background: 'transparent', border: 'none', color: 'var(--danger-accent)', cursor: 'pointer' }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {variantModalOpen && createPortal(
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }} onClick={() => setVariantModalOpen(false)}>
          <div className="glass-panel slide-up" style={{ width: '100%', maxWidth: '400px', padding: '1.5rem', background: 'var(--bg-color)' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>{editingVariant ? 'Edit Variant' : 'Create Variant'}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Name (e.g. Size: M, Color: Red)</label>
                <input type="text" value={variantForm.name} onChange={e => setVariantForm({ ...variantForm, name: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--surface-color)', outline: 'none' }} />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Variant Image</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  {variantForm.image ? (
                    <div style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '8px', overflow: 'hidden' }}>
                      <img src={variantForm.image} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button onClick={() => setVariantForm({ ...variantForm, image: '' })} style={{ position: 'absolute', top: '4px', right: '4px', background: 'var(--danger-accent)', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer' }}>✕</button>
                    </div>
                  ) : (
                    <label style={{ width: '80px', height: '80px', borderRadius: '8px', border: '2px dashed var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: uploadingVariantImage ? 'not-allowed' : 'pointer', color: 'var(--text-secondary)' }}>
                      {uploadingVariantImage ? '...' : <UploadCloud size={20} />}
                      <input type="file" accept="image/*" disabled={uploadingVariantImage} onChange={async (e) => {
                        if (!e.target.files?.[0]) return;
                        const fd = new FormData();
                        fd.append('image', e.target.files[0]);
                        setUploadingVariantImage(true);
                        try {
                          const res = await api.post('/uploads', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
                          setVariantForm({ ...variantForm, image: res.data.data.url });
                        } catch (err: any) {
                          alert(err.response?.data?.message || 'Failed to upload');
                        } finally {
                          setUploadingVariantImage(false);
                          if (e.target) e.target.value = '';
                        }
                      }} style={{ display: 'none' }} />
                    </label>
                  )}
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Optional image for this specific variant</div>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>SKU</label>
                <input type="text" value={variantForm.sku} onChange={e => setVariantForm({ ...variantForm, sku: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--surface-color)', outline: 'none' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Price (₹)</label>
                  <input type="number" min="0" value={variantForm.price} onChange={e => setVariantForm({ ...variantForm, price: Number(e.target.value) })} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--surface-color)', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Stock</label>
                  <input type="number" min="0" value={variantForm.stock} onChange={e => setVariantForm({ ...variantForm, stock: Number(e.target.value) })} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--surface-color)', outline: 'none' }} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button onClick={() => setVariantModalOpen(false)} style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                <button
                  onClick={async () => {
                    if (!variantForm.name || !variantForm.sku) return toast.error('Name and SKU required');

                    setVariantModalOpen(false);

                    if (!isEdit) {
                      if (editingVariant) {
                        setFormData(prev => ({ ...prev, variants: prev.variants.map(v => v.id === editingVariant.id ? { ...v, ...variantForm } : v) }));
                      } else {
                        setFormData(prev => ({ ...prev, variants: [...prev.variants, { ...variantForm, id: Math.random().toString() }] }));
                      }
                      return;
                    }

                    const toastId = toast.loading(editingVariant ? 'Updating variant...' : 'Creating variant...');

                    try {
                      if (editingVariant) {
                        await api.patch(`/products/${id}/variants/${editingVariant.id}`, variantForm);
                        setFormData(prev => ({ ...prev, variants: prev.variants.map(v => v.id === editingVariant.id ? { ...v, ...variantForm } : v) }));
                        toast.success('Variant updated', { id: toastId });
                      } else {
                        const res = await api.post(`/products/${id}/variants`, variantForm);
                        setFormData(prev => ({ ...prev, variants: [...prev.variants, res.data.data] }));
                        toast.success('Variant created', { id: toastId });
                      }
                    } catch (e: any) {
                      toast.error(e.response?.data?.message || 'Failed to save variant', { id: toastId });
                    }
                  }}
                  style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: 'none', background: 'var(--primary-accent)', color: 'white', cursor: 'pointer', fontWeight: 600 }}
                >
                  Save Variant
                </button>
              </div>
            </div>
          </div>
        </div>, document.body
      )}
    </div>
  );
};