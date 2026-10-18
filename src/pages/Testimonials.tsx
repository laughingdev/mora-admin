import React, { useState } from 'react';
import useSWR from 'swr';
import { Plus, Edit2, Trash2, Video, UploadCloud, X, Eye, EyeOff, Play, User, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '../lib/api';
import { Loader } from '../components/Loader';

interface TestimonialItem {
  id: string;
  name: string;
  designation?: string | null;
  title?: string | null;
  description?: string | null;
  videoUrl: string;
  thumbnailUrl?: string | null;
  active: boolean;
  sortOrder: number;
  createdAt: string;
}

export const Testimonials: React.FC = () => {
  const { data: testimonials = [], isLoading, mutate } = useSWR<TestimonialItem[]>(
    '/testimonials/admin',
    (url: string) => api.get(url).then(res => res.data.data)
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState('');
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingThumb, setUploadingThumb] = useState(false);
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    designation: '',
    title: '',
    description: '',
    videoUrl: '',
    thumbnailUrl: '',
    sortOrder: 0,
    active: true
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData(prev => ({ ...prev, [name]: val }));
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    const fd = new FormData();
    fd.append('file', file);

    setUploadingVideo(true);
    const toastId = toast.loading('Uploading video to media cloud...');
    try {
      const res = await api.post('/uploads/media', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFormData(prev => ({ ...prev, videoUrl: res.data.data.url }));
      toast.success('Video uploaded successfully', { id: toastId });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to upload video', { id: toastId });
    } finally {
      setUploadingVideo(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    const fd = new FormData();
    fd.append('image', file);

    setUploadingThumb(true);
    const toastId = toast.loading('Uploading thumbnail image...');
    try {
      const res = await api.post('/uploads', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFormData(prev => ({ ...prev, thumbnailUrl: res.data.data.url }));
      toast.success('Thumbnail uploaded successfully', { id: toastId });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to upload thumbnail', { id: toastId });
    } finally {
      setUploadingThumb(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleCreate = () => {
    setIsEditing(false);
    setCurrentId('');
    setFormData({
      name: '',
      designation: '',
      title: '',
      description: '',
      videoUrl: '',
      thumbnailUrl: '',
      sortOrder: (testimonials.length || 0) + 1,
      active: true
    });
    setIsModalOpen(true);
  };

  const handleEdit = (item: TestimonialItem) => {
    setIsEditing(true);
    setCurrentId(item.id);
    setFormData({
      name: item.name || '',
      designation: item.designation || '',
      title: item.title || '',
      description: item.description || '',
      videoUrl: item.videoUrl || '',
      thumbnailUrl: item.thumbnailUrl || '',
      sortOrder: item.sortOrder ?? 0,
      active: Boolean(item.active)
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete the testimonial from "${name}"?`)) return;
    const toastId = toast.loading('Deleting testimonial...');
    try {
      await api.delete(`/testimonials/${id}`);
      mutate(testimonials.filter(it => it.id !== id), false);
      toast.success('Testimonial deleted successfully', { id: toastId });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete testimonial', { id: toastId });
    }
  };

  const handleToggleActive = async (item: TestimonialItem) => {
    const newActive = !item.active;
    try {
      await api.patch(`/testimonials/${item.id}`, { active: newActive });
      mutate(testimonials.map(it => it.id === item.id ? { ...it, active: newActive } : it), false);
      toast.success(newActive ? 'Testimonial activated on homepage' : 'Testimonial hidden from homepage');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to update status');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Please enter the person's name");
      return;
    }
    if (!formData.videoUrl.trim()) {
      toast.error('Please upload a video or provide a valid video URL');
      return;
    }

    const toastId = toast.loading(isEditing ? 'Updating testimonial...' : 'Creating testimonial...');
    try {
      const payload = {
        name: formData.name.trim(),
        designation: formData.designation.trim() || null,
        title: formData.title.trim() || null,
        description: formData.description.trim() || null,
        videoUrl: formData.videoUrl.trim(),
        thumbnailUrl: formData.thumbnailUrl.trim() || null,
        sortOrder: Number(formData.sortOrder) || 0,
        active: Boolean(formData.active)
      };

      if (isEditing) {
        const res = await api.patch(`/testimonials/${currentId}`, payload);
        mutate(testimonials.map(it => it.id === currentId ? res.data.data : it), false);
        toast.success('Testimonial updated successfully', { id: toastId });
      } else {
        const res = await api.post('/testimonials', payload);
        mutate([res.data.data, ...testimonials], false);
        toast.success('Testimonial created successfully', { id: toastId });
      }
      setIsModalOpen(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save testimonial', { id: toastId });
    }
  };

  return (
    <div className="fade-in">
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: '0 0 0.25rem 0', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Video size={26} color="var(--primary-accent)" /> Video Testimonials
          </h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Manage customer video reviews displayed in the homepage Testimonials section (above Build Your Gift).
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.25rem' }}
        >
          <Plus size={18} /> Add Testimonial
        </button>
      </div>

      {/* Main Panel */}
      <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '12px' }}>
        {isLoading ? (
          <Loader />
        ) : testimonials.length === 0 ? (
          <div style={{ padding: '4rem 1rem', textAlign: 'center', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <Video size={48} opacity={0.3} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>No Video Testimonials Yet</h3>
            <p style={{ maxWidth: '440px', margin: 0, fontSize: '0.9rem', lineHeight: '1.5' }}>
              The homepage testimonials section will remain automatically hidden until you add and activate video testimonials here.
            </p>
            <button onClick={handleCreate} className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
              <Plus size={16} /> Create First Testimonial
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {testimonials.map(item => (
              <div
                key={item.id}
                style={{
                  background: 'var(--surface-color)',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                }}
              >
                {/* Video / Poster Header */}
                <div style={{ position: 'relative', height: '200px', background: '#0f172a', overflow: 'hidden' }}>
                  {item.thumbnailUrl ? (
                    <img
                      src={item.thumbnailUrl}
                      alt={item.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <video
                      src={item.videoUrl}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      preload="metadata"
                    />
                  )}

                  {/* Play preview trigger */}
                  <button
                    type="button"
                    onClick={() => setPreviewVideoUrl(item.videoUrl)}
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.9)',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                      transition: 'transform 0.2s ease',
                      color: 'var(--primary-accent)'
                    }}
                    title="Play Video Preview"
                  >
                    <Play size={22} fill="currentColor" style={{ marginLeft: '3px' }} />
                  </button>

                  {/* Badges */}
                  <div style={{ position: 'absolute', top: '0.75rem', left: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '0.2rem 0.6rem',
                        borderRadius: '999px',
                        background: item.active ? 'rgba(16, 185, 129, 0.9)' : 'rgba(100, 116, 139, 0.85)',
                        color: '#fff',
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase'
                      }}
                    >
                      {item.active ? 'Active' : 'Inactive'}
                    </span>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        padding: '0.2rem 0.5rem',
                        borderRadius: '999px',
                        background: 'rgba(0,0,0,0.5)',
                        color: '#fff'
                      }}
                    >
                      Order #{item.sortOrder}
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <User size={16} color="var(--primary-accent)" />
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {item.name}
                    </h3>
                  </div>

                  {item.designation && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500, marginBottom: '0.5rem' }}>
                      {item.designation}
                    </div>
                  )}

                  {item.title && (
                    <div style={{ fontSize: '0.925rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.35rem', marginBottom: '0.25rem' }}>
                      "{item.title}"
                    </div>
                  )}

                  {item.description && (
                    <p style={{ margin: '0.25rem 0 0.75rem 0', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {item.description}
                    </p>
                  )}

                  {/* Card Actions Footer */}
                  <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={() => handleToggleActive(item)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        color: item.active ? 'var(--success-accent)' : 'var(--text-secondary)'
                      }}
                    >
                      {item.active ? <Eye size={16} /> : <EyeOff size={16} />}
                      {item.active ? 'Live on Home' : 'Hidden'}
                    </button>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={() => handleEdit(item)}
                        style={{
                          background: 'white',
                          border: '1px solid var(--border-color)',
                          borderRadius: '6px',
                          padding: '0.4rem 0.75rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          color: 'var(--text-primary)'
                        }}
                      >
                        <Edit2 size={14} /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id, item.name)}
                        style={{
                          background: 'transparent',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          borderRadius: '6px',
                          padding: '0.4rem 0.6rem',
                          display: 'flex',
                          alignItems: 'center',
                          cursor: 'pointer',
                          color: 'var(--danger-accent)'
                        }}
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Video Preview Modal */}
      {previewVideoUrl && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem'
          }}
          onClick={() => setPreviewVideoUrl(null)}
        >
          <div
            style={{ position: 'relative', width: '100%', maxWidth: '700px', background: '#000', borderRadius: '12px', overflow: 'hidden' }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewVideoUrl(null)}
              style={{
                position: 'absolute',
                top: '0.75rem',
                right: '0.75rem',
                background: 'rgba(0,0,0,0.6)',
                border: 'none',
                color: '#fff',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 10
              }}
            >
              <X size={20} />
            </button>
            <video src={previewVideoUrl} controls autoPlay style={{ width: '100%', maxHeight: '80vh', display: 'block' }} />
          </div>
        </div>
      )}

      {/* Add / Edit Testimonial Modal */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            zIndex: 9998,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            overflowY: 'auto'
          }}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '16px',
              maxWidth: '620px',
              width: '100%',
              padding: '2rem',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700 }}>
                {isEditing ? 'Edit Video Testimonial' : 'New Video Testimonial'}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
              >
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Person Name & Designation */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
                    Person's Name <span style={{ color: 'var(--danger-accent)' }}>*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. Priya Sharma"
                    required
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.9rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
                    Designation / Basic Info
                  </label>
                  <input
                    type="text"
                    name="designation"
                    value={formData.designation}
                    onChange={handleChange}
                    placeholder="e.g. Verified Buyer, Mumbai"
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.9rem' }}
                  />
                </div>
              </div>

              {/* Optional Title */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
                  Optional Title / Headline
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g. Absolutely loved the personalized hamper!"
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.9rem' }}
                />
              </div>

              {/* Optional Description */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
                  Optional Description / Quote
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Write customer thoughts or key excerpts from the video..."
                  rows={3}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.9rem', resize: 'vertical' }}
                />
              </div>

              {/* Video Upload & URL */}
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                  Video Media <span style={{ color: 'var(--danger-accent)' }}>*</span>
                </label>
                <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Upload a video file (MP4, WebM, MOV up to 100MB) OR enter a direct video URL.
                </p>

                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                  <label
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      background: 'white',
                      border: '1px solid var(--border-color)',
                      padding: '0.5rem 1rem',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      cursor: uploadingVideo ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <UploadCloud size={16} />
                    {uploadingVideo ? 'Uploading...' : 'Upload Video File'}
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleVideoUpload}
                      disabled={uploadingVideo}
                      style={{ display: 'none' }}
                    />
                  </label>
                  {formData.videoUrl && (
                    <span style={{ fontSize: '0.8rem', color: 'var(--success-accent)', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600 }}>
                      <CheckCircle2 size={14} /> Video Attached
                    </span>
                  )}
                </div>

                <input
                  type="url"
                  name="videoUrl"
                  value={formData.videoUrl}
                  onChange={handleChange}
                  placeholder="Or paste video URL (e.g. https://res.cloudinary.com/.../video.mp4)"
                  required
                  style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.85rem', background: '#fff' }}
                />
              </div>

              {/* Optional Poster / Thumbnail */}
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                  Video Poster / Thumbnail (Optional)
                </label>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                  <label
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      background: 'white',
                      border: '1px solid var(--border-color)',
                      padding: '0.5rem 1rem',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      cursor: uploadingThumb ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <UploadCloud size={16} />
                    {uploadingThumb ? 'Uploading...' : 'Upload Thumbnail Image'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleThumbnailUpload}
                      disabled={uploadingThumb}
                      style={{ display: 'none' }}
                    />
                  </label>
                  {formData.thumbnailUrl && (
                    <img src={formData.thumbnailUrl} alt="Thumbnail preview" style={{ width: '36px', height: '36px', objectFit: 'cover', borderRadius: '4px' }} />
                  )}
                </div>
                <input
                  type="url"
                  name="thumbnailUrl"
                  value={formData.thumbnailUrl}
                  onChange={handleChange}
                  placeholder="Or paste image URL for video poster frame"
                  style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.85rem', background: '#fff' }}
                />
              </div>

              {/* Sort Order & Active Switch */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Display Order:
                  </label>
                  <input
                    type="number"
                    name="sortOrder"
                    value={formData.sortOrder}
                    onChange={handleChange}
                    style={{ width: '80px', padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
                  />
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  <input
                    type="checkbox"
                    name="active"
                    checked={formData.active}
                    onChange={handleChange}
                    style={{ width: '18px', height: '18px', accentColor: 'var(--primary-accent)' }}
                  />
                  Active (Visible on Homepage)
                </label>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{ padding: '0.65rem 1.25rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', cursor: 'pointer', fontWeight: 600 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ padding: '0.65rem 1.5rem', fontWeight: 600 }}
                >
                  {isEditing ? 'Save Changes' : 'Create Testimonial'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
