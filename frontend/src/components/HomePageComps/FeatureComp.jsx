import React from "react";
import { Lock, Radar, UserCheck } from "lucide-react";
import { useTranslation } from 'react-i18next';
import featureCircle from '../../assets/Circle Background/feature-circle.png';

const features = [
  {
    icon: <Lock className="w-8 h-8 text-white" />, // navy icon on electric blue
    titleKey: "homepage.secure_payment_title",
    descKey: "homepage.secure_payment_desc",
  },
  {
    icon: <Radar className="w-8 h-8 text-white" />,
    titleKey: "homepage.real_time_tracking_title",
    descKey: "homepage.real_time_tracking_desc",
  },
  {
    icon: <UserCheck className="w-8 h-8 text-white" />,
    titleKey: "homepage.mediation_included_title",
    descKey: "homepage.mediation_included_desc",
  },
];

export default function FeatureComp() {
  const { t } = useTranslation();
  
  return (
    <section className="w-full bg-white py-14 px-4">
      <h2 className="text-2xl md:text-3xl font-semibold text-[#2E78A6] text-center mb-12">{t('homepage.features_title')}</h2>
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-center items-stretch gap-10 md:gap-6">
        {features.map((f, i) => (
          <div key={f.titleKey} className="flex-1 flex flex-col items-center text-center">
            <div className="relative mb-6 flex items-center justify-center w-16 h-16">
              <img 
                src={featureCircle} 
                alt="" 
                className="absolute -top-6 -left-8 w-full h-full object-contain"
              />
              <div className="relative z-10 w-16 h-16 rounded-full bg-[#8989C9] flex items-center justify-center">
                {f.icon}
              </div>
            </div>
            <h3 className="text-lg font-semibold text-[#3535AA] mb-2">{t(f.titleKey)}</h3>
            <p className="text-[#707070] text-sm leading-relaxed">{t(f.descKey)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
