import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'motion/react';
import { User, Mail, Lock, Phone, MapPin, Crosshair, ArrowRight, Chrome, CheckCircle2 } from 'lucide-react';
import { settingsService } from '../services/storeService';
import toast from 'react-hot-toast';

export default function SignUp() {
  const { signup, login } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    flat: '',
    apartment: '',
    street: '',
    city: '',
    pincode: '',
    googleMapsLink: ''
  });

  useEffect(() => {
    settingsService.getSettings().then(setSettings);
  }, []);

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported");
      return;
    }

    toast.loading("Fetching location...", { id: 'geo' });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const link = `https://www.google.com/maps?q=${pos.coords.latitude},${pos.coords.longitude}`;
        setFormData(prev => ({ ...prev, googleMapsLink: link }));
        toast.success("Location captured!", { id: 'geo' });
      },
      (err) => {
        toast.error("Could not get location. Please allow permissions.", { id: 'geo' });
      }
    );
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 2) {
      setStep(2);
      return;
    }

    try {
      setLoading(true);
      await signup(formData.email, formData.password, {
        name: formData.name,
        phone: formData.phone,
        address: {
          flat: formData.flat,
          apartment: formData.apartment,
          street: formData.street,
          city: formData.city,
          pincode: formData.pincode,
          googleMapsLink: formData.googleMapsLink
        }
      });
      toast.success('Account created! Welcome to our boutique.');
      navigate('/');
    } catch (err: any) {
      toast.error(err.message || 'Creation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-32 pb-20 bg-gray-50 flex items-center justify-center px-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xl w-full bg-white rounded-3xl shadow-xl shadow-gray-200/50 p-8 border border-gray-100"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-serif font-bold text-gray-900 mb-2">Create Account</h1>
          <div className="flex items-center justify-center space-x-2 mt-4">
            <div className={`h-1.5 w-12 rounded-full transition-all ${step >= 1 ? 'bg-jewelry-gold' : 'bg-gray-100'}`}></div>
            <div className={`h-1.5 w-12 rounded-full transition-all ${step >= 2 ? 'bg-jewelry-gold' : 'bg-gray-100'}`}></div>
          </div>
        </div>

        <form onSubmit={handleSignUp} className="space-y-6">
          {step === 1 ? (
            <div className="space-y-4">
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-jewelry-gold transition-colors" />
                <input 
                  type="text"
                  required
                  placeholder="Full Name"
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-jewelry-gold outline-none transition-all font-medium"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-jewelry-gold transition-colors" />
                <input 
                  type="email"
                  required
                  placeholder="Email Address"
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-jewelry-gold outline-none transition-all font-medium"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-jewelry-gold transition-colors" />
                <input 
                  type="password"
                  required
                  placeholder="Password (Min 6 chars)"
                  minLength={6}
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-jewelry-gold outline-none transition-all font-medium"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
              </div>
              <div className="relative group">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-jewelry-gold transition-colors" />
                <input 
                  type="tel"
                  required
                  placeholder="Phone Number"
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-jewelry-gold outline-none transition-all font-medium"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center px-8 mb-6">Enter your default delivery address for faster shopping</p>
              
              <div className="grid grid-cols-2 gap-4">
                <input 
                  type="text"
                  required
                  placeholder="Flat / House No"
                  className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-jewelry-gold outline-none transition-all text-sm font-medium"
                  value={formData.flat}
                  onChange={(e) => setFormData({...formData, flat: e.target.value})}
                />
                <input 
                  type="text"
                  required
                  placeholder="Apartment / Area"
                  className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-jewelry-gold outline-none transition-all text-sm font-medium"
                  value={formData.apartment}
                  onChange={(e) => setFormData({...formData, apartment: e.target.value})}
                />
              </div>
              
              <input 
                type="text"
                required
                placeholder="Street / Landmark"
                className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-jewelry-gold outline-none transition-all text-sm font-medium"
                value={formData.street}
                onChange={(e) => setFormData({...formData, street: e.target.value})}
              />

              <div className="grid grid-cols-2 gap-4">
                <select 
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-jewelry-gold outline-none transition-all text-sm font-medium cursor-pointer"
                  value={formData.city}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                >
                  <option value="">Select City</option>
                  {settings?.cities?.map((city: any, idx: number) => (
                    <option key={idx} value={city.name}>{city.name}</option>
                  ))}
                </select>
                <input 
                  type="text"
                  required
                  placeholder="Pincode"
                  className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-jewelry-gold outline-none transition-all text-sm font-medium"
                  value={formData.pincode}
                  onChange={(e) => setFormData({...formData, pincode: e.target.value})}
                />
              </div>

              <button 
                type="button"
                onClick={handleGetCurrentLocation}
                className={`w-full py-3.5 rounded-2xl font-bold flex items-center justify-center space-x-2 transition-all border-2 ${
                  formData.googleMapsLink 
                  ? 'border-green-100 bg-green-50 text-green-600' 
                  : 'border-jewelry-gold/10 bg-jewelry-cream/30 text-jewelry-gold hover:bg-jewelry-cream'
                }`}
              >
                {formData.googleMapsLink ? <CheckCircle2 className="w-5 h-5" /> : <Crosshair className="w-5 h-5" />}
                <span>{formData.googleMapsLink ? 'GPS Location Captured' : 'Auto-Capture Precise Location'}</span>
              </button>
            </div>
          )}

          <div className="flex space-x-3">
            {step === 2 && (
              <button 
                type="button"
                onClick={() => setStep(1)}
                className="px-6 py-4 bg-gray-100 text-gray-500 rounded-2xl font-bold hover:bg-gray-200 transition-colors"
              >
                Back
              </button>
            )}
            <button 
              type="submit"
              disabled={loading}
              className="flex-grow bg-gray-900 text-white py-4 rounded-2xl font-bold hover:bg-jewelry-gold transition-all shadow-lg shadow-gray-200 flex items-center justify-center group disabled:opacity-50"
            >
              {loading ? 'Processing...' : (
                <>
                  {step === 1 ? 'Next Details' : 'Create My Account'} 
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </div>
        </form>

        <div className="my-8 flex items-center">
          <div className="flex-grow h-[1px] bg-gray-100"></div>
          <span className="px-4 text-[10px] font-bold text-gray-300 uppercase tracking-widest">Alternatively</span>
          <div className="flex-grow h-[1px] bg-gray-100"></div>
        </div>

        <button 
          onClick={async () => {
             try {
               setLoading(true);
               await login();
               navigate('/');
             } catch(err: any) {
               toast.error(err.message || 'Login failed');
             } finally {
               setLoading(false);
             }
          }}
          disabled={loading}
          className="w-full border-2 border-gray-100 py-3.5 rounded-2xl font-bold text-gray-600 hover:border-jewelry-gold hover:text-jewelry-gold transition-all flex items-center justify-center space-x-3 mb-8"
        >
          <Chrome className="w-5 h-5" />
          <span>Quick Google Sign Up</span>
        </button>

        <p className="text-center text-sm font-medium text-gray-400">
          Already have an account? <Link to="/login" className="text-jewelry-gold hover:underline">Log in</Link>
        </p>
      </motion.div>
    </div>
  );
}
