export interface Student {
  id: string;
  name: string;
  email: string;
  faceDescriptor: Float32Array | null;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  timestamp: string;
  emotion: 'happy' | 'sad' | 'angry' | 'surprised' | 'fearful' | 'disgusted' | 'neutral' | 'focused' | 'sleepy' | 'bored';
  confidence: number;
  sessionId: string;
}

export interface EngagementMetrics {
  totalStudents: number;
  presentStudents: number;
  engagementScore: number;
  emotionBreakdown: Record<string, number>;
  attendanceRate: number;
}

export interface ChatMessage {
  id: string;
  message: string;
  response: string;
  timestamp: string;
}