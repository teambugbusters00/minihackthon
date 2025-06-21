import React, { useState, useEffect } from 'react';
import { Camera, BarChart3, FileSpreadsheet, MessageCircle, Users, Brain, TrendingUp } from 'lucide-react';
import WebcamScanner from './components/WebcamScanner';
import Dashboard from './components/Dashboard';
import Reports from './components/Reports';
import Chatbot from './components/Chatbot';
import { AttendanceRecord, Student } from './types';

function App() {
  const [currentView, setCurrentView] = useState<'home' | 'scanner' | 'dashboard' | 'reports' | 'chat'>('home');
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    // Load data from localStorage on mount
    const savedAttendance = localStorage.getItem('smartclass-attendance');
    const savedStudents = localStorage.getItem('smartclass-students');
    
    if (savedAttendance) {
      setAttendanceData(JSON.parse(savedAttendance));
    }
    
    if (savedStudents) {
      setStudents(JSON.parse(savedStudents));
    } else {
      // Initialize with sample students
      const sampleStudents: Student[] = [
        { id: '1', name: 'Riya Sen', email: 'riya.sen@school.edu', faceDescriptor: null },
        { id: '2', name: 'Aryan Das', email: 'aryan.das@school.edu', faceDescriptor: null },
        { id: '3', name: 'Priya Sharma', email: 'priya.sharma@school.edu', faceDescriptor: null },
        { id: '4', name: 'Vikash Kumar', email: 'vikash.kumar@school.edu', faceDescriptor: null },
      ];
      setStudents(sampleStudents);
      localStorage.setItem('smartclass-students', JSON.stringify(sampleStudents));
    }
  }, []);

  const saveAttendanceData = (data: AttendanceRecord[]) => {
    setAttendanceData(data);
    localStorage.setItem('smartclass-attendance', JSON.stringify(data));
  };

  const addAttendanceRecord = (record: AttendanceRecord) => {
    const newData = [...attendanceData, record];
    saveAttendanceData(newData);
  };

  if (currentView === 'scanner') {
    return (
      <WebcamScanner
        students={students}
        onBack={() => setCurrentView('home')}
        onAttendanceRecord={addAttendanceRecord}
        isScanning={isScanning}
        setIsScanning={setIsScanning}
      />
    );
  }

  if (currentView === 'dashboard') {
    return (
      <Dashboard
        attendanceData={attendanceData}
        students={students}
        onBack={() => setCurrentView('home')}
      />
    );
  }

  if (currentView === 'reports') {
    return (
      <Reports
        attendanceData={attendanceData}
        students={students}
        onBack={() => setCurrentView('home')}
      />
    );
  }

  if (currentView === 'chat') {
    return (
      <Chatbot
        attendanceData={attendanceData}
        students={students}
        onBack={() => setCurrentView('home')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-blue-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg">
                <Brain className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  SmartClass Sentinel+
                </h1>
                <p className="text-sm text-gray-600">AI-Powered Attendance & Engagement Tracker</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <div className="flex items-center space-x-1">
                <Users className="h-4 w-4" />
                <span>{students.length} Students</span>
              </div>
              <div className="flex items-center space-x-1">
                <TrendingUp className="h-4 w-4" />
                <span>{attendanceData.length} Records</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Next-Generation Classroom Intelligence
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Harness the power of AI to automatically track attendance, monitor engagement, 
            and gain real-time insights into your classroom dynamics.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-blue-100 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today's Attendance</p>
                <p className="text-2xl font-bold text-blue-600">
                  {attendanceData.filter(record => {
                    const today = new Date().toDateString();
                    return new Date(record.timestamp).toDateString() === today;
                  }).length}
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-green-100 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg. Engagement</p>
                <p className="text-2xl font-bold text-green-600">
                  {attendanceData.length > 0 
                    ? Math.round((attendanceData.filter(r => r.emotion === 'happy' || r.emotion === 'focused').length / attendanceData.length) * 100)
                    : 0}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-purple-100 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Sessions</p>
                <p className="text-2xl font-bold text-purple-600">
                  {new Set(attendanceData.map(r => new Date(r.timestamp).toDateString())).size}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-500" />
            </div>
          </div>
          
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-amber-100 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">AI Accuracy</p>
                <p className="text-2xl font-bold text-amber-600">97.8%</p>
              </div>
              <Brain className="h-8 w-8 text-amber-500" />
            </div>
          </div>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <button
            onClick={() => setCurrentView('scanner')}
            className="group bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-blue-200 shadow-sm hover:shadow-xl hover:scale-105 transition-all duration-300 text-left"
          >
            <div className="mb-4">
              <div className="inline-flex p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300">
                <Camera className="h-8 w-8 text-white" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Start Attendance</h3>
            <p className="text-gray-600 mb-4">Begin real-time face detection and emotion tracking</p>
            <div className="flex items-center text-blue-600 font-medium group-hover:text-blue-700">
              Launch Scanner →
            </div>
          </button>

          <button
            onClick={() => setCurrentView('dashboard')}
            className="group bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-green-200 shadow-sm hover:shadow-xl hover:scale-105 transition-all duration-300 text-left"
          >
            <div className="mb-4">
              <div className="inline-flex p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300">
                <BarChart3 className="h-8 w-8 text-white" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">View Dashboard</h3>
            <p className="text-gray-600 mb-4">Analyze engagement metrics and attendance patterns</p>
            <div className="flex items-center text-green-600 font-medium group-hover:text-green-700">
              Open Analytics →
            </div>
          </button>

          <button
            onClick={() => setCurrentView('reports')}
            className="group bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-purple-200 shadow-sm hover:shadow-xl hover:scale-105 transition-all duration-300 text-left"
          >
            <div className="mb-4">
              <div className="inline-flex p-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300">
                <FileSpreadsheet className="h-8 w-8 text-white" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Export & Email</h3>
            <p className="text-gray-600 mb-4">Generate detailed reports and email summaries</p>
            <div className="flex items-center text-purple-600 font-medium group-hover:text-purple-700">
              Create Report →
            </div>
          </button>

          <button
            onClick={() => setCurrentView('chat')}
            className="group bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-amber-200 shadow-sm hover:shadow-xl hover:scale-105 transition-all duration-300 text-left"
          >
            <div className="mb-4">
              <div className="inline-flex p-3 bg-gradient-to-r from-amber-500 to-amber-600 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300">
                <MessageCircle className="h-8 w-8 text-white" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">AI Assistant</h3>
            <p className="text-gray-600 mb-4">Get real-time insights and classroom recommendations</p>
            <div className="flex items-center text-amber-600 font-medium group-hover:text-amber-700">
              Chat with AI →
            </div>
          </button>
        </div>

        {/* Features */}
        <div className="mt-16 bg-white/60 backdrop-blur-sm rounded-3xl p-8 border border-gray-200">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Powered by Advanced AI</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="inline-flex p-4 bg-blue-100 rounded-2xl mb-4">
                <Camera className="h-8 w-8 text-blue-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Real-Time Face Recognition</h4>
              <p className="text-gray-600">Advanced facial detection and recognition with 97%+ accuracy</p>
            </div>
            <div className="text-center">
              <div className="inline-flex p-4 bg-green-100 rounded-2xl mb-4">
                <Brain className="h-8 w-8 text-green-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Emotion Analysis</h4>
              <p className="text-gray-600">Detect engagement levels through facial emotion recognition</p>
            </div>
            <div className="text-center">
              <div className="inline-flex p-4 bg-purple-100 rounded-2xl mb-4">
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Smart Analytics</h4>
              <p className="text-gray-600">Generate insights and recommendations for better teaching</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;