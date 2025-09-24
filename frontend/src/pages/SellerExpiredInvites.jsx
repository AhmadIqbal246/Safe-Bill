import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchExpiredInvites, resendExpiredInvite } from '../store/slices/ProjectSlice';
import MainLayout from '../components/Layout/MainLayout';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';

function ExpiredInvitesTable({ items, onResend, t, resendingToken }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left">
          <thead className="bg-gray-50 text-gray-700">
            <tr>
              <th className="px-4 py-3 text-sm">{t('common.project')}</th>
              <th className="px-4 py-3 text-sm">{t('common.client_email')}</th>
              <th className="px-4 py-3 text-sm whitespace-nowrap">{t('common.created_at')}</th>
              <th className="px-4 py-3 text-sm">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {items.map(project => (
              <tr key={project.id} className="border-t border-gray-100">
                <td className="px-4 py-3 text-sm text-gray-800">{project.name}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{project.client_email}</td>
                <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{project.created_at}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => onResend(project.invite_token)}
                    disabled={!project.invite_token || resendingToken === project.invite_token}
                    className={`px-3 py-1.5 text-sm rounded-md cursor-pointer text-white ${
                      resendingToken === project.invite_token
                        ? 'bg-gray-400'
                        : 'bg-[#01257D] hover:bg-[#2346a0]'
                    }`}
                  >
                    {resendingToken === project.invite_token
                      ? t('actions.sending')
                      : t('common.resend_invite')}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Pagination({ page, total, pageSize, onPageChange, t }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className="flex items-center justify-between mt-4 gap-2">
      <button
        className="px-3 py-1.5 text-sm rounded-md border border-gray-300 bg-white disabled:opacity-50"
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page <= 1}
      >
        {t('common.prev')}
      </button>
      <div className="text-sm text-gray-600">
        {page} / {totalPages}
      </div>
      <button
        className="px-3 py-1.5 text-sm rounded-md border border-gray-300 bg-white disabled:opacity-50"
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        disabled={page >= totalPages}
      >
        {t('common.next')}
      </button>
    </div>
  );
}

export default function SellerExpiredInvitesPage() {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { expiredInvites, expiredInvitesLoading, expiredInvitesError } = useSelector(state => state.project);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [resendingToken, setResendingToken] = useState(null);

  useEffect(() => {
    dispatch(fetchExpiredInvites());
  }, [dispatch]);

  const handleResend = async (token) => {
    try {
      setResendingToken(token);
      await dispatch(resendExpiredInvite({ token })).unwrap();
      // Refresh listing after resend
      dispatch(fetchExpiredInvites());
      toast.success(t('common.invite_resent'));
    } catch (e) {
      toast.error(e?.detail || e?.message || t('common.unexpected_error'));
    }
    finally {
      setResendingToken(null);
    }
  };

  const total = expiredInvites ? expiredInvites.length : 0;
  const pagedItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return (expiredInvites || []).slice(start, start + pageSize);
  }, [expiredInvites, page]);

  return (
    <MainLayout>
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold text-[#01257D] mb-2">
            {t('sidebar.expired_tokens')}
          </h1>
          <p className="text-gray-600 mb-4">{t('common.expired_tokens_description')}</p>

          {expiredInvitesLoading && (
            <div className="text-gray-600">{t('common.loading')}</div>
          )}
          {expiredInvitesError && (
            <div className="text-red-600">{String(expiredInvitesError)}</div>
          )}

          {!expiredInvitesLoading && total > 0 && (
            <>
              <ExpiredInvitesTable items={pagedItems} onResend={handleResend} t={t} resendingToken={resendingToken} />
              <Pagination page={page} total={total} pageSize={pageSize} onPageChange={setPage} t={t} />
            </>
          )}

          {!expiredInvitesLoading && total === 0 && (
            <div className="bg-white rounded-md p-6 border border-gray-200 text-center text-gray-500">
              {t('common.no_expired_tokens')}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}


