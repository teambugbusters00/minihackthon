import axios from 'axios';
import { AttendanceRecord, Student } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface ChatResponse {
  response: string;
  insights: {
    totalRecords: number;
    presentStudents: number;
    totalStudents: number;
    attendanceRate: number;
    engagementScore: number;
    emotionCounts: Record<string, number>;
    dominantEmotion: string;
    avgAttendance: number;
    trend: string;
  };
  timestamp: string;
  fallback?: boolean;
}

export interface AnalyticsResponse {
  insights: {
    totalRecords: number;
    presentStudents: number;
    totalStudents: number;
    attendanceRate: number;
    engagementScore: number;
    emotionCounts: Record<string, number>;
    dominantEmotion: string;
    avgAttendance: number;
    trend: string;
  };
  recommendations: Array<{
    type: string;
    priority: string;
    message: string;
  }>;
  timestamp: string;
}

export const chatAPI = {
  sendMessage: async (
    message: string,
    attendanceData: AttendanceRecord[],
    students: Student[]
  ): Promise<ChatResponse> => {
    try {
      const response = await api.post('/chat', {
        message,
        attendanceData,
        students,
      });
      return response.data;
    } catch (error) {
      console.error('Chat API Error:', error);
      throw new Error('Failed to get AI response');
    }
  },

  getAnalytics: async (
    attendanceData: AttendanceRecord[],
    students: Student[]
  ): Promise<AnalyticsResponse> => {
    try {
      const response = await api.post('/analytics', {
        attendanceData,
        students,
      });
      return response.data;
    } catch (error) {
      console.error('Analytics API Error:', error);
      throw new Error('Failed to get analytics');
    }
  },

  healthCheck: async (): Promise<{ status: string; timestamp: string; grokApiKey: string }> => {
    try {
      const response = await api.get('/health');
      return response.data;
    } catch (error) {
      console.error('Health Check Error:', error);
      throw new Error('Backend service unavailable');
    }
  },
};

export default api;