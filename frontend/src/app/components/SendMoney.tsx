import { useState, useEffect, useRef } from 'react';
import { API_BASE } from '../config';
import { motion } from 'motion/react';
import { ArrowLeft, Scan, CheckCircle2, User, X } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import * as faceapi from 'face-api.js';

interface SendMoneyProps {
  onBack: () => void;
  onSend: (recipient: string, amount: number) => void;
}

interface Contact {
  name: string;
  avatar: string;
  color: string;
}

const colorVariants = [
  'from-pink-500 to-rose-500',
  'from-blue-500 to-indigo-500',
  'from-purple-500 to-violet-500',
  'from-green-500 to-emerald-500',
  'from-orange-500 to-amber-500'
];

export function SendMoney({ onBack, onSend }: SendMoneyProps) {
  const [amount, setAmount] = useState('');
  const [selectedContact, setSelectedContact] = useState('');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isSuccess, setIsSuccess] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Face scanning state
  const [isFaceScanning, setIsFaceScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const [faceError, setFaceError] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      stopCamera();
    };
  }, []);

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/users/contacts`, {
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          const mappedContacts = data.contacts.map((c: any, index: number) => ({
            name: c.name,
            avatar: '👤',
            color: colorVariants[index % colorVariants.length]
          }));
          setContacts(mappedContacts);
        }
      } catch (err) {
        console.error('Failed to fetch contacts:', err);
      }
    };
    fetchContacts();
  }, []);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const startFaceScan = async () => {
    setIsFaceScanning(true);
    setFaceError('');
    setScanProgress(0);
    setCameraError(false);

    // Load models
    try {
      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
        faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
        faceapi.nets.faceRecognitionNet.loadFromUri('/models')
      ]);
      setModelsLoaded(true);
    } catch (err) {
      console.error('Failed to load FaceAPI models', err);
      setFaceError('Failed to initialize AI models.');
      return;
    }

    // Start camera
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' }
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

  const handleFaceScan = async () => {
    if (!videoRef.current) return;
    setIsScanning(true);
    setScanProgress(0);
    setFaceError('');

    try {
      setScanProgress(15);

      if (videoRef.current.videoWidth === 0) {
        throw new Error('Video not ready yet. Please wait a moment.');
      }

      // Detect face with retry logic
      let detection = null;
      let attempts = 0;
      const maxAttempts = 20;
      const delayMs = 150;

      while (!detection && attempts < maxAttempts) {
        attempts++;
        detection = await faceapi.detectSingleFace(videoRef.current)
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (!detection && attempts < maxAttempts) {
          setScanProgress(15 + (attempts * 2.5));
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }

      setScanProgress(70);

      if (!detection) {
        throw new Error('No face detected. Please ensure good lighting and look directly at the camera.');
      }

      const descriptorArray = Array.from(detection.descriptor);

      // Verify face against logged-in user
      setScanProgress(80);
      const verifyRes = await fetch(`${API_BASE}/api/face/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ descriptor: descriptorArray })
      });

      if (!verifyRes.ok) {
        const d = await verifyRes.json();
        throw new Error(d.error || 'Face verification failed.');
      }

      setScanProgress(90);

      // Face verified — now execute the transfer
      const response = await fetch(`${API_BASE}/api/wallet/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          contactName: selectedContact,
          amount: parseFloat(amount)
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Transaction failed');
      }

      setScanProgress(100);
      stopCamera();
      setIsFaceScanning(false);
      setIsScanning(false);
      setIsSuccess(true);
      timeoutRef.current = setTimeout(() => {
        onSend(selectedContact, parseFloat(amount));
      }, 1500);

    } catch (err: any) {
      console.error(err);
      setFaceError(err.message || 'Face verification failed');
      setIsScanning(false);
      setScanProgress(0);
    }
  };

  const cancelFaceScan = () => {
    stopCamera();
    setIsFaceScanning(false);
    setIsScanning(false);
    setFaceError('');
    setScanProgress(0);
  };

  const handleAmountChange = (value: string) => {
    const numericValue = value.replace(/[^\d.]/g, '');
    const match = numericValue.match(/^\d*\.?\d{0,2}/);
    if (match) {
      setAmount(match[0]);
    }
  };

  const addToAmount = (value: number) => {
    const currentAmount = parseFloat(amount || '0');
    setAmount((currentAmount + value).toString());
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-950 via-emerald-950 to-black flex items-center justify-center p-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.2, 1] }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center justify-center w-24 h-24 bg-green-500 rounded-full mb-6"
          >
            <CheckCircle2 className="w-16 h-16 text-white" />
          </motion.div>
          <h2 className="text-3xl text-white mb-2">Transaction Successful!</h2>
          <p className="text-green-300">
            ₹{parseFloat(amount).toFixed(2)} sent to {selectedContact}
          </p>
        </motion.div>
      </div>
    );
  }

  // Face scanning screen
  if (isFaceScanning) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-black flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full"
        >
          <div className="text-center mb-6">
            <h2 className="text-2xl text-white mb-1">Verify Face to Send</h2>
            <p className="text-purple-300 text-sm">
              ₹{parseFloat(amount || '0').toFixed(2)} → {selectedContact}
            </p>
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
                  className="w-48 h-60 border-4 border-purple-500 rounded-3xl"
                  style={{ boxShadow: '0 0 40px rgba(168, 85, 247, 0.4)' }}
                >
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-white rounded-tl-2xl" />
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-white rounded-tr-2xl" />
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-white rounded-bl-2xl" />
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-white rounded-br-2xl" />
                </motion.div>
              </div>
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
                  Verifying... {Math.round(scanProgress)}%
                </p>
              </div>
            )}

            {!isScanning && (
              <div className="space-y-3">
                <Button
                  onClick={handleFaceScan}
                  disabled={!modelsLoaded || cameraError}
                  className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white py-6 rounded-2xl text-lg disabled:opacity-50"
                >
                  <Scan className="mr-2" />
                  {modelsLoaded ? 'Scan & Verify' : 'Loading ML Models...'}
                </Button>
                <Button
                  variant="ghost"
                  onClick={cancelFaceScan}
                  className="w-full text-purple-300 hover:text-white hover:bg-white/10 py-4 rounded-2xl"
                >
                  <X className="mr-2 w-4 h-4" />
                  Cancel
                </Button>
              </div>
            )}

            {faceError && (
              <div className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-xl">
                <p className="text-center text-red-400 text-sm font-medium">{faceError}</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
      {/* Header */}
      <div className="px-6 pt-8 pb-6">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft />
          </Button>
          <h1 className="text-2xl text-white">Send Money</h1>
        </div>

        {/* Amount Input */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 mb-6"
        >
          <p className="text-purple-300 text-sm mb-2 text-center">Amount</p>
          <div className="flex items-center justify-center mb-6 relative">
            <span className="text-white text-6xl absolute left-[20%] lg:left-[30%] -translate-x-1/2 select-none pointer-events-none">₹</span>
            <input
              type="text"
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              placeholder="0"
              className="bg-transparent text-white placeholder:text-white/50 text-6xl w-full text-center outline-none border-none focus:ring-0"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-4 gap-2">
            {[50, 100, 200, 500].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => addToAmount(value)}
                className="bg-transparent border border-white/20 text-white font-medium rounded-xl py-3 hover:bg-white/20 transition-colors"
              >
                +₹{value}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Recipient Selection */}
        <div className="mb-6">
          <h3 className="text-white text-lg mb-4">Send to</h3>

          {/* Search */}
          <div className="mb-4">
            <Input
              placeholder="Search contacts..."
              className="bg-white/10 border-white/20 text-white placeholder:text-purple-300"
            />
          </div>

          {/* Recent Contacts */}
          <div className="space-y-2">
            {contacts.length === 0 && <p className="text-purple-300 text-sm text-center">No other users found.</p>}
            {contacts.map((contact) => (
              <motion.button
                key={contact.name}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedContact(contact.name)}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${selectedContact === contact.name
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600'
                  : 'bg-white/10 backdrop-blur-xl border border-white/20 hover:bg-white/20'
                  }`}
              >
                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${contact.color} flex items-center justify-center text-2xl`}>
                  {contact.avatar}
                </div>
                <div className="text-left flex-1">
                  <p className="text-white">{contact.name}</p>
                  <p className="text-xs text-purple-300">Tap to select</p>
                </div>
                {selectedContact === contact.name && (
                  <CheckCircle2 className="text-white" />
                )}
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* Send Button */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/80 to-transparent">
        <Button
          onClick={startFaceScan}
          disabled={!amount || !selectedContact || parseFloat(amount) <= 0}
          className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white py-6 rounded-2xl text-lg disabled:opacity-50"
        >
          <Scan className="mr-2" />
          Verify with Face ID & Send
        </Button>
      </div>
    </div>
  );
}
