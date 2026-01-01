import React from 'react';
import axios from 'axios';
import MainLayout from '../components/Layout/MainLayout';
import Loader from '../components/common/Loader';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import Logo from '../assets/Safe_Bill_Dark.png';
import loginBg from '../assets/Circle Background/login-removed-bg.jpg';

const SAFE_BILL_INFO = {
  name: 'Safe Bill',
  email: import.meta.env.VITE_SAFE_BILL_EMAIL || 'contact@safebill.fr',
  address: import.meta.env.VITE_SAFE_BILL_ADDRESS || 'Safe Bill 66 avenue des Champs Elysées 75008 Paris',
};

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function SellerReceipts() {
  const { t } = useTranslation();
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [projects, setProjects] = React.useState([]);
  const [subscriptionInvoices, setSubscriptionInvoices] = React.useState([]);
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  // Removed receiptType state - now showing both types in one table
  const [filters, setFilters] = React.useState({
    paymentStatus: '',
    dateRange: ''
  });
  const pageSize = 10;

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = sessionStorage.getItem('access');
      
      // Fetch project invoices
      const projectRes = await axios.get(`${BASE_URL}api/projects/receipts/seller/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        withCredentials: true,
      });
      const projectItems = projectRes.data.projects || [];
      
      // Fetch subscription invoices
      const subRes = await axios.get(`${BASE_URL}api/subscription/invoices/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        withCredentials: true,
      });
      const subItems = subRes.data.invoices || [];
      
      setProjects(projectItems);
      setSubscriptionInvoices(subItems);
      console.log('[DEBUG] Project invoices:', projectItems.length);
      console.log('[DEBUG] Subscription invoices:', subItems.length);
      console.log('[DEBUG] Subscription invoice data:', subItems);
    } catch (e) {
      setError(e?.response?.data?.detail || e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { fetchData(); }, [fetchData]);

  // Reset page on dataset or search change
  React.useEffect(() => {
    setPage(1);
  }, [projects, subscriptionInvoices, search, filters]);

  const calcTotals = (project) => {
    // Handle subscription invoices
    if (project.invoiceType === 'subscription') {
      const total = Number(project.amount || 0);
      const vatRate = 0; // No VAT for subscription invoices
      const vatAmount = 0;
      const amountIncludingVat = total;
      const platformFee = 0;
      const platformFeeWithVat = 0;
      const finalAmount = total;
      return { total, pct: 0, platformFee, sellerNet: finalAmount, vatRate, vatAmount, platformFeeWithVat, amountIncludingVat, finalAmount };
    }
    
    // Handle project invoices
    const total = (project.installments || []).reduce((s, i) => s + Number(i.amount || 0), 0);
    const vatRate = Number(project.vat_rate || 0);
    const pct = Number(project.platform_fee_percentage || 0);
    
    // Calculate VAT amount
    const vatAmount = +(total * vatRate / 100).toFixed(2);
    
    // Calculate amount including VAT
    const amountIncludingVat = +(total + vatAmount).toFixed(2);
    
    // Calculate platform fee
    const platformFee = +(total * pct / 100).toFixed(2);
    
    // Calculate platform fee including VAT
    const platformFeeWithVat = +(platformFee * (1 + vatRate / 100)).toFixed(2);
    
    // Final amount = (amount including VAT) - (service fees including VAT)
    const finalAmount = +(amountIncludingVat - platformFeeWithVat).toFixed(2);
    
    return { total, pct, platformFee, sellerNet: finalAmount, vatRate, vatAmount, platformFeeWithVat, amountIncludingVat, finalAmount };
  };

  const downloadPdf = async (project, type = 'seller') => {
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);

      let elementId;
      if (type === 'subscription') {
        elementId = `subscription-invoice-${project.id}`;
      } else if (type === 'platform') {
        elementId = `platform-invoice-${project.id}`;
      } else {
        elementId = `receipt-${project.id}`;
      }
      
      const element = document.getElementById(elementId);
      if (!element) {
        console.error(`Element with id '${elementId}' not found`);
        toast.error('Receipt not found');
        return;
      }

      // Clone the element to avoid affecting the original
      const clone = element.cloneNode(true);
      
      // Create a temporary container for the clone
      const container = document.createElement('div');
      container.id = 'pdf-temp-container';
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
                  try { img.src = reader.result; } catch {}
                  resolve();
                };
                reader.onerror = reject;
                reader.readAsDataURL(blob);
              });
            } catch {}
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

      let filename;
      if (type === 'subscription') {
        filename = `subscription_invoice_${project.id}.pdf`;
      } else if (type === 'platform') {
        filename = `platform_invoice_${project.platform_invoice_reference || project.id}.pdf`;
      } else {
        filename = `receipt_seller_${project.reference_number || project.id}.pdf`;
      }
      pdf.save(filename);

      // Clean up the temporary container
      document.body.removeChild(container);
    } catch (e) {
      console.error('Seller receipt PDF generation failed:', e);
      toast.error('Failed to generate PDF');
      
      // Clean up the temporary container in case of error
      const container = document.getElementById('pdf-temp-container');
      if (container) {
        document.body.removeChild(container);
      }
    }
  };

  // Create combined receipts data (seller receipts, platform invoices, and subscription invoices)
  const combinedReceipts = React.useMemo(() => {
    const receipts = [];
    
    // Add project invoices (seller and platform)
    projects.forEach((project) => {
      // Add Seller Receipt (keep original reference_number)
      receipts.push({
        ...project,
        receiptType: 'seller',
        receiptTypeText: t('receipts.seller_receipt'),
        invoiceType: 'project',
        created_at: project.created_at || project.completion_date || new Date().toISOString()
      });
      
      // Add Platform Invoice (use permanent reference from database)
      receipts.push({
        ...project,
        receiptType: 'platform',
        receiptTypeText: t('receipts.platform_invoice'),
        invoiceType: 'project',
        created_at: project.created_at || project.completion_date || new Date().toISOString()
      });
    });
    
    // Add subscription invoices
    subscriptionInvoices.forEach(invoice => {
      // Generate reference number in format SUB-YYYY-XXXX (consistent with project invoices)
      const year = new Date(invoice.created_at).getFullYear();
      const randomSuffix = String(invoice.id).padStart(4, '0');
      const refNumber = `SUB-${year}-${randomSuffix}`;
      
      receipts.push({
        ...invoice,
        receiptType: 'subscription',
        receiptTypeText: 'Subscription Invoice',
        invoiceType: 'subscription',
        name: 'Monthly Subscription',
        reference_number: refNumber,
        payment_id: invoice.id,
        payment_status: invoice.status,
        created_at: invoice.created_at,
        completion_date: invoice.created_at
      });
    });
    
    // Sort all receipts by creation date (newest first)
    // Use created_at for all invoice types to ensure consistent sorting
    // Secondary sort by ID (descending) for invoices created on the same day
    receipts.sort((a, b) => {
      const dateA = new Date(a.created_at || 0);
      const dateB = new Date(b.created_at || 0);
      
      // Primary sort: by date (newest first)
      if (dateB.getTime() !== dateA.getTime()) {
        return dateB - dateA;
      }
      
      // Secondary sort: by ID (newest first) for same-day invoices
      return (b.id || 0) - (a.id || 0);
    });
    
    return receipts;
  }, [projects, subscriptionInvoices, t]);

  // Filter and paginate
  const filtered = React.useMemo(() => {
    let filteredReceipts = combinedReceipts;
    
    // Search filter
    const searchTerm = search.trim().toLowerCase();
    if (searchTerm) {
      filteredReceipts = filteredReceipts.filter(p => 
        (p.name || "").toLowerCase().includes(searchTerm) ||
        (p.reference_number || "").toLowerCase().includes(searchTerm) ||
        (p.payment_id || "").toLowerCase().includes(searchTerm)
      );
    }

    // Payment status filter
    if (filters.paymentStatus) {
      filteredReceipts = filteredReceipts.filter(p => p.payment_status === filters.paymentStatus);
    }


    // Date range filter (simplified - you can enhance this)
    if (filters.dateRange) {
      const now = new Date();
      const daysAgo = parseInt(filters.dateRange);
      const cutoffDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
      
      filteredReceipts = filteredReceipts.filter(p => {
        const projectDate = new Date(p.created_at);
        return projectDate >= cutoffDate;
      });
    }

    return filteredReceipts;
  }, [combinedReceipts, search, filters]);

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
      {/* Scrollable Background Image Layer - covers entire viewport */}
      <div
        className="absolute inset-0 -z-10 bg-top bg-no-repeat bg-cover"
        style={{ backgroundImage: `url(${loginBg})` }}
      />
      <MainLayout title={t('receipts.title')} mainBackgroundClass="">
        <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold text-[#2E78A6]">{t('receipts.title')}</h1>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="w-full sm:w-80">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('receipts.search_placeholder')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#01257D] focus:border-transparent"
              />
            </div>
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#01257D]"
            >
              {t('receipts.clear_filters')}
            </button>
                        </div>
                      </div>


        {/* Filters */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
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

        {/* Table */}
        {projects.length === 0 ? (
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
                      {t('receipts.receipt_type')}
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
                  {paged.map((receipt) => {
                    const { total, vatRate, vatAmount, finalAmount } = calcTotals(receipt);
                    
                                return (
                      <tr key={`${receipt.id}-${receipt.receiptType}`} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(receipt.created_at || receipt.completion_date)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <div className="font-medium">{receipt.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {receipt.receiptTypeText}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {receipt.receiptType === 'platform' ? (receipt.platform_invoice_reference || '-') : (receipt.reference_number || '-')}
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
                          {getStatusBadge(receipt.payment_status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => downloadPdf(receipt, receipt.receiptType)}
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
              {paged.map((receipt) => {
                const { total, vatRate, vatAmount, finalAmount } = calcTotals(receipt);
                
                return (
                  <div key={`${receipt.id}-${receipt.receiptType}`} className="border-b border-gray-200 p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 text-sm">{receipt.name}</h3>
                        <p className="text-xs text-gray-500 mt-1">{receipt.receiptTypeText}</p>
                      </div>
                      {getStatusBadge(receipt.payment_status)}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-xs mb-3">
                      <div>
                        <span className="text-gray-500">{t('receipts.date')}:</span>
                        <div className="font-medium">{formatDate(receipt.created_at || receipt.completion_date)}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">{t('receipts.reference')}:</span>
                        <div className="font-medium">{receipt.receiptType === 'platform' ? (receipt.platform_invoice_reference || '-') : (receipt.reference_number || '-')}</div>
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
                        onClick={() => downloadPdf(receipt, receipt.receiptType)}
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
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                  const pageNum = i + 1;
                                return (
                    <button
                      key={pageNum}
                      className={`px-3 py-2 text-sm rounded-md border cursor-pointer ${
                        page === pageNum 
                          ? 'bg-[#01257D] text-white border-[#01257D]' 
                          : 'bg-white hover:bg-gray-50'
                      }`}
                      onClick={() => setPage(pageNum)}
                    >
                      {pageNum}
                    </button>
                                );
                              })}
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

        {/* Hidden PDF Elements */}
        {paged.map((receipt) => {
          const { total, vatRate, vatAmount, finalAmount, amountIncludingVat, platformFeeWithVat } = calcTotals(receipt);
          const phoneLabel = t('receipts.phone_label', { defaultValue: 'Phone' });
          
          return (
            <div key={`pdf-${receipt.id}-${receipt.receiptType}`} className="hidden">
              {/* Seller Receipt PDF */}
              <div id={`receipt-${receipt.id}`} className="max-w-[800px] mx-auto bg-white p-6 rounded-lg border border-gray-200" style={{ background: '#ffffff' }}>
                {/* Header with Logo */}
                <div className="flex items-center justify-between pt-4 pb-4 mb-4 border-b-2" style={{ borderColor: '#01257D' }}>
                  <div className="flex items-center gap-3">
                    <img src={Logo} alt="Safe Bill" style={{ height: 15, width: 'auto' }} />
                  </div>
                  <div className="text-xs text-gray-500">{t('receipts.seller_invoice')}</div>
                </div>

                {/* Seller and Buyer Info */}
                <div className="flex items-start justify-between mb-4">
                  {/* Seller Info - Left Side */}
                  <div className="flex-1 pr-4">
                    <div className="text-xs font-semibold text-gray-700 mb-1">{t('receipts.seller_information')}</div>
                    <div className="text-xs text-gray-600 space-y-0.5">
                      {receipt.seller_username && <div>{receipt.seller_username}</div>}
                      {receipt.seller_email && <div>{receipt.seller_email}</div>}
                      {receipt.seller_company && <div className="font-semibold">{receipt.seller_company}</div>}
                      {receipt.seller_address && <div>{receipt.seller_address}</div>}
                      {receipt.seller_phone && <div>{t('receipts.phone')}: {receipt.seller_phone}</div>}
                      {receipt.seller_siret && <div>{t('receipts.siret')}: {receipt.seller_siret}</div>}
                    </div>
                  </div>

                  {/* Buyer Info - Right Side */}
                  <div className="flex-1 pl-4 text-right">
                    <div className="text-xs font-semibold text-gray-700 mb-1">{t('receipts.buyer_information')}</div>
                    <div className="text-xs text-gray-600 space-y-0.5">
                      {receipt.buyer_full_name && <div>{receipt.buyer_full_name}</div>}
                      {!receipt.buyer_full_name && receipt.buyer_username && <div>{receipt.buyer_username}</div>}
                      {receipt.buyer_email && <div>{receipt.buyer_email}</div>}
                      {receipt.buyer_address && <div>{receipt.buyer_address}</div>}
                    </div>
                  </div>
                </div>

                {/* Project Details */}
                        <div className="mb-5">
                  <div className="text-lg font-semibold text-gray-900">{receipt.name}</div>
                  <div className="text-xs text-gray-500">{t('receipts.ref')} {receipt.reference_number || '-'}</div>
                  <div className="text-xs text-gray-500">{t('receipts.start')} {receipt.created_at} {receipt.completion_date ? `• ${t('receipts.completed')}: ${receipt.completion_date}` : ''}</div>
                  <div className="text-xs text-gray-500 mt-1">{t('receipts.vat')}: {Number(receipt.vat_rate || 0).toFixed(1)}%</div>
                  <div className="text-xs text-gray-500 mt-1">{t('receipts.seller_label')}: {receipt.seller_username || '-'} ({receipt.seller_email || '-'})</div>
                  <div className="text-xs text-gray-500">{t('receipts.buyer_label')}: {receipt.buyer_username || '-'} ({receipt.buyer_email || '-'})</div>
                        </div>

                {/* Cost Summary with Platform Fees Deduction */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 text-sm mb-6">
                          <div className="bg-gray-50 rounded-md p-3 border border-gray-200">
                            <div className="text-gray-500">{t('receipts.total')}</div>
                            <div className="text-base font-semibold">€{total.toLocaleString()}</div>
                          </div>
                          <div className="bg-gray-50 rounded-md p-3 border border-gray-200">
                    <div className="text-gray-500">{t('receipts.vat')} ({vatRate.toFixed(1)}%)</div>
                            <div className="text-base font-semibold">+€{vatAmount.toLocaleString()}</div>
                          </div>
                          <div className="bg-gray-50 rounded-md p-3 border border-gray-200">
                    <div className="text-gray-500">{t('receipts.amount_with_vat')}</div>
                    <div className="text-base font-semibold">€{amountIncludingVat.toLocaleString()}</div>
                          </div>
                          <div className="bg-gray-50 rounded-md p-3 border border-gray-200">
                    <div className="text-gray-500">{t('receipts.platform_fees')}</div>
                    <div className="text-base font-semibold text-orange-700">-€{platformFeeWithVat.toLocaleString()}</div>
                  </div>
                  <div className="bg-gray-50 rounded-md p-3 border border-gray-200" style={{ backgroundColor: '#f0fdf4', borderColor: '#86efac' }}>
                    <div className="text-gray-500">{t('receipts.seller_invoice')}</div>
                            <div className="text-base font-semibold text-green-700">€{finalAmount.toLocaleString()}</div>
                          </div>
                        </div>

                <div className="mt-6 text-[11px] text-gray-500 flex items-center justify-between">
                  <div>{t('receipts.generated_by')}</div>
                  <div>www.safebill.fr</div>
                </div>
              </div>

              {/* Platform Invoice PDF */}
              <div id={`platform-invoice-${receipt.id}`} className="max-w-[800px] mx-auto bg-white p-6 rounded-lg border border-gray-200" style={{ background: '#ffffff' }}>
                <div className="flex items-center justify-between pb-4 mb-4 border-b-2" style={{ borderColor: '#01257D' }}>
                  <div className="flex items-center gap-3">
                    <img src={Logo} alt="Safe Bill" style={{ height: 15, width: 'auto' }} />
                  </div>
                  <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">{t('receipts.platform_invoice')}</div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-4 mb-4 border-b border-gray-200">
                  <div className="flex-1 text-xs text-gray-600">
                    <div className="text-sm font-semibold text-gray-900 mb-1">{SAFE_BILL_INFO.name}</div>
                    <div>{SAFE_BILL_INFO.email}</div>
                    <div className="mt-0.5">{SAFE_BILL_INFO.address}</div>
                  </div>
                  <div className="flex-1 text-xs text-gray-600 text-left sm:text-right">
                    <div className="text-xs font-semibold text-gray-700 mb-1">{t('receipts.seller_information')}</div>
                    <div className="text-sm text-gray-600 mb-1">{receipt.seller_username || '-'}</div>
                    <div>{receipt.seller_email || '-'}</div>
                    {receipt.seller_company && <div className="text-sm text-gray-600 mb-1">{receipt.seller_company}</div>}
                    <div className="mt-0.5">{receipt.seller_address || '-'}</div>
                    <div className="mt-0.5">{receipt.seller_siret ? `SIRET: ${receipt.seller_siret}` : 'SIRET: -'}</div>
                    <div className="mt-0.5">{receipt.seller_phone ? `${phoneLabel}: ${receipt.seller_phone}` : `${phoneLabel}: -`}</div>
                  </div>
                </div>

                <div className="mb-5">
                  <div className="text-lg font-semibold text-gray-900">{receipt.name}</div>
                  <div className="text-xs text-gray-500">{t('receipts.ref')} {receipt.platform_invoice_reference || '-'}</div>
                  <div className="text-xs text-gray-500 mt-1">{t('receipts.vat_rate')}: {vatRate.toFixed(1)}%</div>
                  <div className="text-xs text-gray-500 mt-1">{t('receipts.invoice_date')}: {receipt.completion_date || receipt.created_at}</div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mb-6">
                  <div className="bg-blue-50 rounded-md p-3 border border-blue-200">
                    <div className="text-gray-500">{t('receipts.project_amount')}</div>
                    <div className="text-base font-semibold">€{total.toLocaleString()}</div>
                  </div>
                  <div className="bg-blue-50 rounded-md p-3 border border-blue-200">
                    <div className="text-gray-500">{t('receipts.service_fees_excl_vat')}</div>
                    <div className="text-base font-semibold">€{(total * Number(receipt.platform_fee_percentage || 0) / 100).toFixed(2)}</div>
                  </div>
                  <div className="bg-blue-50 rounded-md p-3 border border-blue-200">
                    <div className="text-gray-500">{t('receipts.vat_rate')} ({vatRate.toFixed(1)}%)</div>
                    <div className="text-base font-semibold">+€{(total * Number(receipt.platform_fee_percentage || 0) / 100 * vatRate / 100).toFixed(2)}</div>
                  </div>
                  <div className="bg-blue-50 rounded-md p-3 border border-blue-200">
                    <div className="text-gray-500">{t('receipts.total_service_fees')}</div>
                    <div className="text-base font-semibold text-blue-700">€{((total * Number(receipt.platform_fee_percentage || 0) / 100) * (1 + vatRate / 100)).toFixed(2)}</div>
                  </div>
                        </div>

                        <div className="mt-6 text-[11px] text-gray-500 flex items-center justify-between">
                          <div>{t('receipts.generated_by')}</div>
                          <div>www.safebill.fr</div>
                        </div>
                      </div>

              {/* Subscription Invoice PDF */}
              {receipt.invoiceType === 'subscription' && (
                <div id={`subscription-invoice-${receipt.id}`} className="max-w-[800px] mx-auto bg-white p-6 rounded-lg border border-gray-200" style={{ background: '#ffffff' }}>
                  {/* Header with Logo */}
                  <div className="flex items-center justify-between pt-4 pb-4 mb-4 border-b-2" style={{ borderColor: '#01257D' }}>
                    <div className="flex items-center gap-3">
                      <img src={Logo} alt="Safe Bill" style={{ height: 15, width: 'auto' }} />
                    </div>
                    <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">{t('receipts.subscription_invoice')}</div>
                  </div>

                  {/* Safe Bill and Seller Info */}
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-4 mb-4 border-b border-gray-200">
                    <div className="flex-1 text-xs text-gray-600">
                      <div className="text-sm font-semibold text-gray-900 mb-1">{SAFE_BILL_INFO.name}</div>
                      <div>{SAFE_BILL_INFO.email}</div>
                      <div className="mt-0.5">{SAFE_BILL_INFO.address}</div>
                    </div>
                    <div className="flex-1 text-xs text-gray-600 text-left sm:text-right">
                      <div className="text-xs font-semibold text-gray-700 mb-1">{t('receipts.seller_information')}</div>
                      <div className="text-sm text-gray-600 mb-1">{receipt.seller_name || '-'}</div>
                      <div>{receipt.seller_email || '-'}</div>
                      {receipt.seller_company && <div className="text-sm text-gray-600 mb-1">{receipt.seller_company}</div>}
                      <div className="mt-0.5">{receipt.seller_address || '-'}</div>
                      <div className="mt-0.5">{receipt.seller_siret ? `SIRET: ${receipt.seller_siret}` : 'SIRET: -'}</div>
                      <div className="mt-0.5">{receipt.seller_phone ? `${t('receipts.phone')}: ${receipt.seller_phone}` : `${t('receipts.phone')}: -`}</div>
                    </div>
                  </div>

                  {/* Invoice Details */}
                  <div className="mb-5">
                    <div className="text-lg font-semibold text-gray-900">{t('receipts.monthly_subscription_invoice')}</div>
                    <div className="text-xs text-gray-500">{t('receipts.invoice_number')}: {receipt.id}</div>
                    <div className="text-xs text-gray-500 mt-1">{t('receipts.invoice_date')}: {receipt.created_at}</div>
                    <div className="text-xs text-gray-500 mt-1">{t('receipts.billing_period')}: {receipt.billing_period_start} {t('receipts.to')} {receipt.billing_period_end}</div>
                    <div className="text-xs text-gray-500 mt-1">{t('receipts.status')}: <span style={{ textTransform: 'capitalize', color: receipt.status === 'paid' ? '#52c41a' : '#faad14' }}>{t(`receipts.status_${receipt.status}`)}</span></div>
                  </div>

                  {/* Amount Summary */}
                  <div className="grid grid-cols-1 sm:grid-cols-1 gap-4 text-sm mb-6">
                    <div className="bg-blue-50 rounded-md p-3 border border-blue-200">
                      <div className="text-gray-500">{t('receipts.subscription_amount')}</div>
                      <div className="text-base font-semibold text-blue-700">€{Number(receipt.amount).toFixed(2)}</div>
                    </div>
                  </div>

                  <div className="mt-6 text-[11px] text-gray-500 flex items-center justify-between">
                    <div>{t('receipts.generated_by_safe_bill')}</div>
                    <div>www.safebill.fr</div>
                  </div>
                </div>
              )}
                  </div>
                );
              })}
        </div>
      </MainLayout>
    </>
  );
}
