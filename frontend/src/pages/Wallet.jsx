import React, { useEffect, useState } from 'react';
import { Card } from '../components/common/Card';
import { StatCard } from '../components/common/StatCard';
import { DollarSign, Clock, CheckCircle2 } from 'lucide-react';
import { fetchWalletSummary } from '../services/walletService';
import { formatCurrency } from '../utils/formatters';

export const Wallet = () => {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    fetchWalletSummary().then(setSummary).catch(console.error);
  }, []);

  return (
    <div>
      <h1>My Wallet</h1>
      <div className="grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
        <StatCard title="AVAILABLE BALANCE" value={formatCurrency(summary?.available_balance || 0)} icon={DollarSign} />
        <StatCard title="PENDING WITHDRAWAL" value={formatCurrency(summary?.pending_balance || 0)} icon={Clock} />
        <StatCard title="CONFIRMED RECEIVED / PAID" value={formatCurrency(summary?.total_withdrawn || 0)} icon={CheckCircle2} />
      </div>

      <Card>
        <p style={{ color: 'var(--text-muted)', margin: 0 }}>
          💡 Your available balance can be requested as a UPI or bank-transfer withdrawal.
        </p>
      </Card>
    </div>
  );
};
