import { useState } from 'react';
import { API_BASE } from '../config';
import { motion } from 'motion/react';
import { Mail, ArrowLeft, Lock, Eye, EyeOff, CheckCircle2, KeyRound } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { sendPasswordResetOTP } from '../../utils/email-service';

interface ForgotPasswordProps {
  onBack: () => void;
  onSuccess: () => void;
}

type Step = 'email' | 'otp' | 'newPassword' | 'done';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function ForgotPassword({ onBack, onSuccess }: ForgotPasswordProps) {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [otpSent, setOtpSent] = useState(''); // the generated OTP
  const [otpInput, setOtpInput] = useState('');
  const [otpError, setOtpError] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Step 1: Send OTP to email
  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError('');
    setErrorMsg('');

    if (!email.trim()) {
      setEmailError('Email is required');
      return;
    }
    if (!EMAIL_REGEX.test(email)) {
      setEmailError('Enter a valid email address');
      return;
    }

    setIsLoading(true);
    try {
      const otp = generateOTP();
      const sent = await sendPasswordResetOTP(email, otp);
      if (sent) {
        setOtpSent(otp);
        setStep('otp');
      } else {
        setErrorMsg('Failed to send OTP. Please try again.');
      }
    } catch (err) {
      setErrorMsg('Failed to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOTP = (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError('');
    if (!otpInput.trim()) {
      setOtpError('Please enter the OTP');
      return;
    }
    if (otpInput.trim() !== otpSent) {
      setOtpError('Incorrect OTP. Please check your email and try again.');
      return;
    }
    setStep('newPassword');
  };

  // Step 3: Reset password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setErrorMsg('');

    if (!newPassword) {
      setPasswordError('Password is required');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, newPassword })
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to reset password');
        return;
      }

      setStep('done');
      setTimeout(onSuccess, 2000);
    } catch (err) {
      setErrorMsg('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-black flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white">Reset Password</h1>
            <p className="text-purple-300">
              {step === 'email' && 'Enter your registered email'}
              {step === 'otp' && 'Check your email for the OTP'}
              {step === 'newPassword' && 'Set your new password'}
              {step === 'done' && 'Password reset successful!'}
            </p>
          </div>
        </div>

        {/* Step Indicators */}
        <div className="flex gap-2 mb-8">
          {(['email', 'otp', 'newPassword', 'done'] as Step[]).map((s, i) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-all ${
                (['email', 'otp', 'newPassword', 'done'] as Step[]).indexOf(step) >= i
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600'
                  : 'bg-white/20'
              }`}
            />
          ))}
        </div>

        <motion.div
          key={step}
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-2xl"
        >
          {/* STEP 1: Email */}
          {step === 'email' && (
            <form onSubmit={handleSendOTP} className="space-y-5">
              <div>
                <label className="text-purple-200 text-sm mb-2 block">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400 w-5 h-5" />
                  <Input
                    type="text"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setEmailError(''); }}
                    placeholder="john@example.com"
                    className="bg-white/10 border-white/20 text-white placeholder:text-purple-300 pl-12 py-6 rounded-2xl"
                    autoFocus
                  />
                </div>
                {emailError && <p className="text-red-400 text-xs mt-1">{emailError}</p>}
              </div>

              {errorMsg && <p className="text-red-400 text-sm text-center">{errorMsg}</p>}

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white py-6 rounded-2xl text-lg disabled:opacity-50"
              >
                {isLoading ? 'Sending OTP...' : 'Send OTP to Email'}
              </Button>
            </form>
          )}

          {/* STEP 2: OTP Verification */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOTP} className="space-y-5">
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-4 mb-2">
                <p className="text-purple-200 text-sm text-center">
                  A 6-digit OTP has been sent to <span className="font-semibold text-white">{email}</span>
                </p>
              </div>

              <div>
                <label className="text-purple-200 text-sm mb-2 block">Enter OTP</label>
                <div className="relative">
                  <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400 w-5 h-5" />
                  <Input
                    type="text"
                    value={otpInput}
                    onChange={(e) => { setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6)); setOtpError(''); }}
                    placeholder="123456"
                    maxLength={6}
                    className="bg-white/10 border-white/20 text-white placeholder:text-purple-300 pl-12 py-6 rounded-2xl text-center text-2xl tracking-widest"
                    autoFocus
                  />
                </div>
                {otpError && <p className="text-red-400 text-xs mt-1">{otpError}</p>}
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white py-6 rounded-2xl text-lg"
              >
                Verify OTP
              </Button>

              <button
                type="button"
                onClick={() => { setStep('email'); setOtpInput(''); setOtpError(''); }}
                className="w-full text-purple-400 hover:text-purple-300 text-sm"
              >
                Resend OTP
              </button>
            </form>
          )}

          {/* STEP 3: New Password */}
          {step === 'newPassword' && (
            <form onSubmit={handleResetPassword} className="space-y-5">
              <div>
                <label className="text-purple-200 text-sm mb-2 block">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400 w-5 h-5" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => { setNewPassword(e.target.value); setPasswordError(''); }}
                    placeholder="••••••••"
                    className="bg-white/10 border-white/20 text-white placeholder:text-purple-300 pl-12 pr-12 py-6 rounded-2xl"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-purple-400"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-purple-200 text-sm mb-2 block">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400 w-5 h-5" />
                  <Input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setPasswordError(''); }}
                    placeholder="••••••••"
                    className="bg-white/10 border-white/20 text-white placeholder:text-purple-300 pl-12 pr-12 py-6 rounded-2xl"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-purple-400"
                  >
                    {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {passwordError && <p className="text-red-400 text-xs">{passwordError}</p>}
              {errorMsg && <p className="text-red-400 text-sm text-center">{errorMsg}</p>}

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white py-6 rounded-2xl text-lg disabled:opacity-50"
              >
                {isLoading ? 'Updating...' : 'Set New Password'}
              </Button>
            </form>
          )}

          {/* STEP 4: Done */}
          {step === 'done' && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center py-6"
            >
              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500 rounded-full mb-4">
                <CheckCircle2 className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Password Updated!</h2>
              <p className="text-purple-300">Redirecting to login...</p>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
