import React from 'react';
import { useTranslation } from 'react-i18next';
import HomeBg from '../../assets/Circle Background/home-bg1.png';
import ProfessionalsImage from '../../assets/Circle Background/How_To_Keep_Your_Best_Employees-removebg-preview.jpg';

export default function HeroSection() {
  const { t } = useTranslation();
  
  return (
    <div className="relative w-full h-[450px] overflow-hidden bg-[#F8F8F8]">
      {/* Base Light Grey Background */}
      <div className="absolute inset-0 bg-[#F8F8F8]" aria-hidden="true" />
      
      {/* Background Image Layer - Translucent purple circular shapes */}
      <div
        className="absolute inset-0 bg-no-repeat"
        style={{ 
          backgroundImage: `url(${HomeBg})`,
          backgroundPosition: 'center center',
          backgroundSize: 'cover',
          backgroundAttachment: 'local'
        }}
        aria-hidden="true"
      />
      
      {/* Content Container */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 h-full">
        <div className="flex flex-col lg:flex-row items-center justify-between h-full py-6 md:py-8 gap-6 lg:gap-8 xl:gap-12">
          
          {/* Left Side - Text Content */}
          <div className="flex-1 w-full lg:w-auto flex flex-col justify-center items-start z-20 -ml-2 md:-ml-4 lg:mt-38">
            <h1 className="font-bold leading-[1.1] tracking-[-0.02em]">
              <span className="block whitespace-nowrap text-[32px] md:text-[45px] mb-2 md:mb-3 text-[#3535AA]">
                {t('find_professional.hero_line1')}
              </span>
              <span className="block whitespace-nowrap text-[32px] md:text-[45px] mb-2 md:mb-3">
                <span className="text-[#3535AA]">{t('find_professional.hero_line2_part1')} </span>
                <span className="text-[#8989C9]">{t('find_professional.hero_line2_part2')}</span>
              </span>
              <span className="block whitespace-nowrap text-[32px] md:text-[45px] text-[#3535AA]">
                {t('find_professional.hero_line3')}
              </span>
            </h1>
          </div>

          {/* Right Side - Professionals Image */}
          <div className="flex-1 w-full lg:w-auto flex items-center justify-center lg:justify-end z-20">
            <div className="relative w-full max-w-xs sm:max-w-xl md:max-w-2xl lg:max-w-3xl xl:max-w-4xl 2xl:max-w-5xl">
              <img
                src={ProfessionalsImage}
                alt="Diverse group of professionals offering services near you"
                className="w-full h-auto object-contain drop-shadow-lg scale-100 md:scale-110 lg:scale-125"
                loading="eager"
                width="1400"
                height="1050"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

