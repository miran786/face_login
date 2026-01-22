import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, RefreshCw, ShieldCheck } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface OTPVerificationProps {
    email: string;
    onVerify: (otp: string) => void;
    onResend: () => void;
    onBack: () => void;
    context?: 'Login' | 'Password Reset' | 'Transaction';
}

export function OTPVerification({ email, onVerify, onResend, onBack, context = 'Login' }: OTPVerificationProps) {
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [timeLeft, setTimeLeft] = useState(30);
    const [isVerifying, setIsVerifying] = useState(false);

    useEffect(() => {
        if (timeLeft > 0) {
            const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
            return () => clearInterval(timer);
        }
    }, [timeLeft]);

    const handleChange = (element: HTMLInputElement, index: number) => {
        if (isNaN(Number(element.value))) return false;

        setOtp([...otp.map((d, idx) => (idx === index ? element.value : d))]);

        // Focus next input
        if (element.nextSibling && element.value !== '') {
            (element.nextSibling as HTMLInputElement).focus();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
        if (e.key === 'Backspace' && otp[index] === '' && index > 0) {
            const prev = document.getElementById(`otp-${index - 1}`);
            prev?.focus();
        }
    };

    const handleVerify = () => {
        const code = otp.join('');
        if (code.length === 6) {
            setIsVerifying(true);
            onVerify(code);
        }
    };

    const handleResend = () => {
        setOtp(['', '', '', '', '', '']);
        setTimeLeft(30);
        onResend();
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-black flex items-center justify-center p-6">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-md w-full bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl"
            >
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-500/20 rounded-full mb-4">
                        <ShieldCheck className="w-10 h-10 text-indigo-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Two-Step Verification</h1>
                    <p className="text-purple-200 text-sm">
                        Enter the 6-digit code sent to <br />
                        <span className="font-semibold text-white">{email}</span>
                    </p>
                </div>

                <div className="flex gap-2 justify-center mb-8">
                    {otp.map((data, index) => (
                        <input
                            key={index}
                            id={`otp-${index}`}
                            type="text"
                            maxLength={1}
                            value={data}
                            onChange={e => handleChange(e.target, index)}
                            onKeyDown={e => handleKeyDown(e, index)}
                            className="w-12 h-14 bg-white/5 border border-white/10 rounded-xl text-center text-white text-2xl focus:border-indigo-500 focus:outline-none transition-all"
                        />
                    ))}
                </div>

                <Button
                    onClick={handleVerify}
                    disabled={otp.join('').length !== 6 || isVerifying}
                    className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white py-6 rounded-xl text-lg mb-4"
                >
                    {isVerifying ? 'Verifying...' : 'Verify Identity'} <ArrowRight className="ml-2 w-5 h-5" />
                </Button>

                <div className="text-center">
                    {timeLeft > 0 ? (
                        <p className="text-purple-300 text-sm">
                            Resend code in <span className="text-white font-mono">{timeLeft}s</span>
                        </p>
                    ) : (
                        <button
                            onClick={handleResend}
                            className="text-indigo-400 hover:text-indigo-300 text-sm font-medium flex items-center justify-center mx-auto"
                        >
                            <RefreshCw className="w-4 h-4 mr-1" /> Resend Code
                        </button>
                    )}
                </div>

                <div className="mt-6 text-center">
                    <button onClick={onBack} className="text-white/50 hover:text-white text-sm">Cancel</button>
                </div>
            </motion.div>
        </div>
    );
}
