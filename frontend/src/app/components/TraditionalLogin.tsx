import { useState } from 'react';
import { motion } from 'motion/react';
import { Lock, User, ArrowRight, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { TraditionalUserData } from './TraditionalRegistration';
import { sendSuspiciousLoginAlert } from '../../utils/email-service';

interface TraditionalLoginProps {
    onLoginSuccess: (userData: TraditionalUserData) => void;
    onBack: () => void;
}

export function TraditionalLogin({ onLoginSuccess, onBack }: TraditionalLoginProps) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [failedAttempts, setFailedAttempts] = useState(0);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!username || !password) return;

        setIsLoading(true);
        setErrorMsg('');

        try {
            const response = await fetch('http://localhost:5000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 401 && data.email) {
                    const newAttempts = failedAttempts + 1;
                    setFailedAttempts(newAttempts);

                    if (newAttempts >= 3) {
                        const metadata = {
                            ip: 'Client-Side (Localhost)',
                            device: navigator.userAgent,
                            location: 'Navi Mumbai',
                            timestamp: new Date().toISOString()
                        };
                        sendSuspiciousLoginAlert(data.email, metadata);
                        setErrorMsg('Too many failed attempts. A security alert has been sent to your registered email.');
                        setFailedAttempts(0); // Optionally reset or keep them locked
                    } else {
                        setErrorMsg(data.error || 'Login failed');
                    }
                } else {
                    setErrorMsg(data.error || 'Login failed');
                }
                setIsLoading(false);
                return;
            }

            // Successful login resets failed attempts
            setFailedAttempts(0);

            // Assume data.user contains the user details
            onLoginSuccess({
                fullName: data.user.name,
                username: data.user.username,
                email: data.user.email || '',
                phone: '', // Placeholder, usually not sent back or not needed for login
                password: '' // Don't store password in state
            });
        } catch (err) {
            setErrorMsg('Network error, please try again later.');
            setIsLoading(false);
        }
    };

    const isFormValid = username.length > 0 && password.length > 0;

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
                        <h1 className="text-3xl font-bold text-white">Welcome Back</h1>
                        <p className="text-purple-300">Login with your credentials</p>
                    </div>
                </div>

                {/* Form */}
                <motion.div
                    initial={{ scale: 0.95 }}
                    animate={{ scale: 1 }}
                    className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-2xl"
                >
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="text-purple-200 text-sm mb-2 block">Username</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400 w-5 h-5" />
                                <Input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="johndoe"
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
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
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
                        </div>

                        <Button
                            type="submit"
                            disabled={!isFormValid || isLoading}
                            className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white py-6 rounded-2xl text-lg disabled:opacity-50 mt-6"
                        >
                            {isLoading ? 'Signing in...' : 'Sign In'}
                            {!isLoading && <ArrowRight className="ml-2" />}
                        </Button>

                        {errorMsg && (
                            <p className="text-red-400 text-center text-sm mt-4">{errorMsg}</p>
                        )}
                    </form>
                </motion.div>
            </motion.div>
        </div>
    );
}
