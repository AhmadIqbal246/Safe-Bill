import React from "react";
import { Link } from "react-router-dom";
import { User, LayoutGrid, Trophy, ArrowRight } from "lucide-react";

const cards = [
  {
    icon: <User className="w-7 h-7 text-[#01257D]" />,
    title: "My Account",
    desc: "Manage your profile, projects, and payment methods in one place.",
    link: "Access Account",
    href: "/profile",
  },
  {
    icon: <LayoutGrid className="w-7 h-7 text-[#01257D]" />,
    title: "Browse Categories",
    desc: "Explore all available services and find the perfect professional for your needs.",
    link: "View Categories",
    href: "#",
  },
  {
    icon: <Trophy className="w-7 h-7 text-[#01257D]" />,
    title: "Success Stories",
    desc: "Read about successful projects and satisfied clients from our community.",
    link: "Read Stories",
    href: "",
  },
];

export default function ServicesCards() {
  return (
    <section className="w-full py-12 px-4 bg-white">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card) => (
          <div
            key={card.title}
            className="bg-white border border-gray-100 rounded-xl p-8 flex flex-col items-center text-center shadow-sm hover:shadow-lg transition-shadow"
          >
            <div className="w-14 h-14 rounded-full bg-[#00FFFF] flex items-center justify-center mb-5">
              {card.icon}
            </div>
            <h3 className="text-lg font-bold text-[#01257D] mb-2">{card.title}</h3>
            <p className="text-[#111827] text-opacity-70 text-sm mb-6">{card.desc}</p>
            <Link
              to={card.href}
              className="flex items-center gap-1 text-[#01257D] font-medium hover:underline transition-colors"
            >
              {card.link} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
