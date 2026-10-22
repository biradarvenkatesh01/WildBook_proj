import { useState, useEffect } from 'react';
import StatusBadge from '../../components/StatusBadge';
import client from '../../api/client';

export default function AdminDetailDrawer({ adminId, onClose, onUpdated }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [downloadingDocId, setDownloadingDocId] = useState(null);

  // Fetch admin profile and documents
  useEffect(() => {
    if (!adminId) return;

    let isMounted = true;
    async function fetchDetail() {
      try {
        setLoading(true);
        setError('');
        const res = await client.get(`/owner/admins/${adminId}`);
        if (isMounted) {
          setAdmin(res.admin);
          setNote(res.admin.review_note || '');
        }
      } catch (err) {
        if (isMounted) setError(err.data?.error || err.message || 'Failed to load details');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchDetail();
    return () => {
      isMounted = false;
    };
  }, [adminId]);

  // Handle status update (APPROVE / REJECT / SUSPEND)
  const handleDecision = async (decision) => {
    if (decision === 'REJECTED' && (!note || note.trim().length === 0)) {
      alert('Please provide a reason in the Notes field before rejecting this application.');
      return;
    }

    const confirmMsg = {
      APPROVED: 'Are you sure you want to approve this sanctuary administrator?',
      REJECTED: 'Are you sure you want to reject this registration application?',
      SUSPENDED: 'Are you sure you want to suspend this administrator account?',
    }[decision];

    if (!window.confirm(confirmMsg)) return;

    try {
      setActionLoading(true);
      await client.patch(`/owner/admins/${adminId}`, { decision, note });
      onUpdated?.(adminId, decision, note);
      onClose();
    } catch (err) {
      alert(err.data?.error || err.message || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle secure document download streaming
  const handleDownloadDocument = async (docId, filename) => {
    try {
      setDownloadingDocId(docId);
      const token = localStorage.getItem('wb_token');
      const response = await fetch(`/api/owner/admins/${adminId}/documents/${docId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to download document from server');
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename || `document_${docId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      alert(err.message || 'Could not download document.');
    } finally {
      setDownloadingDocId(null);
    }
  };

  if (!adminId) return null;

  return (
    <aside className="w-full lg:w-[440px] xl:w-[480px] bg-white border-l border-[#E5DAC6] h-full flex flex-col shadow-2xl shrink-0 z-30 transition-all">
      {/* ── Drawer Header (Design 23) ─────────────────────────────────────── */}
      <div className="p-6 border-b border-gray-100 flex items-start justify-between bg-white shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <h2 className="text-xl font-serif text-[#162B1D] font-semibold">
              Request Details
            </h2>
            {admin && <StatusBadge status={admin.account_status} size="sm" />}
          </div>
          {admin && (
            <p className="text-xs text-gray-400">
              Submitted on{' '}
              {new Date(admin.created_at).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
          aria-label="Close details"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* ── Scrollable Body ────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {loading ? (
          <div className="py-20 text-center">
            <div className="inline-block w-8 h-8 border-2 border-[#162B1D]/20 border-t-[#162B1D] rounded-full animate-spin mb-2" />
            <p className="text-xs text-gray-500">Loading administrator details...</p>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 text-red-700 rounded-xl text-xs">{error}</div>
        ) : admin ? (
          <>
            {/* 1. Personal Information */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#162B1D] mb-3 pb-1 border-b border-gray-100">
                Personal Information
              </h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="block text-gray-400 mb-0.5">Full Name</span>
                  <span className="font-medium text-gray-900">{admin.name}</span>
                </div>
                <div>
                  <span className="block text-gray-400 mb-0.5">Email</span>
                  <span className="font-medium text-gray-900 break-all">{admin.email}</span>
                </div>
                <div>
                  <span className="block text-gray-400 mb-0.5">Phone Number</span>
                  <span className="font-medium text-gray-900">{admin.phone || '—'}</span>
                </div>
                <div>
                  <span className="block text-gray-400 mb-0.5">Designation</span>
                  <span className="font-medium text-gray-900">{admin.designation || 'Operator'}</span>
                </div>
              </div>
            </div>

            {/* 2. Organisation Information */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#162B1D] mb-3 pb-1 border-b border-gray-100">
                Organisation Information
              </h3>
              <div className="space-y-3 text-xs">
                <div>
                  <span className="block text-gray-400 mb-0.5">Organisation Name</span>
                  <span className="font-semibold text-gray-900 text-sm">{admin.organisation_name}</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="block text-gray-400 mb-0.5">License Number</span>
                    <span className="font-mono text-gray-900 bg-gray-50 px-2 py-0.5 rounded border border-gray-200 inline-block">
                      {admin.license_number}
                    </span>
                  </div>
                  <div>
                    <span className="block text-gray-400 mb-0.5">Website</span>
                    {admin.website ? (
                      <a
                        href={admin.website.startsWith('http') ? admin.website : `https://${admin.website}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#D9A441] hover:underline font-medium truncate block"
                      >
                        {admin.website.replace(/^https?:\/\//, '')} ↗
                      </a>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </div>
                </div>
                <div>
                  <span className="block text-gray-400 mb-0.5">Registered Address</span>
                  <span className="text-gray-700 leading-relaxed block">{admin.registered_address}</span>
                </div>
              </div>
            </div>

            {/* 3. Uploaded Documents (Design 23) */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#162B1D] mb-3 pb-1 border-b border-gray-100">
                Uploaded Documents
              </h3>
              {admin.documents && admin.documents.length > 0 ? (
                <div className="space-y-2.5">
                  {admin.documents.map((doc) => {
                    const isDownloading = downloadingDocId === doc.document_id;
                    const docLabels = {
                      LICENSE: 'License Certificate',
                      IDENTITY: 'Identity Proof',
                      AUTHORIZATION: 'Authorization Letter',
                    };
                    const label = docLabels[doc.doc_type] || doc.doc_type;

                    return (
                      <div
                        key={doc.document_id}
                        className="flex items-center justify-between p-3 rounded-xl border border-gray-200 bg-gray-50/70 hover:bg-gray-50 transition"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0">
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                              <polyline points="14 2 14 8 20 8" />
                              <line x1="16" y1="13" x2="8" y2="13" />
                              <line x1="16" y1="17" x2="8" y2="17" />
                            </svg>
                          </div>
                          <div className="min-w-0">
                            <span className="block text-xs font-semibold text-gray-900 truncate">
                              {label}
                            </span>
                            <span className="block text-[10px] text-gray-400">
                              {doc.sizeFormatted} • {doc.doc_type}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDownloadDocument(doc.document_id, doc.filename)}
                          disabled={isDownloading}
                          className="p-2 text-gray-500 hover:text-[#162B1D] hover:bg-white rounded-lg border border-transparent hover:border-gray-200 transition shrink-0 ml-2"
                          title="Download document"
                        >
                          {isDownloading ? (
                            <span className="inline-block w-4 h-4 border-2 border-gray-400 border-t-gray-800 rounded-full animate-spin" />
                          ) : (
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                              <polyline points="7 10 12 15 17 10" />
                              <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic">No documents attached.</p>
              )}
            </div>

            {/* 4. Notes Section (Design 23) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[#162B1D]" htmlFor="review-notes">
                  Notes
                </label>
                <span className="text-[11px] text-gray-400 italic">
                  (Required for Reject)
                </span>
              </div>
              <textarea
                id="review-notes"
                rows="3"
                value={note}
                maxLength="500"
                onChange={(e) => setNote(e.target.value)}
                placeholder="Enter notes here..."
                className="w-full p-3 text-xs border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D9A441] focus:border-transparent text-gray-900 resize-none"
              />
              <div className="text-right text-[10px] text-gray-400 mt-1">
                {note.length} / 500
              </div>
            </div>
          </>
        ) : null}
      </div>

      {/* ── Action Buttons Footer (Design 23) ──────────────────────────────── */}
      {admin && (
        <div className="p-6 border-t border-[#E5DAC6] bg-gray-50 shrink-0">
          <div className="grid grid-cols-3 gap-2.5">
            {/* Approve Button */}
            <button
              type="button"
              disabled={actionLoading || admin.account_status === 'APPROVED'}
              onClick={() => handleDecision('APPROVED')}
              className="py-2.5 px-3 rounded-xl bg-[#1F3D2B] text-white font-semibold text-xs hover:bg-[#162B1D] active:scale-[0.98] transition shadow-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
              </svg>
              Approve
            </button>

            {/* Reject Button (Requires Note) */}
            <button
              type="button"
              disabled={actionLoading || admin.account_status === 'REJECTED'}
              onClick={() => handleDecision('REJECTED')}
              className="py-2.5 px-3 rounded-xl bg-[#C53030] text-white font-semibold text-xs hover:bg-[#9B2C2C] active:scale-[0.98] transition shadow-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
              </svg>
              Reject
            </button>

            {/* Suspend Button */}
            <button
              type="button"
              disabled={actionLoading || admin.account_status === 'SUSPENDED'}
              onClick={() => handleDecision('SUSPENDED')}
              className="py-2.5 px-3 rounded-xl bg-white border border-gray-300 text-gray-700 font-semibold text-xs hover:bg-gray-100 active:scale-[0.98] transition shadow-xs disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="6" y="4" width="4" height="16" />
                <rect x="14" y="4" width="4" height="16" />
              </svg>
              Suspend
            </button>
          </div>
          <span className="block text-center text-[10px] text-gray-400 mt-2">
            Decisions take effect immediately and are audited.
          </span>
        </div>
      )}
    </aside>
  );
}
