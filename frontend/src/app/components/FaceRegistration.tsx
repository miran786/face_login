import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Scan, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';
import { UserData } from './Registration';

import * as faceapi from 'face-api.js';

interface FaceRegistrationProps {
  userData: UserData;
  onComplete: (descriptor: number[]) => void;
  onBack?: () => void;
}

type ScanStage = 'center' | 'left' | 'right' | 'up' | 'down' | 'complete';

export function FaceRegistration({ userData, onComplete, onBack }: FaceRegistrationProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStage, setScanStage] = useState<ScanStage>('center');
  const [scanProgress, setScanProgress] = useState(0);
  const [cameraError, setCameraError] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const loadModels = async () => {
      try {
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
          faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
          faceapi.nets.faceRecognitionNet.loadFromUri('/models')
        ]);
        setModelsLoaded(true);
      } catch (err) {
        console.error('Failed to load FaceAPI models', err);
        setErrorMsg('Failed to initialize AI ML models.');
      }
    };
    loadModels();
  }, []);

  useEffect(() => {
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' }
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error('Camera access error:', err);
        setCameraError(true);
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleStartScan = async () => {
    if (!modelsLoaded || !videoRef.current) return;
    setIsScanning(true);
    setScanProgress(0);
    setScanStage('center');
    setErrorMsg('');

    try {
      setScanProgress(25);
      // Ensure video is playing and ready
      if (videoRef.current.videoWidth === 0) {
        throw new Error("Video not ready yet.");
      }

      // Add retry logic for detection to allow camera stabilization
      let detection = null;
      let attempts = 0;
      const maxAttempts = 20; // Reduced from 50 for better performance
      const delayMs = 150; // Slightly faster retry

      while (!detection && attempts < maxAttempts) {
        attempts++;
        detection = await faceapi.detectSingleFace(videoRef.current)
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (!detection && attempts < maxAttempts) {
          // Progress update to show we are still trying
          setScanProgress(25 + (attempts * 2.5));
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }

      setScanProgress(75);

      if (!detection) {
        throw new Error("No face detected. Please ensure good lighting, look directly at the camera, and ensure your full face is visible.");
      }

      setScanProgress(100);
      setScanStage('complete');

      // Convert Float32Array to standard array
      const descriptorArray = Array.from(detection.descriptor);

      timeoutRef.current = setTimeout(() => {
        onComplete(descriptorArray);
      }, 1500);

    } catch (err: any) {
      console.error('Scan Error:', err);
      setErrorMsg(err.message || 'Failed to scan face');
      setIsScanning(false);
      setScanProgress(0);
    }
  };

  const getInstructionText = () => {
    switch (scanStage) {
      case 'center':
        return 'Look straight at the camera';
      case 'left':
        return 'Turn your head slightly left';
      case 'right':
        return 'Turn your head slightly right';
      case 'up':
        return 'Tilt your head slightly up';
      case 'down':
        return 'Tilt your head slightly down';
      case 'complete':
        return 'Face scan complete!';
      default:
        return 'Position your face in the frame';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-black flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full"
      >
        <div className="flex items-center gap-4 mb-8">
          {onBack && !isScanning && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="text-white hover:bg-white/10"
            >
              <ArrowLeft />
            </Button>
          )}
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              {isScanning ? 'Scanning...' : 'Register Your Face'}
            </h1>
            <p className="text-purple-300">
              {isScanning ? getInstructionText() : `Hi ${userData.fullName.split(' ')[0]}! Let's set up Face ID`}
            </p>
          </div>
        </div>

        {/* Main scanning area */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-2xl mb-6">
          <div className="relative aspect-square mb-6 rounded-2xl overflow-hidden bg-black">
            {/* Camera feed */}
            {cameraError ? (
              <div className="absolute inset-0 flex items-center justify-center text-white bg-gray-900">
                <div className="text-center">
                  <AlertCircle className="w-16 h-16 mx-auto mb-3 text-purple-400" />
                  <p>Camera not available</p>
                  <p className="text-sm text-gray-400 mt-1">Using simulation mode</p>
                </div>
              </div>
            ) : (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            )}

            {/* Scan points - Replaced with scanning gradient to look clean */}
            {isScanning && !errorMsg && (
              <motion.div
                initial={{ top: 0 }}
                animate={{ top: '100%' }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-purple-400 to-transparent z-10"
              />
            )}

            {/* Face detection frame */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <motion.div
                animate={isScanning ? {
                  scale: [1, 1.05, 1],
                  opacity: [0.5, 1, 0.5],
                } : {}}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-64 h-80 border-4 border-purple-500 rounded-3xl"
                style={{
                  boxShadow: '0 0 40px rgba(168, 85, 247, 0.4)',
                }}
              >
                {/* Corner indicators */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-2xl" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-2xl" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-2xl" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-2xl" />
              </motion.div>
            </div>



            {/* Success overlay */}
            {scanStage === 'complete' && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="absolute inset-0 bg-green-500/20 backdrop-blur-sm flex items-center justify-center"
              >
                <CheckCircle2 className="w-24 h-24 text-green-400" />
              </motion.div>
            )}
          </div>

          {/* Progress bar */}
          {isScanning && (
            <div className="mb-4">
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${scanProgress}%` }}
                  className={`h-full ${scanStage === 'complete'
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                    : 'bg-gradient-to-r from-purple-500 to-pink-500'
                    }`}
                />
              </div>
              <div className="flex justify-between mt-2">
                <p className="text-white text-sm">{scanProgress}%</p>
                <p className="text-purple-300 text-sm">
                  Applying ML Algorithms...
                </p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-xl mb-4">
              <p className="text-center text-red-400 text-sm font-medium">{errorMsg}</p>
            </div>
          )}

          {/* Action button */}
          {!isScanning && (
            <Button
              onClick={handleStartScan}
              disabled={!modelsLoaded}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white py-6 rounded-2xl text-lg disabled:opacity-50"
            >
              <Scan className="mr-2" />
              {modelsLoaded ? 'Scan Face ID' : 'Loading ML Models...'}
            </Button>
          )}

          {scanStage === 'complete' && (
            <div className="text-center">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-400" />
              <p className="text-green-400">Registration Complete!</p>
            </div>
          )}
        </div>

        {/* Instructions */}
        {!isScanning && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="space-y-3"
          >
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-3 flex items-center gap-3">
              <div className="bg-purple-500/20 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
                <span className="text-purple-300 text-sm">1</span>
              </div>
              <p className="text-purple-200 text-sm">Position your face in the center</p>
            </div>

            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-3 flex items-center gap-3">
              <div className="bg-purple-500/20 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
                <span className="text-purple-300 text-sm">2</span>
              </div>
              <p className="text-purple-200 text-sm">Follow the on-screen instructions</p>
            </div>

            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-3 flex items-center gap-3">
              <div className="bg-purple-500/20 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
                <span className="text-purple-300 text-sm">3</span>
              </div>
              <p className="text-purple-200 text-sm">Keep your face visible and well-lit</p>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
