import React from "react";
import { Search } from "lucide-react";

const specialties = [
  { value: "", label: "Select specialty..." },
  { value: "plumbing", label: "Plumbing" },
  { value: "electrical", label: "Electrical" },
  { value: "painting", label: "Painting" },
  { value: "carpentry", label: "Carpentry" },
  { value: "cleaning", label: "Cleaning" },
];

export default function IntroWithSearch() {
  return (
    <section className="w-full flex flex-col items-center justify-center py-16 px-4 bg-white">
      <h1 className="text-3xl md:text-5xl font-bold text-[#111827] text-center mb-6 leading-tight">
        Trusted platform for<br className="hidden md:block" /> your projects
      </h1>
      <p className="text-base md:text-lg text-[#96C2DB] text-center mb-10">
        Secure payments, transparent tracking, mediation included
      </p>
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-lg p-4 md:p-6 flex flex-col md:flex-row items-stretch gap-4 md:gap-2">
        <div className="flex-1 flex flex-col">
          <label className="text-xs font-medium text-[#111827] mb-1">What service do you need?</label>
          <select className="w-full border border-gray-200 rounded-md px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-[#01257D] bg-white">
            {specialties.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
        <div className="flex-1 flex flex-col">
          <label className="text-xs font-medium text-[#111827] mb-1">Location</label>
          <input
            type="text"
            placeholder="Enter city or zip code"
            className="w-full border border-gray-200 rounded-md px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-[#01257D] bg-white"
          />
        </div>
        <button className="mt-2 md:mt-6 flex items-center justify-center gap-2 px-4 py-2 md:px-6 md:py-2 bg-[#01257D] text-white font-semibold rounded-md shadow-sm hover:bg-[#2346a0] transition-colors text-base whitespace-nowrap">
          <Search className="w-5 h-5" />
          Find a professional near you
        </button>
      </div>
    </section>
  );
}
