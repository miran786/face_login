import { useState } from 'react';
import { motion } from 'motion/react';
import { User, Mail, Phone, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { db } from '../../db';

interface FaceRegistrationInfoProps {
  faceDescriptor: Float32Array | null;
  onComplete: (userData: FaceUserData) => void;
}

export interface FaceUserData {
  fullName: string;
  email: string;
  phone: string;
}

export function FaceRegistrationInfo({ faceDescriptor, onComplete }: FaceRegistrationInfoProps) {
  const [formData, setFormData] = useState<FaceUserData>({
    fullName: '',
    email: '',
    phone: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newUser = {
        ...formData, // Spreads fullName, email, phone from formData
        faceData: faceDescriptor ? Array.from(faceDescriptor) : undefined, // Convert Float32Array to regular array
        balance: 1000, // Initial testing balance
      };

      const id = await db.users.add(newUser);
      onComplete(formData);
    } catch (error) {
      console.error('Failed to save user:', error);
      // Fallback or error handling could go here
      onComplete(formData);
    }
  };

  const isValid = formData.fullName && formData.email && formData.phone;

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
            className="inline-flex items-center justify-center w-20 h-20 bg-green-500 rounded-full mb-4 shadow-2xl"
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

            <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4">
              <p className="text-green-200 text-sm">
                ✨ No password needed! You'll log in with Face ID
              </p>
            </div>

            <Button
              type="submit"
              disabled={!isValid}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-6 rounded-2xl text-lg disabled:opacity-50 mt-6"
            >
              Complete Registration
              <ArrowRight className="ml-2" />
            </Button>
          </form>
        </motion.div>

        <p className="text-center text-green-300 text-xs mt-6">
          Your face data is stored securely on your device only
        </p>
      </motion.div>
    </div>
  );
}
