import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUserDocuments } from '../../store/slices/BussinessDetailSlice';
import { CheckCircle, XCircle, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const DOCUMENT_LABELS = {
  kbis: 'documents.business_registration_certificate',
  pro_insurance: 'documents.professional_liability_insurance',
  insurance: 'documents.general_insurance_certificate',
  id: 'documents.contact_id_document',
  rib: 'documents.company_bank_details',
};

const DOCUMENT_GROUPS = [
  { key: 'kbis', labelKey: 'documents.business_registration_certificate' },
  { key: 'pro_insurance', labelKey: 'documents.professional_liability_insurance' },
  { key: 'insurance', labelKey: 'documents.general_insurance_certificate' },
  { key: 'id', labelKey: 'documents.contact_id_document' },
  { key: 'rib', labelKey: 'documents.company_bank_details' },
];

function getStatusIcon(is_verified) {
  return is_verified ? (
    <CheckCircle className="w-6 h-6 text-green-500" />
  ) : (
    <XCircle className="w-6 h-6 text-red-400" />
  );
}

export default function MyDocumentsComp() {
  const { t } = useTranslation();
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
      <h1 className="text-3xl font-bold mb-8">{t('documents.title')}</h1>
      {loading ? (
        <div className="text-center text-gray-400 py-12">{t('my_profile.loading')}</div>
      ) : error ? (
        <div className="text-center text-red-500 py-12">{typeof error === 'string' ? error : t('documents.failed_load_documents')}</div>
      ) : (
        <div className="flex flex-col gap-8">
          {DOCUMENT_GROUPS.map(group => {
            const doc = (userDocuments || []).find(d => d.document_type === group.key);
            return (
              <div key={group.key}>
                <h2 className="text-lg sm:text-xl font-semibold mb-2">{t(group.labelKey)}</h2>
                <div className="bg-white border border-blue-100 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 shadow-sm transition hover:shadow-md">
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <FileText className="w-8 h-8 text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-base sm:text-lg text-gray-900">
                      {t(group.labelKey)}
                    </div>
                    <div className="text-gray-500 text-sm mt-1">
                      {/* Placeholder for coverage/limitations/status, can be dynamic if backend provides */}
                      {group.key === 'kbis' && `${t('documents.coverage_area')}: ${t('documents.nationwide')}`}
                      {group.key === 'pro_insurance' && `${t('documents.coverage_area')}: ${t('documents.regional')}, ${t('documents.limitations')}: ${t('documents.excludes_projects_over')}`}
                      {group.key === 'insurance' && `${t('documents.coverage_area')}: ${t('documents.local')}, ${t('documents.limitations')}: ${t('documents.none')}`}
                      {group.key === 'id' && `${t('documents.coverage_area')}: ${t('documents.nationwide')}`}
                      {group.key === 'rib' && `${t('documents.coverage_area')}: ${t('documents.nationwide')}`}
                    </div>
                    <div className="text-xs mt-1 text-gray-400">
                      {doc ? (doc.is_verified ? t('documents.approved') : t('documents.rejected')) : t('documents.not_uploaded')}
                    </div>
                    {doc && (
                      <a
                        href={doc.file}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block mt-2 text-blue-700 underline text-sm font-medium"
                      >
                        {t('documents.view_document')}
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
