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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

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
    setCurrentPage(1); // Reset to first page on filter change
  }, [products, activeCategory, searchTerm]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="pt-28 pb-20 container mx-auto px-4 max-w-7xl">
      <header className="mb-12 text-center max-w-2xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">Om Collections Fine Jewelry</h1>
        <p className="text-gray-500 font-light tracking-wide">
          Handcrafted elegance for your most precious moments. 
          Browse our collections and experience the luxury of fine craftsmanship.
        </p>
      </header>

      <div className="max-w-xl mx-auto mb-16">
        <div className="relative group mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-jewelry-gold transition-colors" />
          <input 
            type="text" 
            placeholder="Search our exquisite collection..." 
            className="w-full pl-12 pr-4 py-5 bg-white rounded-2xl shadow-sm border-none focus:ring-1 focus:ring-jewelry-gold transition-all text-sm font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-6 py-2.5 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all border ${
                activeCategory === cat 
                ? 'bg-jewelry-gold text-white border-jewelry-gold shadow-md shadow-jewelry-gold/20' 
                : 'bg-white text-gray-500 border-gray-100 hover:border-jewelry-gold/30 hover:text-jewelry-gold'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="w-full">
        {/* Product Grid */}
        <div className="flex-grow">
          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <div key={i} className="animate-pulse bg-white rounded-2xl h-[300px]"></div>
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {paginatedProducts.length > 0 ? (
                  paginatedProducts.map(product => (
                    <ProductCard key={product.id} product={product} />
                  ))
                ) : (
                  <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-dashed border-gray-200">
                    <p className="text-gray-400 text-lg font-serif italic">No pieces found in this collection.</p>
                  </div>
                )}
              </div>

              {totalPages > 1 && (
                <div className="mt-12 flex justify-center items-center space-x-4">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => prev - 1)}
                    className="px-6 py-2 rounded-full border border-jewelry-gold text-jewelry-gold font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-jewelry-gold hover:text-white transition-all"
                  >
                    Previous
                  </button>
                  <span className="text-sm font-bold text-gray-400">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    className="px-6 py-2 rounded-full border border-jewelry-gold text-jewelry-gold font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-jewelry-gold hover:text-white transition-all"
                  >
                    Next Page
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
