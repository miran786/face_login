import { useState } from 'react';
import { motion } from 'motion/react';
import { User, Mail, Phone, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { db } from '../../db';
import { encryptionService } from '../../services/encryptionService';
import { faceService } from '../../services/faceService';

interface FaceRegistrationInfoProps {
  faceDescriptor: Float32Array | null;
  faceImage?: string;
  onComplete: (userData: FaceUserData) => void;
  onBack: () => void;
}

export interface FaceUserData {
  fullName: string;
  email: string;
  phone: string;
  password?: string;
}

export function FaceRegistrationInfo({ faceDescriptor, faceImage, onComplete, onBack }: FaceRegistrationInfoProps) {
  const [formData, setFormData] = useState<FaceUserData>({
    fullName: '',
    email: '',
    phone: '',
    password: '',
  });
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Register with Python Backend
      if (faceImage) {
        // Convert Data URL to Blob
        const res = await fetch(faceImage);
        const blob = await res.blob();

        const success = await faceService.registerUser(blob, formData.email);
        if (!success) {
          alert("Failed to register face with backend server. Is it running?");
          return;
        }
      }

      // We no longer need to store encrypted face descriptors locally for matching
      // But we keep the user record for balance/profile info
      const newUser = {
        ...formData,
        faceData: [], // Clear local face data as we use backend
        balance: 1000,
        avatar: '' // Explicitly not using face capture as avatar
      };

      await db.users.add(newUser);
      onComplete(formData);
    } catch (error) {
      console.error('Failed to save user:', error);
      alert("Registration failed. Please try again.");
    }
  };

  const isValid = formData.fullName && formData.email && formData.phone && formData.password && formData.password.length >= 6 && formData.password === confirmPassword;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-950 via-emerald-950 to-black flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full"
      >
        {/* Success Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.2, 1] }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center justify-center w-24 h-24 bg-green-500 rounded-full mb-4 shadow-2xl overflow-hidden border-4 border-white/20"
          >
            <CheckCircle2 className="w-12 h-12 text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold text-white mb-2">Face ID Registered!</h1>
          <p className="text-green-300">Complete your profile to get started</p>
        </div>

        {/* Form */}
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
                  placeholder="Miran Jamadar"
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
                  placeholder="miran786mj@gmail.com"
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
                  placeholder="+91 7744039115"
                  className="bg-white/10 border-white/20 text-white placeholder:text-green-300 pl-12 py-6 rounded-2xl"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-green-200 text-sm mb-2 block">Create Password</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-green-400 w-5 h-5">🔒</div>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  className="bg-white/10 border-white/20 text-white placeholder:text-green-300 pl-12 py-6 rounded-2xl"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <div>
              <label className="text-green-200 text-sm mb-2 block">Confirm Password</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-green-400 w-5 h-5">🔒</div>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-white/10 border-white/20 text-white placeholder:text-green-300 pl-12 py-6 rounded-2xl"
                  required
                  minLength={6}
                />
              </div>
              {formData.password && confirmPassword && formData.password !== confirmPassword && (
                <p className="text-red-400 text-xs mt-1">Passwords do not match</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={!isValid || formData.password !== confirmPassword}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-6 rounded-2xl text-lg disabled:opacity-50 mt-6"
            >
              Complete Registration
              <ArrowRight className="ml-2" />
            </Button>
          </form>
        </motion.div>

        <div className="mt-6 text-center">
          <Button
            variant="ghost"
            onClick={onBack}
            className="text-white/50 hover:text-white"
          >
            Start Over
          </Button>
        </div>

        <p className="text-center text-green-300 text-xs mt-6">
          Face data is stored by your local Python DeepFace server
        </p>
      </motion.div>
    </div>
  );
}
