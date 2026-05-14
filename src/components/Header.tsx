import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, Menu, X, LogOut, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { motion, AnimatePresence } from 'motion/react';

export default function Header() {
  const { user, isAdmin, logout } = useAuth();
  const { totalItems } = useCart();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white/90 backdrop-blur-md shadow-sm py-3' : 'bg-transparent py-5'}`}>
      <div className="container mx-auto px-4 flex items-center justify-between">
        <Link to="/" className="text-2xl font-serif font-bold tracking-tight text-jewelry-gold">
          OM COLLECTIONS
          <span className="block text-[10px] tracking-[0.3em] font-sans font-light text-gray-500 uppercase">Fine Jewelry</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center space-x-8">
          <Link to="/" className="text-sm font-medium hover:text-jewelry-gold transition-colors">Home</Link>
          {isAdmin && (
            <Link to="/admin" className="flex items-center text-sm font-medium text-jewelry-gold hover:text-jewelry-gold-dark transition-colors">
              <ShieldCheck className="w-4 h-4 mr-1" />
              Admin
            </Link>
          )}
        </nav>

        <div className="flex items-center space-x-5">
          <Link to="/cart" className="relative p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ShoppingCart className="w-5 h-5" />
            {totalItems > 0 && (
              <span className="absolute top-0 right-0 bg-jewelry-gold text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">
                {totalItems}
              </span>
            )}
          </Link>

          {user ? (
            <div className="flex items-center space-x-3">
              <button onClick={() => logout()} className="p-2 hover:bg-gray-100 rounded-full transition-colors" title="Logout">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <Link to="/admin" className="text-sm font-medium bg-gray-900 text-white px-4 py-2 rounded-full hover:bg-gray-800 transition-colors">
              Login
            </Link>
          )}

          <button className="md:hidden p-2" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-gray-100 overflow-hidden"
          >
            <div className="container mx-auto px-4 py-6 flex flex-col space-y-4">
              <Link to="/" onClick={() => setIsMenuOpen(false)} className="text-lg font-medium">Home</Link>
              {isAdmin && <Link to="/admin" onClick={() => setIsMenuOpen(false)} className="text-lg font-medium text-jewelry-gold">Admin Dashboard</Link>}
              <Link to="/cart" onClick={() => setIsMenuOpen(false)} className="text-lg font-medium">My Bag ({totalItems})</Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
