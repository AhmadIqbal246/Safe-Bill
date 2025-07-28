import React from 'react';
import { Mail, Phone, Facebook, Instagram } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="w-full bg-[#01257D] text-[#96C2DB] pt-12 pb-6 px-4 border-t border-[#01257D]">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:justify-between gap-10 md:gap-4">
        {/* Columns */}
        <div className="flex-1 min-w-[180px] mb-8 md:mb-0">
          <Link to="/" className="text-white font-semibold text-lg mb-2">Safe Bill</Link>
          <div className="text-[#96C2DB] text-sm mb-4">Connecting clients with trusted professionals worldwide through secure, verified transactions.</div>
        </div>
        <div className="flex-1 min-w-[140px] mb-8 md:mb-0">
          <div className="text-[#00FFFF] font-semibold mb-2">For Clients</div>
          <ul className="space-y-1">
            <li><Link to="/find-professionals" className="hover:underline text-[#96C2DB]">Find Professionals</Link></li>
            <li><Link to="#" className="hover:underline text-[#96C2DB]">How It Works</Link></li>
            <li><Link to="#" className="hover:underline text-[#96C2DB]">Success Stories</Link></li>
          </ul>
        </div>
        <div className="flex-1 min-w-[140px] mb-8 md:mb-0">
          <div className="text-[#00FFFF] font-semibold mb-2">For Professionals</div>
          <ul className="space-y-1">
            <li><Link to="/seller-register" className="hover:underline text-[#96C2DB]">Join as Professional</Link></li>
            <li><Link to="#" className="hover:underline text-[#96C2DB]">Verification Process</Link></li>
            <li><Link to="#" className="hover:underline text-[#96C2DB]">Resources</Link></li>
          </ul>
        </div>
        <div className="flex-1 min-w-[140px] mb-8 md:mb-0">
          <div className="text-[#00FFFF] font-semibold mb-2">Support</div>
          <ul className="space-y-1">
            <li><Link to="#" className="hover:underline text-[#96C2DB]">Help Center</Link></li>
            <li><Link to="#" className="hover:underline text-[#96C2DB]">Contact Us</Link></li>
            <li><Link to="#" className="hover:underline text-[#96C2DB]">Trust &amp; Safety</Link></li>
          </ul>
        </div>
        <div className="flex-1 min-w-[140px]">
          <div className="text-[#00FFFF] font-semibold mb-2">Legal links</div>
          <ul className="space-y-1">
            <li><Link to="#" className="hover:underline text-[#96C2DB]">Terms</Link></li>
            <li><Link to="#" className="hover:underline text-[#96C2DB]">Privacy</Link></li>
            <li><Link to="#" className="hover:underline text-[#96C2DB]">GDPR</Link></li>
          </ul>
        </div>
      </div>
      {/* Contact and Socials */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:justify-between items-center mt-8 gap-4 md:gap-0 border-t border-[#1a357d] pt-6">
        <div className="flex items-center gap-6 mb-2 md:mb-0">
          <span className="flex items-center gap-2 text-white"><Mail className="w-5 h-5" /> Dummyemail@gmail.com</span>
          <span className="flex items-center gap-2 text-white"><Phone className="w-5 h-5" /> +1 234 567 890</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-white mr-2">Socials</span>
          <Link to="#" className="bg-[#E6F0FA] rounded-md p-1 flex items-center justify-center"><Facebook className="w-5 h-5 text-[#01257D]" /></Link>
          <Link to="#" className="bg-[#E6F0FA] rounded-md p-1 flex items-center justify-center"><svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M4 4l16 16M20 4L4 20" stroke="#01257D" strokeWidth="2" strokeLinecap="round"/></svg></Link>
          <Link to="#" className="bg-[#E6F0FA] rounded-md p-1 flex items-center justify-center"><Instagram className="w-5 h-5 text-[#01257D]" /></Link>
        </div>
      </div>
      <div className="text-center text-[#96C2DB] text-sm mt-6">© 2025 Safe Bill. All rights reserved.</div>
    </footer>
  );
}
