import { motion } from 'motion/react';
import { ArrowLeft, ArrowUpRight, ArrowDownLeft, Filter } from 'lucide-react';
import { Button } from './ui/button';

interface Transaction {
  id: string;
  type: 'sent' | 'received';
  amount: number;
  recipient: string;
  date: string;
  status: 'completed' | 'pending';
}

interface TransactionHistoryProps {
  transactions: Transaction[];
  onBack: () => void;
}

export function TransactionHistory({ transactions, onBack }: TransactionHistoryProps) {
  const groupTransactionsByDate = () => {
    const grouped: { [key: string]: Transaction[] } = {};
    
    transactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      let label: string;
      if (date.toDateString() === today.toDateString()) {
        label = 'Today';
      } else if (date.toDateString() === yesterday.toDateString()) {
        label = 'Yesterday';
      } else {
        label = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      }
      
      if (!grouped[label]) {
        grouped[label] = [];
      }
      grouped[label].push(transaction);
    });
    
    return grouped;
  };

  const groupedTransactions = groupTransactionsByDate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
      {/* Header */}
      <div className="px-6 pt-8 pb-6 sticky top-0 bg-gradient-to-b from-slate-950 to-transparent backdrop-blur-xl z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="text-white hover:bg-white/10"
            >
              <ArrowLeft />
            </Button>
            <h1 className="text-2xl text-white">Transaction History</h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10"
          >
            <Filter />
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4">
            <p className="text-purple-300 text-sm mb-1">Total Sent</p>
            <p className="text-white text-xl">
              ${transactions
                .filter(t => t.type === 'sent')
                .reduce((sum, t) => sum + t.amount, 0)
                .toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4">
            <p className="text-purple-300 text-sm mb-1">Total Received</p>
            <p className="text-white text-xl">
              ${transactions
                .filter(t => t.type === 'received')
                .reduce((sum, t) => sum + t.amount, 0)
                .toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="px-6 pb-6">
        {Object.entries(groupedTransactions).map(([date, txns], groupIndex) => (
          <div key={date} className="mb-6">
            <h3 className="text-purple-300 text-sm mb-3">{date}</h3>
            <div className="space-y-3">
              {txns.map((transaction, index) => (
                <motion.div
                  key={transaction.id}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: (groupIndex * 0.1) + (index * 0.05) }}
                  className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4 hover:bg-white/20 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`rounded-full w-12 h-12 flex items-center justify-center ${
                        transaction.type === 'received' 
                          ? 'bg-green-500/20' 
                          : 'bg-red-500/20'
                      }`}>
                        {transaction.type === 'received' ? (
                          <ArrowDownLeft className="text-green-400" />
                        ) : (
                          <ArrowUpRight className="text-red-400" />
                        )}
                      </div>
                      <div>
                        <p className="text-white font-medium">{transaction.recipient}</p>
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-purple-300">
                            {new Date(transaction.date).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            transaction.status === 'completed'
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {transaction.status}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${
                        transaction.type === 'received' ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {transaction.type === 'received' ? '+' : '-'}$
                        {transaction.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
