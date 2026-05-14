import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Header from './components/Header';
import Home from './pages/Home';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import AdminDashboard from './pages/admin/AdminDashboard';
import ProductDetail from './pages/ProductDetail';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/admin/*" element={<AdminDashboard />} />
            </Routes>
          </main>
          <footer className="bg-white py-12 border-t border-gray-100">
            <div className="container mx-auto px-4 text-center">
              <h2 className="text-2xl font-serif font-bold text-jewelry-gold mb-4">OM COLLECTIONS</h2>
              <p className="text-gray-500 text-sm max-w-md mx-auto mb-8">
                Premium fine jewelry for your most precious moments. Handcrafted with love and precision.
              </p>
              <div className="flex justify-center space-x-6 mb-8 text-gray-400">
                <a href="#" className="hover:text-jewelry-gold transition-colors">Instagram</a>
                <a href="#" className="hover:text-jewelry-gold transition-colors">Facebook</a>
                <a href="#" className="hover:text-jewelry-gold transition-colors">Twitter</a>
              </div>
              <p className="text-xs text-gray-400">
                &copy; 2026 Om Collections Fine Jewelry. All rights reserved.
              </p>
            </div>
          </footer>
          <Toaster position="bottom-center" />
        </div>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
