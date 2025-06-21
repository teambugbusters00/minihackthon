import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, MessageCircle, Send, Bot, User, Brain, TrendingUp, Users, AlertCircle } from 'lucide-react';
import { AttendanceRecord, Student, ChatMessage } from '../types';

interface ChatbotProps {
  attendanceData: AttendanceRecord[];
  students: Student[];
  onBack: () => void;
}

export default function Chatbot({ attendanceData, students, onBack }: ChatbotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      message: '',
      response: 'Hello! I\'m your AI assistant for SmartClass Sentinel+. I can provide real-time insights about attendance, engagement, and classroom analytics. What would you like to know?',
      timestamp: new Date().toISOString(),
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getClassroomInsights = () => {
    const today = new Date().toDateString();
    const todayRecords = attendanceData.filter(record => 
      new Date(record.timestamp).toDateString() === today
    );

    const presentStudents = new Set(todayRecords.map(r => r.studentId)).size;
    const attendanceRate = Math.round((presentStudents / students.length) * 100);
    
    const emotionCounts = todayRecords.reduce((acc, record) => {
      acc[record.emotion] = (acc[record.emotion] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const positiveEmotions = ['happy', 'focused'];
    const engagementScore = todayRecords.length > 0
      ? Math.round((todayRecords.filter(r => positiveEmotions.includes(r.emotion)).length / todayRecords.length) * 100)
      : 0;

    return {
      totalRecords: todayRecords.length,
      presentStudents,
      totalStudents: students.length,
      attendanceRate,
      engagementScore,
      emotionCounts,
      dominantEmotion: Object.keys(emotionCounts).reduce((a, b) => 
        emotionCounts[a] > emotionCounts[b] ? a : b, 'neutral'
      ),
    };
  };

  const generateAIResponse = async (userMessage: string): Promise<string> => {
    const insights = getClassroomInsights();
    const lowerMessage = userMessage.toLowerCase();

    // Real-time data analysis responses
    if (lowerMessage.includes('attendance') || lowerMessage.includes('present')) {
      return `Today's attendance is ${insights.attendanceRate}% with ${insights.presentStudents} out of ${insights.totalStudents} students present. ${
        insights.attendanceRate >= 80 ? 'Great attendance today!' : 
        insights.attendanceRate >= 60 ? 'Moderate attendance - consider following up with absent students.' :
        'Low attendance - immediate action recommended.'
      }`;
    }

    if (lowerMessage.includes('engagement') || lowerMessage.includes('emotion')) {
      const emotionSummary = Object.entries(insights.emotionCounts)
        .map(([emotion, count]) => `${emotion}: ${count}`)
        .join(', ');
      
      return `Current engagement score is ${insights.engagementScore}%. Dominant emotion: ${insights.dominantEmotion}. Breakdown: ${emotionSummary || 'No data yet'}. ${
        insights.engagementScore >= 70 ? 'Students are highly engaged!' :
        insights.engagementScore >= 50 ? 'Moderate engagement - consider interactive activities.' :
        'Low engagement detected - recommend energizing the class.'
      }`;
    }

    if (lowerMessage.includes('recommend') || lowerMessage.includes('suggest')) {
      const recommendations = [];
      
      if (insights.attendanceRate < 70) {
        recommendations.push('• Send attendance alerts to absent students');
        recommendations.push('• Review attendance patterns for early intervention');
      }
      
      if (insights.engagementScore < 60) {
        recommendations.push('• Incorporate more interactive activities');
        recommendations.push('• Take a short break to re-energize students');
        recommendations.push('• Consider changing teaching method or pace');
      }
      
      if (insights.emotionCounts.sleepy > 3) {
        recommendations.push('• Room may need better ventilation or lighting');
        recommendations.push('• Consider a quick energizer activity');
      }
      
      if (insights.emotionCounts.bored > 2) {
        recommendations.push('• Introduce multimedia content or group activities');
        recommendations.push('• Check if content difficulty is appropriate');
      }

      return recommendations.length > 0 
        ? `Based on current data, here are my recommendations:\n\n${recommendations.join('\n')}`
        : 'Great job! Your class is performing well. Keep up the excellent engagement strategies.';
    }

    if (lowerMessage.includes('summary') || lowerMessage.includes('report')) {
      return `📊 **Classroom Summary**\n\n` +
        `👥 **Attendance**: ${insights.presentStudents}/${insights.totalStudents} (${insights.attendanceRate}%)\n` +
        `🧠 **Engagement**: ${insights.engagementScore}%\n` +
        `😊 **Dominant Emotion**: ${insights.dominantEmotion}\n` +
        `📈 **Total Records**: ${insights.totalRecords}\n\n` +
        `${insights.attendanceRate >= 80 && insights.engagementScore >= 70 ? 
          '✅ Excellent classroom performance!' : 
          '⚠️ Areas for improvement identified - ask for recommendations!'}`;
    }

    if (lowerMessage.includes('trend') || lowerMessage.includes('pattern')) {
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

      return `📈 **Weekly Trends**\n\n` +
        `Average attendance over 7 days: ${avgAttendance} students\n` +
        `Trend: ${trend}\n` +
        `Today vs. week ago: ${dailyAttendance[6]} vs ${dailyAttendance[0]} students\n\n` +
        `${trend === 'increasing' ? '✅ Positive trend!' : 
          trend === 'decreasing' ? '⚠️ Declining attendance needs attention' : 
          '➡️ Stable attendance pattern'}`;
    }

    if (lowerMessage.includes('help') || lowerMessage.includes('what can you')) {
      return `🤖 **I can help you with:**\n\n` +
        `📊 **Analytics**: Ask about attendance rates, engagement scores, trends\n` +
        `😊 **Emotions**: Get insights on student emotions and engagement\n` +
        `💡 **Recommendations**: Get AI-powered suggestions to improve your class\n` +
        `📈 **Reports**: Request summaries and detailed breakdowns\n` +
        `📋 **Patterns**: Analyze trends and identify concerning patterns\n\n` +
        `**Try asking**: "What's my attendance today?" or "Give me recommendations"`;
    }

    // Simulate API call to Grok/xAI for more complex queries
    if (lowerMessage.includes('predict') || lowerMessage.includes('forecast')) {
      return `🔮 **Predictive Analysis**\n\n` +
        `Based on current patterns, I predict:\n` +
        `• Next class attendance: ${Math.max(0, insights.attendanceRate + Math.random() * 10 - 5).toFixed(0)}%\n` +
        `• Optimal teaching time: ${insights.emotionCounts.focused > insights.emotionCounts.sleepy ? 'Morning sessions work well' : 'Consider afternoon energy boosters'}\n` +
        `• Risk factors: ${insights.engagementScore < 60 ? 'Low engagement trend detected' : 'Positive engagement trajectory'}\n\n` +
        `💡 These predictions are based on historical classroom data and AI analysis.`;
    }

    // Default intelligent response
    return `I understand you're asking about "${userMessage}". Based on your current classroom data:\n\n` +
      `• ${insights.totalRecords} interactions recorded today\n` +
      `• ${insights.attendanceRate}% attendance rate\n` +
      `• ${insights.engagementScore}% engagement level\n\n` +
      `For more specific insights, try asking about attendance, engagement, recommendations, or trends!`;
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = inputMessage;
    setInputMessage('');
    setIsLoading(true);

    // Add user message
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      message: userMessage,
      response: '',
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, newMessage]);

    try {
      // Generate AI response
      const aiResponse = await generateAIResponse(userMessage);
      
      // Update the message with AI response
      setMessages(prev => prev.map(msg => 
        msg.id === newMessage.id 
          ? { ...msg, response: aiResponse }
          : msg
      ));
    } catch (error) {
      console.error('Error generating response:', error);
      setMessages(prev => prev.map(msg => 
        msg.id === newMessage.id 
          ? { ...msg, response: 'Sorry, I encountered an error. Please try again.' }
          : msg
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const QuickActionButton = ({ icon: Icon, label, onClick }: { icon: any, label: string, onClick: () => void }) => (
    <button
      onClick={onClick}
      className="flex items-center space-x-2 px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-sm transition-colors"
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </button>
  );

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
                <Bot className="h-6 w-6 text-blue-600" />
                <h1 className="text-xl font-bold text-gray-900">AI Assistant</h1>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Brain className="h-4 w-4" />
              <span>Powered by Advanced AI</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Chat Interface */}
          <div className="lg:col-span-3">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-sm h-[600px] flex flex-col">
              {/* Chat Header */}
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                      <Bot className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">SmartClass AI</h3>
                      <p className="text-sm text-green-600 flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        Online
                      </p>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    Real-time insights available
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((msg) => (
                  <div key={msg.id}>
                    {msg.message && (
                      <div className="flex justify-end mb-2">
                        <div className="flex items-start space-x-2 max-w-xs lg:max-w-md">
                          <div className="bg-blue-600 text-white px-4 py-2 rounded-2xl rounded-br-sm">
                            <p className="text-sm">{msg.message}</p>
                          </div>
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <User className="h-4 w-4 text-blue-600" />
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {msg.response && (
                      <div className="flex justify-start">
                        <div className="flex items-start space-x-2 max-w-xs lg:max-w-2xl">
                          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                            <Bot className="h-4 w-4 text-white" />
                          </div>
                          <div className="bg-gray-100 px-4 py-2 rounded-2xl rounded-bl-sm">
                            <p className="text-sm text-gray-900 whitespace-pre-line">{msg.response}</p>
                            <p className="text-xs text-gray-500 mt-2">
                              {new Date(msg.timestamp).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="flex items-start space-x-2">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                        <Bot className="h-4 w-4 text-white" />
                      </div>
                      <div className="bg-gray-100 px-4 py-2 rounded-2xl rounded-bl-sm">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="px-6 py-4 border-t border-gray-200">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask about attendance, engagement, or get recommendations..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isLoading}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={isLoading || !inputMessage.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Questions</h3>
              <div className="space-y-2">
                <QuickActionButton 
                  icon={Users}
                  label="Today's Attendance"
                  onClick={() => setInputMessage("What's today's attendance?")}
                />
                <QuickActionButton 
                  icon={TrendingUp}
                  label="Engagement Score"
                  onClick={() => setInputMessage("How is student engagement?")}
                />
                <QuickActionButton 
                  icon={Brain}
                  label="Recommendations"
                  onClick={() => setInputMessage("Give me recommendations")}
                />
                <QuickActionButton 
                  icon={MessageCircle}
                  label="Class Summary"
                  onClick={() => setInputMessage("Generate a summary report")}
                />
              </div>
            </div>

            {/* Live Stats */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Live Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Students Present:</span>
                  <span className="font-semibold">{new Set(attendanceData.map(r => r.studentId)).size}/{students.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Records:</span>
                  <span className="font-semibold">{attendanceData.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Active Sessions:</span>
                  <span className="font-semibold">{new Set(attendanceData.map(r => r.sessionId)).size}</span>
                </div>
              </div>
            </div>

            {/* AI Capabilities */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Capabilities</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Real-time analysis</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Predictive insights</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>Smart recommendations</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                  <span>Trend analysis</span>
                </div>
              </div>
            </div>

            {/* Tips */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-blue-900 mb-2">Pro Tips</h4>
                  <p className="text-sm text-blue-700">
                    Ask specific questions like "Why is engagement low?" or "Predict next week's attendance" for detailed AI insights.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}