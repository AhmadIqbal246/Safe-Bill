import React from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function ReceiptsSection() {
  const { t } = useTranslation();
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [projects, setProjects] = React.useState([]);
  const [page, setPage] = React.useState(1);
  const pageSize = 2;
  const [expands, setExpands] = React.useState({});
  const [search, setSearch] = React.useState("");

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = sessionStorage.getItem('access');
      const res = await axios.get(`${BASE_URL}api/projects/receipts/buyer/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        withCredentials: true,
      });
      const items = res.data.projects || [];
      setProjects(items);
      // default expanded
      const map = {};
      items.forEach((it) => { if (it && it.id != null) map[it.id] = true; });
      setExpands(map);
    } catch (e) {
      setError(e?.response?.data?.detail || e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { fetchData(); }, [fetchData]);

  const toggleExpand = (id) => setExpands(prev => ({ ...prev, [id]: !prev[id] }));

  const calcTotals = (project) => {
    const total = (project.installments || []).reduce((s, i) => s + Number(i.amount || 0), 0);
    const vatPct = Number(project.vat_rate || 0);
    const vatAmount = +(total * vatPct / 100).toFixed(2);
    const buyerPaid = +(total + vatAmount).toFixed(2);
    return { total, vatPct, vatAmount, buyerPaid };
  };

  const downloadPdf = async (project) => {
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);

      const el = document.getElementById(`buyer-receipt-${project.id}`);
      if (!el) return;

      const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = canvas.height * imgWidth / canvas.width;

      let pos = 0;
      let heightLeft = imgHeight;
      while (heightLeft > 0) {
        pdf.addImage(imgData, 'PNG', 0, pos, imgWidth, imgHeight);
        heightLeft -= pageHeight;
        if (heightLeft > 0) {
          pdf.addPage();
          pos = 0 - (imgHeight - heightLeft);
        }
      }
      pdf.save(`receipt_buyer_${project.reference_number || project.id}.pdf`);
    } catch (e) {
      toast.error('Failed to generate PDF');
    }
  };

  // Reset page when search or dataset changes
  React.useEffect(() => { setPage(1); }, [search, projects]);

  // Filter by project name
  const filtered = React.useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return projects;
    return projects.filter(p => (p.name || "").toLowerCase().includes(term));
  }, [projects, search]);

  // Pagination
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const startIdx = (page - 1) * pageSize;
  const endIdx = Math.min(startIdx + pageSize, total);
  const paged = filtered.slice(startIdx, endIdx);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{t('receipts.title')}</h3>
        <div className="flex items-center gap-2 w-full sm:w-80">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('receipts.search_placeholder')}
            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#01257D]"
          />
        </div>
      </div>

      {loading ? (
        <div className="py-10 text-center text-gray-500">{t('receipts.loading')}</div>
      ) : error ? (
        <div className="py-10 text-center text-red-600">{error}</div>
      ) : paged.length === 0 ? (
        <div className="py-10 text-center text-gray-500">{t('receipts.none_found')}</div>
      ) : (
        <div className="space-y-4">
          {paged.map((p) => {
            const { total, vatPct, vatAmount, buyerPaid } = calcTotals(p);
            return (
              <div key={p.id} className="border border-gray-200 rounded-md">
                <div className="flex items-center justify-between gap-3 p-3 bg-gray-50 rounded-t-md">
                  <div>
                    <div className="font-medium text-[#01257D]">{p.name}</div>
                    <div className="text-xs text-gray-500">{t('receipts.ref')} {p.reference_number || '-'}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleExpand(p.id)}
                      className="px-3 py-2 text-sm rounded-md border bg-white hover:bg-gray-50 cursor-pointer"
                    >
                      {expands[p.id] ? t('receipts.hide') : t('receipts.details')}
                    </button>
                    <button
                      onClick={() => downloadPdf(p)}
                      className="px-3 py-2 text-sm rounded-md bg-[#01257D] text-white cursor-pointer hover:bg-[#1d3f99]"
                    >
                      {t('receipts.download_pdf')}
                    </button>
                  </div>
                </div>
                {expands[p.id] && (
                  <>
                    <div className="p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                      <div><span className="text-gray-500">{t('receipts.total')}</span><div className="font-semibold">€{total.toLocaleString()}</div></div>
                      <div><span className="text-gray-500">{t('receipts.vat')}</span><div className="font-semibold">{vatPct.toFixed(1)}% (+€{vatAmount.toLocaleString()})</div></div>
                      <div><span className="text-gray-500">{t('receipts.paid')}</span><div className="font-semibold text-green-700">€{buyerPaid.toLocaleString()}</div></div>
                    </div>

                    {/* Milestones table (buyer sees actual milestone amounts) */}
                    <div className="px-3 pb-3">
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                          <thead>
                            <tr className="text-left text-gray-500">
                              <th className="py-2 pr-4">{t('receipts.milestone')}</th>
                              <th className="py-2 pr-4">{t('receipts.completed_at')}</th>
                              <th className="py-2 pr-0 text-right">{t('receipts.amount')}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(p.milestones || []).filter(m => m.status === 'approved').map((m) => (
                              <tr key={m.id} className="border-t border-gray-100">
                                <td className="py-2 pr-4">{m.name}</td>
                                <td className="py-2 pr-4">{m.completion_date || '-'}</td>
                                <td className="py-2 pr-0 text-right">€{Number(m.relative_payment).toLocaleString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                )}

                {/* Printable area - show/hide with the same toggle */}
                {expands[p.id] && (
                  <div id={`buyer-receipt-${p.id}`} className="max-w-[800px] mx-auto bg-white p-6 rounded-lg border border-gray-200 mb-4" style={{ background: '#ffffff' }}>
                    {/* Brand header */}
                    <div className="flex items-center justify-between pb-4 mb-4 border-b-2" style={{ borderColor: '#01257D' }}>
                      <div className="text-xl font-bold" style={{ color: '#01257D' }}>{t('receipts.brand')}</div>
                      <div className="text-xs text-gray-500">{t('receipts.buyer_copy')}</div>
                    </div>

                    {/* Project meta */}
                    <div className="mb-5">
                      <div className="text-lg font-semibold text-gray-900">{p.name}</div>
                      <div className="text-xs text-gray-500">{t('receipts.ref')} {p.reference_number || '-'}</div>
                    </div>

                    {/* Summary grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm mb-6">
                      <div className="bg-gray-50 rounded-md p-3 border border-gray-200">
                        <div className="text-gray-500">{t('receipts.total')}</div>
                        <div className="text-base font-semibold">€{total.toLocaleString()}</div>
                      </div>
                      <div className="bg-gray-50 rounded-md p-3 border border-gray-200">
                        <div className="text-gray-500">{t('receipts.vat')}</div>
                        <div className="text-base font-semibold">{vatPct.toFixed(1)}% (+€{vatAmount.toLocaleString()})</div>
                      </div>
                      <div className="bg-gray-50 rounded-md p-3 border border-gray-200">
                        <div className="text-gray-500">{t('receipts.paid')}</div>
                        <div className="text-base font-semibold text-green-700">€{buyerPaid.toLocaleString()}</div>
                      </div>
                    </div>

                    {/* Milestones */}
                    <div className="text-sm">
                      <div className="font-semibold mb-2">{t('receipts.milestones')}</div>
                      <table className="w-full text-xs border border-gray-200 rounded-md overflow-hidden">
                        <thead>
                          <tr className="bg-gray-50 text-gray-600">
                            <th className="py-2 px-2 text-left">{t('receipts.name')}</th>
                            <th className="py-2 px-2 text-left">{t('receipts.completed_at')}</th>
                            <th className="py-2 px-2 text-right">{t('receipts.amount')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(p.milestones || []).filter(m => m.status === 'approved').map((m, idx) => (
                            <tr key={m.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              <td className="py-2 px-2">{m.name}</td>
                              <td className="py-2 px-2">{m.completion_date || '-'}</td>
                              <td className="py-2 px-2 text-right">€{Number(m.relative_payment).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Footer */}
                    <div className="mt-6 text-[11px] text-gray-500 flex items-center justify-between">
                      <div>{t('receipts.generated_by')}</div>
                      <div>www.safebill.app</div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {!loading && total > 0 && (
        <div className="mt-4 flex items-center justify-between">
          <div className="text-xs text-gray-600">{t('receipts.showing')} {total === 0 ? 0 : startIdx + 1}–{endIdx} {t('receipts.of')} {total}</div>
          <div className="flex items-center gap-2">
            <button
              className="px-3 py-2 text-sm rounded-md border bg-white hover:bg-gray-50 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              {t('receipts.prev')}
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  className={`px-3 py-2 text-sm rounded-md border cursor-pointer ${page === i + 1 ? 'bg-[#01257D] text-white border-[#01257D]' : 'bg-white hover:bg-gray-50'}`}
                  onClick={() => setPage(i + 1)}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <button
              className="px-3 py-2 text-sm rounded-md border bg-white hover:bg-gray-50 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              {t('receipts.next')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


