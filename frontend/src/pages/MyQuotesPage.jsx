import React from 'react';
import MainLayout from '../components/Layout/MainLayout';
import ProjectCreation from '../components/Quotes/ProjectCreation';

export default function MyQuotesPage() {
  return (
    <MainLayout
      hideSafeBillHeader
      shiftNavbarLeft 
    >
      <ProjectCreation />
    </MainLayout>
  );
}
