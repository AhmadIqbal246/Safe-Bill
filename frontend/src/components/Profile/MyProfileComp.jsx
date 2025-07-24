import React, { useState } from 'react';

const profile = {
  avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
  name: 'Ethan Bennett',
  title: 'Experienced Plumber',
  location: 'San Francisco, CA',
  about:
    'Ethan Bennett is a seasoned plumber with over 10 years of experience in providing reliable plumbing services. His expertise covers residential and commercial projects, focusing on efficiency and quality workmanship. He is dedicated to solving plumbing issues and ensuring customer satisfaction.',
  skills: [
    'Drain Cleaning',
    'Pipe Repair',
    'Water Heater Installation',
    'Leak Detection',
    'Fixture Installation',
  ],
  email: 'ethan.bennett@email.com',
  phone: '(555) 987-6543',
};

export default function MyProfileComp() {
  const [feedback, setFeedback] = useState('');
  const [rating, setRating] = useState('');
  const [email, setEmail] = useState('');

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="flex flex-col items-center mb-6">
        <img
          src={profile.avatar}
          alt={profile.name}
          className="w-24 h-24 rounded-full object-cover border-4 border-[#E6F0FA] mb-3"
        />
        <div className="text-xl font-bold text-gray-900">{profile.name}</div>
        <div className="text-gray-500 font-medium">{profile.title}</div>
        <div className="text-gray-400 text-sm mb-2">{profile.location}</div>
        <button className="w-full max-w-xs bg-[#E6F0FA] text-[#01257D] font-semibold py-2 rounded-md mb-2 mt-2">Edit</button>
      </div>
      <div className="mb-6">
        <h2 className="text-lg font-bold mb-2">About</h2>
        <p className="text-gray-700 leading-relaxed">{profile.about}</p>
      </div>
      <div className="mb-6">
        <h2 className="text-lg font-bold mb-2">Skills</h2>
        <div className="flex flex-wrap gap-2">
          {profile.skills.map((skill) => (
            <span
              key={skill}
              className="bg-[#E6F0FA] text-[#01257D] px-3 py-1 rounded-full text-sm font-semibold"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>
      <div className="mb-8">
        <h2 className="text-lg font-bold mb-2">Contact</h2>
        <div className="flex flex-col sm:flex-row gap-6 text-gray-700">
          <div>
            <div className="text-xs text-gray-400 font-semibold">Email</div>
            <div>{profile.email}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400 font-semibold">Phone</div>
            <div>{profile.phone}</div>
          </div>
        </div>
      </div>
      <div className="mb-8">
        <h2 className="text-lg font-bold mb-4">Help us improve</h2>
        <div className="flex gap-2 mb-4 flex-wrap">
          {['Excellent', 'Good', 'Needs Improvement'].map((label) => (
            <button
              key={label}
              className={`px-4 py-2 rounded-md border font-semibold text-sm transition-colors ${rating === label ? 'bg-[#E6F0FA] text-[#01257D] border-[#01257D]' : 'bg-white text-gray-700 border-gray-200 hover:bg-[#E6F0FA]'}`}
              onClick={() => setRating(label)}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>
        <div className="mb-4">
          <textarea
            className="w-full min-h-[80px] rounded-md border border-gray-200 px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#01257D]"
            placeholder="Feedback"
            value={feedback}
            onChange={e => setFeedback(e.target.value)}
          />
        </div>
        <input
          type="email"
          className="w-full mb-4 rounded-md border border-gray-200 px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#01257D]"
          placeholder="Your email address"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <button className="w-full bg-[#01257D] text-white font-semibold py-2 rounded-md hover:bg-[#2346a0] transition-colors">Submit Feedback</button>
      </div>
    </div>
  );
}
