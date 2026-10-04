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
      <div className="reviews-header-container">
        <div className="reviews-header-left">
          <h1 className="reviews-header-title">Reviews Moderation</h1>
          <div className="reviews-count-badge">
            {data?.pagination?.total || 0} Total
          </div>
        </div>
      </div>

      <div className="glass-panel reviews-glass-panel">
        {loading ? (
          <Loader />
        ) : reviews.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <MessageSquare size={48} opacity={0.5} />
            <p>No reviews found.</p>
          </div>
        ) : (
          <div className="reviews-list-grid">
            {reviews.map((review: any) => (
              <div key={review.id} className="review-card">
                {/* Status Indicator Bar */}
                <div className={`review-card-status-bar ${review.isApproved ? 'approved' : 'pending'}`} />

                {/* Desktop Product Thumbnail */}
                <div className="review-thumb review-desktop-only">
                  {review.productImage ? (
                    <img src={review.productImage} alt={review.productName || 'Product'} />
                  ) : (
                    <div className="review-thumb-placeholder">No Img</div>
                  )}
                </div>

                <div className="review-main">
                  {/* Mobile Top Row: Thumbnail + Product Name + Reviewer + Stars */}
                  <div className="review-card-top-row review-mobile-only">
                    <div className="review-thumb">
                      {review.productImage ? (
                        <img src={review.productImage} alt={review.productName || 'Product'} />
                      ) : (
                        <div className="review-thumb-placeholder">No Img</div>
                      )}
                    </div>
                    <div className="review-top-meta">
                      <div className="review-product-name">{review.productName}</div>
                      <div className="review-meta">
                        <span>{review.user?.firstName} {review.user?.lastName}</span>
                        <span>•</span>
                        <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="review-stars">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={14}
                            fill={i < review.rating ? '#F59E0B' : 'transparent'}
                            color={i < review.rating ? '#F59E0B' : 'var(--border-color)'}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Desktop Header Row: Title & Meta on left, Stars on right */}
                  <div className="review-header review-desktop-only">
                    <div className="review-header-info">
                      <h3 className="review-title">{review.title}</h3>
                      <div className="review-meta">
                        <span className="review-product-name">{review.productName}</span>
                        <span>•</span>
                        <span>{review.user?.firstName} {review.user?.lastName}</span>
                        <span>•</span>
                        <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="review-stars">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={16}
                          fill={i < review.rating ? '#F59E0B' : 'transparent'}
                          color={i < review.rating ? '#F59E0B' : 'var(--border-color)'}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Mobile Title */}
                  <h3 className="review-title review-mobile-only" style={{ marginTop: '0.25rem' }}>{review.title}</h3>

                  {/* Review Comment */}
                  <p className="review-comment">
                    {review.comment || <em>No comment provided.</em>}
                  </p>

                  {/* Attached Photos & Videos */}
                  {((review.images && review.images.length > 0) || (review.videos && review.videos.length > 0)) && (
                    <div className="review-attachments">
                      {review.images?.map((imgUrl: string, idx: number) => (
                        <a
                          key={`img-${idx}`}
                          href={imgUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="review-attachment-img"
                        >
                          <img src={imgUrl} alt={`Review attachment ${idx + 1}`} />
                        </a>
                      ))}
                      {review.videos?.map((vidUrl: string, idx: number) => (
                        <div key={`vid-${idx}`} className="review-attachment-video">
                          <video src={vidUrl} controls />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Footer Bar */}
                  <div className="review-footer">
                    <span className={`review-badge ${review.isApproved ? 'approved' : 'pending'}`}>
                      {review.isApproved ? '● APPROVED' : '⏳ PENDING APPROVAL'}
                    </span>

                    <div className="review-actions-group">
                      {!review.isApproved ? (
                        <>
                          <button
                            type="button"
                            className="review-btn review-btn-approve"
                            onClick={() => handleApproval(review.id, true)}
                          >
                            <Check size={16} /> Approve
                          </button>
                          <button
                            type="button"
                            className="review-btn review-btn-reject"
                            onClick={() => handleApproval(review.id, false)}
                          >
                            <X size={16} /> Reject
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          className="review-btn review-btn-reject-outline"
                          onClick={() => handleApproval(review.id, false)}
                        >
                          <X size={16} /> Reject
                        </button>
                      )}

                      <button
                        type="button"
                        className="review-btn review-btn-delete"
                        onClick={() => handleDelete(review.id)}
                      >
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
          <div className="review-pagination">
            <button
              type="button"
              className="review-pagination-btn"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </button>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              className="review-pagination-btn"
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};