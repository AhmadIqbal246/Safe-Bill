import React from 'react';
import axios from 'axios';
// import SafeBillHeader from '../components/mutualComponents/Navbar/Navbar';
import MainLayout from '../components/Layout/MainLayout';
import Loader from '../components/common/Loader';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import Logo from '../assets/Safe_Bill_Logo_Bleu.png';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function SellerReceipts() {
  const { t } = useTranslation();
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [projects, setProjects] = React.useState([]);
  const [expands, setExpands] = React.useState({});
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const pageSize = 5;

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = sessionStorage.getItem('access');
      const res = await axios.get(`${BASE_URL}api/projects/receipts/seller/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        withCredentials: true,
      });
      const items = res.data.projects || [];
      setProjects(items);
      // Default expanded for each project
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

  // reset page on dataset or search change
  React.useEffect(() => {
    setPage(1);
  }, [projects, search]);

  const toggleExpand = (id) => setExpands(prev => ({ ...prev, [id]: !prev[id] }));

  const calcTotals = (project) => {
    const total = (project.installments || []).reduce((s, i) => s + Number(i.amount || 0), 0);
    const pct = Number(project.platform_fee_percentage || 0);
    const platformFee = +(total * pct / 100).toFixed(2);
    const sellerNet = +(total - platformFee).toFixed(2);
    return { total, pct, platformFee, sellerNet };
  };

  const calcMilestoneNet = (amount, pct) => {
    const a = Number(amount || 0);
    const fee = +(a * pct / 100).toFixed(2);
    return { fee, net: +(a - fee).toFixed(2) };
  };

  const downloadPdf = async (project) => {
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);

      const element = document.getElementById(`receipt-${project.id}`);
      if (!element) return;

      const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
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

      pdf.save(`receipt_seller_${project.reference_number || project.id}.pdf`);
    } catch (e) {
      toast.error('Failed to generate PDF');
    }
  };

  // Filter and paginate (must be before any early returns to keep hooks order stable)
  const filtered = React.useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return projects;
    return projects.filter(p => (p.name || "").toLowerCase().includes(term));
  }, [projects, search]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const startIdx = (page - 1) * pageSize;
  const endIdx = Math.min(startIdx + pageSize, total);
  const paged = filtered.slice(startIdx, endIdx);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader size="large" text="Loading receipts..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-red-600">{error}</div>
    );
  }

  return (
      <MainLayout title={t('receipts.title')}>
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
            <h1 className="text-xl font-bold text-gray-900">{t('receipts.title')}</h1>
            <div className="w-full md:w-80">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('receipts.search_placeholder')}
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#01257D]"
              />
            </div>
          </div>

          {projects.length === 0 ? (
            <div className="text-gray-500 text-center py-10">{t('receipts.no_completed')}</div>
          ) : (
            <div className="space-y-6">
              {paged.map((p) => {
                const { total, pct, platformFee, sellerNet } = calcTotals(p);
                return (
                  <div key={p.id} className="border border-gray-200 rounded-lg">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-4 bg-gray-50">
                      <div>
                        <div className="text-lg font-semibold text-[#01257D]">{p.name}</div>
                        <div className="text-sm text-gray-600">{t('receipts.ref')} {p.reference_number || '-'}</div>
                        <div className="text-xs text-gray-500">{t('receipts.start')} {p.created_at} {p.completion_date ? `• ${t('receipts.completed')}: ${p.completion_date}` : ''}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => toggleExpand(p.id)} className="px-3 py-2 text-sm rounded-md bg-white border cursor-pointer hover:bg-gray-100">{expands[p.id] ? t('receipts.hide') : t('receipts.details')}</button>
                        <button onClick={() => downloadPdf(p)} className="px-3 py-2 text-sm rounded-md bg-[#01257D] text-white cursor-pointer hover:bg-[#1d3f99]">{t('receipts.download_pdf')}</button>
                      </div>
                    </div>

                    <div className="p-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div><span className="text-gray-500">{t('receipts.total_amount')}</span><div className="font-semibold">€{total.toLocaleString()}</div></div>
                        <div><span className="text-gray-500">{t('receipts.platform_fee')}</span><div className="font-semibold">{pct.toFixed(1)}% (−€{platformFee.toLocaleString()})</div></div>
                        <div><span className="text-gray-500">{t('receipts.seller_receives')}</span><div className="font-semibold text-green-700">€{sellerNet.toLocaleString()}</div></div>
                      </div>
                    </div>

                    {expands[p.id] && (
                      <div className="p-4 pt-0">
                        <div className="overflow-x-auto">
                          <table className="min-w-full text-sm">
                            <thead>
                              <tr className="text-left text-gray-500">
                                <th className="py-2 pr-4">{t('receipts.milestone')}</th>
                                <th className="py-2 pr-4">{t('receipts.completed_at')}</th>
                                <th className="py-2 pr-4 text-right">{t('receipts.amount')}</th>
                                <th className="py-2 pr-0 text-right">{t('receipts.after_fee')}</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(p.milestones || []).filter(m => m.status === 'approved').map((m) => {
                                const { net } = calcMilestoneNet(m.relative_payment, pct);
                                return (
                                  <tr key={m.id} className="border-t border-gray-100">
                                    <td className="py-2 pr-4">{m.name}</td>
                                    <td className="py-2 pr-4">{m.completion_date || '-'}</td>
                                    <td className="py-2 pr-4 text-right">€{Number(m.relative_payment).toLocaleString()}</td>
                                    <td className="py-2 pr-0 text-right font-medium text-green-700">€{net.toLocaleString()}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Printable area for PDF (hide/show with Details toggle) */}
                    {expands[p.id] && (
                      <div id={`receipt-${p.id}`} className="max-w-[800px] mx-auto bg-white p-6 rounded-lg border border-gray-200 mb-4" style={{ background: '#ffffff' }}>
                        {/* Brand header */}
                        <div className="flex items-center justify-between pb-4 mb-4 border-b-2" style={{ borderColor: '#01257D' }}>
                            <div className="flex items-center gap-3">
                            <img src={Logo} alt="Safe Bill" style={{ height: 80, width: 'auto' }} />
                          </div>
                          <div className="text-xs text-gray-500">{t('receipts.seller_copy')}</div>
                        </div>

                        {/* Project meta */}
                        <div className="mb-5">
                          <div className="text-lg font-semibold text-gray-900">{p.name}</div>
                          <div className="text-xs text-gray-500">{t('receipts.ref')} {p.reference_number || '-'}</div>
                          <div className="text-xs text-gray-500">{t('receipts.start')} {p.created_at} {p.completion_date ? `• ${t('receipts.completed')}: ${p.completion_date}` : ''}</div>
                          <div className="text-xs text-gray-500 mt-1">{t('receipts.vat')}: {Number(p.vat_rate || 0).toFixed(1)}%</div>
                          <div className="text-xs text-gray-500 mt-1">{t('receipts.seller_label')}: {p.seller_username || '-'} ({p.seller_email || '-'})</div>
                          <div className="text-xs text-gray-500">{t('receipts.buyer_label')}: {p.buyer_username || '-'} ({p.buyer_email || '-'})</div>
                        </div>

                        {/* Summary grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm mb-6">
                          <div className="bg-gray-50 rounded-md p-3 border border-gray-200">
                            <div className="text-gray-500">{t('receipts.total')}</div>
                            <div className="text-base font-semibold">€{total.toLocaleString()}</div>
                          </div>
                          <div className="bg-gray-50 rounded-md p-3 border border-gray-200">
                            <div className="text-gray-500">{t('receipts.platform_fee')}</div>
                            <div className="text-base font-semibold">{pct.toFixed(1)}% (−€{platformFee.toLocaleString()})</div>
                          </div>
                          <div className="bg-gray-50 rounded-md p-3 border border-gray-200">
                            <div className="text-gray-500">{t('receipts.seller_receives')}</div>
                            <div className="text-base font-semibold text-green-700">€{sellerNet.toLocaleString()}</div>
                          </div>
                        </div>

                        {/* Milestones */}
                        <div className="text-sm">
                          <div className="font-semibold mb-2">Milestones</div>
                          <table className="w-full text-xs border border-gray-200 rounded-md overflow-hidden">
                            <thead>
                              <tr className="bg-gray-50 text-gray-600">
                                <th className="py-2 px-2 text-left">{t('receipts.name')}</th>
                                <th className="py-2 px-2 text-left">{t('receipts.completed_at')}</th>
                                <th className="py-2 px-2 text-right">{t('receipts.amount')}</th>
                                <th className="py-2 px-2 text-right">{t('receipts.after_fee')}</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(p.milestones || []).filter(m => m.status === 'approved').map((m, idx) => {
                                const { net } = calcMilestoneNet(m.relative_payment, pct);
                                return (
                                  <tr key={m.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                    <td className="py-2 px-2">{m.name}</td>
                                    <td className="py-2 px-2">{m.completion_date || '-'}</td>
                                    <td className="py-2 px-2 text-right">€{Number(m.relative_payment).toLocaleString()}</td>
                                    <td className="py-2 px-2 text-right">€{net.toLocaleString()}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                        {/* Footer */}
                        <div className="mt-6 text-[11px] text-gray-500 flex items-center justify-between">
                          <div>{t('receipts.generated_by')}</div>
                          <div>www.safebill.fr</div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {total > 0 && (
            <div className="mt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="text-sm text-gray-600">
                Showing {total === 0 ? 0 : startIdx + 1}–{endIdx} of {total}
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="px-3 py-2 text-sm rounded-md border bg-white hover:bg-gray-50 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Prev
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
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </MainLayout>
  );
}


