import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';
import api from '../lib/api';
import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';
import '@blocknote/mantine/style.css';

export const PageForm: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    isPublished: true,
    metaTitle: '',
    metaDescription: '',
    metaKeywords: ''
  });

  const handleUpload = async (file: File) => {
    const fd = new FormData();
    fd.append('image', file);
    try {
      const res = await api.post('/uploads', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return res.data.data.url;
    } catch (err: any) {
      toast.error('Failed to upload image');
      return '';
    }
  };

  const editor = useCreateBlockNote({ uploadFile: handleUpload });
  const [editorReady, setEditorReady] = useState(false);

  useEffect(() => {
    if (isEdit) {
      api.get(`/pages/${id}`).then(async res => {
        const page = res.data.data;
        setFormData({
          title: page.title || '',
          slug: page.slug || '',
          content: page.content || '',
          isPublished: page.isPublished,
          metaTitle: page.metaTitle || '',
          metaDescription: page.metaDescription || '',
          metaKeywords: page.metaKeywords || ''
        });

        if (page.content) {
          try {
            const blocks = await editor.tryParseHTMLToBlocks(page.content);
            editor.replaceBlocks(editor.document, blocks);
          } catch (e) {
            console.error('Failed to parse HTML to blocks', e);
          }
        }
        setEditorReady(true);
      }).catch(() => {
        toast.error('Failed to load page');
        navigate('/pages');
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

  // Auto-generate slug from title if it's a new page and slug is empty
  const handleTitleBlur = () => {
    if (!isEdit && !formData.slug && formData.title) {
      setFormData(prev => ({
        ...prev,
        slug: formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEdit) {
        await api.patch(`/pages/${id}`, formData);
        toast.success('Page updated successfully');
      } else {
        await api.post('/pages', formData);
        toast.success('Page created successfully');
      }
      navigate('/pages');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save page');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <button onClick={() => navigate('/pages')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--text-secondary)' }}>
          <ArrowLeft size={24} />
        </button>
        <h1 style={{ fontSize: '1.75rem' }}>{isEdit ? 'Edit Page' : 'Create New Page'}</h1>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '2rem', gridTemplateColumns: '1fr 350px' }}>
        <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Page Title</label>
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
              <span style={{ fontWeight: 600 }}>Publish Page</span>
            </label>

            <button type="submit" disabled={loading} style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', borderRadius: '8px', border: 'none', background: 'var(--primary-accent)', color: 'white', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 600 }}>
              <Save size={18} /> {loading ? 'Saving...' : 'Save Page'}
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