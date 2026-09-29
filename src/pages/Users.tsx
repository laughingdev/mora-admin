import { Loader } from '../components/Loader';
import React, { useEffect, useState } from 'react';
import { User, Shield, ShieldAlert, RefreshCw, Mail, Phone, Calendar, LayoutList, LayoutGrid } from 'lucide-react';
import api from '../lib/api';
import { useSearchParams } from 'react-router';
import useSWR from 'swr';

export const Users: React.FC = () => {
  const [page, setPage] = useState(1);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
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

  const { data, error, mutate, isLoading: loading } = useSWR(
    `/users/admin/all?page=${page}&limit=15${searchParam ? `&search=${encodeURIComponent(searchParam)}` : ''}`,
    url => api.get(url).then(res => res.data)
  );

  const users = data?.data || [];
  const totalPages = data?.pagination?.totalPages || 1;

  useEffect(() => {
    setPage(1);
  }, [searchParam]);

  const handleRoleChange = async (id: string, newRole: string) => {
    if (!window.confirm(`Are you sure you want to change this user's role to ${newRole}?`)) return;

    setUpdatingId(id);
    try {
      await api.patch(`/users/admin/${id}/role`, { role: newRole });
      mutate(
        { ...data, data: users.map((u: any) => u.id === id ? { ...u, role: newRole } : u) },
        false
      );
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update user role');
    } finally {
      setUpdatingId(null);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN': return <span className="badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', background: '#fed7d7', color: '#c53030' }}><ShieldAlert size={12} /> Admin</span>;
      case 'MANAGER': return <span className="badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', background: '#feebc8', color: '#dd6b20' }}><Shield size={12} /> Manager</span>;
      default: return <span className="badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', background: '#e2e8f0', color: '#4a5568' }}><User size={12} /> User</span>;
    }
  };

  const allRoles = ['USER', 'MANAGER', 'ADMIN'];

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ fontSize: '2rem' }}>Users</h1>

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
                      <th>Customer</th>
                      <th>Contact Info</th>
                      <th>Role</th>
                      <th>Joined Date</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user: any) => (
                      <tr key={user.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{
                              width: '36px', height: '36px', borderRadius: '50%',
                              background: 'var(--surface-color)', display: 'flex',
                              alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'var(--primary-accent)'
                            }}>
                              {user.firstName ? user.firstName.charAt(0).toUpperCase() : 'G'}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                {user.firstName || 'Guest'} {user.lastName || ''}
                              </div>
                              {user.isProfileComplete ? (
                                <span style={{ fontSize: '0.7rem', color: 'var(--success-accent)' }}>Profile Complete</span>
                              ) : (
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Incomplete Profile</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                              <Phone size={14} /> {user.phone}
                            </div>
                            {user.email && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                <Mail size={14} /> {user.email}
                              </div>
                            )}
                          </div>
                        </td>
                        <td>
                          {getRoleBadge(user.role)}
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                            <Calendar size={14} />
                            {new Date(user.createdAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'flex-end' }}>
                            {/* Role Dropdown */}
                            <select
                              value={user.role}
                              onChange={(e) => handleRoleChange(user.id, e.target.value)}
                              disabled={updatingId === user.id}
                              style={{
                                padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)',
                                background: 'var(--bg-color)', outline: 'none', cursor: 'pointer',
                                opacity: updatingId === user.id ? 0.5 : 1
                              }}
                            >
                              {allRoles.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {users.length === 0 && (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                          No users found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                {users.map((user: any) => (
                  <div key={user.id} style={{ border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.5rem', background: 'var(--bg-color)', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{
                          width: '48px', height: '48px', borderRadius: '50%',
                          background: 'var(--surface-color)', display: 'flex',
                          alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'var(--primary-accent)', fontSize: '1.25rem'
                        }}>
                          {user.firstName ? user.firstName.charAt(0).toUpperCase() : 'G'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{user.firstName || 'Guest'} {user.lastName || ''}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Joined {new Date(user.createdAt).toLocaleDateString()}</div>
                        </div>
                      </div>
                      {getRoleBadge(user.role)}
                    </div>

                    <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        <Phone size={16} /> {user.phone}
                      </div>
                      {user.email && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                          <Mail size={16} /> {user.email}
                        </div>
                      )}
                    </div>

                    <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        disabled={updatingId === user.id}
                        style={{
                          padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)',
                          background: 'var(--surface-color)', outline: 'none', cursor: 'pointer',
                          opacity: updatingId === user.id ? 0.5 : 1, fontSize: '0.75rem'
                        }}
                      >
                        {allRoles.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                  </div>
                ))}
                {users.length === 0 && (
                  <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                    No users found.
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