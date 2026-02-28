import React from "react";
import { ShieldCheck, Radar, UserCheck } from "lucide-react";
import { useTranslation } from 'react-i18next';

const features = [
  {
    icon: <ShieldCheck className="w-8 h-8 text-[#01257D]" />, // navy icon on electric blue
    titleKey: "homepage.secure_payment_title",
    descKey: "homepage.secure_payment_desc",
  },
  {
    icon: <Radar className="w-8 h-8 text-[#01257D]" />,
    titleKey: "homepage.real_time_tracking_title",
    descKey: "homepage.real_time_tracking_desc",
  },
  {
    icon: <UserCheck className="w-8 h-8 text-[#01257D]" />,
    titleKey: "homepage.mediation_included_title",
    descKey: "homepage.mediation_included_desc",
  },
];

export default function FeatureComp() {
  const { t } = useTranslation();
  
  return (
    <section className="w-full bg-[#01257D] py-14 px-4">
      <h2 className="text-2xl md:text-3xl font-semibold text-white text-center mb-12">{t('homepage.features_title')}</h2>
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-center items-stretch gap-10 md:gap-6">
        {features.map((f, i) => (
          <div key={f.titleKey} className="flex-1 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-[#00FFFF] flex items-center justify-center mb-6">
              {f.icon}
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">{t(f.titleKey)}</h3>
            <p className="text-[#00FFFF] text-sm leading-relaxed">{t(f.descKey)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
