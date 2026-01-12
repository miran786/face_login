import { motion } from 'motion/react';
import { Scan, Mail, Lock, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';

interface RegistrationStartProps {
  onStartFaceID: () => void;
  onUseTraditional: () => void;
}

export function RegistrationStart({ onStartFaceID, onUseTraditional }: RegistrationStartProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-black flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        {/* Logo */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', delay: 0.2, duration: 0.8 }}
            className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[2rem] mb-6 shadow-2xl"
          >
            <Lock className="w-12 h-12 text-white" />
          </motion.div>
          <h1 className="text-5xl font-bold text-white mb-3">FaceWallet</h1>
          <p className="text-purple-300 text-lg">The future of secure payments</p>
        </div>

        {/* Main Face ID Option */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-6"
        >
          <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-8 shadow-2xl mb-4">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full mb-4">
                <Scan className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Register with Face ID</h2>
              <p className="text-purple-100 text-sm">
                Quick, secure, and passwordless authentication
              </p>
            </div>

            <Button
              onClick={onStartFaceID}
              className="w-full bg-white text-purple-600 hover:bg-purple-50 py-6 rounded-2xl text-lg font-semibold shadow-xl"
            >
              <Scan className="mr-2" />
              Start Face Registration
            </Button>
          </div>

          {/* Features */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-3 text-center">
              <div className="text-2xl mb-1">⚡</div>
              <p className="text-purple-200 text-xs">Instant</p>
            </div>
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-3 text-center">
              <div className="text-2xl mb-1">🔒</div>
              <p className="text-purple-200 text-xs">Secure</p>
            </div>
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-3 text-center">
              <div className="text-2xl mb-1">🚫</div>
              <p className="text-purple-200 text-xs">No Password</p>
            </div>
          </div>
        </motion.div>


        {/* Footer */}
        <p className="text-center text-purple-300 text-xs mt-8">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </motion.div>
    </div>
  );
}
