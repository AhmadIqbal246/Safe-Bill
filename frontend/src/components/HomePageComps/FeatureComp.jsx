import React from "react";
import { ShieldCheck, Radar, UserCheck } from "lucide-react";

const features = [
  {
    icon: <ShieldCheck className="w-8 h-8 text-[#01257D]" />, // navy icon on electric blue
    title: "Secure payment",
    desc: "Pay safely on our platform with full encryption and protection for every transaction.",
  },
  {
    icon: <Radar className="w-8 h-8 text-[#01257D]" />,
    title: "Real-time tracking",
    desc: "Monitor project progress and payments live, with instant updates every step of the way.",
  },
  {
    icon: <UserCheck className="w-8 h-8 text-[#01257D]" />,
    title: "Mediation included",
    desc: "Get peace of mind—our team steps in to resolve any disputes quickly and fairly.",
  },
];

export default function FeatureComp() {
  return (
    <section className="w-full bg-[#01257D] py-14 px-4">
      <h2 className="text-2xl md:text-3xl font-semibold text-white text-center mb-12">Features</h2>
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-center items-stretch gap-10 md:gap-6">
        {features.map((f, i) => (
          <div key={f.title} className="flex-1 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-[#00FFFF] flex items-center justify-center mb-6">
              {f.icon}
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">{f.title}</h3>
            <p className="text-[#00FFFF] text-sm leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
