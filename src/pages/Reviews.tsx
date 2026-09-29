import { Loader } from '../components/Loader';
import React, { useState } from 'react';
import useSWR from 'swr';
import { toast } from 'sonner';
import { MessageSquare, Check, X, Trash2, Star } from 'lucide-react';
import api from '../lib/api';

export const Reviews: React.FC = () => {
  const [page, setPage] = useState(1);
  const { data, error, mutate } = useSWR(`/admin/reviews?page=${page}&limit=10`, url => api.get(url).then(res => res.data));

  const reviews = data?.data || [];
  const totalPages = data?.pagination?.totalPages || 1;
  const loading = !data && !error;

  const handleApproval = async (id: string, isApproved: boolean) => {
    const toastId = toast.loading(isApproved ? 'Approving review...' : 'Rejecting review...');
    try {
      await api.patch(`/admin/reviews/${id}`, { isApproved });
      mutate();
      toast.success(isApproved ? 'Review approved' : 'Review rejected', { id: toastId });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update review', { id: toastId });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this review?')) return;
    const toastId = toast.loading('Deleting review...');
    try {
      await api.delete(`/admin/reviews/${id}`);
      mutate();
      toast.success('Review deleted', { id: toastId });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete review', { id: toastId });
    }
  };

  if (error) return <div style={{ color: 'var(--danger-accent)', padding: '2rem' }}>{error.message || 'Failed to load reviews'}</div>;

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', margin: 0 }}>Reviews Moderation</h1>
        <div style={{ background: 'var(--primary-accent)', color: 'white', padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.875rem', fontWeight: 600 }}>
          {data?.pagination?.total || 0} Total
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        {loading ? (
          <Loader />
        ) : reviews.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <MessageSquare size={48} opacity={0.5} />
            <p>No reviews found.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            {reviews.map((review: any) => (
              <div key={review.id} style={{ display: 'flex', gap: '1.5rem', padding: '1.5rem', background: 'var(--bg-color)', borderRadius: '12px', border: '1px solid var(--border-color)', position: 'relative', overflow: 'hidden' }}>
                {/* Status Indicator */}
                <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '4px', background: review.isApproved ? 'var(--success-accent)' : 'var(--warning-accent)' }} />
                
                {/* Product Image */}
                <div style={{ width: '80px', height: '80px', borderRadius: '8px', background: 'var(--surface-color)', flexShrink: 0, overflow: 'hidden' }}>
                  {review.productImage ? (
                    <img src={review.productImage} alt={review.productName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>No Img</div>
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem', gap: '1rem' }}>
                    <div>
                      <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.1rem', color: 'var(--text-primary)' }}>{review.title}</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        <span style={{ fontWeight: 600, color: 'var(--primary-accent)' }}>{review.productName}</span>
                        <span>•</span>
                        <span>{review.user?.firstName} {review.user?.lastName}</span>
                        <span>•</span>
                        <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={16} fill={i < review.rating ? '#F59E0B' : 'transparent'} color={i < review.rating ? '#F59E0B' : 'var(--border-color)'} />
                      ))}
                    </div>
                  </div>

                  <p style={{ margin: '0.5rem 0', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {review.comment || <em>No comment provided.</em>}
                  </p>

                  {/* Attached Photos & Videos */}
                  {((review.images && review.images.length > 0) || (review.videos && review.videos.length > 0)) && (
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', margin: '0.75rem 0' }}>
                      {review.images?.map((imgUrl: string, idx: number) => (
                        <a key={`img-${idx}`} href={imgUrl} target="_blank" rel="noreferrer" style={{ display: 'block', width: '64px', height: '64px', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                          <img src={imgUrl} alt={`Review attachment ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </a>
                      ))}
                      {review.videos?.map((vidUrl: string, idx: number) => (
                        <div key={`vid-${idx}`} style={{ width: '110px', height: '64px', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--border-color)', position: 'relative', background: '#000' }}>
                          <video src={vidUrl} controls style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>
                    <span style={{ 
                      fontSize: '0.75rem', fontWeight: 600, padding: '0.3rem 0.65rem', borderRadius: '4px',
                      background: review.isApproved ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.15)',
                      color: review.isApproved ? 'var(--success-accent)' : '#D97706'
                    }}>
                      {review.isApproved ? '● APPROVED' : '⏳ PENDING APPROVAL'}
                    </span>
                    
                    <div style={{ flex: 1 }} />
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {!review.isApproved ? (
                        <>
                          <button 
                            onClick={() => handleApproval(review.id, true)} 
                            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.5rem 1rem', borderRadius: '6px', border: 'none', background: 'var(--success-accent)', color: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}
                          >
                            <Check size={16} /> Approve
                          </button>
                          <button 
                            onClick={() => handleApproval(review.id, false)} 
                            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid #EF4444', background: 'rgba(239, 68, 68, 0.08)', color: '#EF4444', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}
                          >
                            <X size={16} /> Reject
                          </button>
                        </>
                      ) : (
                        <button 
                          onClick={() => handleApproval(review.id, false)} 
                          style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid #EF4444', background: 'transparent', color: '#EF4444', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}
                        >
                          <X size={16} /> Reject
                        </button>
                      )}
                      
                      <button onClick={() => handleDelete(review.id)} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 500, fontSize: '0.875rem' }}>
                        <Trash2 size={16} /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
            <button disabled={page === 1} onClick={() => setPage(page - 1)} style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', cursor: page === 1 ? 'not-allowed' : 'pointer' }}>
              Previous
            </button>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Page {page} of {totalPages}</span>
            <button disabled={page === totalPages} onClick={() => setPage(page + 1)} style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', cursor: page === totalPages ? 'not-allowed' : 'pointer' }}>
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};