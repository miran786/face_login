import { motion } from 'motion/react';
import { Scan, Mail, Lock, ShieldCheck, Zap, KeyRound } from 'lucide-react';
import { Button } from './ui/button';

interface RegistrationStartProps {
  onStartFaceID: () => void;
  onUseTraditional: () => void;
}

export function RegistrationStart({ onStartFaceID, onUseTraditional }: RegistrationStartProps) {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6 overflow-hidden relative">
      {/* Background Ambience */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[120px] mix-blend-screen animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[120px] mix-blend-screen animate-pulse delay-1000" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="max-w-md w-full relative z-10"
      >
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.1 }}
            className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 rounded-[2rem] mb-6 ring-1 ring-white/10 backdrop-blur-xl shadow-[0_0_50px_-10px_rgba(99,102,241,0.3)]"
          >
            <Lock className="w-10 h-10 text-white" />
          </motion.div>
          <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-white via-indigo-100 to-indigo-200 tracking-tight mb-3">
            FaceWallet
          </h1>
          <p className="text-indigo-200/60 text-lg font-light tracking-wide">
            The future of secure payments
          </p>
        </div>

        {/* Main Card */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="relative group"
        >
          {/* Main Action Area */}
          <div className="bg-gray-900/40 backdrop-blur-2xl rounded-[2.5rem] p-2 border border-white/10 shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-br from-indigo-600/20 via-purple-600/10 to-transparent p-8 rounded-[2rem] border border-white/5 relative overflow-hidden">

              <div className="absolute top-0 right-0 p-8 opacity-20 transform translate-x-1/4 -translate-y-1/4">
                <Scan className="w-48 h-48 text-indigo-400" />
              </div>

              <div className="relative z-10">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-500 rounded-2xl mb-6 shadow-lg shadow-indigo-500/30">
                  <Scan className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">Face ID</h2>
                <p className="text-indigo-200/80 mb-8 max-w-[80%]">
                  Create an account in seconds using just your face. No passwords to remember.
                </p>

                <Button
                  onClick={onStartFaceID}
                  className="w-full bg-white text-indigo-950 hover:bg-gray-50 py-7 rounded-2xl text-lg font-bold shadow-xl transition-all active:scale-[0.98]"
                >
                  Start Registration
                </Button>
              </div>
            </div>

            {/* Features Staggered Grid */}
            <div className="grid grid-cols-3 gap-2 p-2 mt-2">
              {[
                { icon: Zap, label: "Instant", color: "text-yellow-400" },
                { icon: ShieldCheck, label: "Secure", color: "text-green-400" },
                { icon: KeyRound, label: "No Keys", color: "text-pink-400" }
              ].map((item, i) => (
                <div key={i} className="bg-white/5 hover:bg-white/10 transition-colors backdrop-blur-md rounded-2xl p-4 text-center border border-white/5">
                  <item.icon className={`w-6 h-6 mx-auto mb-2 ${item.color}`} />
                  <p className="text-white/60 text-xs font-medium tracking-wide">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-white/30 text-xs mb-4">
            — Or continue with —
          </p>
          <Button
            variant="outline"
            onClick={onUseTraditional}
            className="border-white/10 bg-transparent text-white/60 hover:text-white hover:bg-white/5 hover:border-white/20 rounded-xl px-6"
          >
            <Mail className="w-4 h-4 mr-2" />
            Email & Password
          </Button>
        </div>

        <p className="text-center text-indigo-200/20 text-[10px] mt-12 uppercase tracking-widest">
          Secure by Design
        </p>
      </motion.div>
    </div>
  );
}
