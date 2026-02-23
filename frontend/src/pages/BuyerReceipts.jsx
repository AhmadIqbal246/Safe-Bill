import React from 'react';
import axios from 'axios';
import SafeBillHeader from '../components/mutualComponents/Navbar/Navbar';
import Loader from '../components/common/Loader';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { getStepTranslationKey } from '../utils/translationUtils';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function BuyerReceipts() {
  const { t } = useTranslation();
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [projects, setProjects] = React.useState([]);
  const [expands, setExpands] = React.useState({});

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
      setProjects(res.data.projects || []);
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

      const element = document.getElementById(`receipt-buyer-${project.id}`);
      if (!element) {
        toast.error('Receipt not found');
        return;
      }

      // Clone the element to avoid affecting the original
      const clone = element.cloneNode(true);

      // Create a temporary container for the clone
      const container = document.createElement('div');
      container.id = 'pdf-buyer-temp-container';
      container.style.position = 'absolute';
      container.style.top = '0';
      container.style.left = '0';
      container.style.width = '210mm';
      container.style.height = '297mm'; // A4 height
      container.style.backgroundColor = '#ffffff';
      container.style.opacity = '0';
      container.style.pointerEvents = 'none';
      container.style.zIndex = '999999';
      container.style.overflow = 'visible';

      // Style the clone for PDF
      clone.style.width = '800px';
      clone.style.maxWidth = '800px';
      clone.style.padding = '24px';
      clone.style.backgroundColor = '#ffffff';
      clone.className = ''; // Remove all classes to avoid hidden styling
      clone.style.margin = '0';

      // Append clone to container
      container.appendChild(clone);
      document.body.appendChild(container);

      // Wait for rendering
      await new Promise(resolve => setTimeout(resolve, 300));

      console.log('Buyer Element for PDF:', {
        id: element.id,
        cloneHeight: clone.offsetHeight,
        cloneWidth: clone.offsetWidth
      });

      // Inline any images to avoid CORS tainting in production
      const inlineImages = async (root) => {
        const imgs = Array.from(root.querySelectorAll('img'));
        await Promise.all(
          imgs.map(async (img) => {
            try {
              if (!img || !img.src || img.src.startsWith('data:')) return;
              img.setAttribute('crossorigin', 'anonymous');
              const resp = await fetch(img.src, { mode: 'cors', credentials: 'omit' });
              if (!resp.ok) return;
              const blob = await resp.blob();
              await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                  try { img.src = reader.result; } catch { }
                  resolve();
                };
                reader.onerror = reject;
                reader.readAsDataURL(blob);
              });
            } catch { }
          })
        );
      };

      await inlineImages(clone);

      const canvas = await html2canvas(clone, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: true,
        allowTaint: false,
        foreignObjectRendering: true,
      });
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

      // Clean up the temporary container
      document.body.removeChild(container);
    } catch (e) {
      console.error('Buyer receipt PDF generation failed:', e);
      toast.error('Failed to generate PDF');

      // Clean up the temporary container in case of error
      const container = document.getElementById('pdf-buyer-temp-container');
      if (container) {
        document.body.removeChild(container);
      }
    }
  };

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
    <>
      <SafeBillHeader />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-xl font-bold text-gray-900 mb-4">Receipts</h1>

        {projects.length === 0 ? (
          <div className="text-gray-500 text-center py-10">No completed projects.</div>
        ) : (
          <div className="space-y-6">
            {projects.map((p) => {
              const { total, vatPct, vatAmount, buyerPaid } = calcTotals(p);
              return (
                <div key={p.id} className="border border-gray-200 rounded-lg">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-4 bg-gray-50">
                    <div>
                      <div className="text-lg font-semibold text-[#01257D]">{p.name}</div>
                      <div className="text-sm text-gray-600">Ref{p.reference_number || '-'}</div>
                      <div className="text-xs text-gray-500">Start: {p.created_at}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => toggleExpand(p.id)} className="px-3 py-2 text-sm rounded-md bg-white border cursor-pointer hover:bg-gray-100">{expands[p.id] ? 'Hide' : 'Details'}</button>
                      <button onClick={() => downloadPdf(p)} className="px-3 py-2 text-sm rounded-md bg-[#01257D] text-white cursor-pointer hover:bg-[#1d3f99]">Download PDF</button>
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div><span className="text-gray-500">Total amount</span><div className="font-semibold">€{total.toLocaleString()}</div></div>
                      <div><span className="text-gray-500">VAT</span><div className="font-semibold">{vatPct.toFixed(1)}% (+€{vatAmount.toLocaleString()})</div></div>
                      <div><span className="text-gray-500">Paid</span><div className="font-semibold text-green-700">€{buyerPaid.toLocaleString()}</div></div>
                    </div>
                  </div>

                  {(expands[p.id] || true) && (
                    <div className="p-4 pt-0">
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                          <thead>
                            <tr className="text-left text-gray-500">
                              <th className="py-2 pr-4">Milestone</th>
                              <th className="py-2 pr-4">Completed at</th>
                              <th className="py-2 pr-0 text-right">Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(p.milestones || []).filter(m => m.status === 'approved').map((m) => (
                              <tr key={m.id} className="border-t border-gray-100">
                                <td className="py-2 pr-4">
                                  {getStepTranslationKey(m.name) ? t(getStepTranslationKey(m.name)) : m.name}
                                </td>
                                <td className="py-2 pr-4">{m.completion_date || '-'}</td>
                                <td className="py-2 pr-0 text-right">€{Number(m.relative_payment).toLocaleString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Hidden printable area for PDF */}
                  <div id={`receipt-buyer-${p.id}`} className="max-w-[800px] mx-auto bg-white p-6 rounded-lg border border-gray-200" style={{ display: expands[p.id] || false ? 'block' : 'none' }}>
                    {/* Header with Logo */}
                    <div className="flex items-center justify-between pt-4 pb-4 mb-4 border-b-2" style={{ borderColor: '#01257D' }}>
                      <div className="flex items-center gap-3">
                        <div className="text-xl font-bold text-[#01257D]">SafeBill</div>
                      </div>
                      <div className="text-xs text-gray-500">Buyer copy</div>
                    </div>

                    {/* Seller and Buyer Info */}
                    <div className="flex items-start justify-between mb-4">
                      {/* Seller Info - Top Left */}
                      <div className="flex-1 pr-4">
                        <div className="text-xs font-semibold text-gray-700 mb-1">Seller Information</div>
                        <div className="text-xs text-gray-600 space-y-0.5">
                          {p.seller_username && <div>{p.seller_username}</div>}
                          {p.seller_email && <div>{p.seller_email}</div>}
                          {p.seller_company && <div>{p.seller_company}</div>}
                          {p.seller_address && <div>{p.seller_address}</div>}
                          {p.seller_phone && <div>Phone: {p.seller_phone}</div>}
                          {p.seller_siret && <div>SIRET: {p.seller_siret}</div>}
                        </div>
                      </div>

                      {/* Buyer Info - Top Right */}
                      <div className="flex-1 pl-4 text-right">
                        <div className="text-xs font-semibold text-gray-700 mb-1">Buyer Information</div>
                        <div className="text-xs text-gray-600 space-y-0.5">
                          {p.buyer_full_name && <div>{p.buyer_full_name}</div>}
                          {!p.buyer_full_name && p.buyer_username && <div>{p.buyer_username}</div>}
                          {p.buyer_email && <div>{p.buyer_email}</div>}
                          {p.buyer_company && <div className="font-semibold">{p.buyer_company}</div>}
                          {p.buyer_address && <div>{p.buyer_address}</div>}
                          {p.buyer_siret && <div>{t('receipts.siret')}: {p.buyer_siret}</div>}
                        </div>
                      </div>
                    </div>

                    {/* Project info */}
                    <div className="mb-5">
                      <div className="text-lg font-semibold text-gray-900">{p.name}</div>
                      <div className="text-xs text-gray-500">{t('receipts.ref')} {p.reference_number || '-'}</div>
                      <div className="text-xs text-gray-500">{t('receipts.start')} {p.created_at}</div>
                      <div className="text-xs text-gray-500 mt-1">{t('receipts.vat')}: {vatPct.toFixed(1)}%</div>
                    </div>

                    {/* Summary boxes */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm mb-6">
                      <div className="bg-gray-50 rounded-md p-3 border border-gray-200">
                        <div className="text-gray-500">Total</div>
                        <div className="text-base font-semibold">€{total.toLocaleString()}</div>
                      </div>
                      <div className="bg-gray-50 rounded-md p-3 border border-gray-200">
                        <div className="text-gray-500">VAT</div>
                        <div className="text-base font-semibold">{vatPct.toFixed(1)}% (+€{vatAmount.toLocaleString()})</div>
                      </div>
                      <div className="bg-gray-50 rounded-md p-3 border border-gray-200">
                        <div className="text-gray-500">Paid</div>
                        <div className="text-base font-semibold text-green-700">€{buyerPaid.toLocaleString()}</div>
                      </div>
                    </div>

                    {/* Milestones */}
                    <div className="text-sm">
                      <div className="font-semibold mb-2">Milestones</div>
                      <table className="w-full text-xs border border-gray-200 rounded-md overflow-hidden">
                        <thead>
                          <tr className="bg-gray-50 text-gray-600">
                            <th className="py-2 px-2 text-left">Name</th>
                            <th className="py-2 px-2 text-left">Completed at</th>
                            <th className="py-2 px-2 text-right">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(p.milestones || []).filter(m => m.status === 'approved').map((m, idx) => (
                            <tr key={m.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              <td className="py-2 px-2">
                                {getStepTranslationKey(m.name) ? t(getStepTranslationKey(m.name)) : m.name}
                              </td>
                              <td className="py-2 px-2">{m.completion_date || '-'}</td>
                              <td className="py-2 px-2 text-right">€{Number(m.relative_payment).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Footer */}
                    <div className="mt-6 text-[11px] text-gray-500 flex items-center justify-between">
                      <div>Generated by Safe Bill</div>
                      <div>www.safebill.fr</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}


