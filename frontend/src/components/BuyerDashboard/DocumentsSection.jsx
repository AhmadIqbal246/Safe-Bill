import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function DocumentsSection({ projects = [] }) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');

  // Extract quotes from all projects the buyer is part of
  const allDocuments = useMemo(() => {
    return (projects || [])
      .filter(p => p && p.quote && p.quote.file)
      .map((project) => ({
        id: project.id,
        name: project.name || `Project #${project.id}`,
        file: project.quote?.file,
        reference_number: project.quote?.reference_number,
        uploaded_date: project.created_at,
        type: 'quote'
      }))
      // newest first
      .sort((a, b) => new Date(b.uploaded_date) - new Date(a.uploaded_date));
  }, [projects]);

  // Search filter by project name or reference number
  const filteredDocuments = useMemo(() => {
    const term = (search || '').trim().toLowerCase();
    if (!term) return allDocuments;
    return allDocuments.filter(doc =>
      (doc.name || '').toLowerCase().includes(term) ||
      (doc.reference_number || '').toLowerCase().includes(term)
    );
  }, [allDocuments, search]);

  const getFileIcon = (fileName) => {
    if (fileName?.includes('.pdf')) return '📄';
    if (fileName?.includes('.zip')) return '🗂️';
    if (fileName?.includes('.doc')) return '📝';
    return '📄';
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch (_) {
      return '';
    }
  };

  const handleDownload = (fileUrl) => {
    if (fileUrl) {
      window.open(fileUrl, '_blank');
    }
  };

  return (
    <div style={{ flex: 1, borderRadius: 12, boxShadow: '0 1px 4px #e5e7eb', padding: 24, minWidth: 340 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ fontWeight: 600, fontSize: 18 }}>{t('documents_section.title')}</div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('documents_section.search_placeholder')}
          style={{
            border: '1px solid #e5e7eb',
            borderRadius: 8,
            padding: '8px 12px',
            fontSize: 14,
            width: 220
          }}
        />
      </div>

      {/* Table header */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 170px 70px',
        gap: 12,
        padding: '8px 12px',
        background: '#F9FAFB',
        border: '1px solid #F3F4F6',
        borderRadius: 8,
        color: '#6B7280',
        fontSize: 12,
        fontWeight: 600,
        marginBottom: 8
      }}>
        <div>Project name</div>
        <div>Creation date</div>
        <div style={{ textAlign: 'right' }}>Action</div>
      </div>

      {filteredDocuments.length > 0 ? (
        <div style={{ marginBottom: 8, maxHeight: 280, overflowY: 'auto' }}>
          {filteredDocuments.map((doc, index) => (
            <div key={`${doc.id}-${index}`} style={{ 
              display: 'grid',
              gridTemplateColumns: '1fr 170px 70px',
              gap: 12,
              alignItems: 'center',
              borderBottom: index < filteredDocuments.length - 1 ? '1px solid #f3f4f6' : 'none',
              padding: '10px 12px'
            }}>
              {/* Project name + ref */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                <span style={{ fontSize: 18 }}>{getFileIcon(doc.file)}</span>
                <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                  <span style={{ fontWeight: 600, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {doc.name}
                  </span>
                  {doc.reference_number && (
                    <span style={{ color: '#6b7280', fontSize: 12 }}>Ref: {doc.reference_number}</span>
                  )}
                </div>
              </div>

              {/* Creation date */}
              <div style={{ color: '#6b7280', fontSize: 13, whiteSpace: 'nowrap' }}>
                {formatDate(doc.uploaded_date)}
              </div>

              {/* Action */}
              <div style={{ textAlign: 'right' }}>
                <button 
                  style={{ 
                    background: 'none', 
                    border: '1px solid #e5e7eb',
                    borderRadius: 8,
                    cursor: 'pointer', 
                    fontSize: 14,
                    padding: '6px 10px'
                  }}
                  title="Download"
                  onClick={() => handleDownload(doc.file)}
                >
                  Download
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ color: '#6b7280', fontSize: 14, textAlign: 'center', padding: '20px 0' }}>
          No documents found
        </div>
      )}
    </div>
  );
}