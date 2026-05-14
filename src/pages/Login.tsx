import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'motion/react';
import { LogIn, Mail, Lock, ArrowRight, Chrome } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Login() {
  const { login, loginWithEmail } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname || '/';

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      await login();
      navigate(from, { replace: true });
      toast.success('Welcome back!');
    } catch (err: any) {
      toast.error(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await loginWithEmail(email, password);
      navigate(from, { replace: true });
      toast.success('Logged in successfully');
    } catch (err: any) {
      toast.error(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-32 pb-20 bg-gray-50 flex items-center justify-center px-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-gray-200/50 p-8 border border-gray-100"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-serif font-bold text-gray-900 mb-2">Welcome Back</h1>
          <p className="text-sm text-gray-500 font-medium">Log in to your account to continue shopping</p>
        </div>

        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-jewelry-gold transition-colors" />
            <input 
              type="email"
              required
              placeholder="Email Address"
              className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-jewelry-gold outline-none transition-all font-medium"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-jewelry-gold transition-colors" />
            <input 
              type="password"
              required
              placeholder="Password"
              className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-jewelry-gold outline-none transition-all font-medium"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold hover:bg-jewelry-gold transition-all shadow-lg shadow-gray-200 flex items-center justify-center group disabled:opacity-50"
          >
            {loading ? 'Logging in...' : (
              <>
                Sign In <LogIn className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="my-8 flex items-center">
          <div className="flex-grow h-[1px] bg-gray-100"></div>
          <span className="px-4 text-[10px] font-bold text-gray-300 uppercase tracking-widest">Or continue with</span>
          <div className="flex-grow h-[1px] bg-gray-100"></div>
        </div>

        <button 
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full border-2 border-gray-100 py-3.5 rounded-2xl font-bold text-gray-600 hover:border-jewelry-gold hover:text-jewelry-gold transition-all flex items-center justify-center space-x-3 mb-8"
        >
          <Chrome className="w-5 h-5" />
          <span>Sign in with Google</span>
        </button>

        <p className="text-center text-sm font-medium text-gray-400">
          Don't have an account? <Link to="/signup" className="text-jewelry-gold hover:underline">Create one</Link>
        </p>
      </motion.div>
    </div>
  );
}
