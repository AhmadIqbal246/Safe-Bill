import React from 'react';
import axios from 'axios';
import SafeBillHeader from '../components/mutualComponents/Navbar/Navbar';
import Loader from '../components/common/Loader';
import { toast } from 'react-toastify';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function BuyerReceipts() {
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

      pdf.save(`receipt_buyer_${project.reference_number || project.id}.pdf`);
    } catch (e) {
      toast.error('Failed to generate PDF');
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
                      <div className="text-sm text-gray-600">Ref: {p.reference_number || '-'}</div>
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
                                <td className="py-2 pr-4">{m.name}</td>
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
                  <div id={`receipt-buyer-${p.id}`} className="p-6" style={{ background: '#ffffff' }}>
                    <div className="text-2xl font-bold mb-2">Receipt</div>
                    <div className="text-sm text-gray-600 mb-4">Buyer copy</div>
                    <div className="mb-4">
                      <div className="font-semibold">{p.name}</div>
                      <div className="text-xs text-gray-500">Ref: {p.reference_number || '-'}</div>
                      <div className="text-xs text-gray-500">Start: {p.created_at}</div>
                    </div>
                    <div className="text-sm mb-4">
                      <div>Total: €{total.toLocaleString()}</div>
                      <div>VAT: {vatPct.toFixed(1)}% (+€{vatAmount.toLocaleString()})</div>
                      <div>Paid: €{buyerPaid.toLocaleString()}</div>
                    </div>
                    <div className="text-sm">
                      <div className="font-semibold mb-2">Milestones</div>
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-left">
                            <th className="py-1 pr-2">Name</th>
                            <th className="py-1 pr-2">Completed at</th>
                            <th className="py-1 pr-0 text-right">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(p.milestones || []).filter(m => m.status === 'approved').map((m) => (
                            <tr key={m.id}>
                              <td className="py-1 pr-2">{m.name}</td>
                              <td className="py-1 pr-2">{m.completion_date || '-'}</td>
                              <td className="py-1 pr-0 text-right">€{Number(m.relative_payment).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
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


