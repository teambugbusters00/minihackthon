import React, { useState } from 'react';
import { ArrowLeft, FileSpreadsheet, Mail, Download, Calendar, Filter, Send } from 'lucide-react';
import * as XLSX from 'xlsx';
import emailjs from 'emailjs-com';
import { AttendanceRecord, Student } from '../types';

interface ReportsProps {
  attendanceData: AttendanceRecord[];
  students: Student[];
  onBack: () => void;
}

export default function Reports({ attendanceData, students, onBack }: ReportsProps) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [emailAddress, setEmailAddress] = useState('');
  const [isEmailSending, setIsEmailSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const filteredData = attendanceData.filter(record => {
    const recordDate = new Date(record.timestamp).toISOString().split('T')[0];
    return recordDate === selectedDate;
  });

  const generateExcelReport = () => {
    const reportData = filteredData.map(record => ({
      'Student Name': record.studentName,
      'Date': new Date(record.timestamp).toLocaleDateString(),
      'Time': new Date(record.timestamp).toLocaleTimeString(),
      'Emotion': record.emotion,
      'Confidence': `${Math.round(record.confidence * 100)}%`,
      'Session ID': record.sessionId,
    }));

    // Add summary data
    const summary = {
      'Student Name': 'SUMMARY',
      'Date': `Report for ${new Date(selectedDate).toLocaleDateString()}`,
      'Time': `Generated at ${new Date().toLocaleTimeString()}`,
      'Emotion': `${filteredData.length} total records`,
      'Confidence': `${new Set(filteredData.map(r => r.studentId)).size} unique students`,
      'Session ID': `${new Set(filteredData.map(r => r.sessionId)).size} sessions`,
    };

    const finalData = [summary, {}, ...reportData];

    const worksheet = XLSX.utils.json_to_sheet(finalData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance Report');

    // Style the worksheet
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const address = XLSX.utils.encode_col(C) + "1";
      if (!worksheet[address]) continue;
      worksheet[address].s = {
        font: { bold: true },
        fill: { fgColor: { rgb: "FFFFAA" } }
      };
    }

    const fileName = `SmartClass_Attendance_${selectedDate}.xlsx`;
    XLSX.writeFile(workbook, fileName);

    return { workbook, fileName };
  };

  const sendEmailReport = async () => {
    if (!emailAddress) {
      alert('Please enter an email address');
      return;
    }

    setIsEmailSending(true);
    try {
      const { workbook } = generateExcelReport();
      
      // Convert workbook to base64
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const data = new Uint8Array(excelBuffer);
      const base64String = btoa(String.fromCharCode(...data));

      const templateParams = {
        to_email: emailAddress,
        report_date: new Date(selectedDate).toLocaleDateString(),
        total_records: filteredData.length,
        unique_students: new Set(filteredData.map(r => r.studentId)).size,
        attachment: base64String,
        filename: `SmartClass_Attendance_${selectedDate}.xlsx`,
      };

      // Note: In a real implementation, you'd need to configure EmailJS
      // For demo purposes, we'll simulate the email sending
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setEmailSent(true);
      setTimeout(() => setEmailSent(false), 3000);
    } catch (error) {
      console.error('Error sending email:', error);
      alert('Error sending email. Please try again.');
    } finally {
      setIsEmailSending(false);
    }
  };

  const getEmotionStats = () => {
    const emotions = filteredData.reduce((acc, record) => {
      acc[record.emotion] = (acc[record.emotion] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(emotions).sort(([,a], [,b]) => b - a);
  };

  const getAttendanceRate = () => {
    const presentStudents = new Set(filteredData.map(r => r.studentId)).size;
    return Math.round((presentStudents / students.length) * 100);
  };

  const getEngagementScore = () => {
    const positiveEmotions = ['happy', 'focused'];
    const positiveCount = filteredData.filter(r => positiveEmotions.includes(r.emotion)).length;
    return filteredData.length > 0 ? Math.round((positiveCount / filteredData.length) * 100) : 0;
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
                <FileSpreadsheet className="h-6 w-6 text-purple-600" />
                <h1 className="text-xl font-bold text-gray-900">Reports & Export</h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 shadow-sm mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Report Filters</h2>
            <Filter className="h-5 w-5 text-gray-500" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address (Optional)
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="email"
                  placeholder="teacher@school.edu"
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex items-end space-x-2">
              <button
                onClick={generateExcelReport}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="h-4 w-4" />
                <span>Download Excel</span>
              </button>
              <button
                onClick={sendEmailReport}
                disabled={isEmailSending || !emailAddress}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="h-4 w-4" />
                <span>{isEmailSending ? 'Sending...' : 'Email Report'}</span>
              </button>
            </div>
          </div>
          {emailSent && (
            <div className="mt-4 p-3 bg-green-100 border border-green-400 rounded-lg">
              <p className="text-green-700 font-medium">Report sent successfully!</p>
            </div>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-blue-100 shadow-sm">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Total Records</h3>
            <p className="text-3xl font-bold text-blue-600">{filteredData.length}</p>
            <p className="text-sm text-gray-500">Selected date</p>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-green-100 shadow-sm">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Attendance Rate</h3>
            <p className="text-3xl font-bold text-green-600">{getAttendanceRate()}%</p>
            <p className="text-sm text-gray-500">{new Set(filteredData.map(r => r.studentId)).size}/{students.length} students</p>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-purple-100 shadow-sm">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Engagement Score</h3>
            <p className="text-3xl font-bold text-purple-600">{getEngagementScore()}%</p>
            <p className="text-sm text-gray-500">Positive emotions</p>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-amber-100 shadow-sm">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Sessions</h3>
            <p className="text-3xl font-bold text-amber-600">{new Set(filteredData.map(r => r.sessionId)).size}</p>
            <p className="text-sm text-gray-500">Unique sessions</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Emotion Statistics */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Emotion Breakdown</h3>
            <div className="space-y-3">
              {getEmotionStats().map(([emotion, count]) => (
                <div key={emotion} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className={`w-3 h-3 rounded-full ${
                      emotion === 'happy' ? 'bg-green-500' :
                      emotion === 'focused' ? 'bg-blue-500' :
                      emotion === 'neutral' ? 'bg-gray-500' :
                      emotion === 'sleepy' ? 'bg-purple-500' :
                      'bg-red-500'
                    }`}></span>
                    <span className="font-medium capitalize">{emotion}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold">{count}</span>
                    <span className="text-gray-500 text-sm">
                      ({Math.round((count / filteredData.length) * 100)}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Records */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Records</h3>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {filteredData.slice(-8).reverse().map((record) => (
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
                        {new Date(record.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    record.emotion === 'happy' ? 'bg-green-100 text-green-800' :
                    record.emotion === 'focused' ? 'bg-blue-100 text-blue-800' :
                    record.emotion === 'neutral' ? 'bg-gray-100 text-gray-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {record.emotion}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Preview Table */}
        <div className="mt-8 bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Preview</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 font-medium text-gray-700">Student Name</th>
                  <th className="text-left py-2 font-medium text-gray-700">Time</th>
                  <th className="text-left py-2 font-medium text-gray-700">Emotion</th>
                  <th className="text-left py-2 font-medium text-gray-700">Confidence</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.slice(0, 10).map((record) => (
                  <tr key={record.id} className="border-b border-gray-100">
                    <td className="py-2 font-medium">{record.studentName}</td>
                    <td className="py-2 text-gray-600">
                      {new Date(record.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        record.emotion === 'happy' ? 'bg-green-100 text-green-800' :
                        record.emotion === 'focused' ? 'bg-blue-100 text-blue-800' :
                        record.emotion === 'neutral' ? 'bg-gray-100 text-gray-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {record.emotion}
                      </span>
                    </td>
                    <td className="py-2 text-gray-600">
                      {Math.round(record.confidence * 100)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}