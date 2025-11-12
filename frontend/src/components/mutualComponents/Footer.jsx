import React from 'react';
import { Mail, Phone, Facebook, Instagram } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Logo from '../../assets/Safe_Bill_Dark.png';

const Email = import.meta.env.VITE_SAFE_BILL_EMAIL || 'safe.bill.office@gmail.com';
const PhoneNumber = import.meta.env.VITE_SAFE_BILL_PHONE_NUMBER || '+0 00 000 0000';
export default function Footer() {
  const { t } = useTranslation();

  
  
  return (
    <footer className="w-full bg-[#01257D] text-[#96C2DB] pt-12 pb-6 px-4 border-t border-[#01257D]">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:justify-between gap-10 md:gap-4">
        {/* Columns */}
        <div className="flex-1 min-w-[180px] mb-8 md:mb-0">
          <div className="mb-5 mt-5">
            <img src={Logo} alt="Safe Bill" className="h-6 w-auto object-contain" />
          </div>
          <div className="text-[#96C2DB] text-sm mb-4">{t('footer.tagline')}</div>
        </div>
        <div className="flex-1 min-w-[140px] mb-8 md:mb-0 md:mt-4">
          <div className="text-[#B0B0DB] font-semibold mb-2">{t('footer.for_clients')}</div>
          <ul className="space-y-1">
            <li><Link to="/find-professionals" className="hover:underline text-white">{t('footer.find_professionals')}</Link></li>
          </ul>
        </div>
        <div className="flex-1 min-w-[140px] mb-8 md:mb-0 md:mt-4">
          <div className="text-[#B0B0DB] font-semibold mb-2">{t('footer.for_professionals')}</div>
          <ul className="space-y-1">
            <li><Link to="/seller-register" className="hover:underline text-white">{t('footer.join_as_professional')}</Link></li>
          </ul>
        </div>
        <div className="flex-1 min-w-[140px] mb-8 md:mb-0 md:mt-4">
          <div className="text-[#B0B0DB] font-semibold mb-2">{t('footer.support')}</div>
          <ul className="space-y-1">
            <li><Link to="/contact-us" className="hover:underline text-white">{t('footer.contact_us')}</Link></li>
          </ul>
        </div>
        <div className="flex-1 min-w-[140px] md:mt-4">
          <div className="text-[#B0B0DB] font-semibold mb-2">{t('footer.legal_links')}</div>
          <ul className="space-y-1">
            <li><Link to="/terms-of-service" className="hover:underline text-white">{t('footer.terms')}</Link></li>
            <li><Link to="/privacy-policy" className="hover:underline text-white">{t('footer.privacy')}</Link></li>
            <li>
              <button 
                onClick={() => window.axeptio?.showConsentModal?.()}
                className="hover:underline text-white cursor-pointer"
              >
                Cookie Preferences
              </button>
            </li>
          </ul>
        </div>
      </div>
      {/* Contact and Socials */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:justify-between items-center mt-8 gap-4 md:gap-0 border-t border-[#E6F0FA] pt-6">
        <div className="flex items-center gap-6 mb-2 md:mb-0">
          <a href={`mailto:${Email}`} className="flex items-center gap-2 text-white">
            <Mail className="w-5 h-5" />
            {Email}
          </a>
          <a href={`tel:${PhoneNumber.replace(/\\s+/g, '')}`} className="flex items-center gap-2 text-white">
            <Phone className="w-5 h-5" />
            {PhoneNumber}
          </a>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-white mr-2">{t('footer.socials')}</span>
          <Link to="#" className="bg-[#E6F0FA] rounded-md p-1 flex items-center justify-center"><Facebook className="w-5 h-5 text-[#01257D]" /></Link>
          <Link to="#" className="bg-[#E6F0FA] rounded-md p-1 flex items-center justify-center"><svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M4 4l16 16M20 4L4 20" stroke="#01257D" strokeWidth="2" strokeLinecap="round"/></svg></Link>
          <Link to="#" className="bg-[#E6F0FA] rounded-md p-1 flex items-center justify-center"><Instagram className="w-5 h-5 text-[#01257D]" /></Link>
        </div>
      </div>
      <div className="text-center text-[#96C2DB] text-sm mt-6">{t('footer.copyright')}</div>
    </footer>
  );
}
