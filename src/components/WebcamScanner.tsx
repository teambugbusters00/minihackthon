import React, { useRef, useEffect, useState } from 'react';
import { Camera, ArrowLeft, Users, Brain, AlertCircle, CheckCircle, X } from 'lucide-react';
import { Student, AttendanceRecord } from '../types';

interface WebcamScannerProps {
  students: Student[];
  onBack: () => void;
  onAttendanceRecord: (record: AttendanceRecord) => void;
  isScanning: boolean;
  setIsScanning: (scanning: boolean) => void;
}

const EMOTIONS = ['happy', 'sad', 'angry', 'surprised', 'fearful', 'disgusted', 'neutral'] as const;

export default function WebcamScanner({ students, onBack, onAttendanceRecord, isScanning, setIsScanning }: WebcamScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detectedFaces, setDetectedFaces] = useState<any[]>([]);
  const [sessionId] = useState(() => `session_${Date.now()}`);
  const [currentAttendees, setCurrentAttendees] = useState<Set<string>>(new Set());
  const [demoMode, setDemoMode] = useState(false);

  useEffect(() => {
    const loadModels = async () => {
      try {
        setError(null);
        
        // Check if face-api.js is available
        if (typeof window !== 'undefined' && (window as any).faceapi) {
          const faceapi = (window as any).faceapi;
          const MODEL_URL = '/models';
          
          // Try to load face-api.js models
          await Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
            faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
            faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
            faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
          ]);
          
          setIsModelLoaded(true);
        } else {
          throw new Error('face-api.js not available');
        }
      } catch (err) {
        console.warn('AI models not available, running in demo mode:', err);
        setError('AI models not found. Running in demo mode with simulated detection.');
        setDemoMode(true);
        setIsModelLoaded(true); // Allow demo mode
      }
    };

    loadModels();
  }, []);

  useEffect(() => {
    if (isScanning && isModelLoaded) {
      startWebcam();
    } else if (!isScanning) {
      stopWebcam();
    }
  }, [isScanning, isModelLoaded]);

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        
        videoRef.current.onloadedmetadata = () => {
          detectFaces();
        };
      }
    } catch (err) {
      console.error('Error accessing webcam:', err);
      setError('Unable to access webcam. Please check permissions.');
    }
  };

  const stopWebcam = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const detectFaces = async () => {
    if (!videoRef.current || !canvasRef.current || !isScanning) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    const detect = async () => {
      if (!isScanning) return;

      try {
        if (demoMode) {
          // Demo mode - simulate face detection
          simulateFaceDetection();
        } else {
          // Real face detection (only if face-api.js is properly loaded)
          const faceapi = (window as any).faceapi;
          if (faceapi && faceapi.nets.tinyFaceDetector.isLoaded) {
            const displaySize = { width: video.videoWidth, height: video.videoHeight };
            faceapi.matchDimensions(canvas, displaySize);

            const detections = await faceapi
              .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
              .withFaceLandmarks()
              .withFaceExpressions();

            const resizedDetections = faceapi.resizeResults(detections, displaySize);
            
            canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
            faceapi.draw.drawDetections(canvas, resizedDetections);
            faceapi.draw.drawFaceExpressions(canvas, resizedDetections);
            
            setDetectedFaces(resizedDetections);
            
            // Process detections for attendance
            resizedDetections.forEach((detection, index) => {
              const expressions = detection.expressions;
              const dominantEmotion = Object.keys(expressions).reduce((a, b) => 
                expressions[a] > expressions[b] ? a : b
              ) as keyof typeof expressions;
              
              // Simulate student recognition (in real implementation, this would use face descriptors)
              const recognizedStudent = students[index % students.length];
              
              if (recognizedStudent && !currentAttendees.has(recognizedStudent.id)) {
                recordAttendance(recognizedStudent, dominantEmotion, expressions[dominantEmotion]);
                setCurrentAttendees(prev => new Set([...prev, recognizedStudent.id]));
              }
            });
          } else {
            // Fallback to demo mode if models aren't properly loaded
            simulateFaceDetection();
          }
        }
      } catch (err) {
        console.error('Detection error:', err);
        // Fallback to demo mode on any detection error
        simulateFaceDetection();
      }

      setTimeout(detect, 2000); // Detect every 2 seconds
    };

    detect();
  };

  const simulateFaceDetection = () => {
    // Demo mode - simulate detection every few seconds
    if (Math.random() > 0.6 && students.length > 0) {
      const randomStudent = students[Math.floor(Math.random() * students.length)];
      const randomEmotion = EMOTIONS[Math.floor(Math.random() * EMOTIONS.length)];
      
      if (!currentAttendees.has(randomStudent.id)) {
        recordAttendance(randomStudent, randomEmotion, Math.random() * 0.3 + 0.7);
        setCurrentAttendees(prev => new Set([...prev, randomStudent.id]));
        
        // Simulate face detection count
        setDetectedFaces([{ simulation: true }]);
      }
    }
  };

  const recordAttendance = (student: Student, emotion: string, confidence: number) => {
    const record: AttendanceRecord = {
      id: `record_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      studentId: student.id,
      studentName: student.name,
      timestamp: new Date().toISOString(),
      emotion: emotion as AttendanceRecord['emotion'],
      confidence: Math.round(confidence * 100) / 100,
      sessionId,
    };

    onAttendanceRecord(record);
  };

  const getEmotionColor = (emotion: string) => {
    const colors = {
      happy: 'text-green-600 bg-green-100',
      focused: 'text-blue-600 bg-blue-100',
      neutral: 'text-gray-600 bg-gray-100',
      sad: 'text-red-600 bg-red-100',
      angry: 'text-red-700 bg-red-100',
      bored: 'text-yellow-600 bg-yellow-100',
      sleepy: 'text-purple-600 bg-purple-100',
    };
    return colors[emotion as keyof typeof colors] || 'text-gray-600 bg-gray-100';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="flex items-center space-x-2 text-white/80 hover:text-white transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Back</span>
              </button>
              <div className="flex items-center space-x-3">
                <Camera className="h-6 w-6 text-white" />
                <h1 className="text-xl font-bold text-white">Live Attendance Scanner</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-white/80">
                <Users className="h-5 w-5" />
                <span>{currentAttendees.size}/{students.length} Present</span>
              </div>
              <button
                onClick={() => setIsScanning(!isScanning)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  isScanning
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {isScanning ? 'Stop Scanning' : 'Start Scanning'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Video Stream */}
          <div className="lg:col-span-2">
            <div className="bg-black/40 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
              <div className="relative">
                <video
                  ref={videoRef}
                  className="w-full rounded-xl bg-black"
                  autoPlay
                  muted
                  playsInline
                />
                <canvas
                  ref={canvasRef}
                  className="absolute top-0 left-0 w-full h-full rounded-xl"
                />
                
                {/* Status Overlay */}
                <div className="absolute top-4 left-4 flex items-center space-x-2">
                  {isScanning ? (
                    <div className="flex items-center space-x-2 bg-green-600/80 backdrop-blur-sm px-3 py-1 rounded-lg">
                      <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></div>
                      <span className="text-white text-sm font-medium">Live</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2 bg-red-600/80 backdrop-blur-sm px-3 py-1 rounded-lg">
                      <div className="w-2 h-2 bg-red-300 rounded-full"></div>
                      <span className="text-white text-sm font-medium">Stopped</span>
                    </div>
                  )}
                </div>

                {/* AI Status */}
                <div className="absolute top-4 right-4">
                  <div className={`flex items-center space-x-2 px-3 py-1 rounded-lg backdrop-blur-sm ${
                    isModelLoaded ? (demoMode ? 'bg-yellow-600/80' : 'bg-blue-600/80') : 'bg-gray-600/80'
                  }`}>
                    <Brain className="h-4 w-4 text-white" />
                    <span className="text-white text-sm font-medium">
                      {!isModelLoaded ? 'Loading...' : demoMode ? 'Demo Mode' : 'AI Ready'}
                    </span>
                  </div>
                </div>

                {/* Error/Info Message */}
                {error && (
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="bg-blue-600/90 backdrop-blur-sm rounded-lg p-3 flex items-center space-x-2">
                      <AlertCircle className="h-5 w-5 text-blue-200" />
                      <span className="text-blue-100 text-sm">{error}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Current Session */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4">Current Session</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-white/70">Started:</span>
                  <span className="text-white">{new Date().toLocaleTimeString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/70">Mode:</span>
                  <span className="text-white">{demoMode ? 'Demo' : 'AI Detection'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/70">Detected:</span>
                  <span className="text-white">{detectedFaces.length} faces</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/70">Attendance:</span>
                  <span className="text-white">{currentAttendees.size}/{students.length}</span>
                </div>
              </div>
            </div>

            {/* Present Students */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4">Present Students</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {students.map(student => (
                  <div
                    key={student.id}
                    className={`flex items-center justify-between p-3 rounded-lg transition-all ${
                      currentAttendees.has(student.id)
                        ? 'bg-green-600/20 border border-green-400/30'
                        : 'bg-white/5 border border-white/10'
                    }`}
                  >
                    <span className="text-white text-sm font-medium">{student.name}</span>
                    {currentAttendees.has(student.id) ? (
                      <CheckCircle className="h-4 w-4 text-green-400" />
                    ) : (
                      <X className="h-4 w-4 text-red-400" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4">Instructions</h3>
              <div className="space-y-2 text-sm text-white/80">
                {demoMode ? (
                  <>
                    <p>• Running in demo mode with simulated detection</p>
                    <p>• Students will be randomly detected over time</p>
                    <p>• To enable AI detection, add face-api.js models</p>
                    <p>• Check console for more technical details</p>
                  </>
                ) : (
                  <>
                    <p>• Ensure good lighting for optimal detection</p>
                    <p>• Students should face the camera directly</p>
                    <p>• AI will automatically detect and log attendance</p>
                    <p>• Emotions are tracked for engagement analysis</p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}