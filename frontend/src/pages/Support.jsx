import React from 'react'
import MainLayout from '../components/Layout/MainLayout'
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LoginBg from '../assets/Circle Background/login-removed-bg.jpg';

export default function Support() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  return (
    <MainLayout mainBackgroundClass="bg-transparent">
      <div className="relative -m-6 min-h-screen">
        {/* Full-page background layer */}
        <div
          className="absolute inset-0 -z-10 bg-top bg-no-repeat bg-contain md:bg-cover"
          style={{ backgroundImage: `url(${LoginBg})` }}
        />
        <div className="min-h-screen px-8 py-8 relative z-10">
      {/* Title */}
      <h1 className="text-3xl font-bold mb-8 text-[#2E78A6]">{t('support.title')}</h1>

      {/* Search Bar */}
      {/* <div className="flex items-center mb-10 max-w-5xl">
        <div className="flex items-center w-full bg-blue-100 rounded-xl px-4 py-2">
          <svg className="w-6 h-6 text-gray-500 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z"></path></svg>
          <input
            type="text"
            placeholder="Search for help"
            className="bg-transparent outline-none w-full text-gray-700 placeholder-gray-400"
          />
        </div>
      </div> */}

      {/* Contact Us Section */}
      <div className="max-w-2xl">
        <h2 className="text-xl font-bold mb-2">{t('support.contact_us')}</h2>
        <p className="mb-6 text-gray-700">{t('support.contact_help')}</p>
        <div className="flex gap-4 flex-wrap">
          <button className="bg-[#2E78A6] hover:bg-[#256a94] text-white font-semibold px-6 py-2 rounded-full transition-colors focus:outline-none cursor-pointer" onClick={() => navigate('/contact-us')}>
            {t('support.submit_request')}
          </button>
          {/* <button className="bg-[#01257D] hover:bg-[#2346a0] text-white font-semibold px-6 py-2 rounded-full transition-colors focus:outline-none">
            Chat with us
          </button> */}
        </div>
      </div>
        </div>
      </div>
    </MainLayout>
  )
}
