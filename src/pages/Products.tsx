import { Loader } from '../components/Loader';
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Plus, Edit2, Trash2, CheckCircle, XCircle, LayoutList, LayoutGrid } from 'lucide-react';
import useSWR from 'swr';
import { toast } from 'sonner';
import api from '../lib/api';

export const Products: React.FC = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [view, setView] = useState<'list' | 'card'>(window.innerWidth < 768 ? 'card' : 'list');

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) setView('card');
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [searchParams] = useSearchParams();
  const searchParam = searchParams.get('search') || '';

  const { data, error, mutate } = useSWR(
    `/products?page=${page}&limit=10${searchParam ? `&search=${encodeURIComponent(searchParam)}` : ''}`, 
    url => api.get(url).then(res => res.data)
  );

  const products = data?.data || [];
  const totalPages = data?.pagination?.totalPages || 1;
  const loading = !data && !error;

  // Reset page when search changes
  useEffect(() => {
    setPage(1);
  }, [searchParam]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    const toastId = toast.loading('Deleting product...');
    try {
      await api.delete(`/products/${id}`);
      mutate();
      toast.success('Product deleted', { id: toastId });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete product', { id: toastId });
    }
  };

  const getAdminPriceDisplay = (product: any) => {
    const baseOriginal = Number(product.price) || 0;
    const baseSale =
      product.salePrice !== undefined && product.salePrice !== null && Number(product.salePrice) > 0
        ? Number(product.salePrice)
        : null;
    const baseSell = baseSale !== null ? baseSale : baseOriginal;
    const baseDiscountRatio =
      baseSale !== null && baseOriginal > baseSale ? (baseOriginal - baseSale) / baseOriginal : 0;

    let lowestSell = baseSell;
    let originalPrice = baseOriginal;

    if (Array.isArray(product.variants) && product.variants.length > 0) {
      for (const v of product.variants) {
        const vp = Number(v.price) || 0;
        if (vp > 0 && vp < lowestSell) {
          lowestSell = vp;
          if (baseDiscountRatio > 0) {
            originalPrice = Math.max(vp, Math.round(vp / (1 - baseDiscountRatio)));
          } else {
            originalPrice = Math.max(baseOriginal, vp);
          }
        }
      }
    }

    const hasDiscount = originalPrice > lowestSell;
    const saved = originalPrice - lowestSell;

    return { sellPrice: lowestSell, originalPrice, hasDiscount, saved };
  };

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ fontSize: '2rem' }}>Products</h1>
        
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
            onClick={() => navigate('/products/new')}
            style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.75rem 1.5rem', borderRadius: '8px',
            background: 'var(--primary-accent)', color: 'var(--bg-color)',
            border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '1rem'
          }}>
            <Plus size={20} />
            <span className="desktop-only">Add Product</span>
          </button>
        </div>
      </div>

      {error && <div style={{ color: 'var(--danger-accent)', marginBottom: '1rem' }}>{error}</div>}

      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        {loading ? (
          <Loader />
        ) : (
          <>
            {view === 'list' ? (
              <div className="table-container desktop-only">
                <table>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>SKU</th>
                      <th>Price</th>
                      <th>Stock</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product: any) => (
                      <tr key={product.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ 
                              width: '40px', height: '40px', borderRadius: '8px', 
                              background: 'var(--surface-color)', overflow: 'hidden',
                              display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                              {product.images && product.images.length > 0 ? (
                                <img src={product.images[0].imageUrl} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>No Img</span>
                              )}
                            </div>
                            <div>
                              <div title={product.name} style={{ fontWeight: 600, color: 'var(--primary-accent)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '250px' }}>{product.name}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span>{product.category?.name || 'Uncategorized'}</span>
                                <span style={{
                                  fontSize: '10px',
                                  padding: '1px 6px',
                                  borderRadius: '4px',
                                  background: product.gender === 'male' ? '#e0f2fe' : product.gender === 'female' ? '#fce7f3' : '#f3f4f6',
                                  color: product.gender === 'male' ? '#0369a1' : product.gender === 'female' ? '#be185d' : '#4b5563',
                                  fontWeight: 600
                                }}>
                                  {product.gender === 'male' ? 'Men' : product.gender === 'female' ? 'Women' : 'Unisex'}
                                </span>
                                {product.isCustomizable && (
                                  <span style={{
                                    fontSize: '10px',
                                    padding: '1px 6px',
                                    borderRadius: '4px',
                                    background: '#fef3c7',
                                    color: '#92400e',
                                    fontWeight: 600
                                  }}>
                                    🎁 Customizable
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td style={{ fontFamily: 'monospace' }}>{product.sku}</td>
                        <td style={{ fontWeight: 600 }}>
                          {(() => {
                            const pInfo = getAdminPriceDisplay(product);
                            return (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                                <span>₹{pInfo.sellPrice.toLocaleString('en-IN')}</span>
                                {pInfo.hasDiscount && (
                                  <>
                                    <span style={{ textDecoration: 'line-through', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                                      ₹{pInfo.originalPrice.toLocaleString('en-IN')}
                                    </span>
                                    <span style={{ fontSize: '0.7rem', color: '#15803d', background: '#dcfce7', padding: '1px 5px', borderRadius: '4px', fontWeight: 700 }}>
                                      Save ₹{pInfo.saved.toLocaleString('en-IN')}
                                    </span>
                                  </>
                                )}
                              </div>
                            );
                          })()}
                        </td>
                        <td>
                          <span className={`badge ${product.stock > 10 ? 'badge-success' : product.stock > 0 ? 'badge-warning' : 'badge-danger'}`}>
                            {product.stock} in stock
                          </span>
                        </td>
                        <td>
                          {product.active ? (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--success-accent)', fontSize: '0.875rem' }}>
                              <CheckCircle size={16} /> Active
                            </span>
                          ) : (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                              <XCircle size={16} /> Draft
                            </span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            <button 
                              onClick={() => navigate(`/products/edit/${product.id}`)}
                              style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }} 
                              title="Edit"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button 
                              onClick={() => handleDelete(product.id)}
                              style={{ background: 'transparent', border: 'none', color: 'var(--danger-accent)', cursor: 'pointer' }} 
                              title="Delete"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {products.length === 0 && (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                          No products found. Create your first product!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                {products.map((product: any) => (
                  <div key={product.id} style={{ border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden', background: 'var(--bg-color)', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ height: '160px', background: 'var(--surface-color)', position: 'relative' }}>
                      {product.images && product.images.length > 0 ? (
                        <img src={product.images[0].imageUrl} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>No Image</div>
                      )}
                      <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                        <button onClick={() => navigate(`/products/edit/${product.id}`)} style={{ background: 'white', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                          <Edit2 size={14} color="var(--text-primary)" />
                        </button>
                        <button onClick={() => handleDelete(product.id)} style={{ background: 'white', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                          <Trash2 size={14} color="var(--danger-accent)" />
                        </button>
                      </div>
                    </div>
                    <div style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{product.category?.name || 'Uncategorized'}</span>
                        <span style={{
                          fontSize: '10px',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          background: product.gender === 'male' ? '#e0f2fe' : product.gender === 'female' ? '#fce7f3' : '#f3f4f6',
                          color: product.gender === 'male' ? '#0369a1' : product.gender === 'female' ? '#be185d' : '#4b5563',
                          fontWeight: 600
                        }}>
                          {product.gender === 'male' ? 'Men' : product.gender === 'female' ? 'Women' : 'Unisex'}
                        </span>
                        {product.isCustomizable && (
                          <span style={{
                            fontSize: '10px',
                            padding: '1px 6px',
                            borderRadius: '4px',
                            background: '#fef3c7',
                            color: '#92400e',
                            fontWeight: 600
                          }}>
                            🎁 Customizable
                          </span>
                        )}
                      </div>
                      <h3 title={product.name} style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--primary-accent)', marginBottom: '0.5rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{product.name}</h3>
                      <div style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>SKU: {product.sku}</div>
                      
                      <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        {(() => {
                          const pInfo = getAdminPriceDisplay(product);
                          return (
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', flexWrap: 'wrap' }}>
                              <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>₹{pInfo.sellPrice.toLocaleString('en-IN')}</div>
                              {pInfo.hasDiscount && (
                                <>
                                  <span style={{ textDecoration: 'line-through', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                    ₹{pInfo.originalPrice.toLocaleString('en-IN')}
                                  </span>
                                  <span style={{ fontSize: '0.7rem', color: '#15803d', background: '#dcfce7', padding: '1px 5px', borderRadius: '4px', fontWeight: 700 }}>
                                    Save ₹{pInfo.saved.toLocaleString('en-IN')}
                                  </span>
                                </>
                              )}
                            </div>
                          );
                        })()}
                        <span className={`badge ${product.stock > 10 ? 'badge-success' : product.stock > 0 ? 'badge-warning' : 'badge-danger'}`}>
                          {product.stock > 0 ? `${product.stock} left` : 'Out of Stock'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                {products.length === 0 && (
                  <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                    No products found.
                  </div>
                )}
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
                <button 
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                  style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', cursor: page === 1 ? 'not-allowed' : 'pointer' }}
                >
                  Previous
                </button>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Page {page} of {totalPages}</span>
                <button 
                  disabled={page === totalPages}
                  onClick={() => setPage(page + 1)}
                  style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', cursor: page === totalPages ? 'not-allowed' : 'pointer' }}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};