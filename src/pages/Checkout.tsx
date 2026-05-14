import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { orderService, settingsService } from '../services/storeService';
import { ChevronRight, ArrowLeft, Send, CheckCircle2, MapPin, QrCode } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';
import { QRCodeSVG } from 'qrcode.react';

export default function Checkout() {
  const { items, totalPrice, clearCart } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'upi' | null>(null);
  const [showUPI, setShowUPI] = useState(false);
  const [settings, setSettings] = useState<any>(null);
  const [cityCharge, setCityCharge] = useState(0);
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    flat: '',
    apartment: '',
    street: '',
    city: '',
    pincode: '',
    googleMapsLink: ''
  });

  useEffect(() => {
    settingsService.getSettings().then(setSettings);
    
    // Autofill from last order
    const savedData = localStorage.getItem('last_jewelry_customer');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setFormData(prev => ({ 
          ...prev, 
          name: parsed.name || '',
          phone: parsed.phone || '',
          email: parsed.email || '',
          flat: parsed.flat || '',
          apartment: parsed.apartment || '',
          street: parsed.street || '',
          city: parsed.city || '',
          pincode: parsed.pincode || '',
          googleMapsLink: '' // Always clear link for new session
        }));
      } catch (e) {
        console.error("Autofill error", e);
      }
    }
  }, []);

  useEffect(() => {
    if (formData.city && settings?.cities) {
      const selectedCity = settings.cities.find((c: any) => c.name === formData.city);
      if (selectedCity) {
        setCityCharge(selectedCity.charge);
      }
    }
  }, [formData.city, settings]);

  if (items.length === 0 && !success) {
    navigate('/cart');
    return null;
  }

  const handleGetCurrentLocation = () => {
    if ("geolocation" in navigator) {
      toast.loading("Finding you...", { id: 'geo' });
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        const link = `https://www.google.com/maps?q=${latitude},${longitude}`;
        setFormData(prev => ({ ...prev, googleMapsLink: link }));
        toast.success("Location link generated!", { id: 'geo' });
      }, () => {
        toast.error("GPS access denied. Enter address manually.", { id: 'geo' });
      });
    } else {
      toast.error("Geolocation not supported.");
    }
  };

  const deliveryCharge = cityCharge;
  const finalTotal = totalPrice + deliveryCharge;
  const remainsForMin = settings ? settings.minOrderAmount - totalPrice : 0;
  const isMinReached = remainsForMin <= 0;

  const handleWhatsAppCheckout = async () => {
    if (!paymentMethod) {
      toast.error('Please select a payment method first.');
      return;
    }

    if (!formData.name || !formData.phone || !formData.flat || !formData.city) {
      toast.error('Please fill in all required shipping details.');
      return;
    }

    if (!formData.googleMapsLink) {
      toast.error('Location Link is mandatory. Please click "Use current location".');
      return;
    }

    setLoading(true);
    // Save details for next time
    localStorage.setItem('last_jewelry_customer', JSON.stringify({
      ...formData,
      googleMapsLink: '' // Privacy: don't save GPS link in localStorage long-term
    }));

    const fullAddress = `${formData.flat}, ${formData.apartment}, ${formData.street}, ${formData.city} - ${formData.pincode}`;
    const mapsLink = formData.googleMapsLink;
    
    try {
      const order = {
        items,
        subtotal: totalPrice,
        deliveryCharge,
        totalAmount: finalTotal,
        paymentMethod,
        customerInfo: {
          ...formData,
          fullAddress,
          googleMapsLink: mapsLink
        },
        orderedAt: new Date().toISOString()
      };
      
      await orderService.createOrder(order);
      
      const phoneNumber = '+919966113452';
      const itemsText = items.map(i => `- ${i.name} (x${i.quantity})`).join('\n');
      const message = `*New Order Request*\n\n*Customer:* ${formData.name}\n*Phone:* ${formData.phone}\n*Address:* ${fullAddress}\n*Payment:* ${paymentMethod.toUpperCase()}\n${mapsLink ? `*GPS Location:* ${mapsLink}` : ''}\n\n*Items:*\n${itemsText}\n\n*Subtotal:* ₹${totalPrice.toLocaleString('en-IN')}\n*Delivery:* ₹${deliveryCharge}\n*Total:* ₹${finalTotal.toLocaleString('en-IN')}`;
      
      window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, '_blank');
      
      setSuccess(true);
      clearCart();
    } catch (error) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const upiUrl = `upi://pay?pa=${settings?.upiId || 'test@upi'}&pn=SanjayDuttaJewelry&am=${finalTotal}&cu=INR`;

  return (
    <div className="pt-28 pb-20 container mx-auto px-4 max-w-5xl">
      <AnimatePresence mode="wait">
        {!success ? (
          <motion.div 
            key="checkout"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <button 
              onClick={() => navigate('/cart')} 
              className="flex items-center text-gray-500 hover:text-jewelry-gold mb-8 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Cart
            </button>

            <h1 className="text-4xl font-serif font-bold mb-10 text-center sm:text-left">Checkout</h1>

            <div className="grid lg:grid-cols-2 gap-12">
              <div className="space-y-8">
                <section className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 mb-8">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                    <h2 className="text-xl font-serif font-bold flex items-center">
                      <span className="w-8 h-8 bg-jewelry-gold text-white rounded-full flex items-center justify-center text-sm mr-3">1</span>
                      Shipping Details
                    </h2>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="grid gap-4">
                      <input 
                        required
                        placeholder="Full Name" 
                        className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-jewelry-gold transition-all"
                        value={formData.name || ''}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <input 
                          required
                          placeholder="Phone" 
                          className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-jewelry-gold transition-all"
                          value={formData.phone || ''}
                          onChange={e => setFormData({...formData, phone: e.target.value})}
                        />
                        <input 
                          type="email"
                          placeholder="Email (Optional)" 
                          className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-jewelry-gold transition-all"
                          value={formData.email || ''}
                          onChange={e => setFormData({...formData, email: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="pt-6 border-t border-gray-100">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-4">Delivery Address</p>
                      <div className="grid gap-4">
                        <div className="grid grid-cols-2 gap-4">
                          <input 
                            required
                            placeholder="Flat / House No." 
                            className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-jewelry-gold transition-all"
                            value={formData.flat || ''}
                            onChange={e => setFormData({...formData, flat: e.target.value})}
                          />
                          <input 
                            required
                            placeholder="Apartment Name" 
                            className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-jewelry-gold transition-all"
                            value={formData.apartment || ''}
                            onChange={e => setFormData({...formData, apartment: e.target.value})}
                          />
                        </div>
                        <input 
                          required
                          placeholder="Area / Street / Colony" 
                          className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-jewelry-gold transition-all"
                          value={formData.street || ''}
                          onChange={e => setFormData({...formData, street: e.target.value})}
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <select 
                            required
                            className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-jewelry-gold transition-all"
                            value={formData.city || ''}
                            onChange={e => setFormData({...formData, city: e.target.value})}
                          >
                            <option value="">Select City</option>
                            {settings?.cities?.map((city: any) => (
                              <option key={city.name} value={city.name}>{city.name}</option>
                            ))}
                          </select>
                          <input 
                            required
                            placeholder="Pincode" 
                            className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-jewelry-gold transition-all"
                            value={formData.pincode || ''}
                            onChange={e => setFormData({...formData, pincode: e.target.value})}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-gray-100 text-center">
                      {formData.city && (
                        <div className="mb-4 inline-flex items-center space-x-2 text-jewelry-gold font-bold bg-jewelry-cream/30 px-6 py-2 rounded-full border border-jewelry-gold/10">
                          <MapPin className="w-4 h-4" />
                          <span>Delivery to {formData.city}: ₹{cityCharge}</span>
                        </div>
                      )}
                    </div>

                    <div className="pt-6 border-t border-gray-100">
                      <div className="flex flex-col gap-4">
                        <button 
                          type="button"
                          onClick={handleGetCurrentLocation}
                          className={`w-full flex items-center justify-center space-x-2 px-6 py-4 rounded-2xl text-sm font-bold transition-all border ${formData.googleMapsLink ? 'bg-jewelry-cream/30 text-jewelry-gold border-jewelry-gold/20' : 'bg-gray-50 text-gray-400 border-gray-100 hover:border-jewelry-gold/30'}`}
                        >
                          <MapPin className="w-5 h-5" />
                          <span>{formData.googleMapsLink ? 'Location Captured' : 'Use current location'}</span>
                        </button>
                        
                        {formData.googleMapsLink && (
                          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Verified GPS Link</p>
                            <input 
                              readOnly
                              className="w-full bg-white px-4 py-2 rounded-lg text-[10px] font-mono text-jewelry-gold border border-gray-100"
                              value={formData.googleMapsLink}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              <aside className="space-y-6">
                <section className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                  <h2 className="text-xl font-serif font-bold mb-6 flex items-center">
                    <span className="w-8 h-8 bg-jewelry-gold text-white rounded-full flex items-center justify-center text-sm mr-3">2</span>
                    Order Summary
                  </h2>
                  <div className="space-y-3 mb-6 max-h-40 overflow-y-auto pr-2">
                    {items.map(item => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-gray-500 whitespace-nowrap overflow-hidden text-ellipsis mr-4">{item.name} x{item.quantity}</span>
                        <span className="font-bold flex-shrink-0">₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                  </div>
                  <div className="h-px bg-gray-100 mb-6"></div>
                  
                  <div className="space-y-2 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Items Total</span>
                      <span className="font-medium">₹{totalPrice.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Delivery Charge</span>
                      <span className="font-medium text-green-600">{deliveryCharge === 0 ? 'FREE' : `+₹${deliveryCharge.toLocaleString('en-IN')}`}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-end mb-8">
                    <span className="text-gray-500 font-medium tracking-wide">Total Payable</span>
                    <span className="text-3xl font-bold text-jewelry-gold">₹{finalTotal.toLocaleString('en-IN')}</span>
                  </div>

                  {!isMinReached && (
                    <div className="mb-6 p-4 bg-orange-50 rounded-2xl text-xs font-bold text-orange-700 flex items-center">
                      <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse mr-2"></div>
                      Add ₹{remainsForMin.toLocaleString('en-IN')} more to reach the ₹{settings?.minOrderAmount} minimum order.
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={() => {
                          setPaymentMethod('cod');
                          setShowUPI(false);
                        }}
                        className={`py-3 rounded-2xl text-xs font-bold transition-all border-2 ${paymentMethod === 'cod' ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-100 text-gray-400 hover:border-gray-200'}`}
                      >
                        Cash on Delivery
                      </button>
                      <button 
                        onClick={() => {
                          setPaymentMethod('upi');
                          setShowUPI(true);
                        }}
                        className={`py-3 rounded-2xl text-xs font-bold transition-all border-2 ${paymentMethod === 'upi' ? 'border-jewelry-gold bg-jewelry-cream text-jewelry-gold' : 'border-gray-100 text-gray-400 hover:border-gray-200'}`}
                      >
                        Select UPI/QR
                      </button>
                    </div>

                    <AnimatePresence>
                      {showUPI && paymentMethod === 'upi' && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden bg-gray-50 rounded-2xl p-4 text-center border border-jewelry-gold/10"
                        >
                          <div className="bg-white p-4 rounded-xl inline-block shadow-sm">
                            <QRCodeSVG value={upiUrl} size={150} />
                          </div>
                          <p className="text-[10px] text-gray-500 mt-3 italic">Scan to pay exactly ₹{finalTotal.toLocaleString('en-IN')}</p>
                          <p className="text-xs font-bold text-jewelry-gold">{settings?.upiId || 'Loading UPI...'}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <button 
                      onClick={handleWhatsAppCheckout}
                      disabled={loading || !formData.name || !formData.phone || !formData.flat || !formData.googleMapsLink || !isMinReached || !paymentMethod}
                      className="w-full bg-jewelry-gold text-white py-4 rounded-full font-bold hover:bg-jewelry-gold-dark transition-all disabled:opacity-50 flex items-center justify-center space-x-2 shadow-xl shadow-jewelry-gold/20"
                    >
                      {loading ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <Send className="w-5 h-5" />
                          <span>{isMinReached ? `Confirm Order (${paymentMethod === 'cod' ? 'COD' : 'UPI'})` : `Min Order ₹${settings?.minOrderAmount}`}</span>
                        </>
                      )}
                    </button>
                    
                    <p className="text-[10px] text-center text-gray-400 mt-2">Order will be processed via message</p>
                  </div>
                </section>
              </aside>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="success"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center pt-20"
          >
            <div className="bg-white max-w-xl mx-auto p-12 rounded-3xl shadow-lg border border-gray-100">
              <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-6" />
              <h1 className="text-4xl font-serif font-bold mb-4">Brilliant Choice!</h1>
              <p className="text-gray-500 text-lg mb-8 leading-relaxed">
                Your order has been placed successfully. Our jewelry expert will contact you shortly to confirm the details.
              </p>
              <div className="bg-jewelry-cream p-6 rounded-2xl mb-10 text-left">
                <p className="text-xs uppercase tracking-widest text-jewelry-gold font-bold mb-2">Order Summary</p>
                <p className="font-serif text-xl font-bold">Expect Delivery: 5 - 7 Business Days</p>
                <p className="text-sm text-gray-500 mt-2 italic">An insured tracking link will be sent to your email.</p>
              </div>
              <Link to="/" className="bg-gray-900 text-white px-10 py-4 rounded-full font-bold hover:bg-jewelry-gold transition-all inline-flex items-center group">
                Continue Shopping <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
