import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, MessageCircle, Send, Bot, User, Brain, TrendingUp, Users, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { AttendanceRecord, Student, ChatMessage } from '../types';
import { chatAPI } from '../services/api';

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
      response: 'Hello! I\'m your AI assistant powered by Grok AI for SmartClass Sentinel+. I can provide real-time insights about attendance, engagement, and classroom analytics using advanced AI. What would you like to know?',
      timestamp: new Date().toISOString(),
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    checkBackendHealth();
  }, []);

  const checkBackendHealth = async () => {
    try {
      await chatAPI.healthCheck();
      setBackendStatus('online');
      setIsOnline(true);
    } catch (error) {
      console.error('Backend health check failed:', error);
      setBackendStatus('offline');
      setIsOnline(false);
    }
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
      // Call backend API with Grok integration
      const response = await chatAPI.sendMessage(userMessage, attendanceData, students);
      
      // Update the message with AI response
      setMessages(prev => prev.map(msg => 
        msg.id === newMessage.id 
          ? { 
              ...msg, 
              response: response.response,
              insights: response.insights,
              fallback: response.fallback 
            }
          : msg
      ));

      // Update online status
      setIsOnline(true);
      setBackendStatus('online');
      
    } catch (error) {
      console.error('Error getting AI response:', error);
      
      // Fallback to local response
      const fallbackResponse = generateLocalFallback(userMessage);
      setMessages(prev => prev.map(msg => 
        msg.id === newMessage.id 
          ? { ...msg, response: fallbackResponse, fallback: true }
          : msg
      ));
      
      setIsOnline(false);
      setBackendStatus('offline');
    } finally {
      setIsLoading(false);
    }
  };

  const generateLocalFallback = (message: string): string => {
    const lowerMessage = message.toLowerCase();
    const presentStudents = new Set(attendanceData.map(r => r.studentId)).size;
    const attendanceRate = Math.round((presentStudents / students.length) * 100);
    
    if (lowerMessage.includes('attendance')) {
      return `📊 Today's attendance is ${attendanceRate}% with ${presentStudents} out of ${students.length} students present. (Note: AI service temporarily unavailable - showing basic stats)`;
    }
    
    if (lowerMessage.includes('engagement')) {
      const positiveEmotions = attendanceData.filter(r => ['happy', 'focused'].includes(r.emotion)).length;
      const engagementScore = attendanceData.length > 0 ? Math.round((positiveEmotions / attendanceData.length) * 100) : 0;
      return `🧠 Current engagement score is ${engagementScore}%. (Note: AI service temporarily unavailable - showing basic calculation)`;
    }
    
    return `I understand you're asking about "${message}". The AI service is currently unavailable, but I can provide basic classroom statistics. Try asking about attendance or engagement for available data.`;
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
            <div className="flex items-center space-x-4">
              <div className={`flex items-center space-x-2 text-sm ${
                backendStatus === 'online' ? 'text-green-600' : 
                backendStatus === 'offline' ? 'text-red-600' : 'text-yellow-600'
              }`}>
                {backendStatus === 'online' ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
                <span>
                  {backendStatus === 'checking' ? 'Checking...' :
                   backendStatus === 'online' ? 'Grok AI Online' : 'Offline Mode'}
                </span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Brain className="h-4 w-4" />
                <span>Powered by Grok AI</span>
              </div>
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
                      <p className={`text-sm flex items-center ${
                        isOnline ? 'text-green-600' : 'text-red-600'
                      }`}>
                        <div className={`w-2 h-2 rounded-full mr-2 ${
                          isOnline ? 'bg-green-500' : 'bg-red-500'
                        }`}></div>
                        {isOnline ? 'Grok AI Connected' : 'Offline Mode'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={checkBackendHealth}
                    className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    Refresh Connection
                  </button>
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
                            {(msg as any).fallback && (
                              <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700">
                                ⚠️ Fallback response - AI service unavailable
                              </div>
                            )}
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
                        <div className="flex items-center space-x-2">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                          <span className="text-xs text-gray-500">
                            {isOnline ? 'Grok AI thinking...' : 'Processing locally...'}
                          </span>
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
                    placeholder={isOnline ? "Ask Grok AI about attendance, engagement, or get recommendations..." : "AI offline - basic responses available..."}
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
            {/* Connection Status */}
            <div className={`backdrop-blur-sm rounded-2xl p-6 border shadow-sm ${
              backendStatus === 'online' ? 'bg-green-50/80 border-green-200' :
              backendStatus === 'offline' ? 'bg-red-50/80 border-red-200' :
              'bg-yellow-50/80 border-yellow-200'
            }`}>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Status</h3>
              <div className="flex items-center space-x-2">
                {backendStatus === 'online' ? (
                  <>
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-green-700 font-medium">Grok AI Connected</span>
                  </>
                ) : backendStatus === 'offline' ? (
                  <>
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-red-700 font-medium">AI Offline</span>
                  </>
                ) : (
                  <>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
                    <span className="text-yellow-700 font-medium">Connecting...</span>
                  </>
                )}
              </div>
              <p className="text-sm text-gray-600 mt-2">
                {backendStatus === 'online' ? 'Full AI capabilities available' :
                 backendStatus === 'offline' ? 'Basic responses only' :
                 'Checking connection...'}
              </p>
            </div>

            {/* Quick Actions */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Questions</h3>
              <div className="space-y-2">
                <QuickActionButton 
                  icon={Users}
                  label="Today's Attendance"
                  onClick={() => setInputMessage("What's today's attendance rate and how does it compare to our average?")}
                />
                <QuickActionButton 
                  icon={TrendingUp}
                  label="Engagement Analysis"
                  onClick={() => setInputMessage("Analyze current student engagement and provide detailed insights")}
                />
                <QuickActionButton 
                  icon={Brain}
                  label="AI Recommendations"
                  onClick={() => setInputMessage("Give me personalized recommendations to improve my classroom")}
                />
                <QuickActionButton 
                  icon={MessageCircle}
                  label="Predictive Insights"
                  onClick={() => setInputMessage("What patterns do you see and what should I expect next week?")}
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
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">AI Responses:</span>
                  <span className="font-semibold">{messages.filter(m => m.response).length}</span>
                </div>
              </div>
            </div>

            {/* AI Capabilities */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Grok AI Features</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                  <span>Real-time analysis</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-blue-500' : 'bg-gray-400'}`}></div>
                  <span>Predictive insights</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-purple-500' : 'bg-gray-400'}`}></div>
                  <span>Smart recommendations</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-amber-500' : 'bg-gray-400'}`}></div>
                  <span>Advanced pattern recognition</span>
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
                    {isOnline 
                      ? "Ask complex questions like 'Why is engagement dropping?' or 'Predict next week's attendance patterns' for advanced AI insights."
                      : "AI is offline. Try basic questions about current attendance and engagement for available data."
                    }
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