import { useState } from 'react';
import { motion } from 'motion/react';
import { User, Mail, Phone, Lock, ArrowRight, CheckCircle2, ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';


interface FaceRegistrationInfoProps {
  faceDescriptor: number[] | null;
  onComplete: (userData: FaceUserData) => void;
  onBack?: () => void;
}

export interface FaceUserData {
  fullName: string;
  username: string; // added username
  email: string;
  phone: string;
}

export function FaceRegistrationInfo({ faceDescriptor, onComplete, onBack }: FaceRegistrationInfoProps) {
  const [formData, setFormData] = useState<FaceUserData>({
    fullName: '',
    username: '',
    email: '',
    phone: '',
  });

  const [isRegistering, setIsRegistering] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRegistering(true);
    setErrorMsg('');

    try {
      if (!faceDescriptor || faceDescriptor.length !== 128) {
        throw new Error('Face descriptor is missing or invalid. Please go back and scan your face again.');
      }

      // Create User and Save Face Descriptor in Backend
      const registerRes = await fetch('http://localhost:5000/api/face/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          name: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          descriptor: faceDescriptor
        })
      });

      if (!registerRes.ok) {
        const d = await registerRes.json();
        throw new Error(d.error || 'Failed to register account');
      }

      const data = await registerRes.json();
      if (data.success) {
        onComplete(formData);
      } else {
        throw new Error('Face registration failed');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred during registration.');
    } finally {
      setIsRegistering(false);
    }
  };

  const isValid = formData.fullName && formData.username && formData.email && formData.phone;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-950 via-emerald-950 to-black flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full"
      >
        <div className="flex items-center gap-4 mb-8">
          {onBack && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-6 h-6" />
            </Button>
          )}
          <div className="text-center flex-1">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center justify-center w-20 h-20 bg-green-500 rounded-full mb-4 shadow-2xl"
            >
              <CheckCircle2 className="w-12 h-12 text-white" />
            </motion.div>
            <h1 className="text-3xl font-bold text-white mb-2">Face ID Registered!</h1>
            <p className="text-green-300">Complete your profile to get started</p>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => setFormData({
              fullName: 'John Doe',
              username: 'johndoe' + Math.floor(Math.random() * 1000),
              email: 'john@example.com',
              phone: '+1 (555) 123-4567'
            })}
            className="w-full bg-white/5 border-white/20 text-green-300 hover:bg-white/10 hover:text-white rounded-2xl py-2 text-sm"
          >
            ✨ Fill Mock Data
          </Button>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-2xl"
          >
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="text-green-200 text-sm mb-2 block">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-green-400 w-5 h-5" />
                  <Input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="John Doe"
                    className="bg-white/10 border-white/20 text-white placeholder:text-green-300 pl-12 py-6 rounded-2xl"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-green-200 text-sm mb-2 block">Username</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-green-400 w-5 h-5" />
                  <Input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().trim() })}
                    placeholder="johndoe"
                    className="bg-white/10 border-white/20 text-white placeholder:text-green-300 pl-12 py-6 rounded-2xl"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-green-200 text-sm mb-2 block">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-green-400 w-5 h-5" />
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john@example.com"
                    className="bg-white/10 border-white/20 text-white placeholder:text-green-300 pl-12 py-6 rounded-2xl"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-green-200 text-sm mb-2 block">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-green-400 w-5 h-5" />
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 (555) 000-0000"
                    className="bg-white/10 border-white/20 text-white placeholder:text-green-300 pl-12 py-6 rounded-2xl"
                    required
                  />
                </div>
              </div>

              <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4">
                <p className="text-green-200 text-sm">
                  ✨ No password needed! You'll log in with Face ID
                </p>
              </div>

              <Button
                type="submit"
                disabled={!isValid || isRegistering}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-6 rounded-2xl text-lg disabled:opacity-50 mt-6"
              >
                {isRegistering ? 'Registering Device...' : 'Complete Registration'}
                {!isRegistering && <ArrowRight className="ml-2" />}
              </Button>

              {errorMsg && (
                <p className="text-red-400 text-center text-sm font-medium mt-4">
                  {errorMsg}
                </p>
              )}
            </form>
          </motion.div>
        </div>

        <p className="text-center text-green-300 text-xs mt-6">
          Your face data is stored securely on your device only
        </p>
      </motion.div>
    </div>
  );
}
