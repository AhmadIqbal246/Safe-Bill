import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUserProfile } from '../../store/slices/UserProfileSlice';

function getDefaultAvatar(username) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(username || 'User')}&background=E6F0FA&color=01257D&size=96`;
}

function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export default function MyProfileComp() {
  const dispatch = useDispatch();
  const { profile, loading, error } = useSelector(state => state.userProfile);

  useEffect(() => {
    dispatch(fetchUserProfile());
  }, [dispatch]);

  if (loading) {
    return <div className="text-center py-12 text-gray-400">Loading...</div>;
  }
  if (error) {
    return <div className="text-center py-12 text-red-500">{typeof error === 'string' ? error : 'Failed to load profile.'}</div>;
  }
  if (!profile) {
    return null;
  }

  const avatarSrc = profile.profile_pic || getDefaultAvatar(profile.username);

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="flex flex-col items-center mb-6">
        <img
          src={avatarSrc}
          alt={profile.username}
          className="w-24 h-24 rounded-full object-cover border-4 border-[#E6F0FA] mb-3"
        />
        <div className="text-xl font-bold text-gray-900">{profile.username}</div>
        <div className="text-gray-500 font-medium">{capitalize(profile.type_of_activity)}</div>
        <div className="text-gray-400 text-sm mb-2">{capitalize(profile.service_area)}</div>
        <button className="w-full max-w-xs bg-[#E6F0FA] text-[#01257D] font-semibold py-2 rounded-md mb-2 mt-2">Edit</button>
      </div>
      <div className="mb-6">
        <h2 className="text-lg font-bold mb-2">About</h2>
        <p className="text-gray-700 leading-relaxed">{profile.about || 'No about info provided.'}</p>
      </div>
      <div className="mb-6">
        <h2 className="text-lg font-bold mb-2">Skills</h2>
        <div className="flex flex-wrap gap-2">
          {(profile.skills && profile.skills.length > 0) ? profile.skills.map((skill) => (
            <span
              key={skill}
              className="bg-[#E6F0FA] text-[#01257D] px-3 py-1 rounded-full text-sm font-semibold"
            >
              {skill}
            </span>
          )) : <span className="text-gray-400">No skills listed.</span>}
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
            <div>{profile.phone_number}</div>
          </div>
        </div>
      </div>
      {/* Feedback form remains as before, not populated from API */}
      <div className="mb-8">
        <h2 className="text-lg font-bold mb-4">Help us improve</h2>
        <div className="flex gap-2 mb-4 flex-wrap">
          {['Excellent', 'Good', 'Needs Improvement'].map((label) => (
            <button
              key={label}
              className={`px-4 py-2 rounded-md border font-semibold text-sm transition-colors bg-white text-gray-700 border-gray-200 hover:bg-[#E6F0FA]`}
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
          />
        </div>
        <input
          type="email"
          className="w-full mb-4 rounded-md border border-gray-200 px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#01257D]"
          placeholder="Your email address"
        />
        <button className="w-full bg-[#01257D] text-white font-semibold py-2 rounded-md hover:bg-[#2346a0] transition-colors">Submit Feedback</button>
      </div>
    </div>
  );
}
