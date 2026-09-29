import { Loader } from '../components/Loader';
import React from 'react';
import { CheckCircle, Clock, XCircle, RefreshCw, Eye } from 'lucide-react';
import useSWR from 'swr';
import api from '../lib/api';

export const Payments: React.FC = () => {
  const { data: payments = [], error, mutate, isLoading: loading } = useSWR('/payments', url => api.get(url).then(res => res.data.data));

  const getPaymentBadge = (status: string) => {
    switch (status) {
      case 'SUCCESS': return <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}><CheckCircle size={12} /> Success</span>;
      case 'PENDING': return <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}><Clock size={12} /> Pending</span>;
      case 'FAILED': return <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}><XCircle size={12} /> Failed</span>;
      case 'REFUNDED': return <span className="badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', background: '#e2e8f0', color: '#4a5568' }}><RefreshCw size={12} /> Refunded</span>;
      default: return <span className="badge">{status}</span>;
    }
  };

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ fontSize: '2rem' }}>Payment Logs</h1>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
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
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Transaction ID</th>
                  <th>Order Reference</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment: any) => (
                  <tr key={payment.id}>
                    <td style={{ fontWeight: 600, fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{payment.id}</td>
                    <td style={{ fontFamily: 'monospace' }}>
                      {payment.orderId ? (
                        <span style={{ color: 'var(--primary-accent)', fontWeight: 600 }}>
                          {payment.orderId.startsWith('MM-') ? payment.orderId : `#${payment.orderId.substring(0, 8)}`}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-secondary)' }}>N/A</span>
                      )}
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>₹{payment.amount}</td>
                    <td>{getPaymentBadge(payment.status)}</td>
                    <td>
                      <div style={{ fontSize: '0.875rem' }}>
                        {new Date(payment.createdAt).toLocaleDateString()} {new Date(payment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }} title="View Order Details">
                        <Eye size={20} />
                      </button>
                    </td>
                  </tr>
                ))}
                {payments.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                      No payment transactions found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};