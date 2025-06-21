import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Grok API configuration
const GROK_API_KEY = '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';
const GROK_API_URL = 'https://api.x.ai/v1/chat/completions';

// Helper function to call Grok API
async function callGrokAPI(messages, systemPrompt) {
  try {
    const response = await fetch(GROK_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROK_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          ...messages
        ],
        model: 'grok-beta',
        stream: false,
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      throw new Error(`Grok API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Grok API Error:', error);
    throw error;
  }
}

// Generate classroom insights
function generateClassroomInsights(attendanceData, students) {
  const today = new Date().toDateString();
  const todayRecords = attendanceData.filter(record => 
    new Date(record.timestamp).toDateString() === today
  );

  const presentStudents = new Set(todayRecords.map(r => r.studentId)).size;
  const attendanceRate = Math.round((presentStudents / students.length) * 100);
  
  const emotionCounts = todayRecords.reduce((acc, record) => {
    acc[record.emotion] = (acc[record.emotion] || 0) + 1;
    return acc;
  }, {});

  const positiveEmotions = ['happy', 'focused'];
  const engagementScore = todayRecords.length > 0
    ? Math.round((todayRecords.filter(r => positiveEmotions.includes(r.emotion)).length / todayRecords.length) * 100)
    : 0;

  const dominantEmotion = Object.keys(emotionCounts).reduce((a, b) => 
    emotionCounts[a] > emotionCounts[b] ? a : b, 'neutral'
  );

  // Calculate trends
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

  const avgAttendance = Math.round(dailyAttendance.reduce((a, b) => a + b, 0) / 7);
  const trend = dailyAttendance[6] > dailyAttendance[0] ? 'increasing' : 
               dailyAttendance[6] < dailyAttendance[0] ? 'decreasing' : 'stable';

  return {
    totalRecords: todayRecords.length,
    presentStudents,
    totalStudents: students.length,
    attendanceRate,
    engagementScore,
    emotionCounts,
    dominantEmotion,
    avgAttendance,
    trend,
    dailyAttendance
  };
}

// Chat endpoint with Grok AI integration
app.post('/api/chat', async (req, res) => {
  try {
    const { message, attendanceData, students } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Generate classroom insights
    const insights = generateClassroomInsights(attendanceData || [], students || []);

    // Create system prompt with classroom context
    const systemPrompt = `You are an AI assistant for SmartClass Sentinel+, an advanced classroom attendance and engagement tracking system. You have access to real-time classroom data and should provide intelligent, actionable insights.

Current Classroom Data:
- Total Students: ${insights.totalStudents}
- Present Today: ${insights.presentStudents} (${insights.attendanceRate}%)
- Engagement Score: ${insights.engagementScore}%
- Dominant Emotion: ${insights.dominantEmotion}
- Total Records Today: ${insights.totalRecords}
- Attendance Trend: ${insights.trend}
- Weekly Average: ${insights.avgAttendance} students

Emotion Breakdown: ${JSON.stringify(insights.emotionCounts)}

Your role is to:
1. Provide real-time analysis of classroom data
2. Offer actionable recommendations for teachers
3. Identify patterns and trends
4. Suggest interventions for low engagement or attendance
5. Answer questions about student behavior and classroom dynamics
6. Provide predictive insights when possible

Be conversational, helpful, and focus on practical advice that teachers can implement immediately. Use emojis sparingly and format responses clearly with bullet points when listing recommendations.`;

    // Prepare messages for Grok API
    const messages = [
      {
        role: 'user',
        content: message
      }
    ];

    // Call Grok API
    const aiResponse = await callGrokAPI(messages, systemPrompt);

    res.json({
      response: aiResponse,
      insights: insights,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Chat API Error:', error);
    
    // Fallback response if Grok API fails
    const fallbackResponse = generateFallbackResponse(req.body.message, req.body.attendanceData, req.body.students);
    
    res.json({
      response: fallbackResponse,
      insights: generateClassroomInsights(req.body.attendanceData || [], req.body.students || []),
      timestamp: new Date().toISOString(),
      fallback: true
    });
  }
});

// Fallback response generator
function generateFallbackResponse(message, attendanceData, students) {
  const insights = generateClassroomInsights(attendanceData || [], students || []);
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('attendance')) {
    return `📊 Today's attendance is ${insights.attendanceRate}% with ${insights.presentStudents} out of ${insights.totalStudents} students present. ${
      insights.attendanceRate >= 80 ? 'Excellent attendance today! 🎉' : 
      insights.attendanceRate >= 60 ? 'Moderate attendance - consider following up with absent students. 📞' :
      'Low attendance detected - immediate action recommended. ⚠️'
    }`;
  }

  if (lowerMessage.includes('engagement')) {
    return `🧠 Current engagement score is ${insights.engagementScore}%. Dominant emotion: ${insights.dominantEmotion}. ${
      insights.engagementScore >= 70 ? 'Students are highly engaged! Keep up the great work! 🌟' :
      insights.engagementScore >= 50 ? 'Moderate engagement - consider interactive activities to boost participation. 🎯' :
      'Low engagement detected - recommend energizing activities or a short break. ⚡'
    }`;
  }

  return `I understand you're asking about "${message}". Based on current data: ${insights.attendanceRate}% attendance, ${insights.engagementScore}% engagement. For detailed insights, the AI service is temporarily unavailable, but I can still help with basic classroom analytics! 🤖`;
}

// Analytics endpoint
app.post('/api/analytics', async (req, res) => {
  try {
    const { attendanceData, students } = req.body;
    const insights = generateClassroomInsights(attendanceData || [], students || []);
    
    res.json({
      insights,
      recommendations: generateRecommendations(insights),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Analytics API Error:', error);
    res.status(500).json({ error: 'Failed to generate analytics' });
  }
});

// Generate recommendations based on insights
function generateRecommendations(insights) {
  const recommendations = [];
  
  if (insights.attendanceRate < 70) {
    recommendations.push({
      type: 'attendance',
      priority: 'high',
      message: 'Send attendance alerts to absent students and review patterns for early intervention'
    });
  }
  
  if (insights.engagementScore < 60) {
    recommendations.push({
      type: 'engagement',
      priority: 'high',
      message: 'Incorporate more interactive activities and consider changing teaching pace'
    });
  }
  
  if (insights.emotionCounts.sleepy > 3) {
    recommendations.push({
      type: 'environment',
      priority: 'medium',
      message: 'Check room ventilation and lighting, consider energizer activities'
    });
  }
  
  if (insights.emotionCounts.bored > 2) {
    recommendations.push({
      type: 'content',
      priority: 'medium',
      message: 'Introduce multimedia content or group activities to increase engagement'
    });
  }

  if (insights.trend === 'decreasing') {
    recommendations.push({
      type: 'trend',
      priority: 'medium',
      message: 'Declining attendance trend detected - investigate underlying causes'
    });
  }

  return recommendations;
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    grokApiKey: GROK_API_KEY ? 'configured' : 'missing'
  });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(join(__dirname, '../dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(join(__dirname, '../dist/index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`🚀 SmartClass Sentinel+ Backend running on port ${PORT}`);
  console.log(`🤖 Grok API: ${GROK_API_KEY ? 'Configured' : 'Missing API Key'}`);
  console.log(`📊 Analytics endpoint: http://localhost:${PORT}/api/analytics`);
  console.log(`💬 Chat endpoint: http://localhost:${PORT}/api/chat`);
});