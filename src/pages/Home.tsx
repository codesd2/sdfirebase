import React, { useEffect, useState } from 'react';
import { productService, settingsService } from '../services/storeService';
import ProductCard from '../components/ProductCard';
import { Search } from 'lucide-react';
import { motion } from 'motion/react';

export default function Home() {
  const [products, setProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>(['All', 'Gold', 'Diamond', 'Silver', 'Platinum', 'Premium']);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    const fetchData = async () => {
      const [pData, sData] = await Promise.all([
        productService.getProducts(),
        settingsService.getSettings()
      ]);
      setProducts(pData);
      if (sData?.categories) {
        setCategories(['All', ...sData.categories]);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  useEffect(() => {
    let result = products;
    if (activeCategory !== 'All') {
      result = result.filter(p => p.category === activeCategory);
    }
    if (searchTerm) {
      result = result.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredProducts(result);
  }, [products, activeCategory, searchTerm]);

  return (
    <div className="pt-28 pb-20 container mx-auto px-4 max-w-7xl">
      <header className="mb-12 text-center max-w-2xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">Om Collections Fine Jewelry</h1>
        <p className="text-gray-500 font-light tracking-wide">
          Handcrafted elegance for your most precious moments. 
          Browse our collections and experience the luxury of fine craftsmanship.
        </p>
      </header>

      <div className="max-w-xl mx-auto mb-12">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-jewelry-gold transition-colors" />
          <input 
            type="text" 
            placeholder="Search our exquisite collection..." 
            className="w-full pl-12 pr-4 py-5 bg-white rounded-2xl shadow-sm border-none focus:ring-1 focus:ring-jewelry-gold transition-all text-sm font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-12">
        {/* Categories Sidebar */}
        <aside className="w-full md:w-64 space-y-6">
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 px-2">Collections</h3>
            <div className="flex flex-wrap md:flex-col gap-2">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-3 rounded-xl text-sm font-bold text-left transition-all ${
                    activeCategory === cat 
                    ? 'bg-jewelry-gold text-white shadow-md' 
                    : 'bg-white text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Product Grid */}
        <div className="flex-grow">
          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <div key={i} className="animate-pulse bg-white rounded-2xl h-[300px]"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {filteredProducts.length > 0 ? (
                filteredProducts.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))
              ) : (
                <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-dashed border-gray-200">
                  <p className="text-gray-400 text-lg font-serif italic">No pieces found in this collection.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
