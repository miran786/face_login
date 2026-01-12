import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Scan, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import type { UserData } from './Registration';
import { faceService } from '../../services/faceService';

interface FaceRegistrationProps {
  userData: UserData;
  onComplete: (descriptor: Float32Array) => void;
}

type ScanStage = 'loading' | 'center' | 'scanning' | 'complete';

export function FaceRegistration({ userData, onComplete }: FaceRegistrationProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStage, setScanStage] = useState<ScanStage>('center');
  const [scanProgress, setScanProgress] = useState(0);
  const [cameraError, setCameraError] = useState(false);
  const [detectedFace, setDetectedFace] = useState(false);

  useEffect(() => {
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        await faceService.loadModels(); // Pre-load models
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: 640, height: 480 }
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

  // Optimization: Lower threshold for faster "success" feeling, but keep real detection
  const handleStartScan = async () => {
    if (!videoRef.current) return;

    setIsScanning(true);
    setScanStage('loading');
    setScanProgress(0);

    const detectLoop = setInterval(async () => {
      if (!videoRef.current || videoRef.current.paused || videoRef.current.ended) return;

      // Faster detection settings
      const descriptor = await faceService.detectFace(videoRef.current);

      if (descriptor) {
        setDetectedFace(true);
        setScanStage('scanning');
        // Faster progress: +20 per frame => 5 good frames needed
        setScanProgress(prev => {
          const newProgress = Math.min(prev + 20, 100);
          if (newProgress >= 100) {
            clearInterval(detectLoop);
            setScanStage('complete');
            setTimeout(() => {
              onComplete(descriptor);
            }, 800);
          }
          return newProgress;
        });
      } else {
        setDetectedFace(false);
      }
    }, 100); // Check every 100ms instead of 200ms
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-black flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            {isScanning ? 'Scanning...' : 'Register Your Face'}
          </h1>
          <p className="text-purple-300">
            {isScanning
              ? (scanStage === 'loading' ? 'Preparing camera...' : 'Keep your face inside the oval')
              : `Hi ${userData.fullName.split(' ')[0]}! Let's set up Face ID`}
          </p>
        </div>

        {/* Main scanning area - Face Guide Added */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-2xl mb-6">
          <div className="relative aspect-square mb-6 rounded-2xl overflow-hidden bg-black flex items-center justify-center">
            {/* Camera feed */}
            {cameraError ? (
              <div className="absolute inset-0 flex items-center justify-center text-white bg-gray-900">
                <div className="text-center">
                  <AlertCircle className="w-16 h-16 mx-auto mb-3 text-purple-400" />
                  <p>Camera not available</p>
                </div>
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="absolute inset-0 w-full h-full object-cover transform scale-x-[-1]"
                />

                {/* Face Guide Overlay */}
                <div className={`absolute inset-0 border-[3px] border-dashed rounded-[45%] w-[65%] h-[80%] m-auto transition-colors duration-300 ${detectedFace ? 'border-green-400 bg-green-500/10' : 'border-white/50'
                  }`}>
                  {/* Corner accents */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-1 bg-white/50"></div>
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-4 h-1 bg-white/50"></div>
                </div>
              </>
            )}

            {/* Scanning animation */}
            {isScanning && scanStage === 'scanning' && (
              <motion.div
                initial={{ top: 0 }}
                animate={{ top: '100%' }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-green-400 to-transparent shadow-[0_0_15px_rgba(74,222,128,0.5)]"
              />
            )}

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
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                />
              </div>
              <div className="flex justify-between mt-2">
                <p className="text-white text-sm">{Math.round(scanProgress)}%</p>
              </div>
            </div>
          )}

          {/* Action button */}
          {!isScanning && (
            <Button
              onClick={handleStartScan}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white py-6 rounded-2xl text-lg"
            >
              <Scan className="mr-2" />
              Start Face Scan
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
