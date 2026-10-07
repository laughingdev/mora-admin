import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, Save, UploadCloud, Maximize2, Minimize2, RotateCcw, Check, FileText } from 'lucide-react';
import { toast } from 'sonner';
import api from '../lib/api';
import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';
import '@blocknote/mantine/style.css';

export const BlogForm: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const draftKey = `mora_blog_draft_${id || 'new'}`;

  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [draftSavedTime, setDraftSavedTime] = useState<string | null>(null);
  const [hasDraftAvailable, setHasDraftAvailable] = useState(false);
  const [savedDraftData, setSavedDraftData] = useState<any>(null);
  
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

  const handleEditorUpload = useCallback(async (file: File) => {
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
  }, []);

  const editor = useCreateBlockNote({ uploadFile: handleEditorUpload });
  const [editorReady, setEditorReady] = useState(false);
  const loadedIdRef = useRef<string | null>(null);

  // Check for local saved draft on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(draftKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.formData && (parsed.formData.title || parsed.formData.content)) {
          setSavedDraftData(parsed);
          setHasDraftAvailable(true);
        }
      }
    } catch (e) {
      console.error('Error reading local draft', e);
    }
  }, [draftKey]);

  // Load backend blog data
  useEffect(() => {
    if (isEdit && id) {
      if (loadedIdRef.current === id) return;
      loadedIdRef.current = id;

      api.get(`/blogs/${id}`).then(async res => {
        const blog = res.data.data;
        setFormData({
          title: blog.title || '',
          slug: blog.slug || '',
          content: blog.content || '',
          image: blog.image || '',
          isPublished: blog.isPublished ?? true,
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

  // Auto-save draft to localStorage whenever content or form changes
  const saveLocalDraft = useCallback(async (currentFormData = formData) => {
    try {
      let html = currentFormData.content;
      if (editor) {
        try {
          html = await editor.blocksToHTMLLossy(editor.document);
        } catch (e) {}
      }
      const dataToSave = {
        formData: { ...currentFormData, content: html },
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem(draftKey, JSON.stringify(dataToSave));
      setDraftSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (e) {
      console.error('Failed to save draft to localStorage', e);
    }
  }, [draftKey, editor, formData]);

  const restoreDraft = async () => {
    if (!savedDraftData || !savedDraftData.formData) return;
    const d = savedDraftData.formData;
    setFormData(d);
    if (d.content && editor) {
      try {
        const blocks = await editor.tryParseHTMLToBlocks(d.content);
        editor.replaceBlocks(editor.document, blocks);
      } catch (e) {
        console.error('Failed to parse restored HTML to blocks', e);
      }
    }
    setHasDraftAvailable(false);
    toast.success('Restored unsaved draft!');
  };

  const discardDraft = () => {
    localStorage.removeItem(draftKey);
    setHasDraftAvailable(false);
    toast.info('Draft discarded');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    setFormData(prev => {
      const updated = {
        ...prev,
        [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
      };
      saveLocalDraft(updated);
      return updated;
    });
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
      setFormData(prev => {
        const updated = { ...prev, image: res.data.data.url };
        saveLocalDraft(updated);
        return updated;
      });
      toast.success('Image uploaded', { id: toastId });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to upload image', { id: toastId });
    } finally {
      setUploadingImage(false);
      if (e.target) e.target.value = '';
    }
  };

  const saveBlog = useCallback(async (shouldNavigateAway = false) => {
    setLoading(true);
    try {
      let contentHtml = formData.content;
      if (editor) {
        try {
          contentHtml = await editor.blocksToHTMLLossy(editor.document);
        } catch (e) {
          console.error('Failed to export editor content to HTML', e);
        }
      }

      const payload = {
        ...formData,
        content: contentHtml
      };

      if (isEdit) {
        await api.patch(`/blogs/${id}`, payload);
        toast.success('Blog updated successfully');
      } else {
        const res = await api.post('/blogs', payload);
        toast.success('Blog created successfully');
        if (!shouldNavigateAway && res.data?.data?.id) {
          navigate(`/blogs/edit/${res.data.data.id}`, { replace: true });
        }
      }

      // Clear local draft after successful save to backend DB
      localStorage.removeItem(draftKey);
      setDraftSavedTime(null);
      setHasDraftAvailable(false);

      if (shouldNavigateAway) {
        navigate('/blogs');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save blog');
    } finally {
      setLoading(false);
    }
  }, [editor, formData, id, isEdit, navigate, draftKey]);

  // Support Ctrl+S / Cmd+S shortcut to save draft quickly
  useEffect(() => {
    const handleShortcut = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveBlog(false);
      }
    };
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, [saveBlog]);

  const handleEditorChange = async () => {
    try {
      const html = await editor.blocksToHTMLLossy(editor.document);
      setFormData(prev => {
        const updated = { ...prev, content: html };
        saveLocalDraft(updated);
        return updated;
      });
    } catch (e) {}
  };

  return (
    <div className="fade-in">
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button type="button" onClick={() => navigate('/blogs')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--text-secondary)' }}>
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 style={{ fontSize: '1.75rem', lineHeight: '1.2' }}>{isEdit ? 'Edit Blog' : 'Create New Blog'}</h1>
            {draftSavedTime && (
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
                <Check size={12} color="var(--success-accent, #10b981)" /> Local draft saved at {draftSavedTime}
              </span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button 
            type="button" 
            onClick={() => setIsFullscreen(!isFullscreen)} 
            style={{ 
              display: 'flex', alignItems: 'center', gap: '0.5rem', 
              padding: '0.6rem 1rem', borderRadius: '8px', 
              border: '1px solid var(--border-color)', background: 'var(--surface-color)', 
              color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 500
            }}
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            {isFullscreen ? 'Exit Fullscreen' : 'Full Page View'}
          </button>

          <button 
            type="button" 
            disabled={loading}
            onClick={() => saveBlog(false)} 
            style={{ 
              display: 'flex', alignItems: 'center', gap: '0.5rem', 
              padding: '0.6rem 1rem', borderRadius: '8px', 
              border: '1px solid var(--border-color)', background: 'var(--surface-color)', 
              color: 'var(--text-primary)', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 600 
            }}
          >
            <Save size={16} /> {loading ? 'Saving...' : 'Save Draft'}
          </button>

          <button 
            type="button" 
            disabled={loading}
            onClick={() => saveBlog(true)} 
            style={{ 
              display: 'flex', alignItems: 'center', gap: '0.5rem', 
              padding: '0.6rem 1.25rem', borderRadius: '8px', 
              border: 'none', background: 'var(--primary-accent)', 
              color: 'white', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 600 
            }}
          >
            <Save size={16} /> {loading ? 'Saving...' : 'Save & Close'}
          </button>
        </div>
      </div>

      {/* Draft restoration alert banner */}
      {hasDraftAvailable && (
        <div className="glass-panel" style={{ padding: '1rem 1.5rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: '4px solid var(--primary-accent)', background: 'rgba(99, 102, 241, 0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <RotateCcw size={20} color="var(--primary-accent)" />
            <div>
              <strong>Unsaved draft found</strong>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                You have a local draft saved on {savedDraftData?.updatedAt ? new Date(savedDraftData.updatedAt).toLocaleString() : 'earlier'}. Would you like to restore it?
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="button" onClick={restoreDraft} style={{ padding: '0.4rem 0.85rem', borderRadius: '6px', border: 'none', background: 'var(--primary-accent)', color: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
              Restore Draft
            </button>
            <button type="button" onClick={discardDraft} style={{ padding: '0.4rem 0.85rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.85rem' }}>
              Discard
            </button>
          </div>
        </div>
      )}

      {/* Main Layout Container */}
      <div style={{ display: 'grid', gap: '2rem', gridTemplateColumns: '1fr 350px' }}>
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
              placeholder="Enter blog title"
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
              placeholder="e.g. my-blog-post"
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label style={{ fontWeight: 600 }}>Content</label>
              <button 
                type="button" 
                onClick={() => setIsFullscreen(true)}
                style={{ background: 'transparent', border: 'none', color: 'var(--primary-accent)', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600 }}
              >
                <Maximize2 size={14} /> Expand Editor
              </button>
            </div>

            <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden', background: 'var(--surface-color)', minHeight: '450px', display: 'flex', flexDirection: 'column' }}>
              {editorReady ? (
                <BlockNoteView 
                  editor={editor} 
                  theme="light"
                  onChange={handleEditorChange}
                  style={{ minHeight: '450px', padding: '1rem' }} 
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button 
                type="button"
                disabled={loading} 
                onClick={() => saveBlog(false)} 
                style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--surface-color)', color: 'var(--text-primary)', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 600 }}
              >
                <Save size={18} /> {loading ? 'Saving...' : 'Save Draft (Stay)'}
              </button>

              <button 
                type="button" 
                disabled={loading} 
                onClick={() => saveBlog(true)} 
                style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', borderRadius: '8px', border: 'none', background: 'var(--primary-accent)', color: 'white', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 600 }}
              >
                <Check size={18} /> {loading ? 'Saving...' : 'Save & Exit'}
              </button>
            </div>
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
      </div>

      {/* Full Screen Editor Overlay Mode */}
      {isFullscreen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9999,
          background: 'var(--bg-color, #f8fafc)',
          display: 'flex',
          flexDirection: 'column',
          padding: '1.5rem',
          boxSizing: 'border-box'
        }}>
          {/* Fullscreen Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <FileText size={22} color="var(--primary-accent)" />
              <div>
                <h2 style={{ fontSize: '1.25rem', margin: 0 }}>
                  Editing: {formData.title || 'Untitled Blog'}
                </h2>
                {draftSavedTime && (
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Auto-saved draft at {draftSavedTime}</span>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <button 
                type="button" 
                disabled={loading}
                onClick={() => saveBlog(false)} 
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--surface-color)', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 600 }}
              >
                <Save size={16} /> Save Progress
              </button>

              <button 
                type="button" 
                onClick={() => setIsFullscreen(false)} 
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '6px', border: 'none', background: 'var(--primary-accent)', color: 'white', cursor: 'pointer', fontWeight: 600 }}
              >
                <Minimize2 size={16} /> Exit Full Screen
              </button>
            </div>
          </div>

          {/* Expanded BlockNote Editor Container */}
          <div style={{ flex: 1, overflowY: 'auto', background: 'var(--surface-color, #ffffff)', borderRadius: '8px', border: '1px solid var(--border-color)', padding: '1.5rem' }}>
            {editorReady && (
              <BlockNoteView 
                editor={editor} 
                theme="light"
                onChange={handleEditorChange}
                style={{ minHeight: '100%', padding: '1rem' }} 
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};