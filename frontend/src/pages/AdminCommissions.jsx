import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { StatCard } from '../components/common/StatCard';
import { useNotification } from '../hooks/useNotification';
import { formatCurrency, formatDate } from '../utils/formatters';
import { CheckCircle2, XCircle, Clock, Zap, Filter } from 'lucide-react';

export const AdminCommissions = () => {
  const [commissions, setCommissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [settling, setSettling] = useState(false);
  const [activeTab, setActiveTab] = useState('pending'); // 'all', 'pending', 'approved', 'paid', 'rejected'
  const { showSuccess, showError } = useNotification();

  const load = () => {
    setLoading(true);
    const query = activeTab === 'all' ? '' : `?status=${activeTab}`;
    api.get(`/commissions/admin/all${query}`)
      .then((res) => {
        setCommissions(res.data.data || []);
      })
      .catch((err) => {
        showError(err.response?.data?.message || 'Failed to fetch commissions');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [activeTab]);

  const updateStatus = async (commissionId, status) => {
    try {
      await api.patch(`/commissions/${commissionId}/status`, { status });
      showSuccess(`Commission status updated to ${status}`);
      load();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleAutoSettle = async (days = 0) => {
    setSettling(true);
    try {
      const res = await api.post('/commissions/auto-settle', { holdDays: days });
      const { settledCount, totalSettledAmount } = res.data.data;
      showSuccess(`Successfully settled ${settledCount} commissions totaling ${formatCurrency(totalSettledAmount)}!`);
      load();
    } catch (err) {
      showError(err.response?.data?.message || 'Settlement failed');
    } finally {
      setSettling(false);
    }
  };

  // Stats calculation
  const pendingItems = commissions.filter((c) => (c.status || '').toLowerCase() === 'pending');
  const totalPendingAmount = pendingItems.reduce((acc, c) => acc + Number(c.amount || 0), 0);

  return (
    <div className="admin-commissions-page">
      <div className="page-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', margin: 0 }}>Pending & All Commissions</h1>
          <p style={{ color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>Review, approve, or reject affiliate sales commissions in real-time.</p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <Button
            onClick={() => handleAutoSettle(0)}
            loading={settling}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', border: 'none' }}
          >
            <Zap size={18} /> Settle ALL Pending Now
          </Button>
          <Button
            onClick={() => handleAutoSettle(7)}
            loading={settling}
            variant="secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Clock size={18} /> Settle Matured (&gt;7 Days)
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
        <StatCard
          title="Pending Approval Commissions"
          value={pendingItems.length.toString()}
          description="Awaiting Admin Review"
          icon={Clock}
        />
        <StatCard
          title="Total Pending Value"
          value={formatCurrency(totalPendingAmount)}
          description="Ready for Approval & Settlement"
          icon={CheckCircle2}
        />
      </div>

      {/* Filter Tabs */}
      <Card>
        <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.1))', paddingBottom: '1rem', marginBottom: '1rem', overflowX: 'auto' }}>
          {[
            { id: 'pending', label: 'Pending Approval' },
            { id: 'approved', label: 'Approved' },
            { id: 'paid', label: 'Paid Out' },
            { id: 'rejected', label: 'Rejected' },
            { id: 'all', label: 'All Commissions' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '0.5rem 1.2rem',
                borderRadius: '0.5rem',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.9rem',
                background: activeTab === tab.id ? 'var(--primary, #3b82f6)' : 'rgba(255,255,255,0.05)',
                color: activeTab === tab.id ? '#ffffff' : 'var(--text-muted, #94a3b8)',
                transition: 'all 0.2s ease',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Table View */}
        <div className="table-container" style={{ overflowX: 'auto' }}>
          <table className="custom-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left' }}>
                <th style={{ padding: '0.85rem' }}>Date & Time</th>
                <th style={{ padding: '0.85rem' }}>Affiliate Details</th>
                <th style={{ padding: '0.85rem' }}>Order ID</th>
                <th style={{ padding: '0.85rem' }}>Sale Amount</th>
                <th style={{ padding: '0.85rem' }}>Commission Earned</th>
                <th style={{ padding: '0.85rem' }}>Status</th>
                <th style={{ padding: '0.85rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {commissions.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No commissions found for "{activeTab}".
                  </td>
                </tr>
              )}

              {commissions.map((c) => {
                const isPending = (c.status || '').toLowerCase() === 'pending';
                return (
                  <tr key={c.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '0.85rem', fontSize: '0.88rem' }}>
                      {formatDate(c.created_at)}
                    </td>

                    <td style={{ padding: '0.85rem' }}>
                      <strong>{c.affiliate_name || 'Affiliate'}</strong>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{c.affiliate_email}</div>
                    </td>

                    <td style={{ padding: '0.85rem', fontSize: '0.88rem', fontFamily: 'monospace' }}>
                      {c.order_id || 'N/A'}
                    </td>

                    <td style={{ padding: '0.85rem', fontWeight: 600 }}>
                      {formatCurrency(c.order_amount || 0)}
                    </td>

                    <td style={{ padding: '0.85rem', fontWeight: 700, color: '#10b981' }}>
                      {formatCurrency(c.amount || 0)}
                    </td>

                    <td style={{ padding: '0.85rem' }}>
                      <Badge status={c.status}>{c.status}</Badge>
                    </td>

                    <td style={{ padding: '0.85rem', textAlign: 'right' }}>
                      {isPending ? (
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <Button
                            size="sm"
                            onClick={() => updateStatus(c.id, 'approved')}
                            style={{ background: '#10b981', color: '#fff', border: 'none' }}
                          >
                            <CheckCircle2 size={14} style={{ marginRight: '4px' }} /> Approve
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => updateStatus(c.id, 'rejected')}
                            style={{ background: '#ef4444', color: '#fff', border: 'none' }}
                          >
                            <XCircle size={14} style={{ marginRight: '4px' }} /> Reject
                          </Button>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No action required</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
