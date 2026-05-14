import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag } from 'lucide-react';
import { motion } from 'motion/react';

export default function Cart() {
  const { items, removeFromCart, updateQuantity, totalPrice } = useCart();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="pt-40 pb-20 container mx-auto px-4 text-center">
        <div className="bg-white max-w-md mx-auto p-12 rounded-3xl shadow-sm border border-gray-100">
          <ShoppingBag className="w-16 h-16 text-gray-200 mx-auto mb-6" />
          <h1 className="text-3xl font-serif font-bold mb-4">Your bag is empty</h1>
          <p className="text-gray-500 mb-8">It looks like you haven't added any elegant pieces to your collection yet.</p>
          <Link to="/shop" className="bg-jewelry-gold text-white px-8 py-3 rounded-full font-bold hover:bg-jewelry-gold-dark transition-all">
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
            <div className="space-y-4 mb-8">
              <div className="flex justify-between text-gray-500">
                <span>Subtotal</span>
                <span>₹{totalPrice.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Shipping</span>
                <span className="text-green-500 font-medium">Free</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Tax (GST)</span>
                <span>Included</span>
              </div>
              <div className="h-px bg-gray-100 my-4"></div>
              <div className="flex justify-between text-xl font-bold">
                <span>Total</span>
                <span className="text-jewelry-gold">₹{totalPrice.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <button 
              onClick={() => navigate('/checkout')}
              className="w-full bg-gray-900 text-white py-4 rounded-full font-bold hover:bg-jewelry-gold transition-colors flex items-center justify-center group"
            >
              Checkout <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
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
