import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, Save, UploadCloud } from 'lucide-react';
import { toast } from 'sonner';
import api from '../lib/api';
import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';
import '@blocknote/mantine/style.css';

export const BlogForm: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    image: '',
    isPublished: true,
    metaTitle: '',
    metaDescription: '',
    metaKeywords: ''
  });

  const handleEditorUpload = async (file: File) => {
    const fd = new FormData();
    fd.append('image', file);
    try {
      const res = await api.post('/uploads', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return res.data.data.url;
    } catch (err: any) {
      toast.error('Failed to upload image to editor');
      return '';
    }
  };

  const editor = useCreateBlockNote({ uploadFile: handleEditorUpload });
  const [editorReady, setEditorReady] = useState(false);

  useEffect(() => {
    if (isEdit) {
      api.get(`/blogs/${id}`).then(async res => {
        const blog = res.data.data;
        setFormData({
          title: blog.title || '',
          slug: blog.slug || '',
          content: blog.content || '',
          image: blog.image || '',
          isPublished: blog.isPublished,
          metaTitle: blog.metaTitle || '',
          metaDescription: blog.metaDescription || '',
          metaKeywords: blog.metaKeywords || ''
        });

        if (blog.content) {
          try {
            const blocks = await editor.tryParseHTMLToBlocks(blog.content);
            editor.replaceBlocks(editor.document, blocks);
          } catch (e) {
            console.error('Failed to parse HTML to blocks', e);
          }
        }
        setEditorReady(true);
      }).catch(() => {
        toast.error('Failed to load blog');
        navigate('/blogs');
      });
    } else {
      setEditorReady(true);
    }
  }, [id, isEdit, navigate, editor]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleTitleBlur = () => {
    if (!isEdit && !formData.slug && formData.title) {
      setFormData(prev => ({
        ...prev,
        slug: formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
      }));
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
    setLoading(true);
    try {
      if (isEdit) {
        await api.patch(`/blogs/${id}`, formData);
        toast.success('Blog updated successfully');
      } else {
        await api.post('/blogs', formData);
        toast.success('Blog created successfully');
      }
      navigate('/blogs');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save blog');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <button onClick={() => navigate('/blogs')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--text-secondary)' }}>
          <ArrowLeft size={24} />
        </button>
        <h1 style={{ fontSize: '1.75rem' }}>{isEdit ? 'Edit Blog' : 'Create New Blog'}</h1>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '2rem', gridTemplateColumns: '1fr 350px' }}>
        <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Blog Title</label>
            <input 
              type="text" 
              name="title" 
              required
              value={formData.title} 
              onChange={handleChange} 
              onBlur={handleTitleBlur}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', outline: 'none' }} 
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Slug (URL path)</label>
            <input 
              type="text" 
              name="slug" 
              required
              value={formData.slug} 
              onChange={handleChange} 
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', outline: 'none' }} 
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Featured Image</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {formData.image && (
                <div style={{ position: 'relative', width: '120px', height: '80px', borderRadius: '8px', overflow: 'hidden' }}>
                  <img src={formData.image} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button type="button" onClick={() => setFormData(prev => ({...prev, image: ''}))} style={{ position: 'absolute', top: '4px', right: '4px', background: 'var(--danger-accent)', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer' }}>✕</button>
                </div>
              )}
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', background: 'var(--surface-color)', borderRadius: '8px', cursor: 'pointer', border: '1px solid var(--border-color)', fontSize: '0.875rem' }}>
                <UploadCloud size={16} /> {uploadingImage ? 'Uploading...' : formData.image ? 'Change Image' : 'Upload Image'}
                <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} disabled={uploadingImage} />
              </label>
            </div>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Content</label>
            <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden', background: 'var(--surface-color)', minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
              {editorReady ? (
                <BlockNoteView 
                  editor={editor} 
                  theme="light"
                  onChange={async () => {
                    const html = await editor.blocksToHTMLLossy(editor.document);
                    setFormData(prev => ({ ...prev, content: html }));
                  }}
                  style={{ minHeight: '400px', padding: '1rem' }} 
                />
              ) : (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading editor...</div>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Publishing</h3>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', marginBottom: '1.5rem' }}>
              <input 
                type="checkbox" 
                name="isPublished" 
                checked={formData.isPublished} 
                onChange={handleChange} 
                style={{ width: '1.25rem', height: '1.25rem', accentColor: 'var(--primary-accent)' }} 
              />
              <span style={{ fontWeight: 600 }}>Publish Blog</span>
            </label>

            <button type="submit" disabled={loading} style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', borderRadius: '8px', border: 'none', background: 'var(--primary-accent)', color: 'white', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 600 }}>
              <Save size={18} /> {loading ? 'Saving...' : 'Save Blog'}
            </button>
          </div>

          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>SEO Settings</h3>
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.875rem' }}>Meta Title</label>
              <input 
                type="text" 
                name="metaTitle" 
                value={formData.metaTitle} 
                onChange={handleChange} 
                style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', outline: 'none' }} 
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.875rem' }}>Meta Description</label>
              <textarea 
                name="metaDescription" 
                value={formData.metaDescription} 
                onChange={handleChange} 
                rows={3}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', outline: 'none', resize: 'vertical' }} 
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.875rem' }}>Meta Keywords</label>
              <input 
                type="text" 
                name="metaKeywords" 
                placeholder="Comma separated"
                value={formData.metaKeywords} 
                onChange={handleChange} 
                style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', outline: 'none' }} 
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};