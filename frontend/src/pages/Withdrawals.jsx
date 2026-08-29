import React, { useEffect, useState } from 'react';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { fetchBankAccounts, fetchMyWithdrawals, createWithdrawal, cancelWithdrawal } from '../services/walletService';
import { formatCurrency, formatDate } from '../utils/formatters';
import { useNotification } from '../hooks/useNotification';
import { CreditCard, ArrowDownRight } from 'lucide-react';

export const Withdrawals = () => {
  const [accounts, setAccounts] = useState([]);
  const [items, setItems] = useState([]);
  const [amount, setAmount] = useState('');
  const [bankAccountId, setBankAccountId] = useState('');
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError } = useNotification();

  const load = async () => {
    try {
      const [a, w] = await Promise.all([fetchBankAccounts(), fetchMyWithdrawals()]);
      setAccounts(a.filter((x) => x.is_verified || x.verification_status === 'VERIFIED'));
      setItems(w.items || []);
    } catch (e) {
      showError(e.message || 'Unable to load withdrawals');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      showError('Please enter a valid withdrawal amount.');
      return;
    }
    setLoading(true);
    try {
      await createWithdrawal({ amount: Number(amount), bankAccountId: bankAccountId || undefined });
      setAmount('');
      showSuccess('Withdrawal request submitted successfully! ✅');
      load();
    } catch (err) {
      showError(err.message || 'Withdrawal request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="withdrawals-page" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1>Request Withdrawal</h1>
        <p style={{ color: 'var(--text-muted)' }}>Request a payout to your verified UPI ID or Bank Account.</p>
      </div>

      <Card style={{ marginBottom: '2rem', padding: '1.5rem' }}>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            <div>
              <label className="form-label" style={{ fontWeight: 600, marginBottom: '0.4rem', display: 'block' }}>
                Withdrawal Amount (₹)
              </label>
              <input
                className="form-input"
                type="number"
                min="1"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount (e.g. 500)"
                required
              />
            </div>

            <div>
              <label className="form-label" style={{ fontWeight: 600, marginBottom: '0.4rem', display: 'block' }}>
                Select Payout Account (UPI / Bank)
              </label>
              <select
                className="form-select"
                value={bankAccountId}
                onChange={(e) => setBankAccountId(e.target.value)}
              >
                <option value="">Default Verified Payout Account</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.upi_id ? `📱 UPI: ${a.upi_id}` : `🏦 ${a.bank_name} · ${a.account_number}`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Button type="submit" loading={loading} style={{ background: '#4f46e5', color: '#fff', width: 'fit-content', padding: '0.6rem 1.5rem' }}>
            Submit Withdrawal Request 💸
          </Button>
        </form>
      </Card>

      <Card style={{ padding: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ArrowDownRight size={20} color="#4f46e5" /> Withdrawal History & Transaction Receipts
        </h2>

        {items.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>No withdrawal requests found yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {items.map((item) => {
              const isPaid = item.status === 'approved' || item.status === 'paid' || item.status === 'completed';
              const utrNote = item.notes || item.transaction_reference || '';

              return (
                <div
                  key={item.id}
                  style={{
                    padding: '1.25rem',
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0',
                    background: isPaid ? '#f0fdf4' : '#ffffff',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <span style={{ fontWeight: 700, fontSize: '1.1rem', color: '#1e293b' }}>
                        {formatCurrency(item.amount)}
                      </span>
                      <span style={{ color: '#64748b', fontSize: '0.85rem', marginLeft: '0.75rem' }}>
                        Ref #{item.withdrawal_number}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <Badge status={isPaid ? 'completed' : item.status}>
                        {isPaid ? 'PAID / CONFIRMED ✅' : item.status.toUpperCase()}
                      </Badge>

                      {item.status === 'pending' && (
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={async () => {
                            try {
                              await cancelWithdrawal(item.id);
                              showSuccess('Withdrawal request cancelled');
                              load();
                            } catch (err) {
                              showError('Failed to cancel request');
                            }
                          }}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.85rem', color: '#475569' }}>
                    <span>Requested: {formatDate(item.created_at)}</span>

                    {/* Transaction ID / UTR Highlight Box */}
                    {utrNote ? (
                      <div style={{ background: '#dcfce7', border: '1px solid #86efac', padding: '0.35rem 0.75rem', borderRadius: '6px', color: '#166534', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <CreditCard size={15} /> <span>Transaction / UTR ID: <strong>{utrNote}</strong></span>
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
};
