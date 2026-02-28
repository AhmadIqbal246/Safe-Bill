import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SafeBillHeader from '../components/mutualComponents/Navbar/Navbar';

const NotFound = () => {
  const { t } = useTranslation();
  return (
    <>
      <SafeBillHeader />
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <h1 className="text-6xl font-bold text-[#01257D]">404</h1>
      <p className="mt-4 text-lg text-gray-700">{t('not_found.page_not_found')}</p>
      <Link
        to="/"
        className="mt-6 inline-block bg-[#01257D] text-white px-6 py-3 rounded-md hover:opacity-90"
      >
        {t('not_found.go_back_home')}
      </Link>
    </div>
    </>
  );
};

export default NotFound;


