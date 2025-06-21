import React, { useMemo } from 'react';
import { ArrowLeft, Users, TrendingUp, Clock, Brain, BarChart3 } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { AttendanceRecord, Student, EngagementMetrics } from '../types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

interface DashboardProps {
  attendanceData: AttendanceRecord[];
  students: Student[];
  onBack: () => void;
}

export default function Dashboard({ attendanceData, students, onBack }: DashboardProps) {
  const metrics = useMemo((): EngagementMetrics => {
    const today = new Date().toDateString();
    const todayRecords = attendanceData.filter(record => 
      new Date(record.timestamp).toDateString() === today
    );

    const uniqueStudents = new Set(todayRecords.map(r => r.studentId));
    const emotionCounts = todayRecords.reduce((acc, record) => {
      acc[record.emotion] = (acc[record.emotion] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const positiveEmotions = ['happy', 'focused'];
    const engagementScore = todayRecords.length > 0
      ? Math.round((todayRecords.filter(r => positiveEmotions.includes(r.emotion)).length / todayRecords.length) * 100)
      : 0;

    return {
      totalStudents: students.length,
      presentStudents: uniqueStudents.size,
      engagementScore,
      emotionBreakdown: emotionCounts,
      attendanceRate: Math.round((uniqueStudents.size / students.length) * 100),
    };
  }, [attendanceData, students]);

  const emotionChartData = {
    labels: Object.keys(metrics.emotionBreakdown),
    datasets: [
      {
        data: Object.values(metrics.emotionBreakdown),
        backgroundColor: [
          '#10b981', // happy - green
          '#3b82f6', // focused - blue
          '#6b7280', // neutral - gray
          '#f59e0b', // sleepy - amber
          '#ef4444', // sad - red
          '#8b5cf6', // bored - purple
          '#f97316', // angry - orange
        ],
        borderWidth: 2,
        borderColor: '#ffffff',
      },
    ],
  };

  const attendanceOverTime = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toDateString();
    }).reverse();

    const dailyAttendance = last7Days.map(date => {
      const dayRecords = attendanceData.filter(record => 
        new Date(record.timestamp).toDateString() === date
      );
      return new Set(dayRecords.map(r => r.studentId)).size;
    });

    return {
      labels: last7Days.map(date => new Date(date).toLocaleDateString('en-US', { weekday: 'short' })),
      datasets: [
        {
          label: 'Students Present',
          data: dailyAttendance,
          borderColor: '#3b82f6',
          backgroundColor: '#3b82f6',
          tension: 0.1,
        },
      ],
    };
  }, [attendanceData]);

  const engagementOverTime = useMemo(() => {
    const hourlyData = Array.from({ length: 24 }, (_, hour) => {
      const hourRecords = attendanceData.filter(record => {
        const recordHour = new Date(record.timestamp).getHours();
        return recordHour === hour;
      });
      
      if (hourRecords.length === 0) return 0;
      
      const positiveEmotions = ['happy', 'focused'];
      return Math.round((hourRecords.filter(r => positiveEmotions.includes(r.emotion)).length / hourRecords.length) * 100);
    });

    return {
      labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
      datasets: [
        {
          label: 'Engagement %',
          data: hourlyData,
          backgroundColor: 'rgba(16, 185, 129, 0.2)',
          borderColor: '#10b981',
          borderWidth: 2,
          fill: true,
        },
      ],
    };
  }, [attendanceData]);

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const pieOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right' as const,
      },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-blue-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Back</span>
              </button>
              <div className="flex items-center space-x-3">
                <BarChart3 className="h-6 w-6 text-blue-600" />
                <h1 className="text-xl font-bold text-gray-900">Analytics Dashboard</h1>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              Last updated: {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-blue-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Attendance Rate</p>
                <p className="text-3xl font-bold text-blue-600">{metrics.attendanceRate}%</p>
                <p className="text-sm text-gray-500">{metrics.presentStudents}/{metrics.totalStudents} students</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-green-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Engagement Score</p>
                <p className="text-3xl font-bold text-green-600">{metrics.engagementScore}%</p>
                <p className="text-sm text-gray-500">Positive emotions</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-purple-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Records</p>
                <p className="text-3xl font-bold text-purple-600">{attendanceData.length}</p>
                <p className="text-sm text-gray-500">All time</p>
              </div>
              <Brain className="h-8 w-8 text-purple-500" />
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-amber-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg. Session Time</p>
                <p className="text-3xl font-bold text-amber-600">47m</p>
                <p className="text-sm text-gray-500">Per student</p>
              </div>
              <Clock className="h-8 w-8 text-amber-500" />
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Emotion Breakdown */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Emotion Breakdown</h3>
            <div className="h-64">
              {Object.keys(metrics.emotionBreakdown).length > 0 ? (
                <Pie data={emotionChartData} options={pieOptions} />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  No data available
                </div>
              )}
            </div>
          </div>

          {/* Attendance Over Time */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Attendance Trend (7 Days)</h3>
            <div className="h-64">
              <Line data={attendanceOverTime} options={chartOptions} />
            </div>
          </div>
        </div>

        {/* Engagement Over Time */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 shadow-sm mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Engagement Throughout Day</h3>
          <div className="h-64">
            <Line data={engagementOverTime} options={chartOptions} />
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {attendanceData.slice(-10).reverse().map((record) => (
              <div key={record.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-medium text-sm">
                      {record.studentName.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{record.studentName}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(record.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    record.emotion === 'happy' ? 'bg-green-100 text-green-800' :
                    record.emotion === 'focused' ? 'bg-blue-100 text-blue-800' :
                    record.emotion === 'neutral' ? 'bg-gray-100 text-gray-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {record.emotion}
                  </span>
                  <span className="text-sm text-gray-500">
                    {Math.round(record.confidence * 100)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}