import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Scan, CheckCircle2, Lock, AlertCircle, RefreshCw, UserPlus } from 'lucide-react';
import { Button } from './ui/button';
import { faceService } from '../../services/faceService';
import * as faceapi from 'face-api.js';
import { db } from '../../db';
import { encryptionService } from '../../services/encryptionService';

interface FaceAuthProps {
  onAuthSuccess: (user: any) => void;
  onRegister: () => void;
  onUsePassword: () => void;
}

export function FaceAuth({ onAuthSuccess, onRegister, onUsePassword }: FaceAuthProps) {
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
  const MAX_FAILURES = 50; // Increased to 50 (~5s) to allow time for backend/positioning

  // Pre-load users for scanning
  const usersRef = useRef<any[]>([]);

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
              // Create a glowing box effect
              ctx.shadowColor = authStatus === 'success' ? '#4ade80' : authStatus === 'failed' ? '#f87171' : '#c084fc';
              ctx.shadowBlur = 15;
              ctx.strokeStyle = authStatus === 'success' ? '#4ade80' : authStatus === 'failed' ? '#f87171' : '#ffffff';
              ctx.lineWidth = 3;

              // Draw rounded rect manually or just rect
              ctx.strokeRect(box.x, box.y, box.width, box.height);

              // Reset shadow for performance
              ctx.shadowBlur = 0;
            }

            if (isScanningRef.current) {
              // Server-side verification (DeepFace)
              // We pause scanning locally to prevent spamming the server
              isScanningRef.current = false;

              try {
                const blob = await faceService.captureFaceBlob(video);
                if (blob) {
                  // Call the Python backend
                  const result = await faceService.verifyUser(blob);

                  if (result && result.email) {
                    console.log("Backend Match Raw:", result.email);

                    // Case-insensitive lookup
                    const allUsers = await db.users.toArray();
                    const fullUser = allUsers.find(u =>
                      u.email.toLowerCase().trim() === result.email.toLowerCase().trim()
                    );

                    if (fullUser) {
                      setAuthStatus('success');
                      setIsScanning(false);
                      setTimeout(() => onAuthSuccess(fullUser), 1000);
                    } else {
                      console.error("MISMATCH: Backend found " + result.email + " but no local match.");

                      setStatusMessage(`System Mismatch! AI found ${result.email}, but Browser has no data. Please Register Again.`);
                      setAuthStatus('failed');

                      consecutiveFailuresRef.current++;
                      isScanningRef.current = false; // Stop scanning to show the error
                    }
                  } else {
                    // console.log("Backend verification failed");
                    consecutiveFailuresRef.current++;
                    // Add a small delay before trying again to prevent server overload
                    setTimeout(() => {
                      isScanningRef.current = true;
                    }, 500);
                  }
                } else {
                  isScanningRef.current = true;
                }
              } catch (e) {
                console.error("Verification process error", e);
                isScanningRef.current = true;
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
  }, [authStatus]); // Add authStatus dependency to update colors

  const [retryCount, setRetryCount] = useState(0);

  const handleStartLogin = async () => {
    setAuthStatus('scanning');
    setIsScanning(true); // Keep this to trigger UI changes

    // reset counters
    consecutiveFailuresRef.current = 0;

    // Load users once
    try {
      const users = await db.users.toArray();
      // Decrypt users face data for matching
      const decryptedUsers = await Promise.all(users.map(async (u) => {
        if (typeof u.faceData === 'string') {
          try {
            return { ...u, faceData: await encryptionService.decryptData(u.faceData) };
          } catch (e) {
            console.error('Decryption failed for user', u.id, e);
            return { ...u, faceData: [] };
          }
        }
        return u;
      }));
      usersRef.current = decryptedUsers;
      isScanningRef.current = true;
    } catch (e) {
      console.error("Failed to load users for login", e);
      setAuthStatus('failed');
      setIsScanning(false);
    }
  };

  // Check for retry limit
  useEffect(() => {
    if (authStatus === 'failed') {
      const newCount = retryCount + 1;
      setRetryCount(newCount);

      if (newCount >= 2) {
        // Add a small delay so user sees the 'fail' state briefly
        setTimeout(() => {
          onUsePassword();
          // Reset for next time
          setRetryCount(0);
        }, 1500);
      }
    }
  }, [authStatus]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isScanningRef.current = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6 overflow-hidden relative">
      {/* Background Ambience */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[120px] mix-blend-screen animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[120px] mix-blend-screen animate-pulse delay-1000" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="max-w-md w-full relative z-10"
      >
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-tr from-indigo-500/10 to-purple-500/10 rounded-3xl mb-6 ring-1 ring-white/10 backdrop-blur-md shadow-[0_0_40px_-10px_rgba(99,102,241,0.3)]"
          >
            <Lock className="w-8 h-8 text-white/90" />
          </motion.div>
          <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-white via-indigo-100 to-indigo-200 tracking-tight mb-3">
            FaceWallet
          </h1>
          <p className="text-indigo-200/60 text-lg font-light tracking-wide">
            Next-gen biometric security
          </p>
        </div>

        <div className="group relative bg-gray-900/40 backdrop-blur-2xl rounded-[2.5rem] p-2 border border-white/5 shadow-2xl">
          <div className="relative aspect-[4/5] rounded-[2rem] overflow-hidden bg-black/50 ring-1 ring-white/5 mx-auto">
            {/* Camera Feed */}
            {cameraError ? (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                <div className="text-center p-6">
                  <Scan className="w-16 h-16 mx-auto mb-4 text-gray-500" />
                  <p className="text-gray-400">Camera access unavailable</p>
                </div>
              </div>
            ) : (
              <div className="relative w-full h-full">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover transform scale-x-[-1]"
                />
                <canvas
                  ref={canvasRef}
                  className="absolute inset-0 w-full h-full object-cover transform scale-x-[-1]"
                />

                {/* Vignette Overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60 pointer-events-none" />
              </div>
            )}

            {/* Scanning Overlay */}
            <AnimatePresence>
              {authStatus === 'scanning' && (
                <div className="absolute inset-0 pointer-events-none">
                  <motion.div
                    initial={{ top: "0%" }}
                    animate={{ top: "100%" }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                    className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-indigo-400 to-transparent shadow-[0_0_20px_2px_rgba(129,140,248,0.5)]"
                  />

                  {/* Corner Targets */}
                  <div className="absolute top-8 left-8 w-16 h-16 border-t-2 border-l-2 border-white/30 rounded-tl-2xl" />
                  <div className="absolute top-8 right-8 w-16 h-16 border-t-2 border-r-2 border-white/30 rounded-tr-2xl" />
                  <div className="absolute bottom-8 left-8 w-16 h-16 border-b-2 border-l-2 border-white/30 rounded-bl-2xl" />
                  <div className="absolute bottom-8 right-8 w-16 h-16 border-b-2 border-r-2 border-white/30 rounded-br-2xl" />
                </div>
              )}
            </AnimatePresence>

            {/* Status Messages */}
            <AnimatePresence>
              {authStatus === 'success' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-20"
                >
                  <div className="text-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", delay: 0.1 }}
                      className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/20 text-green-400 mb-4 ring-1 ring-green-500/40 shadow-[0_0_30px_-5px_rgba(74,222,128,0.3)]"
                    >
                      <CheckCircle2 className="w-10 h-10" />
                    </motion.div>
                    <h3 className="text-2xl font-bold text-white mb-1">Authenticated</h3>
                    <p className="text-green-400/80 text-sm">Welcome back</p>
                  </div>
                </motion.div>
              )}

              {authStatus === 'failed' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-20"
                >
                  <div className="text-center px-6">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", delay: 0.1 }}
                      className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-500/20 text-red-400 mb-4 ring-1 ring-red-500/40 shadow-[0_0_30px_-5px_rgba(248,113,113,0.3)]"
                    >
                      <AlertCircle className="w-10 h-10" />
                    </motion.div>
                    <h3 className="text-2xl font-bold text-white mb-2">No Match Found</h3>
                    <Button
                      onClick={handleStartLogin}
                      className="bg-white/10 hover:bg-white/20 text-white rounded-full px-8 py-6 backdrop-blur-md transition-all"
                    >
                      Try Again
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <p className="text-purple-300 px-4 text-center">
            {authStatus === 'idle'
              ? (!isScanningRef.current && isScanning ? 'Verifying with server...' : 'Position your face in the oval')
              : authStatus === 'success'
                ? 'Identity Verified'
                : (statusMessage || 'Authentication Failed')}
          </p>
          <div className="p-4 pt-6">
            {!isScanning && authStatus !== 'success' && authStatus !== 'failed' && (
              <Button
                onClick={handleStartLogin}
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white py-7 rounded-2xl text-lg font-semibold shadow-lg shadow-indigo-900/20 transition-all active:scale-[0.98] border border-white/10"
              >
                <Scan className="mr-3 w-5 h-5" />
                Scan Face
              </Button>
            )}

            {isScanning && (
              <Button
                disabled
                className="w-full bg-white/5 text-white/50 py-7 rounded-2xl text-lg font-medium border border-white/5"
              >
                <RefreshCw className="mr-3 w-5 h-5 animate-spin" />
                Scanning...
              </Button>
            )}
          </div>
        </div>

        <div className="mt-8 text-center flex flex-col gap-3">
          <Button
            variant="ghost"
            onClick={onUsePassword}
            className="text-white/60 hover:text-white hover:bg-white/5 rounded-full px-6 py-2 transition-all"
          >
            <Lock className="w-4 h-4 mr-2" />
            Login with Password
          </Button>

          <Button
            variant="ghost"
            onClick={onRegister}
            className="text-white/60 hover:text-white hover:bg-white/5 rounded-full px-6 py-2 transition-all"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Create new account
          </Button>
        </div>

        {/* Reset Option */}
        <div className="mt-12 flex justify-center">
          <button
            onClick={async () => {
              if (confirm("Are you sure you want to clear all users, transactions and face data? This cannot be undone.")) {
                await db.users.clear();
                await db.transactions.clear();
                window.location.reload();
              }
            }}
            className="text-white/30 hover:text-red-400 text-xs uppercase tracking-widest transition-colors"
          >
            Delete All Data
          </button>
        </div>
      </motion.div>
    </div>
  );
}
