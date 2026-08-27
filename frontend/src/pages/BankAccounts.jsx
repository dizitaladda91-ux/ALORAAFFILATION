import React, { useEffect, useState } from 'react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { createBankAccount, deleteBankAccount, fetchBankAccounts, setDefaultBankAccount } from '../services/walletService';
import { useNotification } from '../hooks/useNotification';
import { Upload, FileCheck } from 'lucide-react';

const emptyForm = {
  accountHolderName: '',
  bankName: '',
  accountNumber: '',
  ifscCode: '',
  branchName: '',
  upiId: '',
  accountType: 'SAVINGS',
  documentUrl: '',
};

export const BankAccounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const { showSuccess, showError } = useNotification();

  const load = async () => {
    try {
      setAccounts(await fetchBankAccounts());
    } catch (error) {
      showError(error.message || 'Unable to load bank accounts');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const change = (event) => {
    const { name, value } = event.target;
    let updatedValue = value;
    if (name === 'ifscCode') {
      let clean = value.replace(/\s+/g, '').toUpperCase();
      if (clean.length >= 5 && clean[4] === 'O') {
        clean = clean.substring(0, 4) + '0' + clean.substring(5);
      }
      updatedValue = clean;
    } else if (name === 'accountNumber') {
      updatedValue = value.replace(/\s+/g, '');
    }
    setForm((current) => ({ ...current, [name]: updatedValue }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showError('Passbook image must be under 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setForm((current) => ({ ...current, documentUrl: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await createBankAccount(form);
      setForm(emptyForm);
      showSuccess('Bank account & proof submitted successfully. Pending Admin verification.');
      load();
    } catch (error) {
      showError(error.message || 'Unable to add bank account');
    } finally {
      setSaving(false);
    }
  };

  const makeDefault = async (id) => {
    try {
      await setDefaultBankAccount(id);
      showSuccess('Default bank account updated');
      load();
    } catch (error) {
      showError(error.message || 'Unable to set default account');
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this bank account?')) return;
    try {
      await deleteBankAccount(id);
      showSuccess('Bank account deleted');
      load();
    } catch (error) {
      showError(error.message || 'Unable to delete bank account');
    }
  };

  return (
    <div className="bank-accounts-page">
      <div className="page-heading">
        <h1>Bank Accounts</h1>
        <p>Add a payout account and passbook proof. Only verified accounts can receive withdrawals.</p>
      </div>

      <div className="grid-2">
        <Card>
          <h2>Add bank account</h2>
          <form className="bank-account-form" onSubmit={submit}>
            <input
              className="form-input"
              name="accountHolderName"
              placeholder="Account holder name *"
              value={form.accountHolderName}
              onChange={change}
              required
            />

            <div style={{ background: 'rgba(59, 130, 246, 0.08)', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid rgba(59, 130, 246, 0.2)', marginBottom: '0.5rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#60a5fa', display: 'block', marginBottom: '0.3rem' }}>
                📱 UPI ID / PhonePe / GPay Mobile Number (Primary Payout)
              </label>
              <input
                className="form-input"
                name="upiId"
                placeholder="e.g. 9315507417@kotakbank or 9876543210 (GPay/PhonePe)"
                value={form.upiId}
                onChange={change}
              />
              <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block', marginTop: '0.25rem' }}>
                Jis UPI ID ya Mobile Number par aapko payout payment receive karni hai.
              </small>
            </div>

            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.5rem 0' }}>
              🏛️ Bank details below are optional if UPI ID is provided:
            </p>

            <input
              className="form-input"
              name="bankName"
              placeholder="Bank name (optional)"
              value={form.bankName}
              onChange={change}
            />
            <input
              className="form-input"
              name="accountNumber"
              inputMode="numeric"
              placeholder="Account number (optional)"
              value={form.accountNumber}
              onChange={change}
            />
            <input
              className="form-input"
              name="ifscCode"
              placeholder="IFSC code (optional)"
              value={form.ifscCode}
              onChange={change}
            />
            <input
              className="form-input"
              name="branchName"
              placeholder="Branch name (optional)"
              value={form.branchName}
              onChange={change}
            />
            <select className="form-select" name="accountType" value={form.accountType} onChange={change}>
              <option value="SAVINGS">Savings account</option>
              <option value="CURRENT">Current account</option>
            </select>

            {/* Document Proof Upload */}
            <div className="form-group" style={{ margin: '0.5rem 0' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                📷 Passbook / Cancelled Cheque Proof (For Fast Verification)
              </label>
              <input
                type="file"
                accept="image/*,.pdf"
                className="form-input"
                onChange={handleFileChange}
                style={{ padding: '0.4rem' }}
              />
              {form.documentUrl && (
                <small style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.3rem' }}>
                  <FileCheck size={14} /> Document attached successfully
                </small>
              )}
            </div>

            <Button type="submit" loading={saving}>
              Add bank account
            </Button>
          </form>
        </Card>

        <Card>
          <h2>Your bank accounts</h2>
          <div className="bank-account-list">
            {accounts.length === 0 && <p className="empty-state">No bank account added yet.</p>}
            {accounts.map((account) => (
              <article className="bank-account-item" key={account.id}>
                <div>
                  <strong>{account.bank_name}</strong>
                  <p>{account.account_holder_name} · {account.account_number}</p>
                  <small>{account.ifsc_code} · {account.account_type}</small>
                </div>

                <div className="bank-account-actions">
                  <Badge status="verified" style={{ background: '#10b981', color: '#fff' }}>Verified ✅</Badge>
                  {account.is_default ? (
                    <span className="default-account">Default</span>
                  ) : (
                    <Button onClick={() => makeDefault(account.id)}>Set default</Button>
                  )}
                  {!account.is_default && (
                    <Button onClick={() => remove(account.id)}>Delete</Button>
                  )}
                </div>
              </article>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
