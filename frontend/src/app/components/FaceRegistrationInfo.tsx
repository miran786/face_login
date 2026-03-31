import { useState } from 'react';
import { API_BASE } from '../config';
import { motion } from 'motion/react';
import { User, Mail, Phone, Lock, ArrowRight, CheckCircle2, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';


interface FaceRegistrationInfoProps {
  faceDescriptor: number[] | null;
  onComplete: (userData: FaceUserData) => void;
  onBack?: () => void;
}

export interface FaceUserData {
  fullName: string;
  username: string;
  email: string;
  phone: string;
  password?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function FaceRegistrationInfo({ faceDescriptor, onComplete, onBack }: FaceRegistrationInfoProps) {
  const [formData, setFormData] = useState<FaceUserData>({
    fullName: '',
    username: '',
    email: '',
    phone: '',
    password: '',
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Only allow digits in phone, max 10
  const handlePhoneChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 10);
    setFormData({ ...formData, phone: digits });
    if (fieldErrors.phone) setFieldErrors({ ...fieldErrors, phone: '' });
  };

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!formData.fullName.trim()) errors.fullName = 'Full name is required';
    if (!formData.username.trim()) errors.username = 'Username is required';
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!EMAIL_REGEX.test(formData.email)) {
      errors.email = 'Enter a valid email address';
    }
    const digits = formData.phone.replace(/\D/g, '');
    if (!formData.phone) {
      errors.phone = 'Phone number is required';
    } else if (digits.length !== 10) {
      errors.phone = 'Phone must be exactly 10 digits';
    }
    if (!formData.password) {
      errors.password = 'Password is required (used as backup if Face ID fails)';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }
    if (formData.password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsRegistering(true);
    setErrorMsg('');

    try {
      if (!faceDescriptor || faceDescriptor.length !== 128) {
        throw new Error('Face descriptor is missing or invalid. Please go back and scan your face again.');
      }

      const registerRes = await fetch(`${API_BASE}/api/face/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          username: formData.username,
          name: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
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

  const passwordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength++;
    if (password.match(/[0-9]/)) strength++;
    if (password.match(/[^a-zA-Z0-9]/)) strength++;
    return strength;
  };

  const getStrengthText = () => {
    const s = passwordStrength(formData.password || '');
    if (s === 0) return { text: '', color: '' };
    if (s <= 1) return { text: 'Weak', color: 'text-red-400' };
    if (s <= 2) return { text: 'Fair', color: 'text-yellow-400' };
    if (s <= 3) return { text: 'Good', color: 'text-blue-400' };
    return { text: 'Strong', color: 'text-green-400' };
  };

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
            onClick={() => {
              const rand = Math.floor(Math.random() * 1000);
              setFormData({
                fullName: 'John Doe',
                username: `johndoe${rand}`,
                email: `john${rand}@example.com`,
                phone: '9876543210',
                password: 'Password@1',
              });
              setConfirmPassword('Password@1');
              setFieldErrors({});
            }}
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
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="text-green-200 text-sm mb-2 block">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-green-400 w-5 h-5" />
                  <Input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => { setFormData({ ...formData, fullName: e.target.value }); setFieldErrors({ ...fieldErrors, fullName: '' }); }}
                    placeholder="John Doe"
                    className="bg-white/10 border-white/20 text-white placeholder:text-green-300 pl-12 py-6 rounded-2xl"
                  />
                </div>
                {fieldErrors.fullName && <p className="text-red-400 text-xs mt-1">{fieldErrors.fullName}</p>}
              </div>

              {/* Username */}
              <div>
                <label className="text-green-200 text-sm mb-2 block">Username</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-green-400 w-5 h-5" />
                  <Input
                    type="text"
                    value={formData.username}
                    onChange={(e) => { setFormData({ ...formData, username: e.target.value.toLowerCase().trim() }); setFieldErrors({ ...fieldErrors, username: '' }); }}
                    placeholder="johndoe"
                    className="bg-white/10 border-white/20 text-white placeholder:text-green-300 pl-12 py-6 rounded-2xl"
                  />
                </div>
                {fieldErrors.username && <p className="text-red-400 text-xs mt-1">{fieldErrors.username}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="text-green-200 text-sm mb-2 block">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-green-400 w-5 h-5" />
                  <Input
                    type="text"
                    value={formData.email}
                    onChange={(e) => { setFormData({ ...formData, email: e.target.value }); setFieldErrors({ ...fieldErrors, email: '' }); }}
                    placeholder="john@example.com"
                    className="bg-white/10 border-white/20 text-white placeholder:text-green-300 pl-12 py-6 rounded-2xl"
                  />
                </div>
                {fieldErrors.email && <p className="text-red-400 text-xs mt-1">{fieldErrors.email}</p>}
              </div>

              {/* Phone */}
              <div>
                <label className="text-green-200 text-sm mb-2 block">Phone Number (10 digits)</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-green-400 w-5 h-5" />
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    placeholder="9876543210"
                    maxLength={10}
                    className="bg-white/10 border-white/20 text-white placeholder:text-green-300 pl-12 py-6 rounded-2xl"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-green-400 text-xs">
                    {formData.phone.replace(/\D/g, '').length}/10
                  </span>
                </div>
                {fieldErrors.phone && <p className="text-red-400 text-xs mt-1">{fieldErrors.phone}</p>}
              </div>

              {/* Password */}
              <div>
                <label className="text-green-200 text-sm mb-2 block">Backup Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-green-400 w-5 h-5" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => { setFormData({ ...formData, password: e.target.value }); setFieldErrors({ ...fieldErrors, password: '' }); }}
                    placeholder="••••••••"
                    className="bg-white/10 border-white/20 text-white placeholder:text-green-300 pl-12 pr-12 py-6 rounded-2xl"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-green-400"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {fieldErrors.password && <p className="text-red-400 text-xs mt-1">{fieldErrors.password}</p>}
                {formData.password && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className={`h-1 flex-1 rounded-full ${i < passwordStrength(formData.password || '')
                          ? passwordStrength(formData.password || '') <= 1 ? 'bg-red-400'
                            : passwordStrength(formData.password || '') <= 2 ? 'bg-yellow-400'
                              : passwordStrength(formData.password || '') <= 3 ? 'bg-blue-400'
                                : 'bg-green-400'
                          : 'bg-white/20'}`} />
                      ))}
                    </div>
                    <p className={`text-xs ${getStrengthText().color}`}>{getStrengthText().text}</p>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="text-green-200 text-sm mb-2 block">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-green-400 w-5 h-5" />
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setFieldErrors({ ...fieldErrors, confirmPassword: '' }); }}
                    placeholder="••••••••"
                    className="bg-white/10 border-white/20 text-white placeholder:text-green-300 pl-12 pr-12 py-6 rounded-2xl"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-green-400"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {fieldErrors.confirmPassword && <p className="text-red-400 text-xs mt-1">{fieldErrors.confirmPassword}</p>}
              </div>

              <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4">
                <p className="text-green-200 text-sm">
                  ✨ You'll log in with Face ID. The password is your secure backup.
                </p>
              </div>

              <Button
                type="submit"
                disabled={isRegistering}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-6 rounded-2xl text-lg disabled:opacity-50 mt-2"
              >
                {isRegistering ? 'Registering...' : 'Complete Registration'}
                {!isRegistering && <ArrowRight className="ml-2" />}
              </Button>

              {errorMsg && (
                <p className="text-red-400 text-center text-sm font-medium mt-2">
                  {errorMsg}
                </p>
              )}
            </form>
          </motion.div>
        </div>

        <p className="text-center text-green-300 text-xs mt-6">
          Your face data is stored securely and never shared
        </p>
      </motion.div>
    </div>
  );
}
