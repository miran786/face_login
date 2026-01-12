import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Scan, CheckCircle2, Lock, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { faceService } from '../../services/faceService';
import * as faceapi from 'face-api.js';
import { db } from '../../db';

interface FaceAuthProps {
  onAuthSuccess: (user: any) => void;
  onRegister: () => void;
}

export function FaceAuth({ onAuthSuccess, onRegister }: FaceAuthProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [authStatus, setAuthStatus] = useState<'idle' | 'scanning' | 'success' | 'failed'>('idle');
  const [cameraError, setCameraError] = useState(false);

  useEffect(() => {
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        await faceService.loadModels();
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

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isScanningRef = useRef(false);
  const consecutiveFailuresRef = useRef(0);
  const MAX_FAILURES = 60; // Increased since we are scanning constantly

  // Main tracking loop
  useEffect(() => {
    let animationFrameId: number;
    let isTracking = true;

    const trackFace = async () => {
      if (!videoRef.current || !canvasRef.current || !isTracking) return;

      // Ensure video dimensions match canvas
      if (videoRef.current.readyState === 4) {
        const video = videoRef.current;
        const canvas = canvasRef.current;

        // Match dimensions
        const displaySize = { width: video.videoWidth, height: video.videoHeight };
        if (canvas.width !== displaySize.width || canvas.height !== displaySize.height) {
          faceapi.matchDimensions(canvas, displaySize);
        }

        try {
          // Detect face with landmarks
          const detection = await faceService.detectFace(video);

          // Clear previous drawings
          const ctx = canvas.getContext('2d');
          if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);

          if (detection) {
            // Resize detection to match canvas size
            const resizedDetections = faceapi.resizeResults(detection, displaySize);

            // Draw visual markers (Custom White Box)
            const box = resizedDetections.detection.box;
            if (ctx) {
              ctx.strokeStyle = '#ffffff';
              ctx.lineWidth = 2;
              ctx.strokeRect(box.x, box.y, box.width, box.height);
            }

            if (isScanningRef.current) {
              const users = await db.users.toArray();
              const matchedUser = faceService.matchFace(detection.descriptor, users);

              if (matchedUser) {
                setAuthStatus('success');
                isScanningRef.current = false;
                setIsScanning(false);
                setTimeout(() => onAuthSuccess(matchedUser), 1000);
              } else {
                consecutiveFailuresRef.current++;
              }
            }
          } else {
            if (isScanningRef.current) {
              consecutiveFailuresRef.current++;
            }
          }

          if (isScanningRef.current && consecutiveFailuresRef.current > MAX_FAILURES) {
            setAuthStatus('failed');
            setIsScanning(false);
            isScanningRef.current = false;
          }

        } catch (err) {
          console.error("Tracking error:", err);
        }
      }

      animationFrameId = requestAnimationFrame(trackFace);
    };

    trackFace();

    return () => {
      isTracking = false;
      cancelAnimationFrame(animationFrameId);
    };
  }, []); // Run once on mount

  const handleStartLogin = () => {
    // Just enable the auth check logic flag
    isScanningRef.current = true;
    consecutiveFailuresRef.current = 0;
    setAuthStatus('scanning');
    setIsScanning(true); // Keep this to trigger UI changes
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isScanningRef.current = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-black flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
            className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mb-4"
          >
            <Lock className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-4xl font-bold text-white mb-2">FaceWallet</h1>
          <p className="text-purple-300">Secure transactions with your face</p>
        </div>

        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-2xl">
          <div className="relative aspect-square mb-6 rounded-2xl overflow-hidden bg-black">
            {cameraError ? (
              <div className="absolute inset-0 flex items-center justify-center text-white bg-gray-900">
                <div className="text-center">
                  <Scan className="w-16 h-16 mx-auto mb-3 text-purple-400" />
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
                  className="w-full h-full object-cover transform scale-x-[-1]"
                />
                {/* Canvas for Face Landmarks */}
                <canvas
                  ref={canvasRef}
                  className="absolute inset-0 w-full h-full object-cover transform scale-x-[-1]"
                />
              </>
            )}

            {/* Scanning overlay */}
            {authStatus === 'scanning' && (
              <motion.div
                initial={{ top: 0 }}
                animate={{ top: '100%' }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-purple-400 to-transparent shadow-[0_0_15px_rgba(168,85,247,0.5)]"
              />
            )}

            {/* Status Overlays */}
            {authStatus === 'success' && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="absolute inset-0 bg-green-500/20 backdrop-blur-sm flex items-center justify-center"
              >
                <div className="text-center">
                  <CheckCircle2 className="w-20 h-20 text-green-400 mx-auto mb-2" />
                  <p className="text-green-400 font-bold">Verified</p>
                </div>
              </motion.div>
            )}

            {authStatus === 'failed' && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="absolute inset-0 bg-red-500/20 backdrop-blur-sm flex items-center justify-center"
              >
                <div className="text-center">
                  <AlertCircle className="w-20 h-20 text-red-400 mx-auto mb-2" />
                  <p className="text-red-400 font-bold">Face Not Registered</p>
                  <p className="text-red-300 text-xs mt-1">Please register first</p>
                </div>
              </motion.div>
            )}
          </div>

          {!isScanning && authStatus !== 'success' && (
            <Button
              onClick={handleStartLogin}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white py-6 rounded-2xl text-lg"
            >
              <Scan className="mr-2" />
              {authStatus === 'failed' ? 'Retry Camera' : 'Start Face Login'}
            </Button>
          )}

          {authStatus === 'success' && (
            <div className="text-center text-green-400">
              <p>Redirecting to dashboard...</p>
            </div>
          )}
        </div>

        <p className="text-center text-purple-300 text-sm mt-6">
          Your biometric data is encrypted and never leaves your device
        </p>

        <div className="mt-8 text-center">
          <p className="text-purple-200 text-sm mb-2">Don't have an account?</p>
          <Button
            variant="link"
            onClick={onRegister}
            className="text-white underline decoration-purple-400 decoration-2 underline-offset-4 hover:text-purple-200"
          >
            Register with Face ID
          </Button>
        </div>

        {/* Debug/Reset Option */}
        <div className="mt-8 text-center border-t border-white/10 pt-4">
          <button
            onClick={async () => {
              if (confirm("Are you sure you want to clear all users and face data? This cannot be undone.")) {
                await db.users.clear();
                await db.transactions.clear();
                window.location.reload();
              }
            }}
            className="text-xs text-red-400 hover:text-red-300 opacity-60 hover:opacity-100 transition-opacity"
          >
            Reset / Clear All Data
          </button>
        </div>
      </motion.div>
    </div>
  );
}
