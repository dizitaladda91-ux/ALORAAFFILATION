import React, { useEffect, useState } from 'react';
import { Card } from '../components/common/Card';
import { Table } from '../components/common/Table';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Modal } from '../components/common/Modal';
import { fetchAffiliateLinks, createAffiliateLink } from '../services/affiliateService';
import { useNotification } from '../hooks/useNotification';
import { formatDate } from '../utils/formatters';
import { Plus, Copy, ExternalLink } from 'lucide-react';

export const ReferralLinks = () => {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [saving, setSaving] = useState(false);

  const { showSuccess, showError } = useNotification();

  const loadLinks = async () => {
    try {
      const data = await fetchAffiliateLinks();
      setLinks(data);
    } catch (err) {
      showError('Failed to fetch referral links');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLinks();
  }, []);

  const handleCreateLink = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createAffiliateLink({ title, targetUrl });
      showSuccess('Campaign link generated successfully');
      setModalOpen(false);
      setTitle('');
      setTargetUrl('');
      loadLinks();
    } catch (err) {
      showError(err.message || 'Failed to create link');
    } finally {
      setSaving(false);
    }
  };

  const copyLink = (code) => {
    // Use the public portal even if an administrator happens to generate a
    // link from a local development machine.
    const referralBaseUrl = (import.meta.env.VITE_REFERRAL_BASE_URL || 'https://affiliation.aloraradiance.com').replace(/\/$/, '');
    const fullUrl = `${referralBaseUrl}/ref/${code}`;
    navigator.clipboard.writeText(fullUrl);
    showSuccess('Referral URL copied to clipboard!');
  };

  const columns = [
    {
      header: 'Campaign Title',
      accessor: 'title',
      render: (row) => <strong style={{ fontWeight: 700 }}>{row.title}</strong>,
    },
    {
      header: 'Referral Code',
      accessor: 'referral_code',
      render: (row) => <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{row.referral_code}</span>,
    },
    {
      header: 'Clicks',
      accessor: 'click_count',
    },
    {
      header: 'Created',
      accessor: 'created_at',
      render: (row) => formatDate(row.created_at),
    },
    {
      header: 'Actions',
      accessor: 'id',
      render: (row) => (
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => copyLink(row.referral_code)} style={{ padding: '0.375rem 0.625rem', fontSize: '0.75rem' }}>
            <Copy size={14} /> Copy URL
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>Referral Link Generator</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Create custom tracking links for your marketing campaigns and social channels.
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)} icon={Plus}>
          Generate New Link
        </Button>
      </div>

      <Card>
        <Table columns={columns} data={links} loading={loading} />
      </Card>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Generate Custom Referral Link">
        <form onSubmit={handleCreateLink}>
          <Input
            label="Campaign Title"
            placeholder="e.g. YouTube Tech Review Campaign"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <Input
            label="Target Destination URL (Optional)"
            placeholder="https://yourdomain.com/product/special-offer"
            value={targetUrl}
            onChange={(e) => setTargetUrl(e.target.value)}
          />
          <div className="flex justify-end gap-2" style={{ marginTop: '1.5rem' }}>
            <Button variant="secondary" onClick={() => setModalOpen(false)} type="button">
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              Generate Link
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
