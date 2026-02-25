import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Scan, CheckCircle2, Lock } from 'lucide-react';
import { Button } from './ui/button';

import { startAuthentication } from '@simplewebauthn/browser';

interface FaceAuthProps {
  onAuthSuccess: (user?: any) => void;
  onFallback?: () => void;
}

export function FaceAuth({ onAuthSuccess, onFallback }: FaceAuthProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

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

  const handleScan = async () => {
    setIsScanning(true);
    setScanProgress(0);
    setErrorMsg('');

    try {
      setScanProgress(20);
      const optionsRes = await fetch('http://localhost:5000/api/auth/generate-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!optionsRes.ok) throw new Error('Failed to get authentication options.');
      const { options, sessionId } = await optionsRes.json();
      setScanProgress(40);

      let asseResp;
      try {
        asseResp = await startAuthentication({ optionsJSON: options });
      } catch (err: any) {
        throw new Error('WebAuthn cancelled or invalid.');
      }
      setScanProgress(80);

      const verifyRes = await fetch('http://localhost:5000/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, response: asseResp }),
      });

      if (!verifyRes.ok) {
        const d = await verifyRes.json();
        throw new Error(d.error || 'Verification failed on server.');
      }

      const verification = await verifyRes.json();
      if (verification.verified) {
        setScanProgress(100);
        setIsScanning(false);
        setIsAuthenticated(true);
        setTimeout(() => {
          onAuthSuccess(verification.user);
        }, 1000);
      } else {
        throw new Error('Authentication failed.');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Face ID authentication failed');
      setIsScanning(false);
      setScanProgress(0);
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

            {/* Scanning overlay */}
            {isScanning && (
              <motion.div
                initial={{ top: 0 }}
                animate={{ top: '100%' }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-purple-400 to-transparent"
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

            {/* Success indicator */}
            {isAuthenticated && (
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
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                />
              </div>
              <p className="text-center text-white text-sm mt-2">
                Authenticating... {scanProgress}%
              </p>
            </div>
          )}

          {!isScanning && !isAuthenticated && (
            <Button
              onClick={handleScan}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white py-6 rounded-2xl text-lg"
            >
              <Scan className="mr-2" />
              Start Face Scan
            </Button>
          )}

          {isAuthenticated && (
            <div className="text-center text-green-400">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2" />
              <p>Authentication Successful</p>
            </div>
          )}

          {errorMsg && (
            <div className="mt-4 space-y-3">
              <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-xl">
                <p className="text-center text-red-400 text-sm font-medium">{errorMsg}</p>
              </div>
              {onFallback && (
                <Button
                  variant="outline"
                  onClick={onFallback}
                  className="w-full border-white/20 text-white hover:bg-white/10 py-5 rounded-xl bg-white/5"
                >
                  Use Password Instead
                </Button>
              )}
            </div>
          )}
        </div>

        <p className="text-center text-purple-300 text-sm mt-6">
          Your biometric data is encrypted and never leaves your device
        </p>
      </motion.div>
    </div>
  );
}
