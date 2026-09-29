import React from 'react';
import useSWR from 'swr';
import { Link } from 'react-router';
import { FileText, Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '../lib/api';

export const Pages: React.FC = () => {
  const { data: response, error, mutate } = useSWR('/pages', url => api.get(url).then(res => res.data));

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this page?')) return;
    try {
      await api.delete(`/pages/${id}`);
      toast.success('Page deleted successfully');
      mutate();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete page');
    }
  };

  if (error) return <div style={{ color: 'red', padding: '2rem' }}>Failed to load pages</div>;
  if (!response) return <div style={{ padding: '2rem' }}>Loading...</div>;

  const pages = response.data || [];

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <FileText size={28} color="var(--primary-accent)" />
          Page Manager
        </h1>
        <Link 
          to="/pages/new" 
          style={{ 
            display: 'flex', alignItems: 'center', gap: '0.5rem', 
            background: 'var(--primary-accent)', color: 'white', 
            padding: '0.75rem 1.25rem', borderRadius: '8px', 
            textDecoration: 'none', fontWeight: 600
          }}
        >
          <Plus size={18} /> Add New Page
        </Link>
      </div>

      <div className="glass-panel" style={{ overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Slug</th>
              <th>Status</th>
              <th>Created At</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pages.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                  No pages found. Create one to get started.
                </td>
              </tr>
            ) : (
              pages.map((page: any) => (
                <tr key={page.id}>
                  <td style={{ fontWeight: 600 }}>{page.title}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>/{page.slug}</td>
                  <td>
                    <span className={`status-badge ${page.isPublished ? 'status-delivered' : 'status-pending'}`}>
                      {page.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td>{new Date(page.createdAt).toLocaleDateString()}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <Link to={`/pages/edit/${page.id}`} className="action-btn" title="Edit Page">
                        <Edit size={18} />
                      </Link>
                      <button onClick={() => handleDelete(page.id)} className="action-btn delete" title="Delete Page">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};