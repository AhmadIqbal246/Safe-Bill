import React from 'react';

export default function DocumentsSection({ projects = [] }) {
  // Extract documents from projects (quotes and any other files)
  const allDocuments = projects.map(project => ({
    id: project.id,
    name: `${project.name} - Quote`,
    file: project.quote?.file,
    reference_number: project.quote?.reference_number,
    uploaded_date: project.created_at,
    type: 'quote'
  }));

  // For now, show first 2 documents
  const displayDocuments = allDocuments.slice(0, 2);

  const getFileIcon = (fileName) => {
    if (fileName?.includes('.pdf')) return '📄';
    if (fileName?.includes('.zip')) return '🗂️';
    if (fileName?.includes('.doc')) return '📝';
    return '📄';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const handleDownload = (fileUrl) => {
    if (fileUrl) {
      window.open(fileUrl, '_blank');
    }
  };

  return (
    <div style={{ flex: 1, borderRadius: 12, boxShadow: '0 1px 4px #e5e7eb', padding: 24, minWidth: 340 }}>
      <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 16 }}>Documents</div>
      
      {displayDocuments.length > 0 ? (
        <div style={{ marginBottom: 16 }}>
          {displayDocuments.map((doc, index) => (
            <div key={doc.id} style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              marginBottom: index < displayDocuments.length - 1 ? 8 : 0 
            }}>
              <span>{getFileIcon(doc.file)} {doc.name}</span>
              <span style={{ color: '#6b7280', fontSize: 13 }}>
                Uploaded {formatDate(doc.uploaded_date)}
              </span>
              <button 
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  cursor: 'pointer', 
                  fontSize: 18 
                }}
                onClick={() => handleDownload(doc.file)}
              >
                ⬇️
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ color: '#6b7280', fontSize: 14, textAlign: 'center', padding: '20px 0' }}>
          No documents found
        </div>
      )}
      
      <button style={{ 
        width: '100%', 
        background: '#f5f7fa', 
        border: '1px dashed #153A7D', 
        borderRadius: 8, 
        padding: '12px 0', 
        color: '#153A7D', 
        fontWeight: 500, 
        fontSize: 16, 
        cursor: 'pointer' 
      }}>
        + Upload Document
      </button>
    </div>
  );
}