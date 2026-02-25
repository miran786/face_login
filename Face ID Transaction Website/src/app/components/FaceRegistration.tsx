import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Scan, CheckCircle2, AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from './ui/button';
import { UserData } from './Registration';

interface FaceRegistrationProps {
  userData: UserData;
  onComplete: () => void;
}

type ScanStage = 'center' | 'left' | 'right' | 'up' | 'down' | 'complete';

export function FaceRegistration({ userData, onComplete }: FaceRegistrationProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStage, setScanStage] = useState<ScanStage>('center');
  const [scanProgress, setScanProgress] = useState(0);
  const [cameraError, setCameraError] = useState(false);
  const [faceRotation, setFaceRotation] = useState({ x: 0, y: 0 });

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

  const stages: ScanStage[] = ['center', 'left', 'right', 'up', 'down'];

  const handleStartScan = () => {
    setIsScanning(true);
    setScanProgress(0);
    setScanStage('center');
    
    let currentStageIndex = 0;
    let progress = 0;

    const interval = setInterval(() => {
      progress += 2;
      setScanProgress(progress);

      // Update face rotation based on stage
      const stage = stages[currentStageIndex];
      switch (stage) {
        case 'center':
          setFaceRotation({ x: 0, y: 0 });
          break;
        case 'left':
          setFaceRotation({ x: 0, y: -25 });
          break;
        case 'right':
          setFaceRotation({ x: 0, y: 25 });
          break;
        case 'up':
          setFaceRotation({ x: -20, y: 0 });
          break;
        case 'down':
          setFaceRotation({ x: 20, y: 0 });
          break;
      }

      // Move to next stage every 20%
      if (progress % 20 === 0 && progress < 100) {
        currentStageIndex++;
        if (currentStageIndex < stages.length) {
          setScanStage(stages[currentStageIndex]);
        }
      }

      if (progress >= 100) {
        clearInterval(interval);
        setScanStage('complete');
        setTimeout(() => {
          onComplete();
        }, 1500);
      }
    }, 100);
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
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            {isScanning ? 'Scanning...' : 'Register Your Face'}
          </h1>
          <p className="text-purple-300">
            {isScanning ? getInstructionText() : `Hi ${userData.fullName.split(' ')[0]}! Let's set up Face ID`}
          </p>
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

            {/* 3D Face Mesh Overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <motion.div
                animate={{
                  rotateX: faceRotation.x,
                  rotateY: faceRotation.y,
                }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                style={{ transformStyle: 'preserve-3d', perspective: '1000px' }}
                className="relative"
              >
                {/* 3D Face Wireframe */}
                <svg
                  width="240"
                  height="300"
                  viewBox="0 0 240 300"
                  className="drop-shadow-2xl"
                  style={{ filter: 'drop-shadow(0 0 20px rgba(168, 85, 247, 0.6))' }}
                >
                  {/* Face outline */}
                  <ellipse
                    cx="120"
                    cy="140"
                    rx="90"
                    ry="120"
                    fill="none"
                    stroke={scanStage === 'complete' ? '#10b981' : '#a855f7'}
                    strokeWidth="3"
                    opacity="0.8"
                  />
                  
                  {/* Vertical lines */}
                  <line x1="120" y1="20" x2="120" y2="260" stroke="#a855f7" strokeWidth="2" opacity="0.6" />
                  <line x1="80" y1="30" x2="80" y2="250" stroke="#a855f7" strokeWidth="1.5" opacity="0.4" />
                  <line x1="160" y1="30" x2="160" y2="250" stroke="#a855f7" strokeWidth="1.5" opacity="0.4" />
                  
                  {/* Horizontal lines */}
                  <line x1="30" y1="80" x2="210" y2="80" stroke="#a855f7" strokeWidth="1.5" opacity="0.4" />
                  <line x1="30" y1="140" x2="210" y2="140" stroke="#a855f7" strokeWidth="2" opacity="0.6" />
                  <line x1="30" y1="200" x2="210" y2="200" stroke="#a855f7" strokeWidth="1.5" opacity="0.4" />
                  
                  {/* Eyes */}
                  <circle cx="85" cy="110" r="12" fill="none" stroke="#a855f7" strokeWidth="2" opacity="0.8" />
                  <circle cx="155" cy="110" r="12" fill="none" stroke="#a855f7" strokeWidth="2" opacity="0.8" />
                  <circle cx="85" cy="110" r="5" fill="#a855f7" opacity="0.8" />
                  <circle cx="155" cy="110" r="5" fill="#a855f7" opacity="0.8" />
                  
                  {/* Nose */}
                  <path
                    d="M 120 125 L 110 155 L 120 160 L 130 155 Z"
                    fill="none"
                    stroke="#a855f7"
                    strokeWidth="2"
                    opacity="0.6"
                  />
                  
                  {/* Mouth */}
                  <path
                    d="M 90 190 Q 120 205 150 190"
                    fill="none"
                    stroke="#a855f7"
                    strokeWidth="2.5"
                    opacity="0.7"
                  />
                  
                  {/* Scan points */}
                  {[...Array(50)].map((_, i) => {
                    const angle = (i / 50) * Math.PI * 2;
                    const rx = 90;
                    const ry = 120;
                    const x = 120 + rx * Math.cos(angle);
                    const y = 140 + ry * Math.sin(angle);
                    
                    return (
                      <motion.circle
                        key={i}
                        cx={x}
                        cy={y}
                        r="2"
                        fill="#10b981"
                        initial={{ opacity: 0 }}
                        animate={{
                          opacity: isScanning && scanProgress > (i * 2) ? 1 : 0,
                        }}
                        transition={{ duration: 0.2 }}
                      />
                    );
                  })}
                </svg>

                {/* Direction indicator */}
                {isScanning && scanStage !== 'complete' && scanStage !== 'center' && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-8 left-1/2 -translate-x-1/2"
                  >
                    <div className="bg-purple-500 text-white text-xs px-3 py-1 rounded-full">
                      {scanStage === 'left' && '← Turn left'}
                      {scanStage === 'right' && 'Turn right →'}
                      {scanStage === 'up' && '↑ Look up'}
                      {scanStage === 'down' && '↓ Look down'}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            </div>

            {/* Scanning animation */}
            {isScanning && scanStage !== 'complete' && (
              <motion.div
                initial={{ top: 0 }}
                animate={{ top: '100%' }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-purple-400 to-transparent"
                style={{ boxShadow: '0 0 20px rgba(168, 85, 247, 0.8)' }}
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
                  className={`h-full ${
                    scanStage === 'complete'
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                      : 'bg-gradient-to-r from-purple-500 to-pink-500'
                  }`}
                />
              </div>
              <div className="flex justify-between mt-2">
                <p className="text-white text-sm">{scanProgress}%</p>
                <p className="text-purple-300 text-sm">
                  Step {stages.indexOf(scanStage) + 1} of {stages.length}
                </p>
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
