import { useState, useEffect } from 'react';
import { API_BASE } from '../config';
import { motion } from 'motion/react';
import {
  ArrowUpRight,
  ArrowDownLeft,
  CreditCard,
  TrendingUp,
  Eye,
  EyeOff,
  LogOut,
  UserCircle,
  ShieldCheck,
  Lock
} from 'lucide-react';
import { Button } from './ui/button';
import { SendMoney } from './SendMoney';
import { TransactionHistory } from './TransactionHistory';
import { Profile } from './Profile';
import { ReAuthModal } from './ReAuthModal';

interface Transaction {
  id: string;
  type: 'sent' | 'received';
  amount: number;
  recipient: string;
  date: string;
  status: 'completed' | 'pending';
}

interface DashboardProps {
  userName?: string;
  onLogout: () => void;
}

export function Dashboard({ userName, onLogout }: DashboardProps) {
  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
      onLogout();
    } catch (err) {
      console.error('Logout failed', err);
      onLogout();
    }
  };

  const [balance, setBalance] = useState(0);
  const [showBalance, setShowBalance] = useState(false); // Hidden by default
  const [balanceAuthenticated, setBalanceAuthenticated] = useState(false);
  const [showTransactions, setShowTransactions] = useState(false); // Hidden by default
  const [transactionsAuthenticated, setTransactionsAuthenticated] = useState(false);
  const [activeView, setActiveView] = useState<'dashboard' | 'send' | 'history' | 'profile'>('dashboard');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  // ReAuth modal state
  const [reAuthOpen, setReAuthOpen] = useState(false);
  const [reAuthTarget, setReAuthTarget] = useState<'balance' | 'transactions' | null>(null);

  const fetchWalletData = async (signal?: AbortSignal) => {
    try {
      setFetchError('');
      const [balanceRes, historyRes] = await Promise.all([
        fetch(`${API_BASE}/api/wallet/balance`, { credentials: 'include', signal }),
        fetch(`${API_BASE}/api/wallet/history`, { credentials: 'include', signal })
      ]);

      if (balanceRes.ok && historyRes.ok) {
        const balanceData = await balanceRes.json();
        const historyData = await historyRes.json();
        setBalance(balanceData.balance);
        setTransactions(historyData.transactions);
      } else {
        const balanceFailText = await balanceRes.text();
        const historyFailText = await historyRes.text();
        console.error('Wallet Data API Failed: ', {
          balanceStatus: balanceRes.status,
          balanceText: balanceFailText,
          historyStatus: historyRes.status,
          historyText: historyFailText,
        });
        setFetchError('Failed to load wallet data.');
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Network Error fetching wallet data:', error);
        setFetchError('Could not connect to server.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchWalletData(controller.signal);
    return () => controller.abort();
  }, []);

  const handleSendMoney = async (recipient: string, amount: number) => {
    await fetchWalletData();
    setActiveView('dashboard');
  };

  // Handle balance eye toggle — require auth if not yet authenticated
  const handleBalanceToggle = () => {
    if (showBalance) {
      // Hiding: just hide, no re-auth needed
      setShowBalance(false);
      setBalanceAuthenticated(false);
      return;
    }
    // Showing: require re-auth
    if (!balanceAuthenticated) {
      setReAuthTarget('balance');
      setReAuthOpen(true);
    } else {
      setShowBalance(true);
    }
  };

  // Handle transactions reveal
  const handleTransactionsReveal = () => {
    if (showTransactions) {
      setShowTransactions(false);
      setTransactionsAuthenticated(false);
      return;
    }
    if (!transactionsAuthenticated) {
      setReAuthTarget('transactions');
      setReAuthOpen(true);
    } else {
      setShowTransactions(true);
    }
  };

  // ReAuth success handler
  const handleReAuthSuccess = () => {
    setReAuthOpen(false);
    if (reAuthTarget === 'balance') {
      setBalanceAuthenticated(true);
      setShowBalance(true);
    } else if (reAuthTarget === 'transactions') {
      setTransactionsAuthenticated(true);
      setShowTransactions(true);
    }
    setReAuthTarget(null);
  };

  if (activeView === 'send') {
    return <SendMoney onBack={() => setActiveView('dashboard')} onSend={handleSendMoney} />;
  }


  if (activeView === 'history') {
    return <TransactionHistory transactions={transactions} onBack={() => setActiveView('dashboard')} />;
  }

  if (activeView === 'profile') {
    return (
      <Profile
        onBack={() => setActiveView('dashboard')}
        onDataDeleted={() => {
          onLogout(); // Clear session state and go back to start
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
      {/* ReAuth Modal */}
      <ReAuthModal
        isOpen={reAuthOpen}
        onClose={() => {
          setReAuthOpen(false);
          setReAuthTarget(null);
        }}
        onSuccess={handleReAuthSuccess}
        title={
          reAuthTarget === 'balance'
            ? 'View Balance'
            : 'View Transactions'
        }
        description={
          reAuthTarget === 'balance'
            ? 'Verify your identity to reveal your balance'
            : 'Verify your identity to view transaction history'
        }
      />

      {/* Header */}
      <div className="px-6 pt-8 pb-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-xl text-white">Hello, {userName ? userName.split(' ')[0] : 'User'}</h1>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setActiveView('profile')}
              className="text-white hover:bg-white/10"
              title="Profile"
            >
              <UserCircle className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="text-white hover:bg-white/10"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Balance Card */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-6 mb-6 shadow-2xl"
        >
          <div className="flex justify-between items-start mb-8">
            <div>
              <p className="text-purple-100 text-sm mb-2">Total Balance</p>
              <div className="flex items-center gap-3">
                {isLoading ? (
                  <h2 className="text-4xl text-white/50">Loading...</h2>
                ) : fetchError ? (
                  <div className="flex flex-col gap-2">
                    <h2 className="text-2xl text-red-300">{fetchError}</h2>
                    <Button
                      variant="ghost"
                      onClick={() => { setIsLoading(true); fetchWalletData(); }}
                      className="text-white/80 hover:text-white hover:bg-white/20 text-sm w-fit"
                    >
                      Tap to retry
                    </Button>
                  </div>
                ) : showBalance ? (
                  <motion.h2
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    className="text-4xl text-white"
                  >
                    ₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </motion.h2>
                ) : (
                  <div className="flex items-center gap-2">
                    <h2 className="text-4xl text-white">••••••</h2>
                    {!balanceAuthenticated && (
                      <Lock className="w-4 h-4 text-purple-200/60" />
                    )}
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleBalanceToggle}
                  className="text-white hover:bg-white/20"
                  title={showBalance ? 'Hide balance' : 'Verify to view balance'}
                >
                  {showBalance ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                </Button>
              </div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
              <CreditCard className="text-white" />
            </div>
          </div>

          <div className="flex items-center gap-2 text-green-300">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm">FaceWallet</span>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <div className="flex justify-center mb-6">
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1 }}
            onClick={() => setActiveView('send')}
            className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4 hover:bg-white/20 transition-colors w-full max-w-[120px]"
          >
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-full w-12 h-12 flex items-center justify-center mb-3 mx-auto">
              <ArrowUpRight className="text-white" />
            </div>
            <p className="text-white text-sm text-center">Send</p>
          </motion.button>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-t-[2rem] min-h-[50vh] p-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-xl">Recent Transactions</h3>
            {!transactionsAuthenticated && (
              <Lock className="w-4 h-4 text-gray-400" />
            )}
          </div>
          <div className="flex items-center gap-2">
            {showTransactions && (
              <Button
                variant="ghost"
                onClick={() => setActiveView('history')}
                className="text-purple-600 hover:text-purple-700"
              >
                See All
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleTransactionsReveal}
              className={`rounded-xl ${
                showTransactions
                  ? 'text-purple-600 hover:text-purple-700 hover:bg-purple-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
              title={showTransactions ? 'Hide transactions' : 'Verify to view transactions'}
            >
              {showTransactions ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Hidden state */}
        {!showTransactions ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-12"
          >
            <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-full p-5 mb-4">
              <ShieldCheck className="w-10 h-10 text-purple-500" />
            </div>
            <p className="text-gray-600 font-medium mb-1">Transactions are hidden</p>
            <p className="text-gray-400 text-sm text-center max-w-[260px] mb-4">
              Verify your identity with Face ID to view your transaction history
            </p>
            <Button
              onClick={handleTransactionsReveal}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-2xl px-6 py-3"
            >
              <ShieldCheck className="mr-2 w-4 h-4" />
              Verify & View
            </Button>
          </motion.div>
        ) : (
          /* Visible state - transactions list */
          <div className="space-y-3">
            {transactions.length === 0 && !isLoading && (
              <p className="text-gray-400 text-center py-8">No transactions yet</p>
            )}
            {transactions.slice(0, 5).map((transaction, index) => (
              <motion.div
                key={transaction.id}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`rounded-full w-12 h-12 flex items-center justify-center ${transaction.type === 'received' ? 'bg-green-100' : 'bg-red-100'}`}>
                    {transaction.type === 'received' ? (
                      <ArrowDownLeft className="text-green-600" />
                    ) : (
                      <ArrowUpRight className="text-red-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{transaction.recipient}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(transaction.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${transaction.type === 'received' ? 'text-green-600' : 'text-red-600'}`}>
                    {transaction.type === 'received' ? '+' : '-'}₹
                    {transaction.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">{transaction.status}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
