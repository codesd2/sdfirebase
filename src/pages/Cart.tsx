import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag, MapPin } from 'lucide-react';
import { motion } from 'motion/react';
import { settingsService } from '../services/storeService';
import toast from 'react-hot-toast';

export default function Cart() {
  const { items, removeFromCart, updateQuantity, totalPrice } = useCart();
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [settings, setSettings] = useState<any>(null);
  const [selectedCity, setSelectedCity] = useState<any>(null);

  useEffect(() => {
    settingsService.getSettings().then(setSettings);
  }, []);

  useEffect(() => {
    if (user && user.address?.city && settings?.cities) {
      const city = settings.cities.find((c: any) => c.name === user.address?.city);
      if (city) setSelectedCity(city);
    }
  }, [user, settings]);

  if (items.length === 0) {
    return (
      <div className="pt-40 pb-20 container mx-auto px-4 text-center">
        <div className="bg-white max-w-md mx-auto p-12 rounded-3xl shadow-sm border border-gray-100">
          <ShoppingBag className="w-16 h-16 text-gray-200 mx-auto mb-6" />
          <h1 className="text-3xl font-serif font-bold mb-4">Your bag is empty</h1>
          <p className="text-gray-500 mb-8">It looks like you haven't added any elegant pieces to your collection yet.</p>
          <Link to="/" className="bg-jewelry-gold text-white px-8 py-3 rounded-full font-bold hover:bg-jewelry-gold-dark transition-all">
            Start Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-20 container mx-auto px-4">
      <h1 className="text-4xl font-serif font-bold mb-10">Shopping Bag</h1>

      <div className="grid lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-6">
          {items.map((item) => (
            <motion.div 
              layout
              key={item.id} 
              className="bg-white p-4 rounded-2xl shadow-sm border border-gray-50 flex items-center gap-6"
            >
              <div className="w-24 h-24 rounded-xl overflow-hidden bg-gray-50 shrink-0">
                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-grow">
                <h3 className="font-serif font-bold text-lg">{item.name}</h3>
                <p className="text-jewelry-gold font-bold">₹{item.price.toLocaleString('en-IN')}</p>
                
                <div className="flex items-center space-x-4 mt-3">
                  <div className="flex items-center space-x-2 bg-gray-50 rounded-lg p-1">
                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-1 hover:bg-white rounded transition-colors"><Minus className="w-4 h-4" /></button>
                    <span className="w-8 text-center font-bold text-sm">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-1 hover:bg-white rounded transition-colors"><Plus className="w-4 h-4" /></button>
                  </div>
                  <button onClick={() => removeFromCart(item.id)} className="text-red-400 hover:text-red-600 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="text-right hidden sm:block">
                <p className="font-bold">₹{(item.price * item.quantity).toLocaleString('en-IN')}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <aside>
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 sticky top-32">
            <h2 className="text-xl font-serif font-bold mb-6">Order Summary</h2>
            
            <div className="mb-8">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Delivery Destination</label>
              <div className="relative group">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-jewelry-gold group-focus-within:text-jewelry-gold transition-colors" />
                <select 
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium focus:ring-1 focus:ring-jewelry-gold focus:bg-white transition-all appearance-none cursor-pointer"
                  onChange={(e) => {
                    const city = settings?.cities?.find((c: any) => c.name === e.target.value);
                    setSelectedCity(city || null);
                  }}
                  value={selectedCity?.name || ''}
                >
                  <option value="">Select your city</option>
                  {settings?.cities?.map((city: any, idx: number) => (
                    <option key={idx} value={city.name}>{city.name}</option>
                  ))}
                </select>
              </div>
              {selectedCity && (
                <p className="mt-2 text-[10px] text-green-600 font-bold uppercase tracking-wide flex items-center">
                  <span className="w-1 h-1 bg-green-500 rounded-full mr-2"></span>
                  Delivery available for ₹{selectedCity.charge}
                </p>
              )}
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex justify-between text-gray-500 text-sm">
                <span>Subtotal</span>
                <span>₹{totalPrice.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-gray-500 text-sm">
                <span>Delivery Charges</span>
                <span>{selectedCity ? `₹${selectedCity.charge.toLocaleString('en-IN')}` : <span className="text-xs italic">Select city</span>}</span>
              </div>
              <div className="flex justify-between text-gray-500 text-sm">
                <span>Tax (GST)</span>
                <span>Included</span>
              </div>
              <div className="h-px bg-gray-100 my-4"></div>
              <div className="flex justify-between text-xl font-bold">
                <span>Total</span>
                <span className="text-jewelry-gold">
                  ₹{(totalPrice + (selectedCity?.charge || 0)).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <button 
              disabled={!selectedCity}
              onClick={() => {
                if (selectedCity) {
                  navigate('/checkout', { state: { deliveryCity: selectedCity } });
                }
              }}
              className={`w-full py-4 rounded-full font-bold transition-all flex items-center justify-center group ${
                selectedCity 
                ? 'bg-gray-900 text-white hover:bg-jewelry-gold shadow-lg shadow-jewelry-gold/10' 
                : 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-60'
              }`}
            >
              {selectedCity ? (
                <>Checkout <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" /></>
              ) : (
                'Select City to Checkout'
              )}
            </button>
            <p className="text-[10px] text-gray-400 text-center mt-4 uppercase tracking-widest font-medium">
              Secure checkout guaranteed
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
