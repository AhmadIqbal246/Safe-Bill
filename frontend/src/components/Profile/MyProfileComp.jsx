import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUserProfile, updateUserProfile } from '../../store/slices/UserProfileSlice';
import { setUser } from '../../store/slices/AuthSlices';
import { Dialog } from '@headlessui/react';
import Select from 'react-select';
import { toast } from 'react-toastify';

function getDefaultAvatar(username) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(username || 'User')}&background=E6F0FA&color=01257D&size=96`;
}

function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

const skillOptions = [
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'painting', label: 'Painting' },
  { value: 'carpentry', label: 'Carpentry' },
  { value: 'cleaning', label: 'Cleaning' },
  // ...add more
];

const activityTypeOptions = [
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'carpentry', label: 'Carpentry' },
  { value: 'painting', label: 'Painting' },
  { value: 'cleaning', label: 'Cleaning' },
];

const serviceAreaOptions = [
  { value: 'paris', label: 'Paris' },
  { value: 'lyon', label: 'Lyon' },
  { value: 'marseille', label: 'Marseille' },
  { value: 'toulouse', label: 'Toulouse' },
  { value: 'nice', label: 'Nice' },
];

export default function MyProfileComp() {
  const dispatch = useDispatch();
  const { profile, loading, error, success } = useSelector(state => state.userProfile);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [editPicPreview, setEditPicPreview] = useState(null);
  const fileInputRef = useRef();

  useEffect(() => {
    dispatch(fetchUserProfile());
  }, [dispatch]);

  useEffect(() => {
    if (success && editModalOpen) {
      setEditModalOpen(false);
      setEditForm(null);
      setEditPicPreview(null);
      toast.success('Profile updated successfully!');
      // Update auth.user in Redux
      if (editForm) {
        dispatch(setUser({ ...profile, ...editForm }));
      }
    }
  }, [success]);

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

  // Prepare initial values for edit form
  const openEditModal = () => {
    setEditForm({
      username: profile.username || '',
      type_of_activity: profile.type_of_activity || '',
      service_area: profile.service_area || '',
      about: profile.about || '',
      skills: Array.isArray(profile.skills) ? profile.skills : [],
      profile_pic: null,
    });
    setEditPicPreview(null);
    setEditModalOpen(true);
  };

  const handleEditChange = (field, value) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSkillChange = (selected) => {
    setEditForm(prev => ({
      ...prev,
      skills: selected ? selected.map(s => s.label) : [],
    }));
  };

  const handlePicChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEditForm(prev => ({ ...prev, profile_pic: file }));
      setEditPicPreview(URL.createObjectURL(file));
    }
  };

  const handleEditCancel = () => {
    setEditModalOpen(false);
    setEditForm(null);
    setEditPicPreview(null);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!editForm) return;
    // Use existing values for any blank fields
    const data = {
      username: editForm.username || profile.username,
      type_of_activity: editForm.type_of_activity || profile.type_of_activity,
      service_area: editForm.service_area || profile.service_area,
      about: editForm.about || profile.about,
      skills: editForm.skills && editForm.skills.length > 0 ? editForm.skills : profile.skills,
    };
    if (editForm.profile_pic) {
      data.profile_pic = editForm.profile_pic;
    }
    dispatch(updateUserProfile(data));
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="flex flex-col items-center mb-6">
        <img
          src={avatarSrc}
          alt={profile.username}
          className="w-24 h-24 rounded-full object-cover border-4 border-[#E6F0FA] mb-3"
        />
        <div className="text-xl font-bold text-gray-900">{profile.username}</div>
        <div className="text-gray-500 font-medium">Category: {capitalize(profile.type_of_activity)}</div>
        <div className="text-gray-400 text-sm mb-2">{capitalize(profile.service_area)}</div>
        <button
          className="w-full max-w-xs bg-[#E6F0FA] text-[#01257D] font-semibold py-2 rounded-md mb-2 mt-2"
          onClick={openEditModal}
        >
          Edit
        </button>
      </div>
      <div className="mb-6">
        <h2 className="text-lg font-bold mb-2">About</h2>
        <p className="text-gray-700 leading-relaxed">{profile.about || 'No about info provided.'}</p>
      </div>
      <div className="mb-6">
        <h2 className="text-lg font-bold mb-2">Skills</h2>
        <div className="flex flex-wrap gap-2">
          {(Array.isArray(profile.skills) ? profile.skills : []).length > 0 ? (
            (Array.isArray(profile.skills) ? profile.skills : []).map((skill) => (
              <span
                key={skill}
                className="bg-[#E6F0FA] text-[#01257D] px-3 py-1 rounded-full text-sm font-semibold"
              >
                {skill}
              </span>
            ))
          ) : (
            <span className="text-gray-400">No skills listed.</span>
          )}
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

      {/* Edit Profile Modal */}
      <Dialog open={editModalOpen} onClose={handleEditCancel} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
            <Dialog.Title className="text-xl font-bold text-[#01257D] mb-4">Edit Profile</Dialog.Title>
            {editForm && (
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div className="flex flex-col items-center mb-4">
                  <img
                    src={editPicPreview || profile.profile_pic || getDefaultAvatar(profile.username)}
                    alt="Profile Preview"
                    className="w-20 h-20 rounded-full object-cover border-4 border-[#E6F0FA] mb-2"
                  />
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handlePicChange}
                  />
                  <button
                    type="button"
                    className="px-3 py-1 bg-[#E6F0FA] text-[#01257D] rounded text-sm font-semibold"
                    onClick={() => fileInputRef.current && fileInputRef.current.click()}
                  >
                    Upload New Picture
                  </button>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Username</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded-md"
                    value={editForm.username}
                    onChange={e => handleEditChange('username', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Activity Type</label>
                  <select
                    className="w-full px-3 py-2 border rounded-md"
                    value={editForm.type_of_activity}
                    onChange={e => handleEditChange('type_of_activity', e.target.value)}
                  >
                    <option value="">Choose Activity</option>
                    {activityTypeOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Service Area</label>
                  <select
                    className="w-full px-3 py-2 border rounded-md"
                    value={editForm.service_area}
                    onChange={e => handleEditChange('service_area', e.target.value)}
                  >
                    <option value="">Service Area</option>
                    {serviceAreaOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">About</label>
                  <textarea
                    className="w-full px-3 py-2 border rounded-md"
                    value={editForm.about}
                    onChange={e => handleEditChange('about', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Skills</label>
                  <Select
                    isMulti
                    name="skills"
                    options={skillOptions}
                    value={editForm.skills.map(skill => skillOptions.find(opt => opt.label === skill) || { value: skill, label: skill })}
                    onChange={handleSkillChange}
                    className="basic-multi-select"
                    classNamePrefix="select"
                    placeholder="Type or select skills"
                  />
                </div>
                <div className="flex justify-end gap-2 mt-6">
                  <button
                    type="button"
                    className="px-4 py-2 rounded bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300"
                    onClick={handleEditCancel}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded bg-[#01257D] text-white font-semibold hover:bg-[#2346a0]"
                  >
                    Submit
                  </button>
                </div>
              </form>
            )}
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}
