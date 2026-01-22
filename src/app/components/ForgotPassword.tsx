import { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, ArrowLeft, ArrowRight, Lock } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { db } from '../../db';
import { emailService } from '../../services/emailService';
import { OTPVerification } from './OTPVerification';

interface ForgotPasswordProps {
    onBack: () => void;
    onSuccess: () => void;
}

export function ForgotPassword({ onBack, onSuccess }: ForgotPasswordProps) {
    const [step, setStep] = useState<'email' | 'otp' | 'reset'>('email');
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [generatedOtp, setGeneratedOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSendOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Check if user exists
            const user = await db.users.where('email').equals(email).first();
            if (!user) {
                setError('No account found with this email');
                setLoading(false);
                return;
            }

            // Generate & Send OTP
            const code = Math.floor(100000 + Math.random() * 900000).toString();
            const res = await emailService.sendPasswordReset(email, code);

            if (res.success) {
                setGeneratedOtp(code);
                setStep('otp');
            } else {
                setError('Failed to send email. Please try again.');
            }
        } catch (e) {
            console.error(e);
            setError('Something went wrong');
        }
        setLoading(false);
    };

    const handleVerifyOTP = (code: string) => {
        if (code === generatedOtp) {
            setOtp(code);
            setStep('reset');
        } else {
            alert("Incorrect OTP");
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const user = await db.users.where('email').equals(email).first();
            if (user && user.id) {
                await db.users.update(user.id, { password: newPassword });
                alert("Password Reset Successfully!");
                onSuccess(); // Go back to login
            }
        } catch (e) {
            console.error(e);
            setError("Failed to update password");
        }
        setLoading(false);
    }

    if (step === 'otp') {
        return (
            <OTPVerification
                email={email}
                onVerify={handleVerifyOTP}
                onResend={() => {/* Logic to resend, maybe reuse handleSendOTP but without event */ }}
                onBack={() => setStep('email')}
                context="Password Reset"
            />
        );
    }

    if (step === 'reset') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-black flex items-center justify-center p-6">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md w-full bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl relative"
                >
                    <h1 className="text-2xl font-bold text-white mb-6 text-center">Reset Password</h1>
                    <form onSubmit={handleResetPassword} className="space-y-6">
                        <div>
                            <label className="text-purple-200 text-sm mb-2 block">New Password</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400 w-5 h-5" />
                                <Input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="New strong password"
                                    className="bg-white/10 border-white/20 text-white placeholder:text-purple-300 pl-12 py-6 rounded-2xl"
                                    required
                                    minLength={6}
                                />
                            </div>
                        </div>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-6 rounded-2xl text-lg"
                        >
                            {loading ? 'Updating...' : 'Set New Password'}
                        </Button>
                    </form>
                </motion.div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-black flex items-center justify-center p-6">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-md w-full bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl relative"
            >
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-4 left-4 text-white/50 hover:text-white"
                    onClick={onBack}
                >
                    <ArrowLeft className="w-5 h-5" />
                </Button>

                <div className="text-center mb-8 mt-4">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-500/20 rounded-full mb-4">
                        <Mail className="w-10 h-10 text-indigo-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Forgot Password?</h1>
                    <p className="text-purple-200 text-sm">Enter your email to receive a reset code</p>
                </div>

                <form onSubmit={handleSendOTP} className="space-y-6">
                    <div>
                        <label className="text-purple-200 text-sm mb-2 block">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400 w-5 h-5" />
                            <Input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                className="bg-white/10 border-white/20 text-white placeholder:text-purple-300 pl-12 py-6 rounded-2xl"
                                required
                            />
                        </div>
                    </div>

                    {error && <p className="text-red-400 text-sm text-center">{error}</p>}

                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white py-6 rounded-2xl text-lg"
                    >
                        {loading ? 'Sending...' : 'Send OTP'} <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                </form>
            </motion.div>
        </div>
    );
}
