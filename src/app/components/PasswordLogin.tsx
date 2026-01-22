import { useState } from 'react';
import { motion } from 'motion/react';
import { Lock, Mail, ArrowRight, Scan, ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { db } from '../../db';

interface PasswordLoginProps {
    onLoginSuccess: (user: any) => void;
    onBackToFace: () => void;
    onForgotPassword: () => void;
}

export function PasswordLogin({ onLoginSuccess, onBackToFace, onForgotPassword }: PasswordLoginProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const user = await db.users.where('email').equals(email).first();

            if (user && user.password === password) {
                // Success
                setTimeout(() => {
                    onLoginSuccess(user);
                }, 800);
            } else {
                setError('Invalid email or password');
                setIsLoading(false);
            }
        } catch (err) {
            console.error(err);
            setError('Login failed');
            setIsLoading(false);
        }
    };

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
                    onClick={onBackToFace}
                >
                    <ArrowLeft className="w-5 h-5" />
                </Button>

                <div className="text-center mb-8 mt-4">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-500/20 rounded-full mb-4">
                        <Lock className="w-10 h-10 text-indigo-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Welcome Back</h1>
                    <p className="text-purple-200 text-sm">Login with your password</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
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

                    <div>
                        <label className="text-purple-200 text-sm mb-2 block">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400 w-5 h-5" />
                            <Input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="bg-white/10 border-white/20 text-white placeholder:text-purple-300 pl-12 py-6 rounded-2xl"
                                required
                            />
                        </div>
                        <div className="text-right mt-2">
                            <button type="button" onClick={onForgotPassword} className="text-xs text-indigo-300 hover:text-white transition-colors">
                                Forgot Password?
                            </button>
                        </div>
                    </div>

                    {error && <p className="text-red-400 text-sm text-center">{error}</p>}

                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white py-6 rounded-2xl text-lg"
                    >
                        {isLoading ? 'Verifying...' : 'Login'} <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                </form>

                <div className="mt-8 text-center">
                    <p className="text-white/40 text-sm mb-4">or</p>
                    <Button
                        onClick={onBackToFace}
                        variant="outline"
                        className="w-full border-white/10 bg-transparent hover:bg-white/5 text-white py-6 rounded-2xl"
                    >
                        <Scan className="mr-2 w-5 h-5" /> Login with Face ID
                    </Button>
                </div>
            </motion.div>
        </div>
    );
}
