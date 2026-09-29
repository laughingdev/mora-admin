import { Loader } from '../components/Loader';
import React from 'react';
import { DollarSign, ShoppingCart, Users, Package } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import api from '../lib/api';
import useSWR from 'swr';

export const Dashboard: React.FC = () => {
  const { data: stats, isLoading: loading } = useSWR('/analytics/dashboard', url => api.get(url).then(res => res.data.data));

  if (loading) {
    return <Loader />;
  }

  if (!stats) {
    return <div className="fade-in" style={{ padding: '2rem', textAlign: 'center', color: 'var(--danger-accent)' }}>Failed to load dashboard data.</div>;
  }

  const statCards = [
    { label: 'Total Revenue', value: `₹${stats.totalRevenue.toLocaleString()}`, icon: <DollarSign size={24} />, color: '#10b981', bg: '#d1fae5' },
    { label: 'Total Orders', value: stats.totalOrders.toLocaleString(), icon: <ShoppingCart size={24} />, color: '#3b82f6', bg: '#dbeafe' },
    { label: 'Total Users', value: stats.totalUsers.toLocaleString(), icon: <Users size={24} />, color: '#8b5cf6', bg: '#ede9fe' },
    { label: 'Active Products', value: stats.totalProducts.toLocaleString(), icon: <Package size={24} />, color: '#f59e0b', bg: '#fef3c7' },
  ];

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#64748b'];

  return (
    <div className="fade-in">
      <h1 style={{ fontSize: '2rem', marginBottom: '2rem', color: 'var(--text-primary)' }}>Dashboard Overview</h1>
      
      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {statCards.map((card, index) => (
          <div key={index} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '12px', background: card.bg, color: card.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {card.icon}
            </div>
            <div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{card.label}</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.25rem' }}>{card.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="responsive-grid responsive-grid-dashboard">
        {/* Sales Chart */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem' }}>Sales (Last 7 Days)</h2>
          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.salesData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} tickFormatter={(val) => `₹${val}`} dx={-10} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  formatter={(value: any) => [`₹${value}`, 'Sales']}
                />
                <Line type="monotone" dataKey="sales" stroke="var(--primary-accent)" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: 'var(--bg-color)' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Order Status Chart */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem' }}>Orders by Status</h2>
          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.orderStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats.orderStatusData.map((_entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-color)' }} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};