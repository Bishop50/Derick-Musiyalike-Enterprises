import React, { useState, useEffect } from 'react';
import { Lock, ShieldCheck, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface LockScreenProps {
  onUnlock: () => void;
  onLogout: () => void;
  appName: string;
}

const LockScreen: React.FC<LockScreenProps> = ({ onUnlock, onLogout, appName }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [isCreating, setIsCreating] = useState(!localStorage.getItem('moneylink_user_pin'));
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<'enter' | 'confirm'>(isCreating ? 'enter' : 'enter');

  useEffect(() => {
    if (pin.length === 4) {
      if (isCreating) {
        if (step === 'enter') {
          setConfirmPin(pin);
          setPin('');
          setStep('confirm');
        } else {
          if (pin === confirmPin) {
            localStorage.setItem('moneylink_user_pin', pin);
            onUnlock();
          } else {
            setError('PINs do not match');
            setPin('');
            setConfirmPin('');
            setStep('enter');
          }
        }
      } else {
        handleUnlock();
      }
    }
  }, [pin]);

  const handleUnlock = () => {
    const savedPin = localStorage.getItem('moneylink_user_pin');
    if (savedPin && pin === savedPin) {
      onUnlock();
    } else if (!savedPin && pin.length === 4) {
      // Fallback if somehow they got here without a pin set
      onUnlock();
    } else {
      setError('Invalid PIN');
      setPin('');
      setAttempts(prev => prev + 1);
    }
  };

  const handleDigit = (digit: string) => {
    if (pin.length < 4) {
      setPin(prev => prev + digit);
      setError('');
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
    setError('');
  };

  return (
    <div className="fixed inset-0 z-[200] bg-gray-900/95 backdrop-blur-xl flex flex-col items-center justify-center p-8 text-white">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-sm flex flex-col items-center"
      >
        <div className="w-24 h-24 bg-green-600/20 text-green-500 rounded-full flex items-center justify-center mb-8 border border-green-500/30 shadow-[0_0_40px_rgba(34,197,94,0.2)]">
          <Lock className="w-10 h-10" />
        </div>
        
        <h2 className="text-3xl font-black tracking-tight mb-2">Session Locked</h2>
        <p className="text-gray-400 mb-8 text-center text-sm">Enter your PIN to resume your session with<br/><span className="text-white font-bold">{appName}</span></p>

        {/* PIN Dots */}
        <div className="flex gap-4 mb-12">
          {[0, 1, 2, 3].map((i) => (
            <div 
              key={i} 
              className={`w-4 h-4 rounded-full transition-all duration-300 ${
                i < pin.length 
                  ? 'bg-green-500 scale-110 shadow-[0_0_10px_rgba(34,197,94,0.5)]' 
                  : 'bg-gray-700'
              }`}
            />
          ))}
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-red-400 text-xs font-bold mb-6 bg-red-500/10 px-4 py-2 rounded-lg border border-red-500/20"
          >
            <AlertCircle className="w-4 h-4" />
            {error}
          </motion.div>
        )}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-6 w-full max-w-[280px]">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => handleDigit(num.toString())}
              className="w-16 h-16 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-2xl font-medium transition-all active:scale-95"
            >
              {num}
            </button>
          ))}
          <div className="w-16 h-16 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-gray-600" />
          </div>
          <button
            onClick={() => handleDigit('0')}
            className="w-16 h-16 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-2xl font-medium transition-all active:scale-95"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            className="w-16 h-16 rounded-full bg-transparent hover:bg-white/5 flex items-center justify-center text-sm font-bold text-gray-400 transition-all active:scale-95"
          >
            DELETE
          </button>
        </div>

        <button 
          onClick={() => {
            sessionStorage.removeItem('moneylink_is_locked');
            onLogout();
          }}
          className="mt-8 text-xs font-bold text-gray-400 hover:text-white transition-colors"
        >
          Return to Home Page
        </button>

        <p className="mt-8 text-[10px] text-gray-600 font-bold uppercase tracking-widest">
          Protected by MoneyLink Security
        </p>
      </motion.div>
    </div>
  );
};

export default LockScreen;
