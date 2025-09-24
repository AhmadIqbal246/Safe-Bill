import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { createProject, resetProjectState } from '../../store/slices/ProjectSlice';
import { fetchNotifications } from '../../store/slices/NotificationSlice';
import { toast } from 'react-toastify';
import { Edit } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const paymentConfigs = [
  [
    { amount: '€1000', step: 'Quote Acceptance', desc: 'Full payment upon quote acceptance.' },
  ],
  [
    { amount: '€600', step: 'Quote Acceptance', desc: 'Initial payment upon quote acceptance.' },
    { amount: '€400', step: 'Project Completion', desc: 'Final payment upon project completion.' },
  ],
  [
    { amount: '€500', step: 'Quote Acceptance', desc: 'Initial payment upon quote acceptance.' },
    { amount: '€300', step: 'Project Start', desc: 'Payment due at the start of the project.' },
    { amount: '€200', step: 'Project Completion', desc: 'Final payment upon project completion.' },
  ],
];

export default function ProjectCreation() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading, error, success } = useSelector((state) => state.project);
  const [installments, setInstallments] = useState(3);
  const [clientEmail, setClientEmail] = useState('');
  const [projectName, setProjectName] = useState('');
  const [vatRate, setVatRate] = useState('20.0');
  const [quoteFile, setQuoteFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const fileInputRef = useRef(null);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editRow, setEditRow] = useState({ amount: '', step: '', desc: '' });
  const [installmentRows, setInstallmentRows] = useState(
    paymentConfigs[installments - 1].map(row => ({ ...row }))
  );

  // Calculate platform fee percentage based on total project amount (tiered system)
  const getPlatformFeePct = (totalAmount) => {
    if (totalAmount >= 500001) return 1.5;
    if (totalAmount >= 400001) return 2.0;
    if (totalAmount >= 300001) return 2.5;
    if (totalAmount >= 200001) return 3.0;
    if (totalAmount >= 100001) return 5.0;
    if (totalAmount >= 1001) return 7.0;
    return 10.0; // Default for amounts 500-1000
  };

  // Helper to compute per-row fees; simplified platform fee only
  const computeRowFees = (amount, platformPct) => {
    const numericAmount = Number(amount) || 0;
    const platformFee = +(numericAmount * platformPct / 100).toFixed(2);
    const sellerNet = numericAmount - platformFee;
    return {
      amount: numericAmount,
      platformFee,
      netAmount: +Math.max(sellerNet, 0).toFixed(2),
    };
  };

  // Frontend platform fee calculation based on total project amount
  const totalProjectAmount = installmentRows.reduce((sum, row) => {
    const amount = Number(String(row.amount).replace(/[^0-9.]/g, '')) || 0;
    return sum + amount;
  }, 0);
  const platformPctForProject = getPlatformFeePct(totalProjectAmount);
  const platformFeeForProject = +(totalProjectAmount * platformPctForProject / 100).toFixed(2);

  // Calculate fees for each milestone using platformPctForProject
  const milestoneFees = installmentRows.map(row => {
    const amount = Number(String(row.amount).replace(/[^0-9.]/g, '')) || 0;
    return {
      ...row,
      ...computeRowFees(amount, platformPctForProject),
    };
  });

  // Calculate total net earnings
  const totalSellerNet = milestoneFees.reduce((sum, milestone) => sum + milestone.netAmount, 0);

  // Update rows when installments count changes
  React.useEffect(() => {
    setInstallmentRows(paymentConfigs[installments - 1].map(row => ({ ...row })));
    setEditingIndex(null);
  }, [installments]);

  const handleEdit = (idx) => {
    setEditingIndex(idx);
    setEditRow({ ...installmentRows[idx] });
  };

  const handleEditChange = (e) => {
    setEditRow({ ...editRow, [e.target.name]: e.target.value });
  };

  const handleEditSave = (idx) => {
    const updated = [...installmentRows];
    updated[idx] = { ...editRow };
    setInstallmentRows(updated);
    setEditingIndex(null);
  };

  const handleEditCancel = () => {
    setEditingIndex(null);
  };

  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      setFileError(t('project_creation.only_pdf_allowed'));
      setQuoteFile(null);
      return;
    }
    setFileError('');
    setQuoteFile(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!projectName || !clientEmail || !quoteFile) {
      toast.error(t('project_creation.fill_all_fields'));
      return;
    }
    const selectedConfig = installmentRows.map(row => ({
      amount: Number(row.amount.replace(/[^0-9.]/g, '')),
      step: row.step,
      description: row.desc,
    }));
    dispatch(createProject({
      name: projectName,
      client_email: clientEmail,
      quote: { file: quoteFile },
      installments: selectedConfig,
      vat_rate: vatRate,
      platform_fee_percentage: platformPctForProject,
    }));
  };

  

  // Simple inline error normalizer (no separate file)
  const normalizeError = useCallback((err) => {
    if (!err) return '';
    if (typeof err === 'string') return err;
    const data = err?.response?.data || err;
    if (typeof data === 'string') {
      let s = data.trim();
      // If wrapped in quotes, strip them
      if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
        s = s.slice(1, -1);
      }
      // First parse attempt
      try {
        const parsed1 = JSON.parse(s);
        // If it parses to a string again, try a second parse (double-encoded JSON)
        if (typeof parsed1 === 'string') {
          try {
            const parsed2 = JSON.parse(parsed1);
            return normalizeError({ response: { data: parsed2 } });
          } catch {
            return parsed1;
          }
        }
        return normalizeError({ response: { data: parsed1 } });
      } catch {
        console.log(s);
      }
      return s;
    }
    if (data?.detail && typeof data.detail === 'string') return data.detail;
    if (data && typeof data === 'object') {
      // Handle nested DRF errors e.g. { quote: { file: ["..."] } }
      if (data.quote && typeof data.quote === 'object') {
        if (Array.isArray(data.quote.file)) {
          try { return data.quote.file.join(', '); } catch {
            console.log(data.quote.file);
          }
        }
      }
      // Common DRF pattern: { field: ["msg1", "msg2"], ... }
      if (Array.isArray(data.file)) {
        try { return data.file.join(', '); } catch {
          console.log(data.file);
        }
      }
      try {
        const values = Object.values(data).flatMap((v) => {
          if (v && typeof v === 'object' && !Array.isArray(v)) {
            // Flatten nested object values
            return Object.values(v).flatMap((vv) => Array.isArray(vv) ? vv : [vv]);
          }
          if (Array.isArray(v)) return v;
          return [v];
        }).map((x) => (typeof x === 'string' ? x : JSON.stringify(x)));
        if (values.length) return values.join(', ');
      } catch {
        console.log(data);
      }
    }
    return 'An unexpected error occurred';
  }, []);

  useEffect(() => {
    if (success) {
      toast.success(t('project_creation.project_created_successfully'));
      dispatch(resetProjectState());
      setProjectName('');
      setClientEmail('');
      setQuoteFile(null);
      dispatch(fetchNotifications());
      navigate('/my-quotes');
    } else if (error) {
      const message = normalizeError(error);
      toast.error(message || t('common.unexpected_error'));
      dispatch(resetProjectState());
    }
  }, [success, error, dispatch, t, navigate, normalizeError]);

  return (
    <div className="max-w-5xl mx-auto py-4 sm:py-10 px-2 sm:px-4">
      <h1 className="text-xl sm:text-3xl font-bold mb-4 sm:mb-8">{t('project_creation.title')}</h1>

      {/* Project Name Section */}
      <div className="mb-6 sm:mb-10">
        <h2 className="text-base sm:text-xl font-semibold mb-2 sm:mb-3">{t('project_creation.project_name_section')}</h2>
        <input
          type="text"
          placeholder={t('project_creation.project_name_placeholder')}
          className="px-3 sm:px-4 py-2 sm:py-3 rounded-md border border-gray-200 bg-[#F6FAFD] text-gray-700 w-full max-w-sm sm:max-w-lg focus:outline-none focus:ring-2 focus:ring-[#01257D] text-sm sm:text-base"
          value={projectName}
          onChange={e => setProjectName(e.target.value)}
        />
      </div>

      {/* Signed Quote Upload */}
      <div className="mb-6 sm:mb-10">
        <h2 className="text-base sm:text-xl font-semibold mb-2 sm:mb-3">{t('project_creation.signed_quote_section')}</h2>
        <div className="border-2 border-dashed border-[#D1D5DB] rounded-xl p-4 sm:p-8 flex flex-col items-center justify-center mb-2 min-h-[120px] sm:min-h-[180px]">
          <div className="font-semibold text-sm sm:text-lg mb-1">{t('project_creation.upload_signed_quote')}</div>
          <div className="text-gray-500 mb-3 sm:mb-4 text-center text-xs sm:text-sm">{t('project_creation.drag_drop_message')}</div>
          <input
            type="file"
            accept="application/pdf"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileChange}
          />
          <button
            type="button"
            className="px-4 sm:px-6 py-2 bg-[#01257D] text-white rounded-md font-semibold hover:bg-[#2346a0] transition-colors cursor-pointer text-sm sm:text-base"
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
          >
            {quoteFile ? t('project_creation.change_file') : t('project_creation.upload')}
          </button>
          {fileError && <div className="text-red-500 mt-2 text-xs sm:text-sm">{fileError}</div>}
          {quoteFile && !fileError && (
            <div className="mt-3 sm:mt-4 flex flex-col items-center">
              <span className="text-xs sm:text-sm text-gray-700 font-medium">{quoteFile.name} ({(quoteFile.size / 1024).toFixed(1)} KB)</span>
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  className="text-blue-600 underline text-xs sm:text-sm cursor-pointer"
                  onClick={() => window.open(URL.createObjectURL(quoteFile), '_blank')}
                >
                  {t('project_creation.view')}
                </button>
                <button
                  type="button"
                  className="text-red-500 underline text-xs sm:text-sm cursor-pointer"
                  onClick={() => setQuoteFile(null)}
                >
                  {t('project_creation.remove')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Payment Configuration */}
      <div className="mb-6 sm:mb-10">
        <h2 className="text-base sm:text-xl font-semibold mb-2 sm:mb-3">{t('project_creation.payment_configuration')}</h2>
        <div className="flex gap-1 sm:gap-2 mb-3 sm:mb-4">
          {[1, 2, 3].map((n) => (
            <button
              key={n}
              className={`px-2 sm:px-4 py-1.5 sm:py-2 rounded-md border text-xs sm:text-sm font-medium transition-colors cursor-pointer ${installments === n ? 'bg-[#F6FAFD] border-[#01257D] text-[#01257D]' : 'bg-white border-gray-200 text-gray-700 hover:bg-[#F6FAFD]'}`}
              onClick={() => setInstallments(n)}
            >
              {n} {n > 1 ? t('project_creation.installments') : t('project_creation.installment')}
            </button>
          ))}
        </div>
        <div className="overflow-x-auto rounded-xl border border-gray-200 max-w-full mx-auto">
          <table className="min-w-full text-xs sm:text-sm">
            <thead className="bg-[#E6F0FA]">
              <tr>
                <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold">{t('project_creation.amount')}</th>
                <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold">{t('project_creation.trigger_step')}</th>
                <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold">{t('project_creation.description')}</th>
                <th className="px-2 sm:px-4 py-2 sm:py-3 text-center font-semibold">
                  {t('project_creation.platform_fees')}
                </th>
                <th className="px-2 sm:px-4 py-2 sm:py-3 text-center font-semibold">{t('project_creation.net_amount')}</th>
                <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold">{t('project_creation.edit')}</th>
              </tr>
            </thead>
            <tbody>
              {milestoneFees.map((milestone, i) => (
                <tr key={i} className="border-t border-gray-100">
                  {editingIndex === i ? (
                    <>
                      <td className="px-2 sm:px-4 py-2 sm:py-3">
                        <input
                          type="number"
                          name="amount"
                          value={editRow.amount.replace(/[^0-9.]/g, '')}
                          onChange={handleEditChange}
                          className="w-16 sm:w-20 px-1 sm:px-2 py-1 border rounded text-xs sm:text-sm"
                        />
                      </td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3">
                        <input
                          type="text"
                          name="step"
                          value={editRow.step}
                          onChange={handleEditChange}
                          className="w-24 sm:w-32 px-1 sm:px-2 py-1 border rounded text-xs sm:text-sm"
                        />
                      </td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3">
                        <input
                          type="text"
                          name="desc"
                          value={editRow.desc}
                          onChange={handleEditChange}
                          className="w-40 sm:w-56 px-1 sm:px-2 py-1 border rounded text-xs sm:text-sm"
                        />
                      </td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-center text-gray-500">-</td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-center text-gray-500">-</td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 flex gap-1 sm:gap-2">
                        <button
                          className="px-1 sm:px-2 py-1 bg-green-600 text-white rounded text-xs sm:text-sm"
                          onClick={() => handleEditSave(i)}
                        >
                          {t('project_creation.save')}
                        </button>
                        <button
                          className="px-1 sm:px-2 py-1 bg-gray-300 text-gray-700 rounded text-xs sm:text-sm"
                          onClick={handleEditCancel}
                        >
                          {t('quote_management.cancel')}
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 font-medium">€{milestone.amount.toLocaleString()}</td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-[#01257D] font-medium">{milestone.step}</td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-gray-600">{milestone.desc}</td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-center text-red-600">-€{(milestone.platformFee).toLocaleString()}</td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-center font-semibold text-green-600">€{milestone.netAmount.toLocaleString()}</td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3">
                        <button
                          className="p-1 hover:bg-gray-100 rounded cursor-pointer"
                          title={t('project_creation.edit')}
                          onClick={() => handleEdit(i)}
                        >
                          <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Final Total Only */}
        <div className="mt-6 flex justify-end">
          <div className=" border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-4 justify-between">
              <span className="text-lg font-semibold text-gray-900">{t('project_creation.final_total') || 'Total Net Earnings'}: </span>
              <span className="text-xl font-bold text-[#01257D]">€{totalSellerNet.toLocaleString()}</span>
              <span className="text-sm text-gray-700 bg-[#E6F0FA] px-2 py-1 rounded-md">{t('project_creation.platform_fee_label')}: {(platformPctForProject).toFixed(1)}% (€{platformFeeForProject.toLocaleString()})</span>
            </div>
          </div>
        </div>
      </div>

      {/* VAT Selection */}
      <div className="mb-6 sm:mb-10">
        <h2 className="text-base sm:text-xl font-semibold mb-2 sm:mb-3">{t('project_creation.vat_section') || 'VAT Rate'}</h2>
        <div className="relative inline-block">
          <select
            value={vatRate}
            onChange={(e) => setVatRate(e.target.value)}
            className="w-48 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent bg-white text-gray-700"
          >
            <option value="20.0">20%</option>
            <option value="10.0">10%</option>
            <option value="7.0">8.5%</option>
            <option value="5.5">5.5%</option>
            <option value="2.1">2.1%</option>
            <option value="0.0">0%</option>
          </select>
        </div>
      </div>

      {/* Client Email and Send Button */}
      <div className="mb-6 sm:mb-10">
        <h2 className="text-base sm:text-xl font-semibold mb-2 sm:mb-3">{t('project_creation.client_section')}</h2>
        <form className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-center" onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder={t('project_creation.client_email_placeholder')}
            className="px-3 sm:px-4 py-2 sm:py-3 rounded-md border border-gray-200 bg-[#F6FAFD] text-gray-700 w-full max-w-sm sm:max-w-xs focus:outline-none focus:ring-2 focus:ring-[#01257D] text-sm sm:text-base"
            value={clientEmail}
            onChange={e => setClientEmail(e.target.value)}
          />
          <button
            type="submit"
            className="px-4 sm:px-6 py-2 bg-[#01257D] text-white rounded-md font-semibold hover:bg-[#2346a0] transition-colors w-full sm:w-auto cursor-pointer text-sm sm:text-base"
            disabled={loading}
          >
            {loading ? t('project_creation.sending') : t('project_creation.send_payment_invitation')}
          </button>
        </form>
      </div>
    </div>
  );
}
