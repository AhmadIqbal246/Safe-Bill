import React from "react";
import { useTranslation } from 'react-i18next';
import medalIcon from '../../assets/Circle Background/medal-icon.png';
import featureCircle from '../../assets/Circle Background/feature-circle.png';
import circleTick from '../../assets/Circle Background/circle-tick.png';

const benefits = [
  {
    textKey: "homepage.why_choose_benefit1",
  },
  {
    textKey: "homepage.why_choose_benefit2",
  },
  {
    textKey: "homepage.why_choose_benefit3",
  },
  {
    textKey: "homepage.why_choose_benefit4",
  },
  {
    textKey: "homepage.why_choose_benefit5",
  },
];

export default function WhyChooseUs({ badgeIcon, badgeBackground }) {
  const { t } = useTranslation();
  
  return (
    <section className="w-full py-14 px-4" style={{ backgroundColor: '#E8E8F5' }}>
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-[#2E78A6] text-center mb-12">
          {t('homepage.why_choose_title')}
        </h2>
        
        <div className="flex flex-col lg:flex-row items-center lg:items-start justify-between gap-8 lg:gap-12">
          {/* Left side - Benefits list */}
          <div className="flex-1 w-full lg:w-auto">
            <div className="flex flex-col gap-6">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start gap-4">
                  <img 
                    src={circleTick} 
                    alt="" 
                    className="w-8 h-8 flex-shrink-0 object-contain self-start"
                  />
                  <p className="text-[#707070] text-base leading-relaxed flex-1 pt-0.5">
                    {t(benefit.textKey)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Right side - Badge icon */}
          <div className="flex-1 flex items-center justify-center lg:justify-end w-full lg:w-auto">
            <div className="relative flex items-center justify-center">
              {/* Feature circle background */}
              <img 
                src={featureCircle} 
                alt="" 
                className="absolute w-64 h-64 md:w-80 md:h-80 object-contain -mt-8"
              />
              {/* Background pattern */}
              {badgeBackground && (
                <img 
                  src={badgeBackground} 
                  alt="" 
                  className="absolute inset-0 w-full h-full object-contain opacity-30"
                />
              )}
              {/* Badge icon */}
              <img 
                src={badgeIcon || medalIcon} 
                alt="Safe Bill Badge" 
                className="relative z-10 w-64 h-64 md:w-80 md:h-80 object-contain -mt-8"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

