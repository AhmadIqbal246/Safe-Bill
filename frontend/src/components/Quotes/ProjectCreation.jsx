import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createProject, resetProjectState } from '../../store/slices/ProjectSlice';
import { toast } from 'react-toastify';
import { Edit } from 'lucide-react';

const paymentConfigs = [
  [
    { amount: '$1000', step: 'Quote Acceptance', desc: 'Full payment upon quote acceptance.' },
  ],
  [
    { amount: '$600', step: 'Quote Acceptance', desc: 'Initial payment upon quote acceptance.' },
    { amount: '$400', step: 'Project Completion', desc: 'Final payment upon project completion.' },
  ],
  [
    { amount: '$500', step: 'Quote Acceptance', desc: 'Initial payment upon quote acceptance.' },
    { amount: '$300', step: 'Project Start', desc: 'Payment due at the start of the project.' },
    { amount: '$200', step: 'Project Completion', desc: 'Final payment upon project completion.' },
  ],
];

export default function ProjectCreation() {
  const [installments, setInstallments] = useState(3);
  const [clientEmail, setClientEmail] = useState('');
  const [projectName, setProjectName] = useState('');
  const [quoteFile, setQuoteFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const fileInputRef = useRef(null);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editRow, setEditRow] = useState({ amount: '', step: '', desc: '' });
  const [installmentRows, setInstallmentRows] = useState(
    paymentConfigs[installments - 1].map(row => ({ ...row }))
  );

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
      setFileError('Only PDF files are allowed.');
      setQuoteFile(null);
      return;
    }
    setFileError('');
    setQuoteFile(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!projectName || !clientEmail || !quoteFile) {
      toast.error('Please fill all fields and upload the signed quote.');
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
    }));
  };

  const dispatch = useDispatch();
  const { loading, error, success } = useSelector((state) => state.project);

  useEffect(() => {
    if (success) {
      toast.success('Project created successfully!');
      dispatch(resetProjectState());
      setProjectName('');
      setClientEmail('');
      setQuoteFile(null);
    } else if (error) {
      toast.error(
        typeof error === 'string'
          ? error
          : error.detail || Object.values(error).flat().join(', ')
      );
      dispatch(resetProjectState());
    }
  }, [success, error, dispatch]);

  return (
    <div className="max-w-5xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-8">Project Creation</h1>

      {/* Project Name Section */}
      <div className="mb-10">
        <h2 className="text-xl font-semibold mb-3">Project Name</h2>
        <input
          type="text"
          placeholder="Enter project name"
          className="px-4 py-3 rounded-md border border-gray-200 bg-[#F6FAFD] text-gray-700 w-full max-w-lg focus:outline-none focus:ring-2 focus:ring-[#01257D]"
          value={projectName}
          onChange={e => setProjectName(e.target.value)}
        />
      </div>

      {/* Signed Quote Upload */}
      <div className="mb-10">
        <h2 className="text-xl font-semibold mb-3">Signed Quote</h2>
        <div className="border-2 border-dashed border-[#D1D5DB] rounded-xl p-8 flex flex-col items-center justify-center mb-2 min-h-[180px]">
          <div className="font-semibold text-lg mb-1">Upload signed quote</div>
          <div className="text-gray-500 mb-4 text-center">Drag and drop or browse to upload the signed quote.</div>
          <input
            type="file"
            accept="application/pdf"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileChange}
          />
          <button
            type="button"
            className="px-6 py-2 bg-[#01257D] text-white rounded-md font-semibold hover:bg-[#2346a0] transition-colors cursor-pointer"
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
          >
            {quoteFile ? 'Change File' : 'Upload'}
          </button>
          {fileError && <div className="text-red-500 mt-2">{fileError}</div>}
          {quoteFile && !fileError && (
            <div className="mt-4 flex flex-col items-center">
              <span className="text-sm text-gray-700 font-medium">{quoteFile.name} ({(quoteFile.size / 1024).toFixed(1)} KB)</span>
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  className="text-blue-600 underline text-sm cursor-pointer"
                  onClick={() => window.open(URL.createObjectURL(quoteFile), '_blank')}
                >
                  View
                </button>
                <button
                  type="button"
                  className="text-red-500 underline text-sm cursor-pointer"
                  onClick={() => setQuoteFile(null)}
                >
                  Remove
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Payment Configuration */}
      <div className="mb-10">
        <h2 className="text-xl font-semibold mb-3">Payment Configuration</h2>
        <div className="flex gap-2 mb-4">
          {[1, 2, 3].map((n) => (
            <button
              key={n}
              className={`px-4 py-2 rounded-md border text-sm font-medium transition-colors cursor-pointer ${installments === n ? 'bg-[#F6FAFD] border-[#01257D] text-[#01257D]' : 'bg-white border-gray-200 text-gray-700 hover:bg-[#F6FAFD]'}`}
              onClick={() => setInstallments(n)}
            >
              {n} installment{n > 1 ? 's' : ''}
            </button>
          ))}
        </div>
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="min-w-full text-sm">
            <thead className="bg-[#E6F0FA]">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Amount</th>
                <th className="px-4 py-3 text-left font-semibold">Trigger Step</th>
                <th className="px-4 py-3 text-left font-semibold">Description</th>
                <th className="px-4 py-3 text-left font-semibold">Edit</th>
              </tr>
            </thead>
            <tbody>
              {installmentRows.map((row, i) => (
                <tr key={i} className="border-t border-gray-100">
                  {editingIndex === i ? (
                    <>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          name="amount"
                          value={editRow.amount.replace(/[^0-9.]/g, '')}
                          onChange={handleEditChange}
                          className="w-20 px-2 py-1 border rounded"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          name="step"
                          value={editRow.step}
                          onChange={handleEditChange}
                          className="w-32 px-2 py-1 border rounded"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          name="desc"
                          value={editRow.desc}
                          onChange={handleEditChange}
                          className="w-56 px-2 py-1 border rounded"
                        />
                      </td>
                      <td className="px-4 py-3 flex gap-2">
                        <button
                          className="px-2 py-1 bg-green-600 text-white rounded"
                          onClick={() => handleEditSave(i)}
                        >
                          Save
                        </button>
                        <button
                          className="px-2 py-1 bg-gray-300 text-gray-700 rounded"
                          onClick={handleEditCancel}
                        >
                          Cancel
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3">{row.amount}</td>
                      <td className="px-4 py-3 text-[#01257D] font-medium">{row.step}</td>
                      <td className="px-4 py-3 text-gray-600">{row.desc}</td>
                      <td className="px-4 py-3">
                        <button
                          className="p-1 hover:bg-gray-100 rounded cursor-pointer"
                          title="Edit"
                          onClick={() => handleEdit(i)}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Client Email and Send Button */}
      <div className="mb-10">
        <h2 className="text-xl font-semibold mb-3">Client</h2>
        <form className="flex flex-col sm:flex-row gap-4 items-center" onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Client's  email"
            className="px-4 py-3 rounded-md border border-gray-200 bg-[#F6FAFD] text-gray-700 w-full max-w-xs focus:outline-none focus:ring-2 focus:ring-[#01257D]"
            value={clientEmail}
            onChange={e => setClientEmail(e.target.value)}
          />
          <button
            type="submit"
            className="px-6 py-2 bg-[#01257D] text-white rounded-md font-semibold hover:bg-[#2346a0] transition-colors w-full sm:w-auto cursor-pointer"
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send Payment Invitation'}
          </button>
        </form>
      </div>
    </div>
  );
}
