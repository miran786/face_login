import { useState } from 'react';
import { motion } from 'motion/react';
import {
  Bell,
  Settings,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  Wallet,
  LogOut,
  QrCode
} from 'lucide-react';
import { Button } from './ui/button';
import { SendMoney } from './SendMoney';
import { ReceiveMoney } from './ReceiveMoney';
import { db } from '../../db';
import { useLiveQuery } from 'dexie-react-hooks';

interface DashboardProps {
  user: {
    fullName: string;
    email: string;
  };
  onLogout: () => void;
}

export function Dashboard({ user, onLogout }: DashboardProps) {
  const [showSendMoney, setShowSendMoney] = useState(false);
  const [showReceiveMoney, setShowReceiveMoney] = useState(false);

  // Real Data Fetching
  const currentUser = useLiveQuery(
    () => {
      if (!user?.email) return undefined;
      return db.users.where('email').equals(user.email).first();
    },
    [user?.email]
  );

  const transactions = useLiveQuery(
    () => {
      if (!user?.email) return [];
      return db.transactions
        .where('senderEmail').equals(user.email)
        .or('recipientEmail').equals(user.email)
        .reverse()
        .sortBy('date');
    },
    [user?.email]
  ) || [];

  if (!user || !user.email) {
    return <div className="min-h-screen flex items-center justify-center text-white">Loading user profile...</div>;
  }

  // Use DB balance or default to 0
  const currentBalance = currentUser?.balance !== undefined ? currentUser.balance : 0;

  if (showSendMoney) {
    return <SendMoney
      onBack={() => setShowSendMoney(false)}
      onSendSuccess={() => setShowSendMoney(false)}
      currentUserEmail={user.email}
    />;
  }

  if (showReceiveMoney) {
    return <ReceiveMoney
      onBack={() => setShowReceiveMoney(false)}
      userEmail={user.email}
      userName={user.fullName}
    />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
      {/* Header */}
      <div className="flex items-center justify-between p-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-lg font-bold text-white shadow-lg shadow-purple-900/50 border border-white/10 overflow-hidden">
            {currentUser?.avatar ? (
              <img src={currentUser.avatar} alt="Profile" className="w-full h-full object-cover transform scale-x-[-1]" />
            ) : (
              user.fullName.split(' ').map(n => n[0]).join('')
            )}
          </div>
          <div>
            <h2 className="text-white font-semibold">Welcome back,</h2>
            <p className="text-purple-300 text-sm">{user.fullName}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {/* Logout Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onLogout}
            className="text-white/70 hover:text-white hover:bg-white/10 rounded-full"
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Balance Card */}
      <div className="px-6 mb-8">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-[2rem] p-8 shadow-2xl shadow-purple-900/50 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-3xl -ml-32 -mb-32" />

          <div className="relative z-10">
            <p className="text-purple-100 text-sm font-medium mb-2 opacity-80">Total Balance</p>
            <h1 className="text-5xl font-bold text-white mb-6">
              ₹{currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </h1>

            <div className="flex gap-4">
              <Button
                onClick={() => setShowSendMoney(true)}
                className="flex-1 bg-white text-purple-600 hover:bg-purple-50 rounded-xl py-6 font-semibold shadow-lg"
              >
                <ArrowUpRight className="mr-2 w-5 h-5" />
                Send
              </Button>
              <Button
                onClick={() => setShowReceiveMoney(true)}
                className="flex-1 bg-white/20 text-white hover:bg-white/30 rounded-xl py-6 font-semibold backdrop-blur-sm border border-white/10"
              >
                <ArrowDownLeft className="mr-2 w-5 h-5" />
                Receive
              </Button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Action Grid */}
      <div className="grid grid-cols-2 gap-4 px-6 mb-8">
        <motion.button
          whileTap={{ scale: 0.98 }}
          className="bg-white/5 hover:bg-white/10 p-4 rounded-2xl flex flex-col items-center gap-3 border border-white/5 transition-colors"
        >
          <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
            <Wallet className="w-6 h-6" />
          </div>
          <span className="text-white text-sm font-medium">Top Up</span>
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowReceiveMoney(true)}
          className="bg-white/5 hover:bg-white/10 p-4 rounded-2xl flex flex-col items-center gap-3 border border-white/5 transition-colors"
        >
          <div className="w-12 h-12 rounded-full bg-pink-500/20 flex items-center justify-center text-pink-400">
            <QrCode className="w-6 h-6" />
          </div>
          <span className="text-white text-sm font-medium">Scan QR</span>
        </motion.button>
      </div>

      {/* Recent Activity */}
      <div className="bg-white/10 backdrop-blur-xl rounded-t-[2.5rem] min-h-[500px] border-t border-white/10 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">Recent Activity</h3>
          <Button variant="ghost" className="text-purple-300 hover:text-white">See All</Button>
        </div>

        <div className="space-y-4">
          {transactions.map((tx) => {
            const amISender = tx.senderEmail === user.email;

            // Normalize display info
            const displayName = amISender
              ? (tx.recipient || tx.recipientEmail || 'Unknown')
              : (tx.senderEmail || 'Unknown');

            const isReceived = tx.type === 'received' || !amISender;

            return (
              <motion.div
                key={tx.id}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isReceived ? 'bg-green-500/20 text-green-400' : 'bg-orange-500/20 text-orange-400'
                    }`}>
                    {isReceived ? <ArrowDownLeft className="w-6 h-6" /> : <ArrowUpRight className="w-6 h-6" />}
                  </div>
                  <div>
                    <h4 className="text-white font-medium">
                      {displayName}
                    </h4>
                    <p className="text-xs text-purple-300 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(tx.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <span className={`font-bold ${isReceived ? 'text-green-400' : 'text-white'
                  }`}>
                  {isReceived ? '+' : '-'}₹{tx.amount.toFixed(2)}
                </span>
              </motion.div>
            )
          })}

          {transactions.length === 0 && (
            <div className="text-center text-purple-300 py-10">
              <p>No transactions yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
