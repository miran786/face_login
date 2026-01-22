import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Scan, CheckCircle2, User as UserIcon } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { db } from '../../db';

interface SendMoneyProps {
  onBack: () => void;
  onSendSuccess: () => void;
  currentUserEmail: string;
}

export function SendMoney({ onBack, onSendSuccess, currentUserEmail }: SendMoneyProps) {
  const [amount, setAmount] = useState('');
  const [selectedContact, setSelectedContact] = useState<{ name: string, email: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<{ name: string, email: string }[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch users to send money to
  useEffect(() => {
    const fetchUsers = async () => {
      const allUsers = await db.users.toArray();
      const others = allUsers
        .filter(u => u.email !== currentUserEmail)
        .map(u => ({ name: u.fullName, email: u.email }));
      setAvailableUsers(others);
    };
    fetchUsers();
  }, [currentUserEmail]);


  const handleAmountChange = (value: string) => {
    const numericValue = value.replace(/[^\d.]/g, '');
    if (numericValue.split('.').length <= 2) {
      setAmount(numericValue);
    }
  };

  const addToAmount = (value: number) => {
    const currentAmount = parseFloat(amount || '0');
    setAmount((currentAmount + value).toString());
  };

  const handleSend = async () => {
    if (!amount || !selectedContact || parseFloat(amount) <= 0) return;

    setIsProcessing(true);

    try {
      // 1. Check Balance
      const sender = await db.users.where('email').equals(currentUserEmail).first();
      if (!sender || (sender.balance || 0) < parseFloat(amount)) {
        alert("Insufficient funds!"); // Basic check
        setIsProcessing(false);
        return;
      }

      const value = parseFloat(amount);

      // Simulate Face ID verification delay + Animation
      setTimeout(async () => {
        // 2. Perform Transaction
        await db.transaction('rw', db.users, db.transactions, async () => {
          // Deduct from Sender
          const sender = await db.users.where('email').equals(currentUserEmail).first();
          if (sender && sender.id) {
            await db.users.update(sender.id, { balance: (sender.balance || 0) - value });
          }

          // Add to Recipient
          const recipient = await db.users.where('email').equals(selectedContact.email).first();
          if (recipient && recipient.id) {
            await db.users.update(recipient.id, { balance: (recipient.balance || 0) + value });
          }

          // Record Transaction
          await db.transactions.add({
            type: 'sent',
            amount: value,
            recipient: selectedContact.name, // Display name
            recipientEmail: selectedContact.email,
            senderEmail: currentUserEmail,
            date: new Date().toISOString(),
            status: 'completed'
          });
        });

        setIsProcessing(false);
        setIsSuccess(true);

        setTimeout(() => {
          onSendSuccess();
        }, 1500);

      }, 2000);

    } catch (e) {
      console.error("Transaction failed", e);
      setIsProcessing(false);
    }
  };

  const filteredContacts = availableUsers.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-950 via-emerald-950 to-black flex items-center justify-center p-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.2, 1] }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center justify-center w-24 h-24 bg-green-500 rounded-full mb-6"
          >
            <CheckCircle2 className="w-16 h-16 text-white" />
          </motion.div>
          <h2 className="text-3xl text-white mb-2">Transaction Successful!</h2>
          <p className="text-green-300">
            ₹{parseFloat(amount).toFixed(2)} sent to {selectedContact?.name}
          </p>
        </motion.div>
      </div>
    );
  }

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-black flex items-center justify-center p-6">
        <motion.div className="text-center">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'linear',
            }}
            className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mb-6"
          >
            <Scan className="w-12 h-12 text-white" />
          </motion.div>
          <h2 className="text-2xl text-white mb-2">Verifying Face ID</h2>
          <p className="text-purple-300">Please look at the camera</p>
          <div className="mt-6">
            <div className="h-1 w-64 bg-white/20 rounded-full overflow-hidden mx-auto">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: 2 }}
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
              />
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

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
          <h1 className="text-2xl text-white">Send Money</h1>
        </div>

        {/* Amount Input */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 mb-6"
        >
          <p className="text-purple-300 text-sm mb-2 text-center">Amount</p>
          <div className="flex items-center justify-center mb-6">
            <span className="text-white text-6xl">₹</span>
            <input
              type="text"
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              placeholder="0"
              className="bg-transparent text-white text-6xl w-full text-center outline-none"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-4 gap-2">
            {[50, 100, 200, 500].map((value) => (
              <Button
                key={value}
                onClick={() => addToAmount(value)}
                variant="outline"
                className="border-white/20 bg-transparent text-white hover:bg-white/20"
              >
                +₹{value}
              </Button>
            ))}
          </div>
        </motion.div>

        {/* Recipient Selection */}
        <div className="mb-6">
          <h3 className="text-white text-lg mb-4">Send to</h3>

          {/* Search */}
          <div className="mb-4">
            <Input
              placeholder="Search contacts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white/10 border-white/20 text-white placeholder:text-purple-300"
            />
          </div>

          {/* Contacts List */}
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {filteredContacts.length === 0 && (
              <p className="text-center text-purple-300 py-4">No other users found</p>
            )}
            {filteredContacts.map((contact) => (
              <motion.button
                key={contact.email}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedContact(contact)}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${selectedContact?.email === contact.email
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600'
                  : 'bg-white/10 backdrop-blur-xl border border-white/20 hover:bg-white/20'
                  }`}
              >
                <div className={`w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center text-2xl`}>
                  <UserIcon className="text-indigo-300 w-6 h-6" />
                </div>
                <div className="text-left flex-1 min-w-0">
                  <p className="text-white truncate">{contact.name}</p>
                  <p className="text-xs text-purple-300 truncate">{contact.email}</p>
                </div>
                {selectedContact?.email === contact.email && (
                  <CheckCircle2 className="text-white flex-shrink-0" />
                )}
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* Send Button */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/80 to-transparent">
        <Button
          onClick={handleSend}
          disabled={!amount || !selectedContact || parseFloat(amount) <= 0}
          className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white py-6 rounded-2xl text-lg disabled:opacity-50"
        >
          <Scan className="mr-2" />
          Verify with Face ID & Send
        </Button>
      </div>
    </div>
  );
}
