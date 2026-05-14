import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { productService, orderService, settingsService, userService } from '../../services/storeService';
import { 
  Package, 
  ShoppingBag, 
  Plus, 
  Edit2, 
  Trash2, 
  Search, 
  LayoutDashboard, 
  TrendingUp, 
  Clock,
  Database,
  CheckCircle,
  XCircle,
  LogOut,
  Settings,
  MapPin,
  Users,
  UserPlus,
  ExternalLink,
  Shield,
  Upload,
  Menu,
  ChevronLeft
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider, createSecondaryUser, resetPassword } from '../../lib/firebase';

export default function AdminDashboard() {
  const { user, logout, isAdmin, loading: authLoading } = useAuth();
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loggingIn, setLoggingIn] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders' | 'settings' | 'categories' | 'customers' | 'staff' | 'delivery'>('overview');
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [registeredUsers, setRegisteredUsers] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({
    categories: [
      "Rings", "Necklaces", "Earrings", "Bracelets", "Bangles", 
      "Pendants", "Anklets", "Mangalsutras", "Brooches", "Nose Rings"
    ],
    maxImageSize: 5,
    adminPath: 'admin',
    upiQrImage: '',
    upiText: 'Please scan the above QR code to pay with any UPI App',
    cities: [],
    upiId: '',
    upiPhone: '',
    minOrderAmount: 100
  });
  const [loading, setLoading] = useState(true);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const [newUserForm, setNewUserForm] = useState({ email: '', password: '', role: 'staff', username: '' });
  const [creatingUser, setCreatingUser] = useState(false);

  // Form states for new/edit product
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: 0,
    category: 'Gold',
    stock: 10,
    images: ['']
  });

  const [newCategory, setNewCategory] = useState('');
  const [newCityForm, setNewCityForm] = useState({ name: '', charge: '' });
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  const fetchData = async () => {
    setLoading(true);
    const [pData, oData, sData, uData] = await Promise.all([
      productService.getProducts(),
      orderService.getOrders(),
      settingsService.getSettings(),
      userService.getUsers()
    ]);
    setProducts(pData);
    setOrders(oData);
    
    // Split users into staff and registered customers
    const staffMembers = (uData as any[]).filter(u => u.role === 'admin' || u.role === 'staff');
    const regUsers = (uData as any[]).filter(u => u.role === 'user');
    setStaff(staffMembers);
    setRegisteredUsers(regUsers);

    // Extract unique customers from orders
    const customerMap = new Map();
    
    // Add registered users to the map first
    regUsers.forEach(u => {
      const contactKey = u.uid || u.id;
      customerMap.set(contactKey, {
        name: u.name,
        email: u.email,
        phone: u.phone,
        fullAddress: u.address ? `${u.address.flat || ''}, ${u.address.apartment || ''}, ${u.address.street || ''}, ${u.address.city || ''}`.replace(/^, |, $/g, '') : 'No address saved',
        googleMapsLink: u.address?.googleMapsLink,
        orderCount: 0,
        totalSpent: 0,
        isRegistered: true,
        uid: u.uid || u.id
      });
    });

    (oData as any[]).forEach(order => {
      const contactKey = order.customerInfo?.phone || order.customerInfo?.email;
      if (!contactKey) return;
      
      // Try to find if this order belongs to a registered user by phone/email if UID not present
      let existing: any = null;
      for (const [key, val] of customerMap.entries()) {
        if (val.email === order.customerInfo?.email || val.phone === order.customerInfo?.phone) {
          existing = val;
          break;
        }
      }

      if (!existing) {
        customerMap.set(contactKey, {
          ...order.customerInfo,
          orderCount: 1,
          totalSpent: order.totalAmount || 0,
          lastOrder: order.createdAt,
          isRegistered: false
        });
      } else {
        existing.orderCount += 1;
        existing.totalSpent += (order.totalAmount || 0);
        if (!existing.lastOrder || order.createdAt > existing.lastOrder) {
          existing.lastOrder = order.createdAt;
        }
        // Update info from order if missing in profile
        if (!existing.name) existing.name = order.customerInfo.name;
        if (!existing.phone) existing.phone = order.customerInfo.phone;
        if (!existing.fullAddress || existing.fullAddress === 'No address saved') {
           existing.fullAddress = order.customerInfo.fullAddress;
        }
        if (!existing.googleMapsLink) existing.googleMapsLink = order.customerInfo.googleMapsLink;
      }
    });
    setCustomers(Array.from(customerMap.values()));

    if (sData) setSettings((prev: any) => ({ ...prev, ...sData }));
    setLoading(false);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserForm.email) {
      toast.error('Email is required');
      return;
    }
    // Password only required for new accounts
    if (!editingUser && (!newUserForm.password || newUserForm.password.length < 6)) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setCreatingUser(true);
    try {
      if (editingUser) {
        const updateData: any = { 
          email: newUserForm.email, 
          role: newUserForm.role,
          username: newUserForm.username
        };
        if (newUserForm.password) {
          updateData.initialPassword = newUserForm.password;
        }
        await userService.updateUser(editingUser.id, updateData);
        toast.success('User updated successfully');
      } else {
        const newUser = await createSecondaryUser(newUserForm.email, newUserForm.password);
        await userService.updateUser(newUser.uid, { 
          email: newUserForm.email, 
          role: newUserForm.role,
          username: newUserForm.username,
          initialPassword: newUserForm.password // Store it since user requested it in DB
        });
        toast.success('User created successfully');
      }
      setShowUserModal(false);
      setEditingUser(null);
      setNewUserForm({ email: '', password: '', role: 'staff', username: '' });
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to process user');
    } finally {
      setCreatingUser(false);
    }
  };

  const handleUpdateUserRole = async (uid: string, role: string) => {
    try {
      await userService.updateUser(uid, { role });
      toast.success('Role updated');
      fetchData();
    } catch (err) {
      toast.error('Failed to update role');
    }
  };

  const handleDeleteUser = async (uid: string) => {
    if (window.confirm('Remove this user and their access?')) {
      await userService.deleteUser(uid);
      toast.success('User removed');
      fetchData();
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await productService.updateProduct(editingProduct.id, productForm);
        toast.success('Product updated');
      } else {
        await productService.addProduct(productForm);
        toast.success('Product added');
      }
      setShowProductModal(false);
      setEditingProduct(null);
      setProductForm({ name: '', description: '', price: 0, category: settings.categories[0], stock: 10, images: [''] });
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Operation failed');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this exquisite piece?')) {
      await productService.deleteProduct(id);
      toast.success('Product deleted');
      fetchData();
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    await orderService.updateOrderStatus(orderId, status);
    toast.success(`Order ${status}`);
    fetchData();
  };

  const handleSaveSettings = async () => {
    try {
      await settingsService.updateSettings(settings);
      toast.success('Settings saved');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save settings');
    }
  };

  const addCategory = () => {
    if (newCategory && !settings.categories.includes(newCategory)) {
      const updated = { ...settings, categories: [...settings.categories, newCategory] };
      setSettings(updated);
      setNewCategory('');
    }
  };

  const removeCategory = (cat: string) => {
    const updated = { ...settings, categories: settings.categories.filter((c: string) => c !== cat) };
    setSettings(updated);
  };

  const addCity = () => {
    if (newCityForm.name && newCityForm.charge) {
      const updated = { 
        ...settings, 
        cities: [...(settings.cities || []), { name: newCityForm.name, charge: Number(newCityForm.charge) }] 
      };
      setSettings(updated);
      setNewCityForm({ name: '', charge: '' });
      toast.success('City added to list locally. Click Save to persist.');
    } else {
      toast.error('Please enter both city name and charge');
    }
  };

  const removeCity = (index: number) => {
    const updatedCities = [...settings.cities];
    updatedCities.splice(index, 1);
    setSettings({ ...settings, cities: updatedCities });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, isQr = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSizeMB = settings.maxImageSize || 5;
    const maxSizeBytes = maxSizeMB * 1024 * 1024;

    if (file.size > maxSizeBytes) {
      toast.error(`Image too large. Please use an image under ${maxSizeMB}MB (recommended < 800KB).`);
      return;
    }

    setUploadingImage(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      if (isQr) {
        setSettings(prev => ({ ...prev, upiQrImage: base64String }));
      } else {
        setProductForm(prev => ({ ...prev, images: [base64String] }));
      }
      setUploadingImage(false);
      toast.success('Image uploaded successfully');
    };
    reader.onerror = () => {
      setUploadingImage(false);
      toast.error('Failed to read file');
    };
    reader.readAsDataURL(file);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoggingIn(true);
    try {
      await signInWithEmailAndPassword(auth, loginForm.email, loginForm.password);
      toast.success('Welcome back');
    } catch (err: any) {
      toast.error(err.message || 'Login failed.');
    } finally {
      setLoggingIn(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!loginForm.email) {
      toast.error('Please enter your email/username first');
      return;
    }
    setResettingPassword(true);
    try {
      await resetPassword(loginForm.email);
      toast.success('Password reset email sent!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to send reset email');
    } finally {
      setResettingPassword(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      toast.success('Signed in with Google');
    } catch (err: any) {
      toast.error('Google Sign-in failed');
    }
  };

  if (authLoading) return <div className="pt-40 text-center">Verifying credentials...</div>;
  if (!isAdmin) {
    return (
      <div className="pt-40 flex items-center justify-center px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 w-full max-w-md"
        >
          <div className="text-center mb-8">
            <h1 className="text-3xl font-serif font-bold text-jewelry-gold mb-2">Admin Portal</h1>
            <p className="text-gray-500">Secure access to your jewelry business</p>
          </div>
          
          <button 
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center space-x-3 bg-white border border-gray-200 py-3 rounded-xl font-bold hover:bg-gray-50 mb-6 transition-all"
          >
            <img src="https://www.gstatic.com/firebase/anonymous-scan.png" className="w-5 h-5 hidden" /> { /* Placeholder for Google icon */ }
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span>Sign in with Google</span>
          </button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-gray-400">Or email login</span></div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Username / Email</label>
              <input 
                type="email"
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-jewelry-gold"
                value={loginForm.email}
                onChange={e => setLoginForm({...loginForm, email: e.target.value})}
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Password</label>
                <button 
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-[10px] font-bold text-jewelry-gold hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
              <input 
                type="password"
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-jewelry-gold"
                value={loginForm.password}
                onChange={e => setLoginForm({...loginForm, password: e.target.value})}
              />
            </div>
            <button 
              type="submit" 
              disabled={loggingIn || resettingPassword}
              className="w-full bg-jewelry-gold text-white py-4 rounded-xl font-bold shadow-lg shadow-jewelry-gold/20 hover:bg-jewelry-gold-dark transition-all disabled:opacity-50"
            >
              {loggingIn ? 'Authenticating...' : resettingPassword ? 'Sending Reset...' : 'Enter Dashboard'}
            </button>
          </form>
          <p className="mt-6 text-center text-[10px] text-gray-400">
            For access issues, contact your technical administrator.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-50 lg:pt-0">
      {/* Sidebar - Desktop Only */}
      <aside className={`bg-white border-r border-gray-200 hidden lg:block lg:h-screen lg:fixed lg:left-0 lg:top-0 z-50 overflow-y-auto transition-all duration-300 ${isSidebarCollapsed ? 'lg:w-20' : 'lg:w-72'}`}>
        <div id="admin-sidebar" className="p-4 h-full flex flex-col transition-all duration-300">
          <div className={`mb-10 flex items-center ${isSidebarCollapsed ? 'flex-col space-y-4' : 'justify-between px-2'} overflow-hidden`}>
            <div className={`overflow-hidden transition-all duration-300 ${isSidebarCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
              <h1 className="font-serif font-bold text-jewelry-gold tracking-tight whitespace-nowrap text-2xl">
                ADMIN PANEL
              </h1>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] mt-1">Om Collections</p>
            </div>
            <button 
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className={`p-2 rounded-xl hover:bg-gray-50 text-gray-400 transition-all border border-gray-100 items-center justify-center flex shrink-0 ${isSidebarCollapsed ? 'w-12 h-12' : ''}`}
              title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {isSidebarCollapsed ? <Menu className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            </button>
          </div>

          <nav className="flex-grow space-y-2 w-full">
            {[
              { id: 'overview', icon: LayoutDashboard, label: 'Overview' },
              { id: 'products', icon: Package, label: 'Products' },
              { id: 'orders', icon: ShoppingBag, label: 'Orders' },
              { id: 'customers', icon: Users, label: 'Customers' },
              { id: 'staff', icon: Shield, label: 'Staff members' },
              { id: 'delivery', icon: MapPin, label: 'Delivery' },
              { id: 'categories', icon: Package, label: 'Categories' },
              { id: 'settings', icon: Settings, label: 'Settings' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                title={isSidebarCollapsed ? tab.label : ''}
                className={`w-full flex items-center rounded-2xl text-sm font-bold transition-all group ${activeTab === tab.id ? 'bg-jewelry-gold text-white shadow-lg shadow-jewelry-gold/20' : 'text-gray-500 hover:bg-gray-50'} ${isSidebarCollapsed ? 'h-12 justify-center' : 'px-4 py-4'}`}
              >
                <tab.icon className={`w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110 ${isSidebarCollapsed ? '' : 'mr-3'} ${activeTab === tab.id ? 'text-white' : 'text-gray-400'}`} />
                {!isSidebarCollapsed && <span className="truncate">{tab.label}</span>}
              </button>
            ))}
          </nav>

          <div className="mt-auto pt-8 border-t border-gray-100 w-full space-y-4">
            <div className={`flex items-center overflow-hidden transition-all duration-300 ${isSidebarCollapsed ? 'justify-center px-0' : 'px-2'}`}>
              <div className="w-10 h-10 shrink-0 rounded-full bg-jewelry-cream border border-jewelry-gold/20 flex items-center justify-center text-jewelry-gold font-bold uppercase">
                {user?.email?.charAt(0) || 'A'}
              </div>
              {!isSidebarCollapsed && (
                <div className="ml-3 overflow-hidden">
                  <p className="text-xs font-bold text-gray-900 truncate">{user?.email}</p>
                  <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">{user?.role}</p>
                </div>
              )}
            </div>
            <button
              onClick={() => logout()}
              title={isSidebarCollapsed ? "Sign Out" : ""}
              className={`w-full flex items-center justify-center rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 transition-all border border-red-100 group ${isSidebarCollapsed ? 'h-12' : 'px-4 py-3'}`}
            >
              <LogOut className={`w-4 h-4 transition-transform group-hover:translate-x-1 flex-shrink-0`} />
              {!isSidebarCollapsed && <span className="ml-2">Sign Out</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50 flex items-center justify-around px-2 py-3 shadow-2xl">
        {[
          { id: 'overview', icon: LayoutDashboard },
          { id: 'products', icon: Package },
          { id: 'orders', icon: ShoppingBag },
          { id: 'settings', icon: Settings },
          { id: 'staff', icon: Shield },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`p-3 rounded-2xl transition-all ${activeTab === tab.id ? 'bg-jewelry-gold text-white shadow-lg shadow-jewelry-gold/20' : 'text-gray-400 hover:bg-gray-50'}`}
          >
            <tab.icon className="w-5 h-5" />
          </button>
        ))}
        <button onClick={() => logout()} className="p-3 text-red-500 hover:bg-red-50 rounded-2xl">
          <LogOut className="w-5 h-5" />
        </button>
      </nav>

      {/* Main Content Area */}
      <main className={`flex-grow transition-all duration-300 p-4 lg:p-12 pb-24 lg:pb-12 ${isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-72'}`}>
        <div className="max-w-6xl mx-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-40">
              <div className="w-10 h-10 border-4 border-jewelry-gold border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-jewelry-gold font-bold text-sm tracking-widest uppercase">Fetching System Data</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-10"
              >
                <div className="flex justify-between items-end">
                  <div>
                    <h2 className="text-4xl font-serif font-bold text-gray-900 capitalize">{activeTab}</h2>
                    <p className="text-gray-500 mt-1">Manage and monitor your jewelry store operations</p>
                  </div>
                  <div className="hidden lg:flex items-center text-xs font-bold text-gray-400 uppercase tracking-widest bg-white px-4 py-2 rounded-full border border-gray-100 shadow-sm">
                    <Clock className="w-3 h-3 mr-2" /> {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </div>
                </div>

                {/* Tab Contents */}
                {activeTab === 'overview' && (
                  <div className="space-y-10">
                {/* Bulk Actions for empty stores */}
                {products.length === 0 && (
                  <div className="bg-jewelry-gold/5 border border-jewelry-gold/20 p-8 rounded-3xl text-center">
                    <Database className="w-12 h-12 text-jewelry-gold mx-auto mb-4" />
                    <h3 className="text-xl font-serif font-bold text-gray-900 mb-2">Populate Your Store</h3>
                    <p className="text-gray-500 mb-6 max-w-md mx-auto">Your catalog is currently empty. Would you like to seed your store with 20+ professional jewelry products and categories?</p>
                    <button 
                      onClick={async () => {
                        const { seedProducts } = await import('../../lib/seedUtility');
                        await seedProducts();
                        window.location.reload();
                      }}
                      className="bg-jewelry-gold text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-jewelry-gold/20 hover:bg-jewelry-gold-dark transition-all"
                    >
                      Seed 20+ Products Now
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-center">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-blue-50 text-blue-500 rounded-xl mx-auto"><ShoppingBag className="w-6 h-6" /></div>
                    </div>
                    <p className="text-gray-500 text-sm font-medium uppercase tracking-wider mb-1">Total Orders</p>
                    <p className="text-3xl font-bold">{orders.length}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-jewelry-cream text-jewelry-gold rounded-xl mx-auto"><Package className="w-6 h-6" /></div>
                    </div>
                    <p className="text-gray-500 text-sm font-medium uppercase tracking-wider mb-1">Total Products</p>
                    <p className="text-3xl font-bold">{products.length}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-green-50 text-green-500 rounded-xl mx-auto"><CheckCircle className="w-6 h-6" /></div>
                    </div>
                    <p className="text-gray-500 text-sm font-medium uppercase tracking-wider mb-1">Total Revenue</p>
                    <p className="text-2xl font-bold">₹{orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0).toLocaleString('en-IN')}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-red-50 text-red-500 rounded-xl mx-auto"><Clock className="w-6 h-6" /></div>
                    </div>
                    <p className="text-gray-500 text-sm font-medium uppercase tracking-wider mb-1">Pending Orders</p>
                    <p className="text-3xl font-bold text-red-500">{orders.filter(o => o.status === 'pending').length}</p>
                </div>
              </div>
            </div>
          )}

            {activeTab === 'products' && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                  <h3 className="text-xl font-serif font-bold">Manage Inventory</h3>
                  <button 
                    onClick={() => {
                        setEditingProduct(null);
                        setProductForm({ name: '', description: '', price: 0, category: settings.categories[0], stock: 10, images: [''] });
                        setShowProductModal(true);
                    }}
                    className="bg-jewelry-gold text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center hover:bg-jewelry-gold-dark transition-all"
                  >
                    <Plus className="w-4 h-4 mr-1" /> Add Product
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-wider">
                      <tr>
                        <th className="px-6 py-4">Product</th>
                        <th className="px-6 py-4">Category</th>
                        <th className="px-6 py-4">Price</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {products.map(p => (
                        <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 flex items-center">
                            <img 
                              src={p.images?.[0] || 'https://images.unsplash.com/photo-1515562141207-7a88fb0ce33e?q=80&w=2070&auto=format&fit=crop'} 
                              className="w-10 h-10 rounded-lg object-cover mr-3"
                            />
                            <span className="font-medium text-sm">{p.name}</span>
                          </td>
                          <td className="px-6 py-4"><span className="text-xs bg-gray-100 px-2 py-1 rounded">{p.category}</span></td>
                          <td className="px-6 py-4 text-sm font-bold text-jewelry-gold">₹{p.price.toLocaleString('en-IN')}</td>
                          <td className="px-6 py-4 text-right space-x-2">
                            <button 
                                onClick={() => {
                                    setEditingProduct(p);
                                    setProductForm({ ...p });
                                    setShowProductModal(true);
                                }}
                                className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                                <Edit2 className="w-4 h-4" />
                            </button>
                            <button 
                                onClick={() => handleDeleteProduct(p.id)}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'orders' && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-50">
                  <h3 className="text-xl font-serif font-bold">Recent Orders</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Customer</th>
                                <th className="px-6 py-4">Total</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {orders.map(o => (
                                <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <p className="font-medium text-sm">{o.customerInfo?.name}</p>
                                        <p className="text-xs text-gray-500">{o.customerInfo?.phone}</p>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-bold">₹{o.totalAmount.toLocaleString('en-IN')}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider 
                                            ${o.status === 'pending' ? 'bg-red-100 text-red-600' : 
                                              o.status === 'processing' ? 'bg-blue-100 text-blue-600' :
                                              o.status === 'shipped' ? 'bg-yellow-100 text-yellow-600' :
                                              'bg-green-100 text-green-600'}`}>
                                            {o.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <select 
                                            value={o.status}
                                            onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}
                                            className="text-xs font-bold bg-gray-50 border-none rounded-lg px-2 py-1 focus:ring-1 focus:ring-jewelry-gold"
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="processing">Processing</option>
                                            <option value="shipped">Shipped</option>
                                            <option value="delivered">Delivered</option>
                                            <option value="cancelled">Cancelled</option>
                                        </select>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="max-w-2xl mx-auto space-y-8">
                <section className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                  <h3 className="text-xl font-serif font-bold mb-6">Store Configuration</h3>
                  
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">UPI ID</label>
                        <input 
                          type="text"
                          placeholder="example@upi"
                          className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-jewelry-gold"
                          value={settings.upiId || ''}
                          onChange={e => setSettings({...settings, upiId: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">UPI Phone Number</label>
                        <input 
                          type="text"
                          placeholder="+91 00000 00000"
                          className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-jewelry-gold"
                          value={settings.upiPhone || ''}
                          onChange={e => setSettings({...settings, upiPhone: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Min Order (₹)</label>
                        <input 
                          type="number"
                          className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-jewelry-gold"
                          value={settings.minOrderAmount ?? 0}
                          onChange={e => setSettings({...settings, minOrderAmount: Number(e.target.value)})}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Max Image Size (MB)</label>
                        <input 
                          type="number"
                          className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-jewelry-gold"
                          value={settings.maxImageSize ?? 5}
                          onChange={e => setSettings({...settings, maxImageSize: Number(e.target.value)})}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Admin URL Path</label>
                        <input 
                          type="text"
                          placeholder="admin"
                          className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-jewelry-gold"
                          value={settings.adminPath || 'admin'}
                          onChange={e => setSettings({...settings, adminPath: e.target.value})}
                        />
                      </div>
                    </div>

                    <button 
                      onClick={handleSaveSettings}
                      className="w-full bg-jewelry-gold text-white py-4 rounded-xl font-bold shadow-lg shadow-jewelry-gold/20 hover:bg-jewelry-gold-dark transition-all"
                    >
                      Save Store Settings
                    </button>
                  </div>
                </section>

                <section className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                  <h3 className="text-xl font-serif font-bold mb-6">Payment QR Code</h3>
                  
                  <div className="space-y-6">
                    <div className="flex flex-col items-center p-6 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100">
                      {settings.upiQrImage ? (
                        <div className="relative group">
                          <img src={settings.upiQrImage} className="w-48 h-48 object-contain rounded-lg mb-4 shadow-md bg-white p-2" alt="UPI QR" />
                          <button 
                            onClick={() => setSettings({...settings, upiQrImage: ''})}
                            className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Upload className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                          <p className="text-sm text-gray-400">No QR Code uploaded yet</p>
                        </div>
                      )}
                      
                      <div className="w-full mt-4">
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e, true)}
                          className="hidden" 
                          id="qr-image-upload"
                        />
                        <label 
                          htmlFor="qr-image-upload"
                          className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-white rounded-xl border border-gray-200 cursor-pointer hover:bg-jewelry-cream/30 hover:border-jewelry-gold/30 transition-all font-bold text-sm text-gray-700"
                        >
                          <Upload className="w-4 h-4 text-jewelry-gold" />
                          <span>{settings.upiQrImage ? 'Replace QR Code' : 'Upload QR Code'}</span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">QR Code Footer Text</label>
                      <textarea 
                        className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-jewelry-gold text-sm"
                        placeholder="Instructions for customers below the QR code..."
                        rows={2}
                        value={settings.upiText || ''}
                        onChange={e => setSettings({...settings, upiText: e.target.value})}
                      />
                    </div>

                    <button 
                      onClick={handleSaveSettings}
                      className="w-full bg-jewelry-gold text-white py-4 rounded-xl font-bold shadow-lg shadow-jewelry-gold/20 hover:bg-jewelry-gold-dark transition-all"
                    >
                      Persist QR Changes
                    </button>
                  </div>
                </section>
              </div>
            )}

            {activeTab === 'delivery' && (
              <div className="max-w-2xl mx-auto">
                <section className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                  <div className="mb-6 flex justify-between items-center">
                    <h3 className="text-xl font-serif font-bold">Delivery Cities & Charges</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    <input 
                      type="text"
                      placeholder="City Name"
                      className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-jewelry-gold text-sm"
                      value={newCityForm.name}
                      onChange={e => setNewCityForm({...newCityForm, name: e.target.value})}
                    />
                    <div className="flex gap-2">
                      <input 
                        type="number"
                        placeholder="Charge (₹)"
                        className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-jewelry-gold text-sm"
                        value={newCityForm.charge}
                        onChange={e => setNewCityForm({...newCityForm, charge: e.target.value})}
                      />
                      <button 
                        onClick={addCity}
                        className="bg-jewelry-gold text-white p-3 rounded-xl hover:bg-jewelry-gold-dark transition-colors shrink-0"
                        title="Add City"
                      >
                        <Plus className="w-6 h-6" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {settings.cities?.map((city: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 transition-all hover:border-jewelry-gold/20">
                        <div>
                          <p className="font-bold text-gray-900">{city.name}</p>
                          <p className="text-xs text-jewelry-gold font-bold tracking-wider">₹{city.charge} CHARGE</p>
                        </div>
                        <button 
                          onClick={() => removeCity(idx)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {(!settings.cities || settings.cities.length === 0) && (
                      <div className="text-center py-12 border-2 border-dashed border-gray-100 rounded-3xl">
                        <MapPin className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                        <p className="text-gray-400 text-sm">No cities configured for delivery.</p>
                      </div>
                    )}
                  </div>
                  
                  {settings.cities?.length > 0 && (
                    <button 
                      onClick={handleSaveSettings}
                      className="w-full mt-8 bg-jewelry-gold text-white py-4 rounded-xl font-bold shadow-lg shadow-jewelry-gold/20 hover:bg-jewelry-gold-dark transition-all"
                    >
                      Confirm Delivery Locations
                    </button>
                  )}
                </section>
              </div>
            )}

            {activeTab === 'customers' && (
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-8 border-b border-gray-50 flex justify-between items-center">
                  <h3 className="text-xl font-serif font-bold">Client Directory</h3>
                  <span className="text-sm font-bold text-jewelry-gold bg-jewelry-cream px-4 py-1 rounded-full">
                    {customers.length} Customers
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      <tr>
                        <th className="px-8 py-4">Customer</th>
                        <th className="px-8 py-4">Status</th>
                        <th className="px-8 py-4">Contact</th>
                        <th className="px-8 py-4">Orders</th>
                        <th className="px-8 py-4">Total Value</th>
                        <th className="px-8 py-4">Address & Location</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {customers.map((customer, idx) => (
                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                          <td className="px-8 py-6">
                            <p className="font-bold text-gray-900">{customer.name || 'Anonymous'}</p>
                            <p className="text-xs text-gray-400">{customer.email || 'No email'}</p>
                          </td>
                          <td className="px-8 py-6">
                            {customer.isRegistered ? (
                              <span className="text-[9px] bg-green-100 text-green-600 px-2 py-1 rounded-full font-bold uppercase tracking-widest">Registered</span>
                            ) : (
                              <span className="text-[9px] bg-gray-100 text-gray-400 px-2 py-1 rounded-full font-bold uppercase tracking-widest">Guest</span>
                            )}
                          </td>
                          <td className="px-8 py-6">
                            <a href={`tel:${customer.phone}`} className="text-sm font-bold hover:text-jewelry-gold">
                              {customer.phone}
                            </a>
                          </td>
                          <td className="px-8 py-6">
                            <span className="text-sm">{customer.orderCount}</span>
                          </td>
                          <td className="px-8 py-6">
                            <span className="text-sm font-bold">₹{customer.totalSpent?.toLocaleString('en-IN')}</span>
                          </td>
                          <td className="px-8 py-6 max-w-xs">
                            <p className="text-xs text-gray-500 line-clamp-1 mb-1">{customer.fullAddress}</p>
                            {customer.googleMapsLink && (
                              <a 
                                href={customer.googleMapsLink} 
                                target="_blank" 
                                rel="noreferrer"
                                className="text-[10px] font-bold text-jewelry-gold flex items-center hover:underline"
                              >
                                <MapPin className="w-3 h-3 mr-1" /> View on Maps <ExternalLink className="w-2 h-2 ml-1" />
                              </a>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'staff' && (
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-8 border-b border-gray-50 flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-serif font-bold">System Users</h3>
                    <p className="text-sm text-gray-500">Manage staff access, roles, and credentials</p>
                  </div>
                  <button 
                    onClick={() => {
                        setEditingUser(null);
                        setNewUserForm({ email: '', password: '', role: 'staff', username: '' });
                        setShowUserModal(true);
                    }}
                    className="bg-jewelry-gold text-white px-6 py-2 rounded-xl text-sm font-bold flex items-center hover:bg-jewelry-gold-dark transition-all"
                  >
                    <UserPlus className="w-4 h-4 mr-2" /> Add Staff Member
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      <tr>
                        <th className="px-8 py-4">Staff Member</th>
                        <th className="px-8 py-4">Username</th>
                        <th className="px-8 py-4">Status / Role</th>
                        <th className="px-8 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {staff.map((u, idx) => (
                        <tr key={u.id || idx} className="hover:bg-gray-50 transition-colors">
                          <td className="px-8 py-6">
                            <p className="font-bold text-gray-900">{u.email}</p>
                            <p className="text-[10px] text-gray-400 font-mono">{u.id}</p>
                            {u.email === 'itssanjaydutta@gmail.com' && (
                              <span className="text-[10px] text-jewelry-gold font-bold uppercase tracking-wider block mt-1">System Founder</span>
                            )}
                          </td>
                          <td className="px-8 py-6">
                            <p className="text-sm font-medium">{u.username || 'N/A'}</p>
                            {u.initialPassword && (
                              <p className="text-[9px] text-gray-300 font-mono mt-1 select-all" title="Recorded password">PWD: {u.initialPassword}</p>
                            )}
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex items-center">
                              <select 
                                value={u.role || 'user'}
                                disabled={u.email === 'itssanjaydutta@gmail.com'}
                                onChange={(e) => handleUpdateUserRole(u.id, e.target.value)}
                                className="text-xs font-bold bg-gray-50 border-none rounded-lg px-3 py-1 focus:ring-1 focus:ring-jewelry-gold disabled:opacity-50 mr-2"
                              >
                                <option value="user">Standard User</option>
                                <option value="staff">Staff/Editor</option>
                                <option value="admin">Administrator</option>
                              </select>
                              <div className={`w-2 h-2 rounded-full ${u.role === 'admin' ? 'bg-indigo-500' : u.role === 'staff' ? 'bg-jewelry-gold' : 'bg-gray-300'}`}></div>
                            </div>
                          </td>
                          <td className="px-8 py-6 text-right flex items-center justify-end space-x-2">
                             <button 
                                onClick={async () => {
                                  try {
                                    await resetPassword(u.email);
                                    toast.success('Password reset email sent to staff');
                                  } catch (err) {
                                    toast.error('Failed to send reset email');
                                  }
                                }}
                                className="p-2 text-jewelry-gold hover:bg-jewelry-cream rounded-xl transition-colors"
                                title="Send Reset Password Email"
                              >
                                <Clock className="w-4 h-4" />
                              </button>
                            <button 
                              onClick={() => {
                                setEditingUser(u);
                                setNewUserForm({ email: u.email, password: u.initialPassword || '', role: u.role, username: u.username || '' });
                                setShowUserModal(true);
                              }}
                              className="p-2 text-blue-500 hover:bg-blue-50 rounded-xl transition-colors"
                              title="Edit User Details"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            {u.email !== 'itssanjaydutta@gmail.com' && (
                              <button 
                                onClick={() => handleDeleteUser(u.id)}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'categories' && (
              <div className="max-w-2xl mx-auto">
                <section className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                  <h3 className="text-xl font-serif font-bold mb-6">Product Categories</h3>
                  
                  <div className="flex gap-2 mb-6">
                    <input 
                      type="text"
                      placeholder="Add new collection category..."
                      className="flex-grow px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-jewelry-gold"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                    />
                    <button 
                      onClick={addCategory}
                      className="bg-gray-900 text-white p-3 rounded-xl hover:bg-jewelry-gold transition-colors"
                    >
                      <Plus className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="space-y-2">
                    {settings.categories.map((cat: string) => (
                      <div key={cat} className="flex items-center justify-between bg-jewelry-cream p-4 rounded-xl">
                        <span className="font-medium">{cat}</span>
                        <button 
                          onClick={() => removeCategory(cat)}
                          className="text-red-400 hover:text-red-600"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  <button 
                    onClick={handleSaveSettings}
                    className="w-full mt-8 bg-gray-900 text-white py-4 rounded-xl font-bold hover:bg-jewelry-gold transition-all"
                  >
                    Save Collection Changes
                  </button>
                </section>
              </div>
            )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </main>

      {/* User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-serif font-bold">{editingUser ? 'Edit System User' : 'Add Staff Member'}</h3>
              <button 
                onClick={() => {
                  setShowUserModal(false);
                  setEditingUser(null);
                }} 
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle />
              </button>
            </div>
            
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Display Username</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white transition-all"
                  value={newUserForm.username}
                  onChange={e => setNewUserForm({...newUserForm, username: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Email Address (Login ID)</label>
                <input 
                  type="email"
                  required
                  placeholder="name@jewels.com"
                  className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white transition-all"
                  value={newUserForm.email}
                  onChange={e => setNewUserForm({...newUserForm, email: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                  {editingUser ? 'Update Password (Database Record Only)' : 'Initial login Password'}
                </label>
                <input 
                  type="password"
                  required={!editingUser}
                  minLength={6}
                  placeholder={editingUser ? "Leave blank to keep same" : "Min 6 characters"}
                  className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white transition-all"
                  value={newUserForm.password}
                  onChange={e => setNewUserForm({...newUserForm, password: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Initial Role</label>
                <select 
                  className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50"
                  value={newUserForm.role}
                  onChange={e => setNewUserForm({...newUserForm, role: e.target.value})}
                >
                  <option value="user">Standard User</option>
                  <option value="staff">Staff/Editor</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              <div className="bg-blue-50 p-4 rounded-xl flex items-start space-x-3 mb-6">
                <Shield className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <div className="text-[10px] text-blue-600 leading-relaxed">
                  {editingUser ? (
                    <p>Updating username/email here only changes the display in records. To change the actual login password, use the "Reset Password" button in the staff list.</p>
                  ) : (
                    <p>Creating a user will enable them to log in with these credentials. Ensure the staff member changes their password after their first login.</p>
                  )}
                </div>
              </div>

              <button 
                type="submit" 
                disabled={creatingUser}
                className="w-full bg-jewelry-gold text-white py-4 rounded-xl font-bold shadow-lg shadow-jewelry-gold/20 disabled:opacity-50"
              >
                {creatingUser ? (editingUser ? 'Saving Changes...' : 'Creating System Account...') : (editingUser ? 'Save Changes' : 'Create Account')}
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-serif font-bold">{editingProduct ? 'Edit Piece' : 'New Collection Piece'}</h3>
              <button onClick={() => setShowProductModal(false)} className="text-gray-400 hover:text-gray-600"><XCircle /></button>
            </div>
            
            <form onSubmit={handleSaveProduct} className="space-y-4">
              <input 
                required
                placeholder="Name" 
                className="w-full px-4 py-2 border rounded-xl"
                value={productForm.name || ''}
                onChange={e => setProductForm({...productForm, name: e.target.value})}
              />
              <textarea 
                required
                placeholder="Description" 
                rows={3}
                className="w-full px-4 py-2 border rounded-xl"
                value={productForm.description || ''}
                onChange={e => setProductForm({...productForm, description: e.target.value})}
              />
              <div className="grid grid-cols-2 gap-4">
                <input 
                  type="number"
                  required
                  placeholder="Price (₹)" 
                  className="w-full px-4 py-2 border rounded-xl"
                  value={productForm.price ?? 0}
                  onChange={e => setProductForm({...productForm, price: Number(e.target.value)})}
                />
                <select 
                  className="w-full px-4 py-2 border rounded-xl"
                  value={productForm.category || ''}
                  onChange={e => setProductForm({...productForm, category: e.target.value})}
                >
                  {settings.categories.map((cat: string) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <input 
                type="number"
                required
                placeholder="Stock" 
                className="w-full px-4 py-2 border rounded-xl"
                value={productForm.stock ?? 0}
                onChange={e => setProductForm({...productForm, stock: Number(e.target.value)})}
              />
              
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Product Image</label>
                <div className="flex gap-4 items-start">
                  {productForm.images?.[0] && (
                    <img 
                      src={productForm.images[0]} 
                      className="w-20 h-20 rounded-lg object-cover border border-gray-100" 
                      alt="Preview"
                    />
                  )}
                  <div className="flex-grow">
                    <div className="relative">
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden" 
                        id="product-image-upload"
                      />
                      <label 
                        htmlFor="product-image-upload"
                        className={`w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-xl border-2 border-dashed transition-all cursor-pointer ${uploadingImage ? 'bg-gray-50 border-gray-200' : 'border-jewelry-gold/20 hover:border-jewelry-gold/50'}`}
                      >
                        <Upload className={`w-5 h-5 ${uploadingImage ? 'animate-bounce text-gray-400' : 'text-jewelry-gold'}`} />
                        <span className="text-sm font-medium text-gray-600">
                          {uploadingImage ? 'Processing...' : (productForm.images?.[0] ? 'Change Image' : 'Upload Image')}
                        </span>
                      </label>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1 italic">Max size: {settings.maxImageSize || 5}MB. Base64 encoding used for Firestore.</p>
                  </div>
                </div>
              </div>

              <input 
                placeholder="Or Image URL" 
                className="w-full px-4 py-2 border rounded-xl text-xs"
                value={productForm.images?.[0]?.startsWith('data:') ? '' : (productForm.images?.[0] || '')}
                onChange={e => setProductForm({...productForm, images: [e.target.value]})}
              />
              <button type="submit" disabled={uploadingImage} className="w-full bg-jewelry-gold text-white py-3 rounded-xl font-bold mt-4 shadow-lg shadow-jewelry-gold/20 disabled:opacity-50">
                {editingProduct ? 'Save Changes' : 'Launch Piece'}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
