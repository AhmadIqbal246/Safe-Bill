import React, { useState } from 'react';

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

  return (
    <div className="max-w-5xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-8">Project Creation</h1>

      {/* Signed Quote Upload */}
      <div className="mb-10">
        <h2 className="text-xl font-semibold mb-3">Signed Quote</h2>
        <div className="border-2 border-dashed border-[#D1D5DB] rounded-xl p-8 flex flex-col items-center justify-center mb-2 min-h-[180px]">
          <div className="font-semibold text-lg mb-1">Upload signed quote</div>
          <div className="text-gray-500 mb-4 text-center">Drag and drop or browse to upload the signed quote.</div>
          <button className="px-6 py-2 bg-[#01257D] text-white rounded-md font-semibold hover:bg-[#2346a0] transition-colors cursor-pointer">Upload</button>
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
              </tr>
            </thead>
            <tbody>
              {paymentConfigs[installments - 1].map((row, i) => (
                <tr key={i} className="border-t border-gray-100">
                  <td className="px-4 py-3">{row.amount}</td>
                  <td className="px-4 py-3 text-[#01257D] font-medium">{row.step}</td>
                  <td className="px-4 py-3 text-gray-600">{row.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Client Email and Send Button */}
      <div className="mb-10">
        <h2 className="text-xl font-semibold mb-3">Client</h2>
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <input
            type="email"
            placeholder="Client's  email"
            className="px-4 py-3 rounded-md border border-gray-200 bg-[#F6FAFD] text-gray-700 w-full max-w-xs focus:outline-none focus:ring-2 focus:ring-[#01257D]"
            value={clientEmail}
            onChange={e => setClientEmail(e.target.value)}
          />
          <button className="px-6 py-2 bg-[#01257D] text-white rounded-md font-semibold hover:bg-[#2346a0] transition-colors w-full sm:w-auto cursor-pointer">
            Send Payment Invitation
          </button>
        </div>
      </div>
    </div>
  );
}
