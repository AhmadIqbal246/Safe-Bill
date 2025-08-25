import React from "react";
import { Link } from "react-router-dom";
import { User, LayoutGrid, Trophy, ArrowRight } from "lucide-react";
import { useTranslation } from 'react-i18next';

const cards = [
  {
    icon: <User className="w-7 h-7 text-[#01257D]" />,
    titleKey: "homepage.my_account_title",
    descKey: "homepage.my_account_desc",
    linkKey: "actions.access_account",
    href: "/profile",
  },
  {
    icon: <LayoutGrid className="w-7 h-7 text-[#01257D]" />,
    titleKey: "homepage.browse_categories_title",
    descKey: "homepage.browse_categories_desc",
    linkKey: "actions.view_categories",
    href: "#",
  },
  {
    icon: <Trophy className="w-7 h-7 text-[#01257D]" />,
    titleKey: "homepage.success_stories_title",
    descKey: "homepage.success_stories_desc",
    linkKey: "actions.read_stories",
    href: "",
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
            className="bg-white border border-gray-100 rounded-xl p-8 flex flex-col items-center text-center shadow-sm hover:shadow-lg transition-shadow"
          >
            <div className="w-14 h-14 rounded-full bg-[#00FFFF] flex items-center justify-center mb-5">
              {card.icon}
            </div>
            <h3 className="text-lg font-bold text-[#01257D] mb-2">{t(card.titleKey)}</h3>
            <p className="text-[#111827] text-opacity-70 text-sm mb-6">{t(card.descKey)}</p>
            <Link
              to={card.href}
              className="flex items-center gap-1 text-[#01257D] font-medium hover:underline transition-colors"
            >
              {t(card.linkKey)} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
