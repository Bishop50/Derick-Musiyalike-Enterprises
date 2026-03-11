import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Smartphone, Lock, Eye, EyeOff, ArrowRight, X, Shield } from 'lucide-react';
import { User } from '../types';

interface LoginFlowProps {
  onLogin: (user: User) => void;
  onAdminLogin: () => void;
  onCancel: () => void;
  onSwitchToRegister: () => void;
  appConfig: { name: string, logo: string };
}

const LoginFlow: React.FC<LoginFlowProps> = ({ onLogin, onAdminLogin, onCancel, onSwitchToRegister, appConfig }) => {
  const [step, setStep] = useState<'login' | 'forgot-phone' | 'forgot-otp' | 'forgot-reset'>('login');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [resendTimer, setResendTimer] = useState(60);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === 'forgot-otp' && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, resendTimer]);

  const handleLogin = async () => {
    setIsLoading(true);
    setError('');
    // 1. Check Hardcoded Admin
    if (phone === '709580' && password === '709580') {
      onAdminLogin();
      return;
    }

    // 2. Check Created Admins (from API or LocalStorage)
    try {
      let admins: any[] = [];
      try {
        const res = await fetch('/api/admins');
        if (res.ok) {
          admins = await res.json();
        }
      } catch (e) {
        console.warn('Failed to fetch admins from API, checking local storage');
      }

      // Fallback to local storage for admins if API failed or returned empty
      if (admins.length === 0) {
        const storedAdmins = localStorage.getItem('moneylink_admins');
        if (storedAdmins) {
          admins = JSON.parse(storedAdmins);
        }
      }

      const adminUser = admins.find(a => a.username === phone && a.password === password);
      if (adminUser) {
        onAdminLogin();
        setIsLoading(false);
        return;
      }
    } catch (e) {
      console.error('Admin check failed:', e);
    }

    // 3. Check Regular Users
    try {
      let apiUsers: User[] = [];
      let localUsers: User[] = [];

      // Fetch from API
      try {
        const response = await fetch('/api/users');
        if (response.ok) {
          apiUsers = await response.json();
        }
      } catch (error) {
        console.warn('API login check failed, relying on local storage');
      }

      // Fetch from Local Storage
      const storedUsers = localStorage.getItem('moneylink_users');
      if (storedUsers) {
        localUsers = JSON.parse(storedUsers);
      }

      // Merge users (prefer API data if duplicate ID, but since we use random IDs, phone is better check)
      // Actually, we just need to find *any* matching user.
      const allUsers = [...apiUsers, ...localUsers];
      
      // Find user in combined list
      const user = allUsers.find(u => u.phone === phone && u.password === password);

      if (user) {
        onLogin(user);
      } else {
        setError('Invalid phone number or password');
      }
      setIsLoading(false);
    } catch (error) {
      console.error('Login failed:', error);
      setError('Connection error. Please try again.');
      setIsLoading(false);
    }
  };

  const handleForgotPhone = async () => {
    try {
      const response = await fetch('/api/users');
      const users: User[] = await response.json();
      const user = users.find(u => u.phone === phone);
      if (user) {
        setStep('forgot-otp');
        setError('');
        // Generate 6-digit secure OTP
        const array = new Uint32Array(1);
        window.crypto.getRandomValues(array);
        const newOtp = (array[0] % 900000 + 100000).toString();
        setGeneratedOtp(newOtp);
        setResendTimer(60);
        console.log('OTP Sent to +260' + phone + ': ' + newOtp);
      } else {
        setError('Phone number not registered');
      }
    } catch (error) {
      console.error('Forgot password check failed:', error);
      setError('Connection error.');
    }
  };

  const handleVerifyOtp = () => {
    if (otp === generatedOtp) {
      setStep('forgot-reset');
      setError('');
    } else {
      setError('Invalid OTP');
    }
  };

  const handleResetPassword = async () => {
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    try {
      const response = await fetch('/api/users');
      const users: User[] = await response.json();
      const user = users.find(u => u.phone === phone);
      
      if (user) {
        await fetch(`/api/users/${user.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: newPassword })
        });
        
        alert('Password reset successfully! Please log in.');
        setStep('login');
        setPassword('');
      } else {
        setError('User not found');
      }
    } catch (error) {
      console.error('Password reset failed:', error);
      setError('Failed to reset password.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl relative border border-[#E5E5E5]"
      >
        <div className="p-8">
          <div className="space-y-6">
            <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto border-4 border-green-100 shadow-xl overflow-hidden">
              <img 
                src={appConfig.logo} 
                alt="Logo" 
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://placehold.co/200x200/15803d/ffffff?text=LM";
                }}
              />
            </div>
            
            {step === 'login' && (
              <>
                <div className="text-center">
                  <h2 className="text-2xl font-bold">Welcome Back</h2>
                  <p className="text-[#666] text-sm mt-2 leading-relaxed">
                    Log in to your {appConfig.name} account to continue.
                  </p>
                </div>

                {error && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs font-bold">
                    {error}
                  </div>
                )}

                <div className="space-y-4">
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 border-r border-[#E5E5E5] pr-3">
                      <Smartphone className="w-4 h-4 text-[#999]" />
                    </div>
                    <input 
                      type="tel"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value.replace(/\D/g, ''));
                        setError('');
                      }}
                      className="w-full pl-16 pr-4 py-4 bg-[#F8F9FA] border border-[#E5E5E5] rounded-2xl text-lg font-bold focus:outline-none focus:border-green-700 transition-colors"
                      placeholder="971234567"
                    />
                  </div>

                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 border-r border-[#E5E5E5] pr-3">
                      <Lock className="w-4 h-4 text-[#999]" />
                    </div>
                    <input 
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError('');
                      }}
                      className="w-full pl-16 pr-12 py-4 bg-[#F8F9FA] border border-[#E5E5E5] rounded-2xl text-lg font-medium focus:outline-none focus:border-green-700 transition-colors"
                      placeholder="Password"
                      onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                    />
                    <button 
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#999] hover:text-[#666]"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="text-right">
                  <button 
                    onClick={() => setStep('forgot-phone')}
                    className="text-xs font-bold text-green-700 hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>

                <button 
                  onClick={handleLogin}
                  disabled={isLoading}
                  className="w-full bg-green-700 disabled:bg-gray-300 hover:bg-green-800 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-lg shadow-green-700/20"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      Log In
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>

                <div className="relative py-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[#F0F0F0]"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-[#999] font-bold">Or</span>
                  </div>
                </div>

                <button 
                  onClick={onCancel}
                  className="w-full bg-[#F8F9FA] hover:bg-[#F0F0F0] text-[#1A1A1A] py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all border border-[#E5E5E5]"
                >
                  Continue as Guest
                </button>
              </>
            )}

            {step === 'forgot-phone' && (
              <>
                <div>
                  <h2 className="text-2xl font-bold">Reset Password</h2>
                  <p className="text-[#666] text-sm mt-2 leading-relaxed">
                    Enter your registered phone number to receive an OTP.
                  </p>
                </div>

                {error && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs font-bold">
                    {error}
                  </div>
                )}

                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 border-r border-[#E5E5E5] pr-3">
                    <Smartphone className="w-4 h-4 text-[#999]" />
                  </div>
                  <input 
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    className="w-full pl-16 pr-4 py-4 bg-[#F8F9FA] border border-[#E5E5E5] rounded-2xl text-lg font-bold focus:outline-none focus:border-green-700 transition-colors"
                    placeholder="971234567"
                  />
                </div>

                <button 
                  onClick={handleForgotPhone}
                  className="w-full bg-green-700 hover:bg-green-800 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-lg shadow-green-700/20"
                >
                  Send OTP
                  <Smartphone className="w-5 h-5" />
                </button>

                <button 
                  onClick={() => setStep('login')}
                  className="w-full text-sm font-bold text-[#666] hover:text-green-700"
                >
                  Back to Login
                </button>
              </>
            )}

            {step === 'forgot-otp' && (
              <>
                <div>
                  <h2 className="text-2xl font-bold">Verify OTP</h2>
                  <p className="text-[#666] text-sm mt-2 leading-relaxed">
                    Enter the 6-digit code sent to your phone.
                  </p>
                  {generatedOtp && (
                    <div className="mt-2 p-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-bold text-center border border-blue-200">
                      OTP: {generatedOtp}
                    </div>
                  )}
                </div>

                {error && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs font-bold">
                    {error}
                  </div>
                )}

                <input 
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-4 py-4 bg-[#F8F9FA] border border-[#E5E5E5] rounded-2xl text-2xl font-black text-center tracking-[1rem] focus:outline-none focus:border-green-700"
                  placeholder="000000"
                />

                <div className="text-center">
                  <button 
                    onClick={() => {
                      if (resendTimer === 0) {
                        const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
                        setGeneratedOtp(newOtp);
                        setResendTimer(60);
                      }
                    }}
                    disabled={resendTimer > 0}
                    className={`text-xs font-bold ${resendTimer > 0 ? 'text-gray-400' : 'text-green-700 hover:underline'}`}
                  >
                    {resendTimer > 0 ? `Resend Code in 0:${resendTimer.toString().padStart(2, '0')}` : 'Resend Code'}
                  </button>
                </div>

                <button 
                  onClick={handleVerifyOtp}
                  className="w-full bg-green-700 hover:bg-green-800 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-lg shadow-green-700/20"
                >
                  Verify OTP
                  <Shield className="w-5 h-5" />
                </button>
              </>
            )}

            {step === 'forgot-reset' && (
              <>
                <div>
                  <h2 className="text-2xl font-bold">New Password</h2>
                  <p className="text-[#666] text-sm mt-2 leading-relaxed">
                    Create a strong new password for your account.
                  </p>
                </div>

                {error && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs font-bold">
                    {error}
                  </div>
                )}

                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 border-r border-[#E5E5E5] pr-3">
                    <Lock className="w-4 h-4 text-[#999]" />
                  </div>
                  <input 
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-16 pr-12 py-4 bg-[#F8F9FA] border border-[#E5E5E5] rounded-2xl text-lg font-medium focus:outline-none focus:border-green-700 transition-colors"
                    placeholder="New Password"
                  />
                  <button 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#999] hover:text-[#666]"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                <button 
                  onClick={handleResetPassword}
                  className="w-full bg-green-700 hover:bg-green-800 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-lg shadow-green-700/20"
                >
                  Reset Password
                  <CheckCircle className="w-5 h-5" />
                </button>
              </>
            )}

            <div className="text-center">
              <p className="text-sm text-[#666]">
                Don't have an account?{' '}
                <button 
                  onClick={onSwitchToRegister}
                  className="text-green-700 font-bold hover:underline"
                >
                  Register Now
                </button>
              </p>
            </div>

            {/* Biometric Lock */}
            <div className="text-center py-4">
              <button className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center mx-auto">
                <Smartphone className="w-8 h-8 text-gray-600" />
              </button>
              <p className="text-xs text-gray-500 mt-2">Tap to use Biometric Lock</p>
            </div>
            <div className="text-center pt-8">
              <p className="text-[10px] text-[#999] font-bold uppercase tracking-widest">Developed By Derick Musiyalike</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const CheckCircle = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

export default LoginFlow;
