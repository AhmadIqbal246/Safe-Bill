import React from "react";
import { Link } from "react-router-dom";
import { CheckCircle, MapPin, Star } from "lucide-react";
import { useTranslation } from 'react-i18next';

const professionals = [
  {
    name: "Sarah Johnson",
    profession: "Painter",
    rating: 5.0,
    reviews: 24,
    rate: 50,
    area: "Area Name, Area Name",
    avatar: "https://api.dicebear.com/7.x/micah/svg?seed=Sarah",
  },
  {
    name: "Michael Chen",
    profession: "Constructor",
    rating: 4.9,
    reviews: 18,
    rate: 40,
    area: "Area Name, Area Name",
    avatar: "https://api.dicebear.com/7.x/micah/svg?seed=Michael",
  },
  {
    name: "Emily Rodriguez",
    profession: "Electrician",
    rating: 4.8,
    reviews: 31,
    rate: 60,
    area: "Area Name, Area Name",
    avatar: "https://api.dicebear.com/7.x/micah/svg?seed=Emily",
  },
  {
    name: "David Kim",
    profession: "Plumber",
    rating: 5.0,
    reviews: 12,
    rate: 120,
    area: "Area Name, Area Name",
    avatar: "https://api.dicebear.com/7.x/micah/svg?seed=David",
  },
];

export default function TrustedProfessionals() {
  const { t } = useTranslation();
  
  return (
    <section className="w-full bg-white py-14 px-4 border-t border-[#01257D]">
      <h2 className="text-2xl md:text-3xl font-semibold text-[#111827] text-center mb-2">{t('homepage.trusted_professionals_title')}</h2>
      <p className="text-base md:text-lg text-[#96C2DB] text-center mb-10">{t('homepage.trusted_professionals_subtitle')}</p>
      <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-10">
        {professionals.map((pro) => (
          <div key={pro.name} className="bg-white rounded-xl shadow-md p-6 flex flex-col items-center text-center border border-gray-100">
            <img src={pro.avatar} alt={pro.name} className="w-16 h-16 rounded-full mb-4" />
            <div className="font-semibold text-[#111827] text-lg mb-1">{pro.name}</div>
            <div className="text-[#96C2DB] text-sm mb-2">{pro.profession}</div>
            <div className="flex items-center justify-center gap-1 mb-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`w-4 h-4 ${i < Math.round(pro.rating) ? 'text-[#178582]' : 'text-gray-200'}`} fill={i < Math.round(pro.rating) ? '#178582' : 'none'} />
              ))}
              <span className="text-[#111827] text-sm font-medium ml-1">{pro.rating.toFixed(1)}</span>
              <span className="text-[#96C2DB] text-xs ml-1">({pro.reviews} {t('homepage.reviews')})</span>
            </div>
            <div className="text-[#111827] text-sm mb-2">{t('homepage.starting_at')} ${pro.rate}/{t('homepage.hour')}</div>
            <div className="flex items-center justify-center mb-3">
              <span className="flex items-center gap-1 bg-[#178582] text-white text-xs font-semibold px-3 py-1 rounded-full">
                <CheckCircle className="w-4 h-4" /> {t('homepage.kyc_verified')}
              </span>
            </div>
            <div className="flex items-center gap-1 text-[#96C2DB] text-xs">
              <MapPin className="w-4 h-4" />
              {pro.area}
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-center">
        <Link to="/find-professionals" className="px-8 py-2 bg-[#01257D] text-white font-semibold rounded-md shadow-sm hover:bg-[#2346a0] transition-colors text-base inline-block">{t('actions.view_all_professionals')}</Link>
      </div>
    </section>
  );
}
