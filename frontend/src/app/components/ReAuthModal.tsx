import { useEffect, useRef, useState } from 'react';
import { API_BASE } from '../config';
import { motion, AnimatePresence } from 'motion/react';
import { Scan, CheckCircle2, X, Lock, Eye, EyeOff, ShieldCheck, KeyRound } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import * as faceapi from 'face-api.js';

interface ReAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title?: string;
  description?: string;
}

type AuthStep = 'face' | 'password';

export function ReAuthModal({
  isOpen,
  onClose,
  onSuccess,
  title = 'Verify Identity',
  description = 'Re-authenticate to view sensitive data',
}: ReAuthModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [authStep, setAuthStep] = useState<AuthStep>('face');
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [modelsLoaded, setModelsLoaded] = useState(false);

  // Password fallback state
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isVerifyingPassword, setIsVerifyingPassword] = useState(false);

  // Load face-api models
  useEffect(() => {
    if (!isOpen) return;
    const loadModels = async () => {
      try {
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
          faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
          faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
        ]);
        setModelsLoaded(true);
      } catch (err) {
        console.error('Failed to load FaceAPI models', err);
        setErrorMsg('Failed to load AI models.');
      }
    };
    loadModels();
  }, [isOpen]);

  // Start camera when on face step
  useEffect(() => {
    if (!isOpen || authStep !== 'face') return;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
        });
        streamRef.current = stream;
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
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [isOpen, authStep]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setAuthStep('face');
      setIsScanning(false);
      setScanProgress(0);
      setIsAuthenticated(false);
      setCameraError(false);
      setErrorMsg('');
      setPassword('');
      setShowPassword(false);
      setIsVerifyingPassword(false);
    }
  }, [isOpen]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const handleFaceScan = async () => {
    if (!modelsLoaded || !videoRef.current) return;
    setIsScanning(true);
    setScanProgress(0);
    setErrorMsg('');

    try {
      setScanProgress(25);

      if (videoRef.current.videoWidth === 0) {
        throw new Error('Video not ready yet.');
      }

      let detection = null;
      let attempts = 0;
      const maxAttempts = 20;
      const delayMs = 150;

      while (!detection && attempts < maxAttempts) {
        attempts++;
        detection = await faceapi
          .detectSingleFace(videoRef.current)
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (!detection && attempts < maxAttempts) {
          setScanProgress(25 + attempts * 2.5);
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }

      setScanProgress(75);

      if (!detection) {
        throw new Error(
          'No face detected. Please ensure good lighting and look directly at the camera.'
        );
      }

      const descriptorArray = Array.from(detection.descriptor);

      // Use /api/face/verify (requires logged-in session)
      const verifyRes = await fetch(`${API_BASE}/api/face/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ descriptor: descriptorArray }),
      });

      if (!verifyRes.ok) {
        const d = await verifyRes.json();
        throw new Error(d.error || 'Face verification failed.');
      }

      const result = await verifyRes.json();
      if (result.success) {
        setScanProgress(100);
        setIsScanning(false);
        setIsAuthenticated(true);
        stopCamera();
        timeoutRef.current = setTimeout(() => {
          onSuccess();
        }, 800);
      } else {
        throw new Error('Face verification failed.');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Face verification failed');
      setIsScanning(false);
      setScanProgress(0);
    }
  };

  const handleSwitchToPassword = () => {
    stopCamera();
    setAuthStep('password');
    setErrorMsg('');
    setScanProgress(0);
    setIsScanning(false);
  };

  const handlePasswordVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;

    setIsVerifyingPassword(true);
    setErrorMsg('');

    try {
      const res = await fetch(`${API_BASE}/api/auth/verify-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Password verification failed');
        setIsVerifyingPassword(false);
        return;
      }

      if (data.success) {
        setIsAuthenticated(true);
        timeoutRef.current = setTimeout(() => {
          onSuccess();
        }, 800);
      }
    } catch (err) {
      setErrorMsg('Network error. Please try again.');
      setIsVerifyingPassword(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(8px)' }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 rounded-3xl max-w-md w-full border border-white/10 shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl p-2">
                  <ShieldCheck className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">{title}</h2>
                  <p className="text-purple-300 text-xs">{description}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-white/60 hover:text-white hover:bg-white/10 rounded-xl"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Content */}
            <div className="p-5">
              {/* Success State */}
              {isAuthenticated ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="flex flex-col items-center justify-center py-12"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.1 }}
                    className="bg-green-500/20 rounded-full p-4 mb-4"
                  >
                    <CheckCircle2 className="w-12 h-12 text-green-400" />
                  </motion.div>
                  <p className="text-green-400 font-medium text-lg">Verified!</p>
                  <p className="text-green-300/60 text-sm mt-1">Identity confirmed</p>
                </motion.div>
              ) : authStep === 'face' ? (
                /* Face Auth Step */
                <div>
                  {/* Camera viewport */}
                  <div className="relative aspect-[4/3] mb-4 rounded-2xl overflow-hidden bg-black">
                    {cameraError ? (
                      <div className="absolute inset-0 flex items-center justify-center text-white bg-gray-900">
                        <div className="text-center">
                          <Scan className="w-12 h-12 mx-auto mb-2 text-purple-400" />
                          <p className="text-sm">Camera not available</p>
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

                    {/* Scanning overlay line */}
                    {isScanning && (
                      <motion.div
                        initial={{ top: 0 }}
                        animate={{ top: '100%' }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                        className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-purple-400 to-transparent"
                      />
                    )}

                    {/* Face frame */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <motion.div
                        animate={
                          isScanning
                            ? {
                                scale: [1, 1.03, 1],
                                opacity: [0.5, 1, 0.5],
                              }
                            : {}
                        }
                        transition={{ duration: 2, repeat: Infinity }}
                        className="w-48 h-60 border-3 border-purple-500 rounded-3xl"
                        style={{ boxShadow: '0 0 30px rgba(168, 85, 247, 0.3)' }}
                      >
                        <div className="absolute top-0 left-0 w-6 h-6 border-t-3 border-l-3 border-white rounded-tl-xl" />
                        <div className="absolute top-0 right-0 w-6 h-6 border-t-3 border-r-3 border-white rounded-tr-xl" />
                        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-3 border-l-3 border-white rounded-bl-xl" />
                        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-3 border-r-3 border-white rounded-br-xl" />
                      </motion.div>
                    </div>

                    {/* Auth success overlay */}
                    {isAuthenticated && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="absolute inset-0 bg-green-500/20 backdrop-blur-sm flex items-center justify-center"
                      >
                        <CheckCircle2 className="w-16 h-16 text-green-400" />
                      </motion.div>
                    )}
                  </div>

                  {/* Progress bar */}
                  {isScanning && (
                    <div className="mb-4">
                      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${scanProgress}%` }}
                          className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                        />
                      </div>
                      <p className="text-center text-white text-xs mt-2">
                        Verifying... {scanProgress}%
                      </p>
                    </div>
                  )}

                  {/* Scan button */}
                  {!isScanning && !isAuthenticated && (
                    <Button
                      onClick={handleFaceScan}
                      disabled={!modelsLoaded}
                      className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white py-5 rounded-2xl text-base disabled:opacity-50"
                    >
                      <Scan className="mr-2 w-5 h-5" />
                      {modelsLoaded ? 'Scan Face ID' : 'Loading ML Models...'}
                    </Button>
                  )}

                  {/* Error + password fallback */}
                  {errorMsg && (
                    <div className="mt-3 space-y-3">
                      <div className="p-3 bg-red-500/20 border border-red-500/40 rounded-xl">
                        <p className="text-center text-red-400 text-xs font-medium">{errorMsg}</p>
                      </div>
                      <Button
                        variant="outline"
                        onClick={handleSwitchToPassword}
                        className="w-full border-white/20 text-white hover:bg-white/10 py-4 rounded-xl bg-white/5"
                      >
                        <KeyRound className="mr-2 w-4 h-4" />
                        Use Password Instead
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                /* Password Fallback Step */
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <div className="flex flex-col items-center mb-6">
                    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-3 mb-3">
                      <Lock className="w-7 h-7 text-white" />
                    </div>
                    <p className="text-white font-medium">Enter your password</p>
                    <p className="text-purple-300/70 text-xs mt-1">
                      Verify your identity with password
                    </p>
                  </div>

                  <form onSubmit={handlePasswordVerify} className="space-y-4">
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400 w-4 h-4" />
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        autoFocus
                        className="bg-white/10 border-white/20 text-white placeholder:text-purple-300/50 pl-11 pr-11 py-5 rounded-2xl"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-purple-400"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    <Button
                      type="submit"
                      disabled={!password || isVerifyingPassword}
                      className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white py-5 rounded-2xl text-base disabled:opacity-50"
                    >
                      {isVerifyingPassword ? 'Verifying...' : 'Verify Password'}
                    </Button>

                    {errorMsg && (
                      <div className="p-3 bg-red-500/20 border border-red-500/40 rounded-xl">
                        <p className="text-center text-red-400 text-xs font-medium">{errorMsg}</p>
                      </div>
                    )}

                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setAuthStep('face');
                        setErrorMsg('');
                        setPassword('');
                      }}
                      className="w-full text-purple-300 hover:text-white hover:bg-white/10 py-4 rounded-xl text-sm"
                    >
                      <Scan className="mr-2 w-4 h-4" />
                      Try Face ID Again
                    </Button>
                  </form>
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
