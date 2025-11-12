import React from "react";
import { Link } from "react-router-dom";
import { User, LayoutGrid, Shield, ArrowRight } from "lucide-react";
import { useTranslation } from 'react-i18next';
import featureCircle from '../../assets/Circle Background/feature-circle.png';

const cards = [
  {
    icon: <User className="w-7 h-7 text-white" />,
    titleKey: "homepage.my_account_title",
    descKey: "homepage.my_account_desc",
    linkKey: "actions.access_account",
    href: "/profile",
  },
  {
    icon: <LayoutGrid className="w-7 h-7 text-white" />,
    titleKey: "homepage.browse_categories_title",
    descKey: "homepage.browse_categories_desc",
    linkKey: "actions.view_categories",
    href: "/find-professionals",
  },
  {
    icon: <Shield className="w-7 h-7 text-white" />,
    titleKey: "homepage.dispute_resolution_title",
    descKey: "homepage.dispute_resolution_desc",
    linkKey: "actions.learn_more",
    href: "/contact-us",
  },
];

export default function ServicesCards() {
  const { t } = useTranslation();
  
  return (
    <section className="w-full py-12 px-4 bg-white">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card) => (
          <div
            key={card.titleKey}
            className="bg-white border border-[#2E78A6] rounded-xl p-8 flex flex-col items-center text-center shadow-sm hover:shadow-lg transition-shadow"
          >
            <div className="relative w-14 h-14 mb-5 flex items-center justify-center">
              <img 
                src={featureCircle} 
                alt="" 
                className="absolute -top-7 -left-6 w-16 h-16 object-contain"
              />
              <div className="relative z-10 w-14 h-14 rounded-full bg-[#2E78A6] flex items-center justify-center">
                {card.icon}
              </div>
            </div>
            <h3 className="text-lg font-bold text-[#01257D] mb-2">{t(card.titleKey)}</h3>
            <p className="text-[#111827] text-opacity-70 text-sm mb-6 flex-grow">{t(card.descKey)}</p>
            <Link
              to={card.href}
              className="flex items-center gap-1 text-[#2E78A6] font-medium border border-[#2E78A6] px-4 py-2 rounded-md hover:bg-[#2E78A6] hover:text-white transition-colors mt-auto"
            >
              {t(card.linkKey)} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
