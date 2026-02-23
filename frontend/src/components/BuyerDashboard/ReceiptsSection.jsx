import React from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import Logo from '../../assets/Safe_Bill_Dark.png';
import { getStepTranslationKey } from '../../utils/translationUtils';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function ReceiptsSection() {
  const { t } = useTranslation();
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [projects, setProjects] = React.useState([]);
  const [page, setPage] = React.useState(1);
  const pageSize = 10;
  const [search, setSearch] = React.useState("");
  const [filters, setFilters] = React.useState({
    paymentStatus: '',
    dateRange: ''
  });

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
    } catch (e) {
      setError(e?.response?.data?.detail || e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { fetchData(); }, [fetchData]);

  const calcTotals = (project) => {
    const total = (project.installments || []).reduce((s, i) => s + Number(i.amount || 0), 0);
    const vatRate = Number(project.vat_rate || 0);
    const vatAmount = +(total * vatRate / 100).toFixed(2);
    const finalAmount = +(total + vatAmount).toFixed(2);
    return { total, vatRate, vatAmount, finalAmount };
  };

  // Filter and paginate
  const filtered = React.useMemo(() => {
    let filteredProjects = projects;

    // Search filter
    if (search) {
      filteredProjects = filteredProjects.filter(p =>
        p.name?.toLowerCase().includes(search.toLowerCase()) ||
        p.reference_number?.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Payment status filter
    if (filters.paymentStatus) {
      filteredProjects = filteredProjects.filter(p => p.payment_status === filters.paymentStatus);
    }

    // Date range filter
    if (filters.dateRange) {
      const now = new Date();
      const daysAgo = parseInt(filters.dateRange);
      const cutoffDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
      filteredProjects = filteredProjects.filter(p => {
        const completionDate = new Date(p.completion_date || p.created_at);
        return completionDate >= cutoffDate;
      });
    }

    return filteredProjects;
  }, [projects, search, filters]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const startIdx = (page - 1) * pageSize;
  const endIdx = Math.min(startIdx + pageSize, total);
  const paged = filtered.slice(startIdx, endIdx);

  const clearFilters = () => {
    setFilters({
      paymentStatus: '',
      dateRange: ''
    });
    setSearch('');
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'paid': { color: 'bg-green-100 text-green-800', text: t('receipts.paid') },
      'pending': { color: 'bg-yellow-100 text-yellow-800', text: t('receipts.pending') },
      'failed': { color: 'bg-red-100 text-red-800', text: t('receipts.failed') }
    };

    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', text: status || 'Unknown' };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <span className="w-1.5 h-1.5 bg-current rounded-full mr-1.5"></span>
        {config.text}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const downloadPdf = async (project) => {
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);

      const element = document.getElementById(`buyer-receipt-${project.id}`);
      if (!element) {
        console.error(`Element with id 'buyer-receipt-${project.id}' not found`);
        toast.error('Receipt not found');
        return;
      }

      console.log('Found element:', {
        id: element.id,
        hasContent: element.textContent.length > 0,
        classes: element.className
      });

      // Clone the element to avoid affecting the original
      const clone = element.cloneNode(true);

      // Create a temporary container for the clone
      const container = document.createElement('div');
      container.id = 'pdf-section-temp-container';
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

      console.log('Element for PDF:', {
        id: element.id,
        cloneHeight: clone.offsetHeight,
        cloneWidth: clone.offsetWidth,
        containerExists: !!container.parentNode
      });

      // Additional check
      if (clone.offsetHeight === 0 || clone.offsetWidth === 0) {
        console.error('Clone has no dimensions!');
        document.body.removeChild(container);
        toast.error('Failed to render receipt for PDF');
        return;
      }

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

      console.log('Starting html2canvas capture...');
      const canvas = await html2canvas(clone, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: true,
        allowTaint: false,
        foreignObjectRendering: true,
      });

      console.log('Canvas created:', {
        width: canvas.width,
        height: canvas.height
      });

      if (canvas.width === 0 || canvas.height === 0) {
        console.error('Canvas has no content!');
        document.body.removeChild(container);
        toast.error('Failed to capture receipt content');
        return;
      }

      const imgData = canvas.toDataURL('image/png');

      if (!imgData || imgData === 'data:,' || imgData.length < 100) {
        console.error('Invalid image data!');
        document.body.removeChild(container);
        toast.error('Failed to generate PDF image');
        return;
      }

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

      console.log('PDF created successfully');
      pdf.save(`receipt_buyer_${project.reference_number || project.id}.pdf`);

      // Clean up the temporary container
      document.body.removeChild(container);
    } catch (e) {
      console.error('Receipt PDF generation failed:', e);
      toast.error('Failed to generate PDF');

      // Clean up the temporary container in case of error
      const container = document.getElementById('pdf-section-temp-container');
      if (container) {
        document.body.removeChild(container);
      }
    }
  };


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

      {/* Filters */}
      <div className="mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('receipts.payment_status')}</label>
            <div className="relative">
              <select
                value={filters.paymentStatus}
                onChange={(e) => setFilters(prev => ({ ...prev, paymentStatus: e.target.value }))}
                className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-[#01257D] focus:border-[#01257D] bg-white cursor-pointer appearance-none"
              >
                <option value="">{t('receipts.all_statuses')}</option>
                <option value="paid">{t('receipts.paid')}</option>
                <option value="pending">{t('receipts.pending')}</option>
                <option value="failed">{t('receipts.failed')}</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('receipts.date_range')}</label>
            <div className="relative">
              <select
                value={filters.dateRange}
                onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-[#01257D] focus:border-[#01257D] bg-white cursor-pointer appearance-none"
              >
                <option value="">{t('receipts.all_time')}</option>
                <option value="7">{t('receipts.last_7_days')}</option>
                <option value="30">{t('receipts.last_30_days')}</option>
                <option value="90">{t('receipts.last_90_days')}</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-600">
          {t('receipts.showing')} {total === 0 ? 0 : startIdx + 1}–{endIdx} {t('receipts.of')} {total} {t('receipts.receipts')}
        </p>
      </div>

      {loading ? (
        <div className="py-10 text-center text-gray-500">{t('receipts.loading')}</div>
      ) : error ? (
        <div className="py-10 text-center text-red-600">{error}</div>
      ) : projects.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg">{t('receipts.no_completed')}</div>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('receipts.date')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('receipts.project_name')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('receipts.reference')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('receipts.amount')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('receipts.vat')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('receipts.status')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('receipts.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paged.map((project) => {
                  const { total, vatRate, vatAmount, finalAmount } = calcTotals(project);

                  return (
                    <tr key={project.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(project.completion_date || project.created_at)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="font-medium">{project.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {project.reference_number || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>€{total.toLocaleString()}</div>
                        <div className="text-xs text-gray-500">{t('receipts.net')}: €{finalAmount.toLocaleString()}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>€{vatAmount.toLocaleString()}</div>
                        <div className="text-xs">({vatRate.toFixed(1)}%)</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(project.payment_status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => downloadPdf(project)}
                          className="text-[#01257D] hover:text-[#1d3f99] flex items-center gap-1 cursor-pointer"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          {t('receipts.download_pdf')}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden">
            {paged.map((project) => {
              const { total, vatRate, vatAmount, finalAmount } = calcTotals(project);
              return (
                <div key={project.id} className="border-b border-gray-200 p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 text-sm">{project.name}</h3>
                      <p className="text-xs text-gray-500 mt-1">{t('receipts.buyer_receipt')}</p>
                    </div>
                    {getStatusBadge(project.payment_status)}
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs mb-3">
                    <div>
                      <span className="text-gray-500">{t('receipts.date')}:</span>
                      <div className="font-medium">{formatDate(project.completion_date || project.created_at)}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">{t('receipts.reference')}:</span>
                      <div className="font-medium">{project.reference_number || '-'}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">{t('receipts.amount')}:</span>
                      <div className="font-medium">€{total.toLocaleString()}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">{t('receipts.vat')}:</span>
                      <div className="font-medium">€{vatAmount.toLocaleString()} ({vatRate.toFixed(1)}%)</div>
                    </div>
                    <div>
                      <span className="text-gray-500">{t('receipts.net_amount')}:</span>
                      <div className="font-medium text-green-600">€{finalAmount.toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={() => downloadPdf(project)}
                      className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium text-[#01257D] bg-[#01257D]/10 rounded-lg hover:bg-[#01257D]/20 cursor-pointer"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      {t('receipts.download_pdf')}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Pagination */}
      {total > 0 && (
        <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="text-sm text-gray-600">
            {t('receipts.showing')} {total === 0 ? 0 : startIdx + 1}–{endIdx} {t('receipts.of')} {total} {t('receipts.receipts')}
          </div>
          <div className="flex items-center gap-2">
            <button
              className="px-3 py-2 text-sm rounded-md border bg-white hover:bg-gray-50 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              {t('receipts.previous')}
            </button>
            <span className="px-3 py-2 text-sm text-gray-600">
              {page} / {totalPages}
            </span>
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

      {/* Hidden PDF elements */}
      {projects.map((project) => {
        const { total, vatRate, vatAmount, finalAmount } = calcTotals(project);
        return (
          <div key={`pdf-${project.id}`} id={`buyer-receipt-${project.id}`} className="hidden">
            <div className="max-w-[800px] mx-auto bg-white p-6 rounded-lg border border-gray-200">
              {/* Header with Logo */}
              <div className="flex items-center justify-between pt-4 pb-4 mb-4 border-b-2" style={{ borderColor: '#01257D' }}>
                <div className="flex items-center gap-3">
                  <img src={Logo} alt="Safe Bill" style={{ height: 15, width: 'auto' }} />
                </div>
                <div className="text-xs text-gray-500">{t('receipts.buyer_copy')}</div>
              </div>

              {/* Seller and Buyer Info */}
              <div className="flex items-start justify-between mb-4">
                {/* Seller Info - Top Left */}
                <div className="flex-1 pr-4">
                  <div className="text-xs font-semibold text-gray-700 mb-1">{t('receipts.seller_information')}</div>
                  <div className="text-xs text-gray-600 space-y-0.5">
                    {project.seller_username && <div>{project.seller_username}</div>}
                    {project.seller_email && <div>{project.seller_email}</div>}
                    {project.seller_company && <div>{project.seller_company}</div>}
                    {project.seller_address && <div>{project.seller_address}</div>}
                    {project.seller_phone && <div>{t('receipts.phone')}: {project.seller_phone}</div>}
                    {project.seller_siret && <div>{t('receipts.siret')}: {project.seller_siret}</div>}
                  </div>
                </div>

                {/* Buyer Info - Top Right */}
                <div className="flex-1 pl-4 text-right">
                  <div className="text-xs font-semibold text-gray-700 mb-1">{t('receipts.buyer_information')}</div>
                  <div className="text-xs text-gray-600 space-y-0.5">
                    {project.buyer_full_name && <div>{project.buyer_full_name}</div>}
                    {!project.buyer_full_name && project.buyer_username && <div>{project.buyer_username}</div>}
                    {project.buyer_email && <div>{project.buyer_email}</div>}
                    {project.buyer_company && <div className="font-semibold">{project.buyer_company}</div>}
                    {project.buyer_address && <div>{project.buyer_address}</div>}
                    {project.buyer_siret && <div>{t('receipts.siret')}: {project.buyer_siret}</div>}
                  </div>
                </div>
              </div>

              {/* Project info */}
              <div className="mb-5">
                <div className="text-lg font-semibold text-gray-900">{project.name}</div>
                <div className="text-xs text-gray-500">{t('receipts.ref')} {project.reference_number || '-'}</div>
                <div className="text-xs text-gray-500">{t('receipts.start')} {formatDate(project.created_at)}</div>
                <div className="text-xs text-gray-500 mt-1">{t('receipts.vat')}: {vatRate.toFixed(1)}%</div>
              </div>

              {/* Summary boxes */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm mb-6">
                <div className="bg-gray-50 rounded-md p-3 border border-gray-200">
                  <div className="text-gray-500">{t('receipts.total')}</div>
                  <div className="text-base font-semibold">€{total.toLocaleString()}</div>
                </div>
                <div className="bg-gray-50 rounded-md p-3 border border-gray-200">
                  <div className="text-gray-500">{t('receipts.vat')}</div>
                  <div className="text-base font-semibold">{vatRate.toFixed(1)}% (+€{vatAmount.toLocaleString()})</div>
                </div>
                <div className="bg-gray-50 rounded-md p-3 border border-gray-200">
                  <div className="text-gray-500">{t('receipts.paid')}</div>
                  <div className="text-base font-semibold text-green-700">€{finalAmount.toLocaleString()}</div>
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
                    {(project.milestones || []).filter(m => m.status === 'approved').map((m, idx) => (
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
                <div>{t('receipts.generated_by')}</div>
                <div>www.safebill.fr</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}


