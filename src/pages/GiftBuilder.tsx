import { Loader } from '../components/Loader';
import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, CheckCircle, XCircle, Gift, Mail, UploadCloud, X, LayoutList, LayoutGrid, Sparkles } from 'lucide-react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import api from '../lib/api';
import useSWR from 'swr';

export const GiftBuilder: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'boxes' | 'cards'>('boxes');
  const [view, setView] = useState<'list' | 'card'>(window.innerWidth < 768 ? 'card' : 'list');

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) setView('card');
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch Boxes & Cards
  const { data: boxes = [], mutate: mutateBoxes, isLoading: loadingBoxes } = useSWR(
    '/boxes',
    url => api.get(url).then(res => res.data.data)
  );

  const { data: cards = [], mutate: mutateCards, isLoading: loadingCards } = useSWR(
    '/cards',
    url => api.get(url).then(res => res.data.data)
  );

  // Box Modal State
  const [boxModalOpen, setBoxModalOpen] = useState(false);
  const [editingBox, setEditingBox] = useState<any>(null);
  const [uploadingBoxImg, setUploadingBoxImg] = useState(false);
  const [boxForm, setBoxForm] = useState({
    name: '',
    description: '',
    price: 0,
    minItems: 3,
    maxItems: 7,
    active: true,
    images: [] as string[]
  });

  // Card Modal State
  const [cardModalOpen, setCardModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<any>(null);
  const [uploadingCardImg, setUploadingCardImg] = useState(false);
  const [cardForm, setCardForm] = useState({
    name: '',
    description: '',
    price: 0,
    type: 'handwritten',
    active: true,
    images: [] as string[]
  });

  // Image Upload helper
  const handleUploadImages = async (
    files: FileList | null,
    target: 'box' | 'card'
  ) => {
    if (!files || files.length === 0) return;
    const fd = new FormData();
    Array.from(files).forEach(f => fd.append('images', f));

    if (target === 'box') setUploadingBoxImg(true);
    else setUploadingCardImg(true);

    try {
      const res = await api.post('/uploads/multiple', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const urls = res.data.data.map((item: any) => item.url);
      if (target === 'box') {
        setBoxForm(prev => ({ ...prev, images: [...prev.images, ...urls] }));
      } else {
        setCardForm(prev => ({ ...prev, images: [...prev.images, ...urls] }));
      }
      toast.success('Images uploaded successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to upload images');
    } finally {
      if (target === 'box') setUploadingBoxImg(false);
      else setUploadingCardImg(false);
    }
  };

  // Open Box Modal
  const openBoxModal = (box?: any) => {
    if (box) {
      setEditingBox(box);
      setBoxForm({
        name: box.name,
        description: box.description || '',
        price: box.price || 0,
        minItems: box.minItems || 3,
        maxItems: box.maxItems || 7,
        active: box.active !== undefined ? box.active : true,
        images: box.images || []
      });
    } else {
      setEditingBox(null);
      setBoxForm({
        name: '',
        description: '',
        price: 0,
        minItems: 3,
        maxItems: 7,
        active: true,
        images: []
      });
    }
    setBoxModalOpen(true);
  };

  // Save Box
  const handleSaveBox = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!boxForm.name.trim()) return toast.error('Box name is required');
    if (boxForm.minItems > boxForm.maxItems) return toast.error('Min items cannot be greater than max items');

    try {
      if (editingBox) {
        await api.patch(`/boxes/${editingBox.id}`, boxForm);
        toast.success('Gift Box updated successfully');
      } else {
        await api.post('/boxes', boxForm);
        toast.success('Gift Box created successfully');
      }
      mutateBoxes();
      setBoxModalOpen(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save gift box');
    }
  };

  // Delete Box
  const handleDeleteBox = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this gift box?')) return;
    try {
      await api.delete(`/boxes/${id}`);
      toast.success('Gift Box deleted');
      mutateBoxes();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete gift box');
    }
  };

  // Open Card Modal
  const openCardModal = (card?: any) => {
    if (card) {
      setEditingCard(card);
      setCardForm({
        name: card.name,
        description: card.description || '',
        price: card.price || 0,
        type: card.type || 'handwritten',
        active: card.active !== undefined ? card.active : true,
        images: card.images || []
      });
    } else {
      setEditingCard(null);
      setCardForm({
        name: '',
        description: '',
        price: 0,
        type: 'handwritten',
        active: true,
        images: []
      });
    }
    setCardModalOpen(true);
  };

  // Save Card
  const handleSaveCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardForm.name.trim()) return toast.error('Card name is required');

    try {
      if (editingCard) {
        await api.patch(`/cards/${editingCard.id}`, cardForm);
        toast.success('Greeting Card updated successfully');
      } else {
        await api.post('/cards', cardForm);
        toast.success('Greeting Card created successfully');
      }
      mutateCards();
      setCardModalOpen(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save greeting card');
    }
  };

  // Delete Card
  const handleDeleteCard = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this greeting card?')) return;
    try {
      await api.delete(`/cards/${id}`);
      toast.success('Greeting Card deleted');
      mutateCards();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete greeting card');
    }
  };

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Sparkles size={28} color="var(--primary-accent)" /> Gift Builder Packaging
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Manage curated hamper boxes and personalized greeting cards for the custom gift builder.
          </p>
        </div>

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
            onClick={() => activeTab === 'boxes' ? openBoxModal() : openCardModal()}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.75rem 1.5rem', borderRadius: '8px',
              background: 'var(--primary-accent)', color: 'white',
              border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.95rem'
            }}>
            <Plus size={18} />
            <span>{activeTab === 'boxes' ? 'Add Gift Box' : 'Add Greeting Card'}</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
        <button
          onClick={() => setActiveTab('boxes')}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            background: 'transparent', border: 'none', padding: '0.75rem 1.25rem',
            cursor: 'pointer', fontWeight: 600, fontSize: '1rem',
            borderBottom: activeTab === 'boxes' ? '2px solid var(--primary-accent)' : '2px solid transparent',
            color: activeTab === 'boxes' ? 'var(--primary-accent)' : 'var(--text-secondary)'
          }}
        >
          <Gift size={18} /> Gift Boxes ({boxes.length})
        </button>
        <button
          onClick={() => setActiveTab('cards')}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            background: 'transparent', border: 'none', padding: '0.75rem 1.25rem',
            cursor: 'pointer', fontWeight: 600, fontSize: '1rem',
            borderBottom: activeTab === 'cards' ? '2px solid var(--primary-accent)' : '2px solid transparent',
            color: activeTab === 'cards' ? 'var(--primary-accent)' : 'var(--text-secondary)'
          }}
        >
          <Mail size={18} /> Greeting Cards ({cards.length})
        </button>
      </div>

      {/* BOXES TAB CONTENT */}
      {activeTab === 'boxes' && (
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          {loadingBoxes ? (
            <Loader />
          ) : view === 'list' ? (
            <div className="table-container desktop-only">
              <table>
                <thead>
                  <tr>
                    <th>Box</th>
                    <th>Price</th>
                    <th>Suitable Items</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {boxes.map((box: any) => (
                    <tr key={box.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div style={{ width: '48px', height: '48px', borderRadius: '8px', overflow: 'hidden', background: 'var(--surface-color)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {box.images && box.images.length > 0 ? (
                              <img src={box.images[0]} alt={box.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <Gift size={20} color="var(--text-secondary)" />
                            )}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--primary-accent)' }}>{box.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', maxWidth: '350px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {box.description || 'No description'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontWeight: 600 }}>
                        {box.price > 0 ? `₹${box.price.toLocaleString('en-IN')}` : <span style={{ color: '#16a34a', background: '#dcfce7', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 700 }}>FREE</span>}
                      </td>
                      <td>
                        <span className="badge" style={{ background: '#e0e7ff', color: '#3730a3', fontWeight: 600 }}>
                          Fits {box.minItems} - {box.maxItems} items
                        </span>
                      </td>
                      <td>
                        {box.active ? (
                          <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                            <CheckCircle size={12} /> Active
                          </span>
                        ) : (
                          <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                            <XCircle size={12} /> Inactive
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <button onClick={() => openBoxModal(box)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.4rem' }}>
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => handleDeleteBox(box.id)} style={{ background: 'transparent', border: 'none', color: 'var(--danger-accent)', cursor: 'pointer', padding: '0.4rem' }}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {boxes.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                        No gift boxes created yet. Click "Add Gift Box" to create one.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
              {boxes.map((box: any) => (
                <div key={box.id} style={{ border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden', background: 'var(--bg-color)', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ height: '160px', background: 'var(--surface-color)', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {box.images && box.images.length > 0 ? (
                      <img src={box.images[0]} alt={box.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <Gift size={40} color="var(--text-secondary)" />
                    )}
                    <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => openBoxModal(box)} style={{ background: 'white', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                        <Edit2 size={14} color="var(--text-primary)" />
                      </button>
                      <button onClick={() => handleDeleteBox(box.id)} style={{ background: 'white', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                        <Trash2 size={14} color="var(--danger-accent)" />
                      </button>
                    </div>
                  </div>
                  <div style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span className="badge" style={{ background: '#e0e7ff', color: '#3730a3', fontSize: '11px', fontWeight: 600 }}>
                        Fits {box.minItems} - {box.maxItems} items
                      </span>
                      {box.active ? <span className="badge badge-success">Active</span> : <span className="badge badge-danger">Hidden</span>}
                    </div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--primary-accent)', marginBottom: '0.5rem' }}>{box.name}</h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem', flex: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {box.description || 'No description provided'}
                    </p>
                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Price</span>
                      <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                        {box.price > 0 ? `₹${box.price.toLocaleString('en-IN')}` : <span style={{ color: '#16a34a' }}>FREE</span>}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {boxes.length === 0 && (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                  No gift boxes found. Click "Add Gift Box" to start.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* CARDS TAB CONTENT */}
      {activeTab === 'cards' && (
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          {loadingCards ? (
            <Loader />
          ) : view === 'list' ? (
            <div className="table-container desktop-only">
              <table>
                <thead>
                  <tr>
                    <th>Greeting Card</th>
                    <th>Type</th>
                    <th>Price</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {cards.map((card: any) => (
                    <tr key={card.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div style={{ width: '48px', height: '48px', borderRadius: '8px', overflow: 'hidden', background: 'var(--surface-color)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {card.images && card.images.length > 0 ? (
                              <img src={card.images[0]} alt={card.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <Mail size={20} color="var(--text-secondary)" />
                            )}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--primary-accent)' }}>{card.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', maxWidth: '350px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {card.description || 'No description'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge" style={{
                          background: card.type === 'handwritten' ? '#fdf2f8' : card.type === 'typed' ? '#eff6ff' : '#f5f3ff',
                          color: card.type === 'handwritten' ? '#be185d' : card.type === 'typed' ? '#1d4ed8' : '#6d28d9',
                          fontWeight: 600
                        }}>
                          {card.type === 'handwritten' ? '✍️ Handwritten' : card.type === 'typed' ? '🖨️ Typed / Printed' : '✍️ & 🖨️ Both'}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>
                        {card.price > 0 ? `₹${card.price.toLocaleString('en-IN')}` : <span style={{ color: '#16a34a', background: '#dcfce7', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 700 }}>FREE</span>}
                      </td>
                      <td>
                        {card.active ? (
                          <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                            <CheckCircle size={12} /> Active
                          </span>
                        ) : (
                          <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                            <XCircle size={12} /> Inactive
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <button onClick={() => openCardModal(card)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.4rem' }}>
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => handleDeleteCard(card.id)} style={{ background: 'transparent', border: 'none', color: 'var(--danger-accent)', cursor: 'pointer', padding: '0.4rem' }}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {cards.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                        No greeting cards created yet. Click "Add Greeting Card" to create one.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
              {cards.map((card: any) => (
                <div key={card.id} style={{ border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden', background: 'var(--bg-color)', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ height: '160px', background: 'var(--surface-color)', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {card.images && card.images.length > 0 ? (
                      <img src={card.images[0]} alt={card.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <Mail size={40} color="var(--text-secondary)" />
                    )}
                    <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => openCardModal(card)} style={{ background: 'white', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                        <Edit2 size={14} color="var(--text-primary)" />
                      </button>
                      <button onClick={() => handleDeleteCard(card.id)} style={{ background: 'white', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                        <Trash2 size={14} color="var(--danger-accent)" />
                      </button>
                    </div>
                  </div>
                  <div style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span className="badge" style={{
                        background: card.type === 'handwritten' ? '#fdf2f8' : card.type === 'typed' ? '#eff6ff' : '#f5f3ff',
                        color: card.type === 'handwritten' ? '#be185d' : card.type === 'typed' ? '#1d4ed8' : '#6d28d9',
                        fontSize: '11px',
                        fontWeight: 600
                      }}>
                        {card.type === 'handwritten' ? '✍️ Handwritten' : card.type === 'typed' ? '🖨️ Typed' : 'Both'}
                      </span>
                      {card.active ? <span className="badge badge-success">Active</span> : <span className="badge badge-danger">Hidden</span>}
                    </div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--primary-accent)', marginBottom: '0.5rem' }}>{card.name}</h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem', flex: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {card.description || 'No description provided'}
                    </p>
                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Price</span>
                      <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                        {card.price > 0 ? `₹${card.price.toLocaleString('en-IN')}` : <span style={{ color: '#16a34a' }}>FREE</span>}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {cards.length === 0 && (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                  No greeting cards found. Click "Add Greeting Card" to start.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* BOX MODAL */}
      {boxModalOpen && createPortal(
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '540px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem', background: 'var(--bg-color)', position: 'relative', borderRadius: '12px' }}>
            <button onClick={() => setBoxModalOpen(false)} style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
              <X size={20} />
            </button>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: 'var(--primary-accent)' }}>
              {editingBox ? 'Edit Gift Box' : 'Add New Gift Box'}
            </h2>
            <form onSubmit={handleSaveBox} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Box Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Royal Pine Wood Keepsake Box"
                  value={boxForm.name}
                  onChange={e => setBoxForm({ ...boxForm, name: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Description</label>
                <textarea
                  rows={3}
                  placeholder="Material, finish, dimensions, feel..."
                  value={boxForm.description}
                  onChange={e => setBoxForm({ ...boxForm, description: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0 = Free"
                    value={boxForm.price}
                    onChange={e => setBoxForm({ ...boxForm, price: Number(e.target.value) })}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', outline: 'none' }}
                  />
                  <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>0 means Free</span>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Min Items</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={boxForm.minItems}
                    onChange={e => setBoxForm({ ...boxForm, minItems: Number(e.target.value) })}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', outline: 'none' }}
                  />
                  <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>e.g. 3</span>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Max Items</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={boxForm.maxItems}
                    onChange={e => setBoxForm({ ...boxForm, maxItems: Number(e.target.value) })}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', outline: 'none' }}
                  />
                  <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>e.g. 7</span>
                </div>
              </div>

              {/* Images */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Box Images</label>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                  {boxForm.images.map((img, i) => (
                    <div key={i} style={{ position: 'relative', width: '70px', height: '70px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                      <img src={img} alt="Box" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button
                        type="button"
                        onClick={() => setBoxForm(p => ({ ...p, images: p.images.filter((_, idx) => idx !== i) }))}
                        style={{ position: 'absolute', top: '2px', right: '2px', background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <label style={{ width: '70px', height: '70px', borderRadius: '8px', border: '2px dashed var(--border-color)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: uploadingBoxImg ? 'not-allowed' : 'pointer', color: 'var(--text-secondary)' }}>
                    {uploadingBoxImg ? <span style={{ fontSize: '10px' }}>...</span> : <><UploadCloud size={20} /><span style={{ fontSize: '9px' }}>Upload</span></>}
                    <input type="file" multiple accept="image/*" onChange={e => handleUploadImages(e.target.files, 'box')} style={{ display: 'none' }} disabled={uploadingBoxImg} />
                  </label>
                </div>
              </div>

              {/* Active Toggle */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 600 }}>
                <input
                  type="checkbox"
                  checked={boxForm.active}
                  onChange={e => setBoxForm({ ...boxForm, active: e.target.checked })}
                  style={{ width: '1.25rem', height: '1.25rem', accentColor: 'var(--primary-accent)' }}
                />
                Active (Available in Builder)
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setBoxModalOpen(false)} style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', border: 'none', background: 'var(--primary-accent)', color: 'white', fontWeight: 600, cursor: 'pointer' }}>
                  {editingBox ? 'Save Changes' : 'Create Box'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* CARD MODAL */}
      {cardModalOpen && createPortal(
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '540px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem', background: 'var(--bg-color)', position: 'relative', borderRadius: '12px' }}>
            <button onClick={() => setCardModalOpen(false)} style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
              <X size={20} />
            </button>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: 'var(--primary-accent)' }}>
              {editingCard ? 'Edit Greeting Card' : 'Add New Greeting Card'}
            </h2>
            <form onSubmit={handleSaveCard} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Card Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Classic Gold Embossed Note"
                  value={cardForm.name}
                  onChange={e => setCardForm({ ...cardForm, name: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Description</label>
                <textarea
                  rows={3}
                  placeholder="Occasion theme, paper weight, gold foil details..."
                  value={cardForm.description}
                  onChange={e => setCardForm({ ...cardForm, description: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0 = Free"
                    value={cardForm.price}
                    onChange={e => setCardForm({ ...cardForm, price: Number(e.target.value) })}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', outline: 'none' }}
                  />
                  <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>0 means Free</span>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Card Type</label>
                  <select
                    value={cardForm.type}
                    onChange={e => setCardForm({ ...cardForm, type: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', outline: 'none' }}
                  >
                    <option value="handwritten">✍️ Handwritten</option>
                    <option value="typed">🖨️ Typed / Digital Printed</option>
                    <option value="both">Both (Customer Choice)</option>
                  </select>
                </div>
              </div>

              {/* Images */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Card Images</label>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                  {cardForm.images.map((img, i) => (
                    <div key={i} style={{ position: 'relative', width: '70px', height: '70px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                      <img src={img} alt="Card" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button
                        type="button"
                        onClick={() => setCardForm(p => ({ ...p, images: p.images.filter((_, idx) => idx !== i) }))}
                        style={{ position: 'absolute', top: '2px', right: '2px', background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <label style={{ width: '70px', height: '70px', borderRadius: '8px', border: '2px dashed var(--border-color)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: uploadingCardImg ? 'not-allowed' : 'pointer', color: 'var(--text-secondary)' }}>
                    {uploadingCardImg ? <span style={{ fontSize: '10px' }}>...</span> : <><UploadCloud size={20} /><span style={{ fontSize: '9px' }}>Upload</span></>}
                    <input type="file" multiple accept="image/*" onChange={e => handleUploadImages(e.target.files, 'card')} style={{ display: 'none' }} disabled={uploadingCardImg} />
                  </label>
                </div>
              </div>

              {/* Active Toggle */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 600 }}>
                <input
                  type="checkbox"
                  checked={cardForm.active}
                  onChange={e => setCardForm({ ...cardForm, active: e.target.checked })}
                  style={{ width: '1.25rem', height: '1.25rem', accentColor: 'var(--primary-accent)' }}
                />
                Active (Available in Builder)
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setCardModalOpen(false)} style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', border: 'none', background: 'var(--primary-accent)', color: 'white', fontWeight: 600, cursor: 'pointer' }}>
                  {editingCard ? 'Save Changes' : 'Create Card'}
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
