import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProjects } from '../../store/slices/ProjectSlice';
import ProjectDetailDialogue from '../mutualComponents/Project/ProjectDetailDialogue';

export default function CurrentProjectsComp() {
  const dispatch = useDispatch();
  const { projects, loading, error } = useSelector(state => state.project);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogProject, setDialogProject] = useState(null);

  useEffect(() => {
    dispatch(fetchProjects());
  }, [dispatch]);

  // Sort projects by created_at descending
  const sortedProjects = (projects || []).slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const currentProject = sortedProjects[0];
  const otherProjects = sortedProjects.slice(1);

  const handleViewDetails = (project) => {
    setDialogProject(project);
    setDialogOpen(true);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h2 className="text-2xl md:text-3xl font-bold mb-6">Current Projects</h2>
      {/* Highlighted Current Project */}
      {loading ? (
        <div className="py-12 text-center text-gray-400">Loading...</div>
      ) : error ? (
        <div className="py-12 text-center text-red-500">{typeof error === 'string' ? error : 'Failed to load projects.'}</div>
      ) : currentProject ? (
        <div className="bg-[#E6F4FF] rounded-lg p-6 mb-8 flex flex-col gap-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div>
              <div className="text-lg font-semibold text-[#01257D]">{currentProject.name}</div>
              <div className="text-gray-500 text-sm">Client: {currentProject.client_email}</div>
            </div>
            <button
              className="mt-2 md:mt-0 px-5 py-2 bg-[#01257D] text-white rounded-lg font-semibold hover:bg-[#2346a0] transition-colors text-sm cursor-pointer"
              onClick={() => handleViewDetails(currentProject)}
            >
              View Details
            </button>
          </div>
          {/* Progress Bar (static for now) */}
          <div className="flex items-center gap-2 mt-2">
            <span className="text-gray-500 text-sm">Progress</span>
            <div className="flex-1 mx-4">
              <div className="w-full h-2 bg-[#E6F0FA] rounded-full">
                <div
                  className="h-2 bg-[#01257D] rounded-full transition-all"
                  style={{ width: `60%` }}
                />
              </div>
            </div>
            <span className="text-gray-700 text-sm font-semibold">60%</span>
          </div>
          {/* Breakdown: show steps and amounts from installments */}
          <div className="flex flex-col md:flex-row justify-between mt-4 gap-4">
            {(currentProject.installments || []).map((item, idx) => (
              <div key={idx} className="flex-1 text-center">
                <div className="text-gray-500 text-sm mb-1">{item.step}</div>
                <div className="text-lg font-semibold text-gray-800">${parseFloat(item.amount).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="py-12 text-center text-gray-400">No projects found.</div>
      )}
      {/* Other Projects List */}
      <div className="flex flex-col gap-3">
        {otherProjects.map((proj, idx) => (
          <div
            key={proj.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between bg-white border border-[#E6F0FA] rounded-lg px-5 py-4 hover:shadow-sm transition-shadow"
          >
            <div>
              <div className="text-base font-semibold text-gray-900">{proj.name}</div>
              <div className="text-gray-500 text-sm">Client: {proj.client_email}</div>
            </div>
            <div className="text-lg font-semibold text-[#01257D] mt-2 sm:mt-0">${parseFloat(proj.total_amount).toLocaleString()}</div>
          </div>
        ))}
      </div>
      {/* Project Detail Dialog */}
      <ProjectDetailDialogue
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        project={dialogProject}
      />
    </div>
  );
}
