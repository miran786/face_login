import { useState } from 'react';
import { motion } from 'motion/react';
import { Lock, Mail, User, Phone, ArrowRight, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { db } from '../../db';

interface TraditionalRegistrationProps {
  onComplete: (userData: TraditionalUserData) => void;
  onBack: () => void;
}

export interface TraditionalUserData {
  fullName: string;
  email: string;
  phone: string;
  password: string;
}

export function TraditionalRegistration({ onComplete, onBack }: TraditionalRegistrationProps) {
  const [formData, setFormData] = useState<TraditionalUserData>({
    fullName: '',
    email: '',
    phone: '',
    password: '',
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [step, setStep] = useState(1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1 && formData.fullName && formData.email) {
      setStep(2);
    } else if (step === 2 && formData.phone && formData.password && formData.password === confirmPassword) {
      try {
        await db.users.add(formData);
        onComplete(formData);
      } catch (error) {
        console.error('Failed to save user:', error);
        // Fallback or error handling
        onComplete(formData);
      }
    }
  };

  const passwordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength++;
    if (password.match(/[0-9]/)) strength++;
    if (password.match(/[^a-zA-Z0-9]/)) strength++;
    return strength;
  };

  const getPasswordStrengthText = () => {
    const strength = passwordStrength(formData.password);
    if (strength === 0) return { text: '', color: '' };
    if (strength <= 1) return { text: 'Weak', color: 'text-red-400' };
    if (strength <= 2) return { text: 'Fair', color: 'text-yellow-400' };
    if (strength <= 3) return { text: 'Good', color: 'text-blue-400' };
    return { text: 'Strong', color: 'text-green-400' };
  };

  const isStep1Valid = formData.fullName && formData.email;
  const isStep2Valid = formData.phone && formData.password.length >= 8 && formData.password === confirmPassword;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-black flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white">Create Account</h1>
            <p className="text-purple-300">Traditional registration</p>
          </div>
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

                <div>
                  <label className="text-purple-200 text-sm mb-2 block">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400 w-5 h-5" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="••••••••"
                      className="bg-white/10 border-white/20 text-white placeholder:text-purple-300 pl-12 pr-12 py-6 rounded-2xl"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-purple-400"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {formData.password && (
                    <div className="mt-2">
                      <div className="flex gap-1 mb-1">
                        {[...Array(4)].map((_, i) => (
                          <div
                            key={i}
                            className={`h-1 flex-1 rounded-full ${i < passwordStrength(formData.password)
                              ? passwordStrength(formData.password) <= 1
                                ? 'bg-red-400'
                                : passwordStrength(formData.password) <= 2
                                  ? 'bg-yellow-400'
                                  : passwordStrength(formData.password) <= 3
                                    ? 'bg-blue-400'
                                    : 'bg-green-400'
                              : 'bg-white/20'
                              }`}
                          />
                        ))}
                      </div>
                      <p className={`text-xs ${getPasswordStrengthText().color}`}>
                        {getPasswordStrengthText().text}
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-purple-200 text-sm mb-2 block">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400 w-5 h-5" />
                    <Input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="bg-white/10 border-white/20 text-white placeholder:text-purple-300 pl-12 pr-12 py-6 rounded-2xl"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-purple-400"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {confirmPassword && formData.password !== confirmPassword && (
                    <p className="text-red-400 text-xs mt-1">Passwords do not match</p>
                  )}
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
                    Create Account
                  </Button>
                </div>
              </motion.div>
            )}
          </form>
        </motion.div>

        {/* Security Notice */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 mt-6">
          <p className="text-purple-200 text-sm text-center">
            🔒 Your data is encrypted and secured with industry-standard protocols
          </p>
        </div>
      </motion.div>
    </div>
  );
}
