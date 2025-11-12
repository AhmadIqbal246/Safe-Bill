import React, { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { CheckCircle, MapPin, Star } from "lucide-react";
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAllSellersComplete } from '../../store/slices/FilterSlice';
import { businessActivityStructure, serviceAreaOptions } from '../../constants/registerationTypes';

function getServiceTypeLabel(typeId) {
  const found = businessActivityStructure.find(opt => opt.id === typeId);
  return found ? found.label : typeId || '';
}

function formatServiceArea(areaValue) {
  const found = serviceAreaOptions.find(opt => opt.value === areaValue);
  return found ? found.label : areaValue || '';
}

function buildAvatarUrl(profilePic, name) {
  const BASE_URL = import.meta.env.VITE_API_BASE_URL;
  if (profilePic) {
    const path = String(profilePic);
    if (path.startsWith('http')) return path;
    const clean = path.startsWith('/') ? path.slice(1) : path;
    return `${BASE_URL}${clean}`;
  }
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=E6F0FA&color=01257D&size=144`;
}

function StarRating({ value }) {
  const rounded = Math.round(Number(value || 0));
  return (
    <div className="flex items-center justify-center gap-1 mb-1">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${i < rounded ? 'text-[#178582]' : 'text-gray-200'}`}
          fill={i < rounded ? '#178582' : 'none'}
        />
      ))}
      <span className="text-[#111827] text-sm font-medium ml-1">{Number(value || 0).toFixed(1)}</span>
    </div>
  );
}

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export default function TrustedProfessionals() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { sellers, loading } = useSelector((state) => state.filter);

  useEffect(() => {
    if (!Array.isArray(sellers) || sellers.length === 0) {
      dispatch(fetchAllSellersComplete());
    }
  }, [dispatch]);

  const featured = useMemo(() => {
    const list = Array.isArray(sellers) ? sellers : [];
    if (list.length === 0) return [];

    const rated = list
      .filter(s => (s.average_rating || 0) > 0)
      .sort((a, b) => {
        const ar = Number(b.average_rating || 0) - Number(a.average_rating || 0);
        if (ar !== 0) return ar;
        return Number(b.rating_count || 0) - Number(a.rating_count || 0);
      });

    const topRated = rated.slice(0, 4);
    if (topRated.length >= 4) return topRated;

    const excludeIds = new Set(topRated.map(s => s.id));
    const others = shuffle(list.filter(s => !excludeIds.has(s.id)));
    const needed = 4 - topRated.length;
    return [...topRated, ...others.slice(0, needed)];
  }, [sellers]);

  return (
    <section className="w-full py-14 px-4 border-t border-[#01257D]" style={{ backgroundColor: '#E8E8F5' }}>
      <h2 className="text-3xl md:text-4xl font-semibold text-[#2E78A6] text-center mb-2">{t('homepage.trusted_professionals_title')}</h2>
      <p className="text-base md:text-lg text-black text-center mb-10">{t('homepage.trusted_professionals_subtitle')}</p>

      <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-10">
        {(featured.length > 0 ? featured : []).map((pro) => {
          const avatar = buildAvatarUrl(pro.profile_pic, pro.name);
          const serviceType = getServiceTypeLabel(pro.business_type);
          const firstArea = Array.isArray(pro.selected_service_areas) && pro.selected_service_areas.length > 0
            ? formatServiceArea(pro.selected_service_areas[0])
            : (pro.full_address || '');
          return (
            <Link key={pro.id} to={`/professional/${pro.id}`} className="bg-white rounded-xl shadow-md p-6 flex flex-col items-center text-center border border-gray-100 hover:shadow-lg transition-shadow cursor-pointer">
              <img src={avatar} alt={pro.name} className="w-16 h-16 rounded-full mb-4 object-cover" />
              <div className="font-semibold text-[#111827] text-lg mb-1">{pro.name}</div>
              <div className="text-[#96C2DB] text-sm mb-2">{serviceType}</div>
              {/* <StarRating value={pro.average_rating} /> */}
              <div className="flex items-center justify-center mb-3">
                <span className="flex items-center gap-1 bg-[#178582] text-white text-xs font-semibold px-3 py-1 rounded-full">
                  <CheckCircle className="w-4 h-4" /> {t('homepage.kyc_verified')}
                </span>
              </div>
              <div className="flex items-center gap-1 text-[#96C2DB] text-xs">
                <MapPin className="w-4 h-4" />
                {firstArea}
              </div>
            </Link>
          );
        })}

        {(!loading && featured.length === 0) && (
          <div className="col-span-1 sm:col-span-2 md:col-span-4 text-center text-gray-400">
            {t('homepage.no_professionals_available')}
          </div>
        )}
      </div>

      <div className="flex justify-center">
        <Link to="/find-professionals" className="px-8 py-2 bg-[#2E78A6] text-white font-semibold rounded-[15px] shadow-sm hover:bg-[#256699] transition-colors text-base inline-block">{t('actions.view_all_professionals')}</Link>
      </div>
    </section>
  );
}
