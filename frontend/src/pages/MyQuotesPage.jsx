import React from 'react';
import MainLayout from '../components/Layout/MainLayout';
import QuoteManagement from '../components/Quotes/QuoteManagement';

export default function MyQuotesPage() {
  return (
    <MainLayout mainBackgroundClass="bg-transparent">
      <QuoteManagement />
    </MainLayout>
  );
}
