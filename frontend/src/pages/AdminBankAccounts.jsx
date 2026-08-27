import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { FileText, Eye } from 'lucide-react';

export const AdminBankAccounts = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);

  const load = () => {
    setLoading(true);
    api.get('/bank-accounts/admin/all')
      .then((r) => setItems(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const action = (id, name) => {
    api.patch(`/bank-accounts/${id}/${name}`).then(load);
  };

  return (
    <div className="admin-bank-verification-page">
      <div className="page-heading">
        <h1>Bank Verification</h1>
        <p>Verify affiliate payout accounts & passbook proof before approving withdrawals.</p>
      </div>

      <Card>
        {items.length === 0 && !loading && (
          <p className="empty-state">No bank accounts pending verification.</p>
        )}

        <div className="bank-account-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {items.map((a) => (
            <article
              className="bank-account-item"
              key={a.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1.2rem',
                border: '1px solid var(--border-color, rgba(255,255,255,0.1))',
                borderRadius: '0.75rem',
                background: 'var(--bg-card, #1e293b)'
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                <strong style={{ fontSize: '1.1rem' }}>{a.bank_name} · {a.account_number}</strong>
                <p style={{ margin: 0, color: 'var(--text-muted)' }}>
                  <strong>Holder:</strong> {a.account_holder_name} | <strong>Email:</strong> {a.email}
                </p>
                <small style={{ color: 'var(--text-muted)' }}>
                  <strong>IFSC:</strong> {a.ifsc_code} | <strong>Type:</strong> {a.account_type || 'SAVINGS'}
                </small>

                {a.document_url && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setSelectedDoc({ name: a.account_holder_name, url: a.document_url })}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                    >
                      <Eye size={16} /> View Passbook / Cheque Proof
                    </Button>
                  </div>
                )}
              </div>

              <div className="bank-account-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Badge status={a.verification_status}>{a.verification_status}</Badge>

                {a.verification_status === 'PENDING' && (
                  <>
                    <Button onClick={() => action(a.id, 'verify')} variant="primary">
                      Verify
                    </Button>
                    <Button onClick={() => action(a.id, 'reject')} variant="danger">
                      Reject
                    </Button>
                  </>
                )}
              </div>
            </article>
          ))}
        </div>
      </Card>

      {/* Document Proof Modal */}
      {selectedDoc && (
        <Modal
          isOpen={Boolean(selectedDoc)}
          onClose={() => setSelectedDoc(null)}
          title={`Bank Proof Document - ${selectedDoc.name}`}
        >
          <div style={{ textAlign: 'center', padding: '1rem' }}>
            {selectedDoc.url.startsWith('data:image') || selectedDoc.url.match(/\.(jpeg|jpg|gif|png|webp)/i) ? (
              <img
                src={selectedDoc.url}
                alt="Passbook / Cheque Proof"
                style={{ maxWidth: '100%', maxHeight: '70vh', borderRadius: '0.5rem', border: '1px solid #334155' }}
              />
            ) : (
              <iframe
                src={selectedDoc.url}
                title="Passbook Proof PDF"
                style={{ width: '100%', height: '500px', border: 'none' }}
              />
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
