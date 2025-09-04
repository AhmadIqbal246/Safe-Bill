import React from 'react';
import { useTranslation } from 'react-i18next';

const ProjectStatusBadge = ({ status, size = 'default' }) => {
  const { t } = useTranslation();

  // Status configuration with colors and translation keys
  const statusConfig = {
    pending: {
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      label: 'project_status.pending'
    },
    payment_in_progress: {
      color: 'bg-orange-100 text-orange-800 border-orange-200',
      label: 'project_status.payment_in_progress'
    },
    approved: {
      color: 'bg-green-100 text-green-800 border-green-200',
      label: 'project_status.approved'
    },
    not_approved: {
      color: 'bg-red-100 text-red-800 border-red-200',
      label: 'project_status.not_approved'
    },
    in_progress: {
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      label: 'project_status.in_progress'
    },
    completed: {
      color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      label: 'project_status.completed'
    }
  };

  // Size configurations
  const sizeConfig = {
    small: 'px-2 py-1 text-xs',
    default: 'px-3 py-1.5 text-sm',
    large: 'px-4 py-2 text-base'
  };

  const config = statusConfig[status] || statusConfig.pending;
  const sizeClass = sizeConfig[size] || sizeConfig.default;

  return (
    <span 
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.color} ${sizeClass}`}
    >
      {t(config.label)}
    </span>
  );
};

export default ProjectStatusBadge;
