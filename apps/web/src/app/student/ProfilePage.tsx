// apps/web/src/app/student/profile/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store/auth-store';
import { apiClient } from '@/lib/api-client';
import { User, Mail, Phone, Music, Calendar, Clock, MapPin, Edit, Save, X } from 'lucide-react';

export default function StudentProfile() {
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    contact: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const data = await apiClient.getStudentProfile();
      setProfile(data);
      setFormData({
        name: data.name,
        contact: data.contact
      });
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      await apiClient.updateStudentProfile(formData);
      await fetchProfile();
      setEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-600 mt-2">Manage your personal information</p>
      </div>

      {/* Profile Card */}
      <div className="card mb-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full gradient-purple-pink flex items-center justify-center text-white text-3xl font-bold">
              {profile?.name?.charAt(0) || 'S'}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{profile?.name}</h2>
              <p className="text-gray-600">{profile?.email}</p>
              <span className={`badge mt-2 ${
                profile?.status === 'Active' ? 'badge-success' : 'badge-warning'
              }`}>
                {profile?.status}
              </span>
            </div>
          </div>

          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="btn btn-outline gap-2"
            >
              <Edit className="w-4 h-4" />
              Edit Profile
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                className="btn btn-primary gap-2"
              >
                <Save className="w-4 h-4" />
                Save
              </button>
              <button
                onClick={() => {
                  setEditing(false);
                  setFormData({ name: profile.name, contact: profile.contact });
                }}
                className="btn btn-ghost gap-2"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 text-lg mb-4">Personal Information</h3>
            
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <User className="w-5 h-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-600">Full Name</p>
                {editing ? (
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input mt-1"
                  />
                ) : (
                  <p className="font-medium text-gray-900">{profile?.name}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Mail className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium text-gray-900">{profile?.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Phone className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-600">Contact Number</p>
                {editing ? (
                  <input
                    type="text"
                    value={formData.contact}
                    onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                    className="input mt-1"
                  />
                ) : (
                  <p className="font-medium text-gray-900">{profile?.contact}</p>
                )}
              </div>
            </div>
          </div>

          {/* Class Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 text-lg mb-4">Class Information</h3>
            
            <div className="flex items-center gap-3">
              <div className="p-2 bg-pink-100 rounded-lg">
                <Music className="w-5 h-5 text-pink-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-600">Subject</p>
                <p className="font-medium text-gray-900">{profile?.subject}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <User className="w-5 h-5 text-yellow-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-600">Batch</p>
                <p className="font-medium text-gray-900">{profile?.batchName}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <User className="w-5 h-5 text-indigo-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-600">Teacher</p>
                <p className="font-medium text-gray-900">{profile?.teacher}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-100 rounded-lg">
                <Clock className="w-5 h-5 text-cyan-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-600">Timings</p>
                <p className="font-medium text-gray-900">
                  {profile?.timeFrom} - {profile?.timeTill}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Calendar className="w-5 h-5 text-orange-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-600">Class Days</p>
                <p className="font-medium text-gray-900">{profile?.classDays}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-teal-100 rounded-lg">
                <MapPin className="w-5 h-5 text-teal-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-600">Mode</p>
                <p className="font-medium text-gray-900">{profile?.mode}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enrollment Details */}
      <div className="card">
        <h3 className="font-semibold text-gray-900 text-lg mb-4">Enrollment Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-600 font-medium">Start Date</p>
            <p className="text-lg font-bold text-blue-900 mt-1">{profile?.startDate}</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-green-600 font-medium">End Date</p>
            <p className="text-lg font-bold text-green-900 mt-1">{profile?.endDate}</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <p className="text-sm text-purple-600 font-medium">Total Classes</p>
            <p className="text-lg font-bold text-purple-900 mt-1">{profile?.classes}</p>
          </div>
        </div>
      </div>
    </div>
  );
}