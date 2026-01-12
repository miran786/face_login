import { useState } from 'react';
import { motion } from 'motion/react';
import { Lock, Mail, User, Phone, ArrowRight } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface RegistrationProps {
  onComplete: (userData: UserData) => void;
}

export interface UserData {
  fullName: string;
  email: string;
  phone: string;
}

export function Registration({ onComplete }: RegistrationProps) {
  const [formData, setFormData] = useState<UserData>({
    fullName: '',
    email: '',
    phone: '',
  });
  const [step, setStep] = useState(1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 2) {
      setStep(2);
    } else {
      onComplete(formData);
    }
  };

  const isStep1Valid = formData.fullName && formData.email;
  const isStep2Valid = formData.phone;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-black flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', delay: 0.2 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl mb-4 shadow-2xl"
          >
            <Lock className="w-10 h-10 text-white" />
          </motion.div>
          <h1 className="text-4xl font-bold text-white mb-2">Join FaceWallet</h1>
          <p className="text-purple-300">Create your secure account</p>
        </div>

        {/* Progress Indicator */}
        <div className="flex gap-2 mb-8">
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            className={`h-1.5 flex-1 rounded-full ${step >= 1 ? 'bg-gradient-to-r from-indigo-500 to-purple-600' : 'bg-white/20'
              }`}
          />
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: step >= 2 ? 1 : 0 }}
            transition={{ delay: 0.1 }}
            className={`h-1.5 flex-1 rounded-full ${step >= 2 ? 'bg-gradient-to-r from-indigo-500 to-purple-600' : 'bg-white/20'
              }`}
          />
        </div>

        {/* Form */}
        <motion.div
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-2xl"
        >
          <form onSubmit={handleSubmit}>
            {step === 1 && (
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="space-y-5"
              >
                <div>
                  <label className="text-purple-200 text-sm mb-2 block">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400 w-5 h-5" />
                    <Input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      placeholder="Miran Jamadar"
                      className="bg-white/10 border-white/20 text-white placeholder:text-purple-300 pl-12 py-6 rounded-2xl"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-purple-200 text-sm mb-2 block">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400 w-5 h-5" />
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="miran786mj@gmail.com"
                      className="bg-white/10 border-white/20 text-white placeholder:text-purple-300 pl-12 py-6 rounded-2xl"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={!isStep1Valid}
                  className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white py-6 rounded-2xl text-lg disabled:opacity-50 mt-6"
                >
                  Continue
                  <ArrowRight className="ml-2" />
                </Button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="space-y-5"
              >
                <div>
                  <label className="text-purple-200 text-sm mb-2 block">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400 w-5 h-5" />
                    <Input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+91 7744039115"
                      className="bg-white/10 border-white/20 text-white placeholder:text-purple-300 pl-12 py-6 rounded-2xl"
                      required
                    />
                  </div>
                </div>

                <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-4">
                  <p className="text-purple-200 text-sm">
                    📱 We'll send you a verification code to confirm your number
                  </p>
                </div>

                <div className="flex gap-3 mt-6">
                  <Button
                    type="button"
                    onClick={() => setStep(1)}
                    variant="outline"
                    className="flex-1 border-white/20 text-white hover:bg-white/10 py-6 rounded-2xl"
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    disabled={!isStep2Valid}
                    className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white py-6 rounded-2xl disabled:opacity-50"
                  >
                    Next: Face ID
                    <ArrowRight className="ml-2" />
                  </Button>
                </div>
              </motion.div>
            )}
          </form>
        </motion.div>

        {/* Terms */}
        <p className="text-center text-purple-300 text-xs mt-6">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </motion.div>
    </div>
  );
}
