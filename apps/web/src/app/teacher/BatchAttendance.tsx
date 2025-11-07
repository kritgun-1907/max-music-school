// apps/web/src/components/BatchAttendance.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Save,
  Users,
  TrendingUp,
  Search,
} from 'lucide-react';
import { Input } from '@/components/ui/input';

interface Student {
  id: string;
  name: string;
  email: string;
  phone: string;
  attendancePercentage: number;
  totalClasses: number;
  presentClasses: number;
  isPresent: boolean;
}

interface Batch {
  id: string;
  day: string;
  time: string;
  studentCount: number;
}

export default function BatchAttendance() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<string>('');
  const [students, setStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    fetchBatches();
  }, []);

  useEffect(() => {
    if (selectedBatch) {
      fetchStudents(selectedBatch);
    }
  }, [selectedBatch]);

  const fetchBatches = async () => {
    try {
      const response = await fetch('/api/teacher/batches', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      const data = await response.json();
      setBatches(data.batches);
    } catch (error) {
      console.error('Error fetching batches:', error);
    }
  };

  const fetchStudents = async (batchId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/teacher/batch/${batchId}/students`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      const data = await response.json();
      setStudents(
        data.students.map((s: Student) => ({ ...s, isPresent: false }))
      );
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAttendance = (studentId: string) => {
    setStudents((prev) =>
      prev.map((student) =>
        student.id === studentId
          ? { ...student, isPresent: !student.isPresent }
          : student
      )
    );
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    setStudents((prev) =>
      prev.map((student) => ({ ...student, isPresent: checked }))
    );
  };

  const saveAttendance = async () => {
    setSaving(true);
    try {
      const attendanceData = students.map((student) => ({
        studentId: student.id,
        isPresent: student.isPresent,
      }));

      await fetch(`/api/teacher/batch/${selectedBatch}/attendance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({
          date: new Date().toISOString().split('T')[0],
          attendance: attendanceData,
        }),
      });

      // Show success message
      alert('Attendance saved successfully!');
      
      // Refresh student data
      fetchStudents(selectedBatch);
    } catch (error) {
      console.error('Error saving attendance:', error);
      alert('Failed to save attendance. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const filteredStudents = students.filter((student) =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const presentCount = students.filter((s) => s.isPresent).length;
  const absentCount = students.length - presentCount;
  const attendancePercentage =
    students.length > 0 ? (presentCount / students.length) * 100 : 0;

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Mark Attendance</h1>
        <p className="text-gray-600 mt-2">
          Select a batch and mark attendance for today
        </p>
      </div>

      {/* Batch Selector */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Batch
              </label>
              <Select value={selectedBatch} onValueChange={setSelectedBatch}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a batch..." />
                </SelectTrigger>
                <SelectContent>
                  {batches.map((batch) => (
                    <SelectItem key={batch.id} value={batch.id}>
                      {batch.day} - {batch.time} ({batch.studentCount} students)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="pt-6">
              <Button
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                disabled={!selectedBatch || saving}
                onClick={saveAttendance}
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Attendance'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedBatch && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Total Students
                    </p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {students.length}
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Present</p>
                    <p className="text-3xl font-bold text-green-600 mt-2">
                      {presentCount}
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-red-500">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Absent</p>
                    <p className="text-3xl font-bold text-red-600 mt-2">
                      {absentCount}
                    </p>
                  </div>
                  <XCircle className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Attendance %
                    </p>
                    <p className="text-3xl font-bold text-purple-600 mt-2">
                      {attendancePercentage.toFixed(0)}%
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Student List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold">
                  Student List
                </CardTitle>
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search students..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="select-all"
                      checked={selectAll}
                      onCheckedChange={handleSelectAll}
                    />
                    <label
                      htmlFor="select-all"
                      className="text-sm font-medium cursor-pointer"
                    >
                      Select All
                    </label>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredStudents.map((student) => (
                    <div
                      key={student.id}
                      className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${
                        student.isPresent
                          ? 'bg-green-50 border-green-200'
                          : 'bg-white hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center space-x-4 flex-1">
                        <Checkbox
                          id={`student-${student.id}`}
                          checked={student.isPresent}
                          onCheckedChange={() => toggleAttendance(student.id)}
                        />
                        <div className="flex-1">
                          <label
                            htmlFor={`student-${student.id}`}
                            className="font-medium text-gray-900 cursor-pointer"
                          >
                            {student.name}
                          </label>
                          <p className="text-sm text-gray-600">{student.email}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">
                            {student.attendancePercentage}% Attendance
                          </p>
                          <p className="text-xs text-gray-600">
                            {student.presentClasses}/{student.totalClasses}{' '}
                            classes
                          </p>
                        </div>
                        <Badge
                          variant={student.isPresent ? 'default' : 'secondary'}
                          className={
                            student.isPresent
                              ? 'bg-green-500 hover:bg-green-600'
                              : ''
                          }
                        >
                          {student.isPresent ? 'Present' : 'Absent'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {!selectedBatch && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-gray-500">
              <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium">
                Select a batch to start marking attendance
              </p>
              <p className="text-sm mt-2">
                Choose from the dropdown above to view students
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
