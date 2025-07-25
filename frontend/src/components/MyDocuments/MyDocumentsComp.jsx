import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUserDocuments } from '../../store/slices/BussinessDetailSlice';
import { CheckCircle, XCircle, FileText } from 'lucide-react';

const DOCUMENT_LABELS = {
  kbis: 'Business Registration Certificate',
  pro_insurance: 'Professional Liability Insurance',
  insurance: 'General Insurance Certificate',
  id: 'Contact ID Document',
  rib: 'Company Bank Details',
};

const DOCUMENT_GROUPS = [
  { key: 'kbis', label: 'Business Registration Certificate' },
  { key: 'pro_insurance', label: 'Professional Liability Insurance' },
  { key: 'insurance', label: 'General Insurance Certificate' },
  { key: 'id', label: 'Contact ID Document' },
  { key: 'rib', label: 'Company Bank Details' },
];

function getStatusIcon(is_verified) {
  return is_verified ? (
    <CheckCircle className="w-6 h-6 text-green-500" />
  ) : (
    <XCircle className="w-6 h-6 text-red-400" />
  );
}

export default function MyDocumentsComp() {
  const dispatch = useDispatch();
  const { userDocuments, loading, error } = useSelector(state => state.businessDetail);
  const accessToken = sessionStorage.getItem('access');

  useEffect(() => {
    if (!userDocuments && accessToken) {
      dispatch(fetchUserDocuments(accessToken));
    }
  }, [dispatch, userDocuments, accessToken]);

  return (
    <div className="max-w-3xl mx-auto px-2 sm:px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Documents</h1>
      {loading ? (
        <div className="text-center text-gray-400 py-12">Loading...</div>
      ) : error ? (
        <div className="text-center text-red-500 py-12">{typeof error === 'string' ? error : 'Failed to load documents.'}</div>
      ) : (
        <div className="flex flex-col gap-8">
          {DOCUMENT_GROUPS.map(group => {
            const doc = (userDocuments || []).find(d => d.document_type === group.key);
            return (
              <div key={group.key}>
                <h2 className="text-lg sm:text-xl font-semibold mb-2">{group.label}</h2>
                <div className="bg-white border border-blue-100 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 shadow-sm transition hover:shadow-md">
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <FileText className="w-8 h-8 text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-base sm:text-lg text-gray-900">
                      {DOCUMENT_LABELS[group.key]}
                    </div>
                    <div className="text-gray-500 text-sm mt-1">
                      {/* Placeholder for coverage/limitations/status, can be dynamic if backend provides */}
                      {group.key === 'kbis' && 'Coverage Area: Nationwide'}
                      {group.key === 'pro_insurance' && 'Coverage Area: Regional, Limitations: Excludes projects over $50,000'}
                      {group.key === 'insurance' && 'Coverage Area: Local, Limitations: None'}
                      {group.key === 'id' && 'Coverage Area: Nationwide'}
                      {group.key === 'rib' && 'Coverage Area: Nationwide'}
                    </div>
                    <div className="text-xs mt-1 text-gray-400">
                      {doc ? (doc.is_verified ? 'Approved' : 'Rejected') : 'Not Uploaded'}
                    </div>
                    {doc && (
                      <a
                        href={doc.file}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block mt-2 text-blue-700 underline text-sm font-medium"
                      >
                        View Document
                      </a>
                    )}
                  </div>
                  <div className="flex-shrink-0 mt-2 sm:mt-0">
                    {doc ? getStatusIcon(doc.is_verified) : <XCircle className="w-6 h-6 text-gray-300" />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
