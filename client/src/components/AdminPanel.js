import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function AdminPanel() {
  const [password, setPassword] = useState('');
  const [token, setToken] = useState(() => sessionStorage.getItem('adminToken') || '');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterPlan, setFilterPlan] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [actionLoading, setActionLoading] = useState(null); // stores ID of active update

  // Validate session token on mount
  useEffect(() => {
    if (token) {
      fetchData(token);
    }
  }, [token]);

  const fetchData = async (authToken) => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get('/api/registrations', {
        headers: { 'x-admin-token': authToken }
      });
      setRegistrations(res.data.data);
      setIsAuthenticated(true);
      setToken(authToken);
      sessionStorage.setItem('adminToken', authToken);
    } catch (err) {
      setError(err.response?.data?.message || 'Access denied. Invalid password.');
      setIsAuthenticated(false);
      sessionStorage.removeItem('adminToken');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (!password) {
      setError('Please enter the password.');
      return;
    }
    fetchData(password);
  };

  const handleLogout = () => {
    setToken('');
    setIsAuthenticated(false);
    setRegistrations([]);
    sessionStorage.removeItem('adminToken');
  };

  const handleStatusUpdate = async (id, status) => {
    setActionLoading(id);
    try {
      const res = await axios.patch(
        `/api/registrations/${id}/status`,
        { status },
        { headers: { 'x-admin-token': token } }
      );
      // Update local state list
      setRegistrations(prev => prev.map(r => r._id === id ? res.data.data : r));
    } catch (err) {
      alert('Failed to update status: ' + (err.response?.data?.message || err.message));
    } finally {
      setActionLoading(null);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Date', 'Name', 'Email', 'Phone', 'College', 'Plan', 'Amount (INR)', 'UTR / Transaction ID', 'Goal', 'Status'];
    const rows = filteredRegistrations.map(r => [
      new Date(r.registeredAt).toLocaleString(),
      r.name,
      r.email,
      r.phone,
      r.college,
      r.plan === 'workshop' ? 'Group Workshop' : '1-on-1 Call',
      r.amount,
      `="${r.transactionId}"`, // Wrap in Excel formulation to prevent scientific notation
      r.goal || '',
      r.status
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `registrations_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter logic
  const filteredRegistrations = registrations.filter(r => {
    const matchesSearch = 
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.email.toLowerCase().includes(search.toLowerCase()) ||
      r.college.toLowerCase().includes(search.toLowerCase()) ||
      r.transactionId.toLowerCase().includes(search.toLowerCase());
    
    const matchesPlan = filterPlan === 'all' || r.plan === filterPlan;
    const matchesStatus = filterStatus === 'all' || r.status === filterStatus;

    return matchesSearch && matchesPlan && matchesStatus;
  });

  // Calculate dashboard stats
  const totalRegistrations = registrations.length;
  const totalConfirmed = registrations.filter(r => r.status === 'confirmed').length;
  const totalPending = registrations.filter(r => r.status === 'pending').length;
  const totalRevenue = registrations
    .filter(r => r.status === 'confirmed')
    .reduce((sum, r) => sum + r.amount, 0);

  const s = {
    container: {
      padding: '40px 0',
    },
    loginWrapper: {
      maxWidth: 400,
      margin: '80px auto',
      padding: '40px 32px',
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-md)',
      boxShadow: 'var(--shadow-lg)',
    },
    title: {
      fontSize: 24,
      fontWeight: 800,
      marginBottom: 24,
      textAlign: 'center',
      color: 'var(--text-primary)',
    },
    formGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      marginBottom: 20,
    },
    btn: {
      width: '100%',
      padding: '14px',
      background: 'var(--primary)',
      color: '#ffffff',
      fontWeight: 700,
      borderRadius: 'var(--radius-sm)',
      boxShadow: 'var(--shadow-sm)',
    },
    logoutBtn: {
      background: 'var(--bg-tertiary)',
      border: '1px solid var(--border)',
      color: 'var(--text-primary)',
      padding: '8px 16px',
      borderRadius: 'var(--radius-sm)',
      fontSize: 13,
      fontWeight: 600,
    },
    dashboardHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 32,
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: 20,
      marginBottom: 40,
    },
    statCard: {
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-md)',
      padding: '24px',
      boxShadow: 'var(--shadow-sm)',
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
    },
    statVal: {
      fontSize: 28,
      fontWeight: 800,
      color: 'var(--text-primary)',
    },
    statLabel: {
      fontSize: 12,
      fontWeight: 600,
      color: 'var(--text-muted)',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
    },
    filterBar: {
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-md)',
      padding: 20,
      marginBottom: 24,
      display: 'flex',
      flexWrap: 'wrap',
      gap: 16,
      alignItems: 'center',
    },
    filterGroup: {
      flex: '1 1 200px',
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
    },
    select: {
      padding: '10px 12px',
      borderRadius: 'var(--radius-sm)',
      background: 'var(--bg-primary)',
      border: '1px solid var(--border)',
      color: 'var(--text-primary)',
    },
    exportBtn: {
      background: 'var(--accent)',
      color: '#ffffff',
      padding: '12px 20px',
      fontWeight: 700,
      borderRadius: 'var(--radius-sm)',
      boxShadow: 'var(--shadow-sm)',
      height: 'fit-content',
      alignSelf: 'flex-end',
    },
    tableWrapper: {
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-md)',
      overflowX: 'auto',
      boxShadow: 'var(--shadow-md)',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      textAlign: 'left',
      fontSize: 13,
    },
    th: {
      background: 'var(--bg-tertiary)',
      color: 'var(--text-secondary)',
      padding: '14px 16px',
      fontWeight: 700,
      borderBottom: '1px solid var(--border)',
    },
    td: {
      padding: '14px 16px',
      color: 'var(--text-primary)',
      borderBottom: '1px solid var(--border)',
      verticalAlign: 'middle',
    },
    badge: {
      padding: '4px 8px',
      borderRadius: 4,
      fontSize: 11,
      fontWeight: 700,
      display: 'inline-block',
      textTransform: 'uppercase',
    },
    badgePending: { background: 'var(--accent-orange-light)', color: 'var(--accent-orange)' },
    badgeConfirmed: { background: 'var(--accent-light)', color: 'var(--accent)' },
    badgeRejected: { background: '#fef2f2', color: '#ef4444' },
    actions: {
      display: 'flex',
      gap: 8,
    },
    actionBtn: {
      padding: '6px 12px',
      fontSize: 12,
      borderRadius: 'var(--radius-sm)',
      fontWeight: 600,
    },
    confirmBtn: {
      background: 'var(--accent-light)',
      color: 'var(--accent)',
      border: '1px solid var(--accent)',
    },
    rejectBtn: {
      background: '#fef2f2',
      color: '#ef4444',
      border: '1px solid #fee2e2',
    },
  };

  if (!isAuthenticated) {
    return (
      <div className="container" style={s.container}>
        <div style={s.loginWrapper} className="fade-up">
          <h2 style={s.title}>Admin Access</h2>
          <form onSubmit={handleLogin}>
            <div style={s.formGroup}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Admin Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter password"
                required
              />
            </div>
            {error && <div style={{ color: '#ef4444', fontSize: 13, marginBottom: 16, fontWeight: 500, textAlign: 'center' }}>⚠ {error}</div>}
            <button type="submit" style={s.btn} disabled={loading}>
              {loading ? 'Verifying...' : 'Login Dashboard'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={s.container}>
      <div style={s.dashboardHeader} className="fade-up">
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-primary)' }}>Registrations Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Overview and verification of workshop users.</p>
        </div>
        <button style={s.logoutBtn} onClick={handleLogout}>Logout</button>
      </div>

      {/* KPI Stats Cards */}
      <div style={s.statsGrid} className="fade-up-2">
        <div style={s.statCard}>
          <span style={s.statLabel}>Total Enrolled</span>
          <span style={s.statVal}>{totalRegistrations}</span>
        </div>
        <div style={s.statCard}>
          <span style={s.statLabel}>Confirmed Paid</span>
          <span style={s.statVal}>{totalConfirmed}</span>
        </div>
        <div style={s.statCard}>
          <span style={s.statLabel}>Pending Verification</span>
          <span style={s.statVal}>{totalPending}</span>
        </div>
        <div style={s.statCard}>
          <span style={s.statLabel}>Verified Revenue</span>
          <span style={{ ...s.statVal, color: 'var(--accent)' }}>₹{totalRevenue}</span>
        </div>
      </div>

      {/* Filter and Export Bar */}
      <div style={s.filterBar} className="fade-up-3">
        <div style={s.filterGroup}>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Search</label>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name, email, college, UTR..."
          />
        </div>
        <div style={s.filterGroup}>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Filter by Plan</label>
          <select value={filterPlan} onChange={e => setFilterPlan(e.target.value)} style={s.select}>
            <option value="all">All Plans</option>
            <option value="workshop">Group Workshop (₹49)</option>
            <option value="oneonone">1-on-1 Call (₹89)</option>
          </select>
        </div>
        <div style={s.filterGroup}>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Filter by Status</label>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={s.select}>
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        <button style={s.exportBtn} onClick={handleExportCSV}>
          📊 Export to Excel (CSV)
        </button>
      </div>

      {/* registrations spreadsheet table */}
      <div style={s.tableWrapper} className="fade-up-4">
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>Loading registrations...</div>
        ) : filteredRegistrations.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>No registrations found matching the filters.</div>
        ) : (
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Date</th>
                <th style={s.th}>Name</th>
                <th style={s.th}>Contact Info</th>
                <th style={s.th}>College & Year</th>
                <th style={s.th}>Plan Details</th>
                <th style={s.th}>Transaction UTR</th>
                <th style={s.th}>Goal</th>
                <th style={s.th}>Status</th>
                <th style={s.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRegistrations.map((r) => (
                <tr key={r._id}>
                  <td style={s.td}>{new Date(r.registeredAt).toLocaleDateString()}</td>
                  <td style={s.td}><strong>{r.name}</strong></td>
                  <td style={s.td}>
                    <div>📧 {r.email}</div>
                    <div>📱 {r.phone}</div>
                  </td>
                  <td style={s.td}>{r.college}</td>
                  <td style={s.td}>
                    <div>{r.plan === 'workshop' ? '🎓 Workshop' : '📞 1-on-1'}</div>
                    <div style={{ color: 'var(--primary)', fontWeight: 600 }}>₹{r.amount}</div>
                  </td>
                  <td style={s.td}><code style={{ background: 'var(--bg-tertiary)', padding: '2px 6px', borderRadius: 4 }}>{r.transactionId}</code></td>
                  <td style={{ ...s.td, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.goal}>
                    {r.goal || <span style={{ color: 'var(--text-muted)' }}>None</span>}
                  </td>
                  <td style={s.td}>
                    <span style={{
                      ...s.badge,
                      ...(r.status === 'pending' ? s.badgePending : r.status === 'confirmed' ? s.badgeConfirmed : s.badgeRejected)
                    }}>
                      {r.status}
                    </span>
                  </td>
                  <td style={s.td}>
                    {actionLoading === r._id ? (
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Saving...</span>
                    ) : (
                      <div style={s.actions}>
                        {r.status !== 'confirmed' && (
                          <button
                            style={{ ...s.actionBtn, ...s.confirmBtn }}
                            onClick={() => handleStatusUpdate(r._id, 'confirmed')}
                            title="Confirm Registration"
                          >
                            ✓ Confirm
                          </button>
                        )}
                        {r.status !== 'rejected' && (
                          <button
                            style={{ ...s.actionBtn, ...s.rejectBtn }}
                            onClick={() => handleStatusUpdate(r._id, 'rejected')}
                            title="Reject Registration"
                          >
                            ✗ Reject
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
