import { Loader } from '../components/Loader';
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { Eye, Clock, CheckCircle, Package, Truck, XCircle, RefreshCw, LayoutList, LayoutGrid, Gift, Mail, X, MapPin, Printer, Sparkles } from 'lucide-react';
import { createPortal } from 'react-dom';
import api from '../lib/api';
import useSWR from 'swr';

export const Orders: React.FC = () => {
  const [page, setPage] = useState(1);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [view, setView] = useState<'list' | 'card'>(window.innerWidth < 768 ? 'card' : 'list');
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) setView('card');
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const [searchParams] = useSearchParams();
  const searchParam = searchParams.get('search') || '';

  const { data, error, mutate, isLoading: loading } = useSWR(
    `/orders/admin/all?page=${page}&limit=15${searchParam ? `&search=${encodeURIComponent(searchParam)}` : ''}`,
    url => api.get(url).then(res => res.data)
  );

  const orders = data?.data || [];
  const totalPages = data?.pagination?.totalPages || 1;

  useEffect(() => {
    setPage(1);
  }, [searchParam]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    setUpdatingId(id);
    try {
      await api.patch(`/orders/admin/${id}/status`, { status: newStatus });
      mutate(
        { ...data, data: orders.map((o: any) => o.id === id ? { ...o, status: newStatus } : o) },
        false
      );
      if (selectedOrder && selectedOrder.id === id) {
        setSelectedOrder((prev: any) => ({ ...prev, status: newStatus }));
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update order status');
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING': return <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}><Clock size={12} /> Pending</span>;
      case 'CONFIRMED': return <span className="badge badge-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}><CheckCircle size={12} /> Confirmed</span>;
      case 'PROCESSING': return <span className="badge badge-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', background: '#ebf8ff', color: '#2b6cb0' }}><Package size={12} /> Processing</span>;
      case 'SHIPPED': return <span className="badge badge-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', background: '#faf5ff', color: '#6b46c1' }}><Truck size={12} /> Shipped</span>;
      case 'DELIVERED': return <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}><CheckCircle size={12} /> Delivered</span>;
      case 'CANCELLED': return <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}><XCircle size={12} /> Cancelled</span>;
      default: return <span className="badge">{status}</span>;
    }
  };

  const getPaymentBadge = (status: string) => {
    switch (status) {
      case 'SUCCESS':
      case 'PAID':
        return <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}><CheckCircle size={12} /> Paid</span>;
      case 'PENDING': return <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}><Clock size={12} /> Pending</span>;
      case 'FAILED': return <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}><XCircle size={12} /> Failed</span>;
      case 'REFUNDED': return <span className="badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', background: '#e2e8f0', color: '#4a5568' }}><RefreshCw size={12} /> Refunded</span>;
      default: return <span className="badge">{status}</span>;
    }
  };

  const allStatuses = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ fontSize: '2rem' }}>Orders</h1>

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
            onClick={() => mutate()}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.75rem 1.5rem', borderRadius: '8px',
              background: 'var(--surface-color)', color: 'var(--primary-accent)',
              border: '1px solid var(--border-color)', cursor: 'pointer', fontWeight: 600
            }}>
            <RefreshCw size={18} />
            <span className="desktop-only">Refresh</span>
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
                      <th>Order ID</th>
                      <th>Date</th>
                      <th>Customer</th>
                      <th>Type</th>
                      <th>Total</th>
                      <th>Payment</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order: any) => (
                      <tr key={order.id}>
                        <td style={{ fontWeight: 600, fontFamily: 'monospace' }}>
                          {order.id.startsWith('MM-') ? order.id : `#${order.id.substring(0, 8)}`}
                        </td>
                        <td>{new Date(order.createdAt).toLocaleDateString()} {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{order.user?.firstName || 'Guest'} {order.user?.lastName || ''}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{order.user?.phone}</div>
                        </td>
                        <td>
                          {order.isCustomHamper || order.customizationDetails ? (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              background: '#fef3c7',
                              color: '#92400e',
                              fontSize: '11px',
                              fontWeight: 700
                            }}>
                              <Gift size={12} /> Custom Hamper
                            </span>
                          ) : (
                            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Standard Order</span>
                          )}
                        </td>
                        <td style={{ fontWeight: 600, color: 'var(--primary-accent)' }}>₹{order.grandTotal.toLocaleString('en-IN')}</td>
                        <td>
                          {getPaymentBadge(order.paymentStatus || 'PENDING')}
                        </td>
                        <td>
                          {getStatusBadge(order.status)}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'flex-end' }}>
                            <select
                              value={order.status}
                              onChange={(e) => handleStatusChange(order.id, e.target.value)}
                              disabled={updatingId === order.id}
                              style={{
                                padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)',
                                background: 'var(--bg-color)', outline: 'none', cursor: 'pointer',
                                opacity: updatingId === order.id ? 0.5 : 1
                              }}
                            >
                              {allStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>

                            <button
                              onClick={() => setSelectedOrder(order)}
                              style={{ background: 'transparent', border: 'none', color: 'var(--primary-accent)', cursor: 'pointer', padding: '0.25rem' }}
                              title="View Details & Packaging Specs"
                            >
                              <Eye size={20} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {orders.length === 0 && (
                      <tr>
                        <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                          No orders have been placed yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                {orders.map((order: any) => (
                  <div key={order.id} style={{ border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.5rem', background: 'var(--bg-color)', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontFamily: 'monospace', color: 'var(--primary-accent)' }}>
                          {order.id.startsWith('MM-') ? order.id : `#${order.id.substring(0, 8)}`}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{new Date(order.createdAt).toLocaleDateString()} {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                      {getStatusBadge(order.status)}
                    </div>

                    {(order.isCustomHamper || order.customizationDetails) && (
                      <div style={{ marginBottom: '0.75rem' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: '#fef3c7',
                          color: '#92400e',
                          fontSize: '11px',
                          fontWeight: 700
                        }}>
                          <Gift size={12} /> Custom Hamper
                        </span>
                      </div>
                    )}

                    <div style={{ marginBottom: '1.5rem' }}>
                      <div style={{ fontWeight: 600 }}>{order.user?.firstName || 'Guest'} {order.user?.lastName || ''}</div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{order.user?.phone}</div>
                    </div>

                    <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <div style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--primary-accent)' }}>₹{order.grandTotal.toLocaleString('en-IN')}</div>
                        <div>{getPaymentBadge(order.paymentStatus || 'PENDING')}</div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusChange(order.id, e.target.value)}
                          disabled={updatingId === order.id}
                          style={{
                            padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)',
                            background: 'var(--surface-color)', outline: 'none', cursor: 'pointer',
                            opacity: updatingId === order.id ? 0.5 : 1,
                            fontSize: '0.75rem'
                          }}
                        >
                          {allStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <button
                          onClick={() => setSelectedOrder(order)}
                          style={{ background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0.5rem', color: 'var(--primary-accent)', cursor: 'pointer', display: 'flex' }}
                          title="View Details & Packaging Specs"
                        >
                          <Eye size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {orders.length === 0 && (
                  <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                    No orders have been placed yet.
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

      {/* ORDER DETAILS & PACKAGING MODAL */}
      {selectedOrder && createPortal(
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1.5rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '850px', maxHeight: '92vh', overflowY: 'auto', padding: '2rem', background: 'var(--bg-color)', position: 'relative', borderRadius: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <button
              onClick={() => setSelectedOrder(null)}
              style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'var(--surface-color)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-secondary)' }}
            >
              <X size={20} />
            </button>

            {/* Header info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary-accent)', fontFamily: 'monospace' }}>
                Order #{selectedOrder.id}
              </h2>
              {getStatusBadge(selectedOrder.status)}
              {getPaymentBadge(selectedOrder.paymentStatus || 'PENDING')}
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              Placed on {new Date(selectedOrder.createdAt).toLocaleString()}
            </p>

            {/* CUSTOM HAMPER PACKAGING SPEC SHEET */}
            {(selectedOrder.isCustomHamper || selectedOrder.customizationDetails) && (() => {
              const cust = typeof selectedOrder.customizationDetails === 'string'
                ? JSON.parse(selectedOrder.customizationDetails)
                : (selectedOrder.customizationDetails || {});

              return (
                <div style={{
                  background: 'linear-gradient(135deg, rgba(254, 243, 199, 0.4) 0%, rgba(253, 230, 138, 0.2) 100%)',
                  border: '2px solid #f59e0b',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  marginBottom: '2rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid rgba(245, 158, 11, 0.3)', paddingBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#92400e', fontWeight: 700, fontSize: '1.1rem' }}>
                      <Sparkles size={20} color="#b45309" /> Packaging & Crafting Instructions
                    </div>
                    <span style={{ fontSize: '11px', background: '#b45309', color: 'white', padding: '2px 8px', borderRadius: '4px', fontWeight: 700, textTransform: 'uppercase' }}>
                      Priority Crafting
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
                    {/* Box Spec */}
                    <div style={{ background: 'white', borderRadius: '8px', padding: '1rem', border: '1px solid #fde68a' }}>
                      <div style={{ fontSize: '0.75rem', color: '#92400e', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Gift size={14} /> 1. Selected Gift Box
                      </div>
                      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        {cust.box?.images?.[0] ? (
                          <img src={cust.box.images[0]} alt="Box" style={{ width: '56px', height: '56px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #e5e7eb' }} />
                        ) : cust.box?.image ? (
                          <img src={cust.box.image} alt="Box" style={{ width: '56px', height: '56px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #e5e7eb' }} />
                        ) : null}
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '1rem', color: '#1f2937' }}>{cust.box?.name || 'Standard Hamper Box'}</div>
                          {cust.box?.minItems && (
                            <div style={{ fontSize: '0.75rem', color: '#4b5563' }}>Capacity: {cust.box.minItems} - {cust.box.maxItems} items</div>
                          )}
                          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#b45309' }}>
                            {cust.box?.price > 0 ? `₹${cust.box.price}` : 'Free with Hamper'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card Spec */}
                    <div style={{ background: 'white', borderRadius: '8px', padding: '1rem', border: '1px solid #fde68a' }}>
                      <div style={{ fontSize: '0.75rem', color: '#92400e', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Mail size={14} /> 2. Selected Greeting Card
                      </div>
                      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        {cust.card?.images?.[0] ? (
                          <img src={cust.card.images[0]} alt="Card" style={{ width: '56px', height: '56px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #e5e7eb' }} />
                        ) : cust.card?.image ? (
                          <img src={cust.card.image} alt="Card" style={{ width: '56px', height: '56px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #e5e7eb' }} />
                        ) : null}
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '1rem', color: '#1f2937' }}>{cust.card?.name || 'Curated Greeting Card'}</div>
                          <div style={{ marginTop: '0.2rem' }}>
                            <span style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: cust.cardType === 'typed' ? '#dbeafe' : '#fce7f3',
                              color: cust.cardType === 'typed' ? '#1e40af' : '#9d174d'
                            }}>
                              {cust.cardType === 'typed' ? '🖨️ Typed / Printed' : '✍️ HANDWRITTEN NOTE'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Message to write / print */}
                  <div style={{ background: '#fffbeb', borderRadius: '8px', padding: '1.25rem', border: '2px dashed #f59e0b', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#b45309', letterSpacing: '0.05em' }}>
                        📝 Card Personalization Message ({cust.cardType === 'typed' ? 'To Print' : 'To Write by Hand'})
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                      {cust.recipientName && (
                        <div><strong>To:</strong> <span style={{ color: '#1f2937' }}>{cust.recipientName}</span></div>
                      )}
                      {cust.senderName && (
                        <div><strong>From:</strong> <span style={{ color: '#1f2937' }}>{cust.senderName}</span></div>
                      )}
                    </div>

                    <div style={{
                      background: 'white',
                      padding: '1rem',
                      borderRadius: '6px',
                      fontFamily: cust.cardType === 'handwritten' ? 'cursive, sans-serif' : 'serif',
                      fontSize: cust.cardType === 'handwritten' ? '1.15rem' : '1rem',
                      color: '#1f2937',
                      lineHeight: '1.6',
                      border: '1px solid #fde68a',
                      whiteSpace: 'pre-wrap'
                    }}>
                      {cust.cardMessage || cust.customMessage || 'No personalized message entered.'}
                    </div>
                  </div>

                  {/* Special Instructions */}
                  {cust.specialInstructions && (
                    <div style={{ background: 'white', borderRadius: '8px', padding: '1rem', border: '1px solid #fde68a' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#92400e', marginBottom: '0.25rem' }}>
                        📌 Special Packaging Instructions from Customer
                      </div>
                      <div style={{ fontSize: '0.9rem', color: '#374151' }}>{cust.specialInstructions}</div>
                    </div>
                  )}

                  {/* Custom Hamper Items list if embedded */}
                  {cust.customItems && cust.customItems.length > 0 && (
                    <div style={{ marginTop: '1rem' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#92400e', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                        🎁 Curated Products Inside This Box ({cust.customItems.length} items):
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
                        {cust.customItems.map((ci: any, idx: number) => (
                          <div key={idx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', background: 'white', padding: '0.5rem', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                            {ci.image && <img src={ci.image} alt={ci.name} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ci.name}</div>
                              <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Qty: {ci.quantity || 1} • ₹{ci.price}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Grid for Customer and Shipping */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <div style={{ background: 'var(--surface-color)', padding: '1.25rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <h3 style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                  Customer Details
                </h3>
                <div style={{ fontWeight: 600, fontSize: '1rem' }}>
                  {selectedOrder.user?.firstName || 'Guest'} {selectedOrder.user?.lastName || ''}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                  {selectedOrder.user?.email || 'No email'}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                  📞 {selectedOrder.user?.phone || selectedOrder.address?.phone || 'No phone'}
                </div>
              </div>

              <div style={{ background: 'var(--surface-color)', padding: '1.25rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <h3 style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <MapPin size={16} /> Shipping Address
                </h3>
                {selectedOrder.address ? (
                  <div style={{ fontSize: '0.85rem', lineHeight: '1.5' }}>
                    <div style={{ fontWeight: 600 }}>{selectedOrder.address.fullName}</div>
                    <div>{selectedOrder.address.addressLine1}</div>
                    {selectedOrder.address.addressLine2 && <div>{selectedOrder.address.addressLine2}</div>}
                    <div>{selectedOrder.address.city}, {selectedOrder.address.state} - {selectedOrder.address.pincode}</div>
                    <div>{selectedOrder.address.country}</div>
                  </div>
                ) : (
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>No address information attached.</div>
                )}
              </div>
            </div>

            {/* Standard Order Items */}
            {selectedOrder.items && selectedOrder.items.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem' }}>Order Line Items</h3>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th>Qty</th>
                        <th>Price</th>
                        <th style={{ textAlign: 'right' }}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.items.map((item: any) => (
                        <tr key={item.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              {item.product?.images?.[0]?.imageUrl && (
                                <img src={item.product.images[0].imageUrl} alt={item.product.name} style={{ width: '36px', height: '36px', borderRadius: '4px', objectFit: 'cover' }} />
                              )}
                              <div>
                                <div style={{ fontWeight: 600 }}>{item.product?.name || 'Product'}</div>
                                {item.variant && <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Variant: {item.variant.name}</div>}
                              </div>
                            </div>
                          </td>
                          <td>{item.quantity}</td>
                          <td>₹{item.price.toLocaleString('en-IN')}</td>
                          <td style={{ textAlign: 'right', fontWeight: 600 }}>₹{item.subtotal.toLocaleString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Financial Summary */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
              <div style={{ width: '280px', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                  <span>Subtotal:</span>
                  <span>₹{selectedOrder.subtotal.toLocaleString('en-IN')}</span>
                </div>
                {selectedOrder.discount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a' }}>
                    <span>Discount:</span>
                    <span>-₹{selectedOrder.discount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                  <span>Shipping:</span>
                  <span>{selectedOrder.shippingCharge === 0 ? 'Free' : `₹${selectedOrder.shippingCharge}`}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                  <span>Tax (18%):</span>
                  <span>₹{selectedOrder.tax.toLocaleString('en-IN')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.15rem', color: 'var(--primary-accent)', borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem' }}>
                  <span>Grand Total:</span>
                  <span>₹{selectedOrder.grandTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
              <button
                onClick={() => window.print()}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.2rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--surface-color)', cursor: 'pointer', fontWeight: 600 }}
              >
                <Printer size={16} /> Print Packing Slip
              </button>

              <button
                onClick={() => setSelectedOrder(null)}
                style={{ padding: '0.6rem 1.5rem', borderRadius: '8px', border: 'none', background: 'var(--primary-accent)', color: 'white', cursor: 'pointer', fontWeight: 600 }}
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};