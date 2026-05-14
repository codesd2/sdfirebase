import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { ShoppingCart } from 'lucide-react';
import { motion } from 'motion/react';

interface ProductCardProps {
  product: any;
  key?: React.Key;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      viewport={{ once: true }}
      className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col h-full"
    >
      <Link to={`/product/${product.id}`} className="block relative aspect-square overflow-hidden bg-gray-100">
        <img 
          src={product.images?.[0] || 'https://images.unsplash.com/photo-1515562141207-7a88fb0ce33e?q=80&w=2070&auto=format&fit=crop'} 
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {product.stock <= 0 && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded">OUT OF STOCK</span>
          </div>
        )}
      </Link>
      
      <div className="p-3 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-0.5">
          <p className="text-[10px] uppercase tracking-widest text-jewelry-gold font-bold">{product.category}</p>
        </div>
        <Link to={`/product/${product.id}`} className="text-sm font-serif font-bold mb-1 hover:text-jewelry-gold transition-colors line-clamp-1">
          {product.name}
        </Link>
        <div className="mt-auto flex items-center justify-between pt-2 border-t border-gray-50">
          <span className="text-sm font-bold">₹{product.price.toLocaleString('en-IN')}</span>
          <button 
            onClick={() => addToCart(product)}
            disabled={product.stock <= 0}
            className="bg-gray-900 text-white p-1.5 rounded-full hover:bg-jewelry-gold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
