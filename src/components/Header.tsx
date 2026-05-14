import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, User, Menu, X, LogOut, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { motion, AnimatePresence } from 'motion/react';
import { settingsService } from '../services/storeService';

export default function Header() {
  const { user, isAdmin, login, logout } = useAuth();
  const { totalItems } = useCart();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [adminPath, setAdminPath] = useState('admin');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    
    settingsService.getSettings().then(s => {
      if (s?.adminPath) setAdminPath(s.adminPath);
    });

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Hide header on admin pages to maximize workspace and use admin-specific navigation
  const isAdminPage = location.pathname.startsWith(`/${adminPath}`) || location.pathname.startsWith('/admin');
  if (isAdminPage) return null;

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white/90 backdrop-blur-md shadow-sm py-3' : 'bg-transparent py-5'}`}>
      <div className="container mx-auto px-4 flex items-center justify-between">
        <Link to="/" className="text-2xl font-serif font-bold tracking-tight text-jewelry-gold">
          OM COLLECTIONS
          <span className="block text-[10px] tracking-[0.3em] font-sans font-light text-gray-500 uppercase">Fine Jewelry</span>
        </Link>

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
              <button 
                onClick={() => navigate('/cart')} 
                className="w-8 h-8 rounded-full bg-jewelry-cream border border-jewelry-gold/20 flex items-center justify-center text-jewelry-gold font-bold text-xs uppercase"
                title={user.name || 'Profile'}
              >
                {user.name?.charAt(0) || user.email?.charAt(0) || 'U'}
              </button>
              <button onClick={() => logout()} className="p-2 hover:bg-gray-100 rounded-full transition-colors" title="Sign Out">
                <LogOut className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          ) : (
            <button 
              onClick={() => navigate('/login')} 
              className="text-[10px] font-bold uppercase tracking-widest text-jewelry-gold hover:text-jewelry-gold-dark transition-colors border border-jewelry-gold/20 px-3 py-1.5 rounded-full"
            >
              Sign In
            </button>
          )}
        </div>
      </div>

    </header>
  );
}
