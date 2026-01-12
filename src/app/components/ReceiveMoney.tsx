import { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Copy, Share2, CheckCircle } from 'lucide-react';
import { Button } from './ui/button';

interface ReceiveMoneyProps {
  onBack: () => void;
  userEmail: string;
  userName: string;
}

export function ReceiveMoney({ onBack, userEmail, userName }: ReceiveMoneyProps) {
  const [copied, setCopied] = useState(false);
  const walletAddress = userEmail; // Using email as the simplest identifier for now

  const handleCopy = () => {
    navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
      {/* Header */}
      <div className="px-6 pt-8 pb-6">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft />
          </Button>
          <h1 className="text-2xl text-white">Receive Money</h1>
        </div>

        {/* QR Code Section */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 mb-6"
        >
          <p className="text-purple-300 text-center mb-6">
            Share this QR code or use your email
          </p>

          {/* QR Code */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-white rounded-3xl p-6 mb-6 mx-auto max-w-[280px]"
          >
            <svg viewBox="0 0 200 200" className="w-full">
              {/* Simple QR code representation */}
              <rect width="200" height="200" fill="white" />

              {/* Corner markers */}
              <rect x="10" y="10" width="40" height="40" fill="black" />
              <rect x="20" y="20" width="20" height="20" fill="white" />
              <rect x="150" y="10" width="40" height="40" fill="black" />
              <rect x="160" y="20" width="20" height="20" fill="white" />
              <rect x="10" y="150" width="40" height="40" fill="black" />
              <rect x="20" y="160" width="20" height="20" fill="white" />

              {/* Random pattern blocks */}
              {[...Array(20)].map((_, i) => {
                const x = 60 + (i % 8) * 15;
                const y = 60 + Math.floor(i / 8) * 15;
                return (
                  <rect
                    key={i}
                    x={x}
                    y={y}
                    width="10"
                    height="10"
                    fill="black"
                    opacity={Math.random() > 0.4 ? 1 : 0}
                  />
                );
              })}
            </svg>
          </motion.div>

          {/* Wallet Address */}
          <div className="bg-white/10 rounded-2xl p-4 mb-4">
            <p className="text-xs text-purple-300 mb-2">My ID (Email)</p>
            <p className="text-white text-center break-all font-mono">{userEmail}</p>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={handleCopy}
              className="bg-white/20 hover:bg-white/30 text-white border border-white/20"
            >
              {copied ? (
                <>
                  <CheckCircle className="mr-2 w-4 h-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="mr-2 w-4 h-4" />
                  Copy
                </>
              )}
            </Button>
            <Button className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white">
              <Share2 className="mr-2 w-4 h-4" />
              Share
            </Button>
          </div>
        </motion.div>

        {/* Instructions */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
            <div>
              <h4 className="text-white mb-1">How it works</h4>
              <p className="text-purple-300 text-sm">
                Senders can find you by your name or email address "{userEmail}" in the Send Money screen.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
