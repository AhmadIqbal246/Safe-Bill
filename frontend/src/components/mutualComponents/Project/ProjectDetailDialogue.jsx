import React from 'react';
import { Dialog } from '@headlessui/react';
import { Download } from 'lucide-react';

export default function ProjectDetailDialogue({ open, onClose, project }) {
  if (!project) return null;
  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
          <Dialog.Title className="text-xl font-bold text-[#01257D] mb-2">Project Details</Dialog.Title>
          <div className="mb-4 text-gray-700">
            <div className="mb-1"><span className="font-semibold">Project Name:</span> {project.name}</div>
            <div className="mb-1"><span className="font-semibold">Client Email:</span> {project.client_email}</div>
            <div className="mb-1"><span className="font-semibold">Quote Reference:</span> {project.quote?.reference_number}</div>
            <div className="mb-1"><span className="font-semibold">Created At:</span> {project.created_at}</div>
            <div className="mb-1"><span className="font-semibold">Total Amount:</span> <span className="text-[#01257D] font-semibold">${parseFloat(project.total_amount).toLocaleString()}</span></div>
            {project.quote?.file && (
              <div className="mb-1 flex items-center gap-2">
                <span className="font-semibold">Quote File:</span>
                <a
                  href={project.quote.file}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-700 underline flex items-center gap-1 cursor-pointer"
                  download
                >
                  <Download className="w-4 h-4 inline" /> Download/View
                </a>
              </div>
            )}
          </div>
          <div className="mb-4">
            <div className="font-semibold text-[#01257D] mb-2">Installments</div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm border rounded-lg">
                <thead className="bg-[#E6F0FA]">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold">Step</th>
                    <th className="px-3 py-2 text-left font-semibold">Amount</th>
                    <th className="px-3 py-2 text-left font-semibold">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {(project.installments || []).map((inst, idx) => (
                    <tr key={idx} className="border-t border-gray-100">
                      <td className="px-3 py-2">{inst.step}</td>
                      <td className="px-3 py-2 text-[#01257D] font-semibold">${parseFloat(inst.amount).toLocaleString()}</td>
                      <td className="px-3 py-2 text-gray-600">{inst.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="flex justify-end mt-6">
            <button
              className="px-5 py-2 bg-[#01257D] text-white rounded-lg font-semibold hover:bg-[#2346a0] transition-colors cursor-pointer"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
