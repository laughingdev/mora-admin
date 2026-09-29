import React from 'react';
import useSWR from 'swr';
import { Link } from 'react-router';
import { FileText, Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '../lib/api';

export const Blogs: React.FC = () => {
  const { data: response, error, mutate } = useSWR('/blogs', url => api.get(url).then(res => res.data));

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this blog?')) return;
    try {
      await api.delete(`/blogs/${id}`);
      toast.success('Blog deleted successfully');
      mutate();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete blog');
    }
  };

  if (error) return <div style={{ color: 'red', padding: '2rem' }}>Failed to load blogs</div>;
  if (!response) return <div style={{ padding: '2rem' }}>Loading...</div>;

  const blogs = response.data || [];

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <FileText size={28} color="var(--primary-accent)" />
          Blog Manager
        </h1>
        <Link 
          to="/blogs/new" 
          style={{ 
            display: 'flex', alignItems: 'center', gap: '0.5rem', 
            background: 'var(--primary-accent)', color: 'white', 
            padding: '0.75rem 1.25rem', borderRadius: '8px', 
            textDecoration: 'none', fontWeight: 600
          }}
        >
          <Plus size={18} /> Add New Blog
        </Link>
      </div>

      <div className="glass-panel" style={{ overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Title</th>
              <th>Slug</th>
              <th>Status</th>
              <th>Created At</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {blogs.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                  No blogs found. Create one to get started.
                </td>
              </tr>
            ) : (
              blogs.map((blog: any) => (
                <tr key={blog.id}>
                  <td>
                    {blog.image ? (
                      <img src={blog.image} alt={blog.title} style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }} />
                    ) : (
                      <div style={{ width: 40, height: 40, background: 'var(--surface-color)', borderRadius: 4 }} />
                    )}
                  </td>
                  <td style={{ fontWeight: 600 }}>{blog.title}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>/{blog.slug}</td>
                  <td>
                    <span className={`status-badge ${blog.isPublished ? 'status-delivered' : 'status-pending'}`}>
                      {blog.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td>{new Date(blog.createdAt).toLocaleDateString()}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <Link to={`/blogs/edit/${blog.id}`} className="action-btn" title="Edit Blog">
                        <Edit size={18} />
                      </Link>
                      <button onClick={() => handleDelete(blog.id)} className="action-btn delete" title="Delete Blog">
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