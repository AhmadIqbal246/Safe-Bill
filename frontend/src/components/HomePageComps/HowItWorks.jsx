import React from "react";
import { useTranslation } from 'react-i18next';

const steps = [
  {
    number: 1,
    textKey: "homepage.how_it_works_step1",
    bgColor: "#3535AA", // Dark blue
  },
  {
    number: 2,
    textKey: "homepage.how_it_works_step2",
    bgColor: "#8989C9", // Lighter purple
  },
  {
    number: 3,
    textKey: "homepage.how_it_works_step3",
    bgColor: "#3535AA", // Dark blue
  },
  {
    number: 4,
    textKey: "homepage.how_it_works_step4",
    bgColor: "#8989C9", // Lighter purple
  },
];

export default function HowItWorks() {
  const { t } = useTranslation();
  
  return (
    <section className="w-full bg-white py-14 px-4">
      <h2 className="text-3xl md:text-4xl font-semibold text-[#2E78A6] text-center mb-12">
        {t('homepage.how_it_works_title')}
      </h2>
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center md:items-start justify-center gap-4 md:gap-2">
          {steps.map((step, index) => (
            <React.Fragment key={step.number}>
              <div className="flex flex-col items-center text-center flex-1 max-w-[280px] w-full md:w-auto">
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center mb-4 flex-shrink-0"
                  style={{ backgroundColor: step.bgColor }}
                >
                  <span className="text-white text-2xl font-semibold">{step.number}</span>
                </div>
                <p className="text-[#707070] text-sm leading-relaxed px-2">
                  {t(step.textKey)}
                </p>
              </div>
              {index < steps.length - 1 && (
                <div className="hidden md:flex items-center justify-center h-16 flex-shrink-0 px-2">
                  <span className="text-[#707070] text-6xl font-semibold leading-none">
                    &gt;
                  </span>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}

