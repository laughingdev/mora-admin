import React, { useEffect, useState } from 'react';
import { User, Store, Shield, Bell, Save, CreditCard } from 'lucide-react';
import api from '../lib/api';
import useSWR from 'swr';
import { toast } from 'sonner';

export const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('payment');
  const [loading, setLoading] = useState(false);

  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
  });

  const [paymentSettings, setPaymentSettings] = useState({
    business_name: '',
  });

  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [shippingSettings, setShippingSettings] = useState<{
    base_pincode: string;
    shipping_rules: { minDist: number; maxDist: number; price: number }[];
  }>({
    base_pincode: '',
    shipping_rules: [],
  });

  const { data: userRes } = useSWR('/users/me', url => api.get(url).then(res => res.data.data));
  const { data: settingsRes, mutate: mutateSettings } = useSWR('/settings', url => api.get(url).then(res => res.data.data));

  useEffect(() => {
    if (userRes) {
      setProfileData({
        firstName: userRes.firstName || '',
        lastName: userRes.lastName || '',
        phone: userRes.phone || '',
        email: userRes.email || '',
      });
    }
  }, [userRes]);

  useEffect(() => {
    if (settingsRes) {
      setPaymentSettings({
        business_name: settingsRes.business_name || '',
      });
      
      let parsedRules = [];
      try {
        if (settingsRes.shipping_rules) {
          parsedRules = JSON.parse(settingsRes.shipping_rules);
        }
      } catch (e) {
        console.error("Failed to parse shipping rules");
      }
      
      setShippingSettings({
        base_pincode: settingsRes.base_pincode || '',
        shipping_rules: parsedRules,
      });
    }
  }, [settingsRes]);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfileData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.patch('/users/me', {
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        // Typically don't update email/phone directly without OTP, but depends on backend
      });
      toast.success('Profile updated successfully!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPaymentSettings(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSavePaymentSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.patch('/settings', paymentSettings);
      mutateSettings();
      toast.success('Payment settings updated successfully!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveShippingSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.patch('/settings', {
        base_pincode: shippingSettings.base_pincode,
        shipping_rules: JSON.stringify(shippingSettings.shipping_rules),
      });
      mutateSettings();
      toast.success('Shipping settings updated successfully!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update shipping settings');
    } finally {
      setLoading(false);
    }
  };

  const addShippingRule = () => {
    setShippingSettings(prev => ({
      ...prev,
      shipping_rules: [...prev.shipping_rules, { minDist: 0, maxDist: 50, price: 50 }]
    }));
  };

  const removeShippingRule = (index: number) => {
    setShippingSettings(prev => ({
      ...prev,
      shipping_rules: prev.shipping_rules.filter((_, i) => i !== index)
    }));
  };

  const updateShippingRule = (index: number, field: string, value: number) => {
    setShippingSettings(prev => {
      const newRules = [...prev.shipping_rules];
      newRules[index] = { ...newRules[index], [field]: value };
      return { ...prev, shipping_rules: newRules };
    });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords don't match!");
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/change-password', {
        oldPassword: passwordData.oldPassword,
        newPassword: passwordData.newPassword,
      });
      toast.success('Password changed successfully!');
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'My Profile', icon: <User size={18} /> },
    { id: 'payment', label: 'Payment Gateway', icon: <CreditCard size={18} /> },
    { id: 'shipping', label: 'Shipping', icon: <Store size={18} /> },
    { id: 'security', label: 'Security', icon: <Shield size={18} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={18} /> },
  ];

  return (
    <div className="fade-in">
      <h1 style={{ fontSize: '2rem', marginBottom: '2rem' }}>Settings</h1>

      {/* Horizontal Tabs */}
      <div className="glass-panel" style={{ display: 'flex', gap: '0.5rem', padding: '0.5rem', marginBottom: '1.5rem', overflowX: 'auto' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.75rem 1.25rem', borderRadius: '8px', cursor: 'pointer',
              border: 'none', fontWeight: 600,
              background: activeTab === tab.id ? 'var(--primary-accent)' : 'transparent',
              color: activeTab === tab.id ? 'white' : 'var(--text-secondary)',
              transition: 'all 0.2s', whiteSpace: 'nowrap'
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="glass-panel" style={{ padding: '2rem', minHeight: '400px' }}>

        {activeTab === 'profile' && (
          <div className="fade-in">
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>Personal Information</h2>
            <form onSubmit={handleSaveProfile} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>First Name</label>
                <input type="text" name="firstName" value={profileData.firstName} onChange={handleProfileChange} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>Last Name</label>
                <input type="text" name="lastName" value={profileData.lastName} onChange={handleProfileChange} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>Email Address</label>
                <input type="email" name="email" value={profileData.email} disabled style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--surface-color)', color: 'var(--text-secondary)', outline: 'none', cursor: 'not-allowed' }} />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Contact super-admin to change email.</span>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>Phone Number</label>
                <input type="text" name="phone" value={profileData.phone} disabled style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--surface-color)', color: 'var(--text-secondary)', outline: 'none', cursor: 'not-allowed' }} />
              </div>

              <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="submit" disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', borderRadius: '8px', border: 'none', background: 'var(--primary-accent)', color: 'white', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 600 }}>
                  <Save size={18} /> {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'shipping' && (
          <div className="fade-in">
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>Shipping Configuration</h2>
            <form onSubmit={handleSaveShippingSettings} style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
              
              <div style={{ maxWidth: '400px' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>Base / Warehouse Pincode</label>
                <input 
                  type="text" 
                  value={shippingSettings.base_pincode} 
                  onChange={e => setShippingSettings(prev => ({...prev, base_pincode: e.target.value}))} 
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', outline: 'none' }} 
                  placeholder="e.g. 400001" 
                  required
                />
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>This pincode is used to calculate the distance to the customer's delivery address.</p>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <label style={{ fontWeight: 600, fontSize: '1rem' }}>Distance-Based Rules</label>
                  <button type="button" onClick={addShippingRule} style={{ padding: '0.5rem 1rem', borderRadius: '6px', background: 'var(--surface-color)', border: '1px solid var(--border-color)', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem', color: 'var(--primary-accent)' }}>
                    + Add Rule
                  </button>
                </div>
                
                {shippingSettings.shipping_rules.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', background: 'var(--surface-color)', borderRadius: '8px', border: '1px dashed var(--border-color)', color: 'var(--text-secondary)' }}>
                    No shipping rules defined. Please add rules to calculate shipping costs.
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: '1rem' }}>
                    {shippingSettings.shipping_rules.map((rule, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '1rem', background: 'var(--surface-color)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <div style={{ flex: 1 }}>
                          <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.25rem', fontWeight: 600 }}>Min Distance (km)</label>
                          <input type="number" min="0" value={rule.minDist} onChange={e => updateShippingRule(idx, 'minDist', Number(e.target.value))} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', outline: 'none' }} required />
                        </div>
                        <div style={{ flex: 1 }}>
                          <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.25rem', fontWeight: 600 }}>Max Distance (km)</label>
                          <input type="number" min="0" value={rule.maxDist} onChange={e => updateShippingRule(idx, 'maxDist', Number(e.target.value))} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', outline: 'none' }} required />
                        </div>
                        <div style={{ flex: 1 }}>
                          <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.25rem', fontWeight: 600 }}>Price (₹)</label>
                          <input type="number" min="0" value={rule.price} onChange={e => updateShippingRule(idx, 'price', Number(e.target.value))} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', outline: 'none' }} required />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-end', height: '100%' }}>
                          <button type="button" onClick={() => removeShippingRule(idx)} style={{ background: 'transparent', border: 'none', color: 'var(--danger-accent)', cursor: 'pointer', padding: '0.5rem' }} title="Remove Rule">
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="submit" disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', borderRadius: '8px', border: 'none', background: 'var(--primary-accent)', color: 'white', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 600 }}>
                  <Save size={18} /> {loading ? 'Saving...' : 'Save Shipping Settings'}
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'payment' && (
          <div className="fade-in">
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>Razorpay Configuration</h2>
            <form onSubmit={handleSavePaymentSettings} style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>Business Name (displayed on checkout)</label>
                <input type="text" name="business_name" value={paymentSettings.business_name} onChange={handlePaymentChange} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', outline: 'none' }} placeholder="e.g. Mora Moments" />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="submit" disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', borderRadius: '8px', border: 'none', background: 'var(--primary-accent)', color: 'white', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 600 }}>
                  <Save size={18} /> {loading ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="fade-in">
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>Security Settings</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Manage your password and active sessions.</p>

            <form onSubmit={handleChangePassword} style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem', maxWidth: '400px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>Current Password</label>
                <input type="password" required name="oldPassword" value={passwordData.oldPassword} onChange={handlePasswordChange} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>New Password</label>
                <input type="password" required name="newPassword" value={passwordData.newPassword} onChange={handlePasswordChange} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>Confirm New Password</label>
                <input type="password" required name="confirmPassword" value={passwordData.confirmPassword} onChange={handlePasswordChange} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', outline: 'none' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '0.5rem' }}>
                <button type="submit" disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', borderRadius: '8px', border: 'none', background: 'var(--primary-accent)', color: 'white', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 600 }}>
                  <Save size={18} /> {loading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="fade-in">
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>Notification Preferences</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Manage when and how you receive alerts.</p>
            <div style={{ display: 'grid', gap: '1rem', marginTop: '1.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer' }}>
                <input type="checkbox" defaultChecked style={{ width: '1.25rem', height: '1.25rem', accentColor: 'var(--primary-accent)' }} />
                <span style={{ fontWeight: 500 }}>Email me when a new order is placed</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer' }}>
                <input type="checkbox" defaultChecked style={{ width: '1.25rem', height: '1.25rem', accentColor: 'var(--primary-accent)' }} />
                <span style={{ fontWeight: 500 }}>Alert me on low inventory levels</span>
              </label>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};