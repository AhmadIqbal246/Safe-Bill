import React, { useState } from 'react';

export default function MilestoneApproval({ projects = [] }) {
  const [feedback, setFeedback] = useState('');

  // For now, show the first project that has installments as a milestone
  const milestoneProject = projects.find(project => 
    project.installments && project.installments.length > 0
  );

  const handleApprove = () => {
    // TODO: Implement approval logic
    console.log('Approving milestone for project:', milestoneProject?.id);
  };

  const handleRequestChanges = () => {
    // TODO: Implement request changes logic
    console.log('Requesting changes for project:', milestoneProject?.id, 'Feedback:', feedback);
  };

  if (!milestoneProject) {
    return (
      <div style={{ flex: 1, background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px #e5e7eb', padding: 24, minWidth: 340 }}>
        <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 16 }}>Milestone Approval</div>
        <div style={{ color: '#6b7280', fontSize: 14, textAlign: 'center', padding: '20px 0' }}>
          No milestones awaiting approval
        </div>
      </div>
    );
  }

  // Get the latest installment as the current milestone
  const currentMilestone = milestoneProject.installments?.[milestoneProject.installments.length - 1];

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div style={{ flex: 1, borderRadius: 12, boxShadow: '0 1px 4px #e5e7eb', padding: 24, minWidth: 340 }}>
      <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 16 }}>Milestone Approval</div>
      
      <div style={{ background: '#f5f7fa', borderRadius: 8, padding: 16, marginBottom: 16 }}>
        <div style={{ fontWeight: 500 }}>
          {currentMilestone?.step || 'Project Milestone'} 
          <span style={{ 
            background: '#0ec6b0', 
            color: '#fff', 
            borderRadius: 8, 
            padding: '2px 10px', 
            fontSize: 12, 
            marginLeft: 8 
          }}>
            Awaiting Review
          </span>
        </div>
        <div style={{ color: '#6b7280', fontSize: 13, marginBottom: 8 }}>
          Submitted on {formatDate(milestoneProject.created_at)}
        </div>
        {currentMilestone?.description && (
          <div style={{ color: '#374151', fontSize: 14, marginBottom: 12 }}>
            {currentMilestone.description}
          </div>
        )}
        <textarea 
          placeholder="Add feedback or approval notes..." 
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          style={{ 
            width: '100%', 
            borderRadius: 6, 
            border: '1px solid #e5e7eb', 
            padding: 8, 
            minHeight: 48, 
            marginBottom: 12,
            resize: 'vertical'
          }} 
        />
        <div>
          <button 
            style={{ 
              background: '#153A7D', 
              color: '#fff', 
              border: 'none', 
              borderRadius: 6, 
              padding: '8px 18px', 
              fontWeight: 500, 
              marginRight: 8,
              cursor: 'pointer'
            }}
            onClick={handleApprove}
          >
            ✓ Approve
          </button>
          <button 
            style={{ 
              background: '#0ec6b0', 
              color: '#fff', 
              border: 'none', 
              borderRadius: 6, 
              padding: '8px 18px', 
              fontWeight: 500,
              cursor: 'pointer'
            }}
            onClick={handleRequestChanges}
          >
            ✗ Request Changes
          </button>
        </div>
      </div>
    </div>
  );
}