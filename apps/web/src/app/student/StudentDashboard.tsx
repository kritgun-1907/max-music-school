'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  Clock,
  Music,
  TrendingUp,
  CreditCard,
  Bell,
  LogOut,
  CheckCircle,
  XCircle,
//   Guitar,
  Gauge,
  BookOpen,
} from 'lucide-react';

interface DashboardData {
  profile: {
    name: string;
    email: string;
    status: string;
  };
  attendance: {
    percentage: number;
    totalClasses: number;
    upcomingClasses: number;
    daysRemaining: number;
  };
  batch: {
    name: string;
    teacher: string;
    subject: string;
    classDays: string[];
    timing: { from: string; till: string };
    mode: string;
  };
  payment: {
    paidAmount: number;
    upcomingAmount: number;
    status: string;
  };
  schedule: {
    nextClass: string;
  };
}

export default function StudentDashboard() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchDashboardData(token);
  }, [router]);

  const fetchDashboardData = async (token: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/student/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-warm">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!data) return null;

  const attendancePercentage = data.attendance.percentage;
  const circumference = 2 * Math.PI * 54;
  const strokeDashoffset = circumference - (attendancePercentage / 100) * circumference;

  return (
    <div className="min-h-screen gradient-warm">
      {/* Top Navigation */}
      <nav className="bg-white shadow-md sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Music className="w-8 h-8 text-purple-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Max Music School</h1>
                <p className="text-sm text-gray-600">Student Portal</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button className="btn btn-ghost relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <div className="flex items-center gap-3">
                <div className="hidden md:block text-right">
                  <p className="font-medium text-gray-900">{data.profile.name}</p>
                  <p className="text-sm text-gray-600">Student</p>
                </div>
                <div className="w-10 h-10 rounded-full gradient-purple-pink flex items-center justify-center text-white font-bold">
                  {data.profile.name.charAt(0)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8 animate-slide-down">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome, {data.profile.name}! 🎵
          </h2>
          <p className="text-gray-600">Here's your learning dashboard.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Attendance Card */}
            <div className="card animate-fade-in">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Attendance Overview</h3>
                <button className="btn btn-outline btn-sm">View Details</button>
              </div>

              <div className="flex flex-col md:flex-row items-center gap-8">
                {/* Circular Progress */}
                <div className="relative">
                  <svg className="w-40 h-40 transform -rotate-90">
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#a855f7" />
                        <stop offset="100%" stopColor="#ec4899" />
                      </linearGradient>
                    </defs>
                    <circle
                      cx="80"
                      cy="80"
                      r="54"
                      stroke="#e5e7eb"
                      strokeWidth="12"
                      fill="none"
                    />
                    <circle
                      cx="80"
                      cy="80"
                      r="54"
                      stroke="url(#gradient)"
                      strokeWidth="12"
                      fill="none"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      className="transition-all duration-1000"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-gray-900">
                        {attendancePercentage}%
                      </p>
                      <p className="text-sm text-gray-600">Attendance</p>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex-1 grid grid-cols-2 gap-4">
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <p className="font-semibold text-gray-900">Present</p>
                    </div>
                    <p className="text-2xl font-bold text-green-600">
                      {Math.round((data.attendance.totalClasses * attendancePercentage) / 100)}
                    </p>
                    <p className="text-sm text-gray-600">classes attended</p>
                  </div>

                  <div className="p-4 bg-red-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <XCircle className="w-5 h-5 text-red-600" />
                      <p className="font-semibold text-gray-900">Absent</p>
                    </div>
                    <p className="text-2xl font-bold text-red-600">
                      {data.attendance.totalClasses - Math.round((data.attendance.totalClasses * attendancePercentage) / 100)}
                    </p>
                    <p className="text-sm text-gray-600">classes missed</p>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-5 h-5 text-blue-600" />
                      <p className="font-semibold text-gray-900">Upcoming</p>
                    </div>
                    <p className="text-2xl font-bold text-blue-600">
                      {data.attendance.upcomingClasses}
                    </p>
                    <p className="text-sm text-gray-600">classes remaining</p>
                  </div>

                  <div className="p-4 bg-purple-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-5 h-5 text-purple-600" />
                      <p className="font-semibold text-gray-900">Days Left</p>
                    </div>
                    <p className="text-2xl font-bold text-purple-600">
                      {data.attendance.daysRemaining}
                    </p>
                    <p className="text-sm text-gray-600">in this batch</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Batch Information */}
            <div className="card animate-fade-in" style={{animationDelay: '0.1s'}}>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Current Batch</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gradient-lavender rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="p-3 gradient-purple-pink rounded-lg">
                      <Music className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{data.batch.name}</h4>
                      <p className="text-sm text-gray-600">{data.batch.subject}</p>
                    </div>
                  </div>
                  <span className="badge badge-primary">{data.batch.mode}</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Teacher</p>
                    <p className="font-semibold text-gray-900">{data.batch.teacher}</p>
                  </div>
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Timing</p>
                    <p className="font-semibold text-gray-900">
                      {data.batch.timing.from} - {data.batch.timing.till}
                    </p>
                  </div>
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Class Days</p>
                    <p className="font-semibold text-gray-900">
                      {data.batch.classDays.join(', ')}
                    </p>
                  </div>
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Next Class</p>
                    <p className="font-semibold text-gray-900">{data.schedule.nextClass}</p>
                  </div>
                </div>

                <button className="btn btn-outline w-full">
                  Request Batch Change
                </button>
              </div>
            </div>

            {/* Practice Tools */}
            <div className="card animate-fade-in" style={{animationDelay: '0.2s'}}>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Practice Tools</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => router.push('/student/tools/metronome')}
                  className="p-6 border border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all group"
                >
                  <Gauge className="w-8 h-8 text-purple-600 mb-3 group-hover:scale-110 transition-transform" />
                  <h4 className="font-semibold text-gray-900 mb-1">Metronome</h4>
                  <p className="text-sm text-gray-600">Adjustable BPM & time signatures</p>
                </button>

                <button
                  onClick={() => router.push('/student/tools/tuner')}
                  className="p-6 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group"
                >
                  <Music className="w-8 h-8 text-blue-600 mb-3 group-hover:scale-110 transition-transform" />
                  <h4 className="font-semibold text-gray-900 mb-1">Guitar Tuner</h4>
                  <p className="text-sm text-gray-600">Tune your guitar accurately</p>
                </button>

                <button
                  onClick={() => router.push('/student/tools/chords')}
                  className="p-6 border border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all group"
                >
                  <Guitar className="w-8 h-8 text-green-600 mb-3 group-hover:scale-110 transition-transform" />
                  <h4 className="font-semibold text-gray-900 mb-1">Chord Library</h4>
                  <p className="text-sm text-gray-600">Learn chord positions</p>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Payment Status */}
            <div className="card animate-fade-in" style={{animationDelay: '0.3s'}}>
              <div className="flex items-center gap-3 mb-4">
                <CreditCard className="w-6 h-6 text-purple-600" />
                <h3 className="text-lg font-bold text-gray-900">Payment Status</h3>
              </div>

              {data.payment.upcomingAmount > 0 ? (
                <div className="space-y-4">
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800 font-medium mb-2">Payment Due</p>
                    <p className="text-3xl font-bold text-yellow-900">
                      ₹{data.payment.upcomingAmount}
                    </p>
                  </div>
                  <button className="btn btn-primary w-full">Pay Now</button>
                </div>
              ) : (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                  <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-2" />
                  <p className="font-semibold text-green-900">All Paid!</p>
                  <p className="text-sm text-green-700 mt-1">No pending payments</p>
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Paid Amount</span>
                  <span className="font-semibold text-gray-900">₹{data.payment.paidAmount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Upcoming Amount</span>
                  <span className="font-semibold text-gray-900">₹{data.payment.upcomingAmount}</span>
                </div>
              </div>
            </div>

            {/* Account Status */}
            <div className="card animate-fade-in" style={{animationDelay: '0.4s'}}>
              <h3 className="text-lg font-bold text-gray-900 mb-4">Account Status</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Status</span>
                  <span className={`badge ${
                    data.profile.status === 'Active' ? 'badge-success' : 'badge-warning'
                  }`}>
                    {data.profile.status}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Email</span>
                  <span className="text-sm font-medium text-gray-900">{data.profile.email}</span>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="card animate-fade-in" style={{animationDelay: '0.5s'}}>
              <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Links</h3>
              <div className="space-y-2">
                <button
                  onClick={() => router.push('/student/attendance')}
                  className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-3"
                >
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                  <span className="font-medium text-gray-900">Attendance History</span>
                </button>
                <button
                  onClick={() => router.push('/student/profile')}
                  className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-3"
                >
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-gray-900">My Profile</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full text-left p-3 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-3 text-red-600"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}