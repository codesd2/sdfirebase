import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productService } from '../services/storeService';
import { useCart } from '../context/CartContext';
import { ShoppingCart, ArrowLeft, Shield, Truck, Star, Info } from 'lucide-react';
import { motion } from 'motion/react';
import toast from 'react-hot-toast';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      const data = await productService.getProduct(id);
      if (data) {
        setProduct(data);
      } else {
        toast.error('Product not found');
        navigate('/shop');
      }
      setLoading(false);
    };
    fetchProduct();
  }, [id, navigate]);

  if (loading) return <div className="pt-40 text-center text-jewelry-gold">Loading elegance...</div>;
  if (!product) return null;

  return (
    <div className="pt-28 pb-20 container mx-auto px-4">
      <button 
        onClick={() => navigate(-1)} 
        className="flex items-center text-gray-500 hover:text-jewelry-gold mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> Back
      </button>

      <div className="grid md:grid-cols-2 gap-12 lg:gap-20">
        {/* Images */}
        <div className="space-y-4">
          <div className="aspect-square bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100">
            <img 
              src={product.images?.[activeImage] || 'https://images.unsplash.com/photo-1515562141207-7a88fb0ce33e?q=80&w=2070&auto=format&fit=crop'} 
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
          {product.images && product.images.length > 1 && (
            <div className="flex gap-4 overflow-x-auto pb-2">
              {product.images.map((img: string, idx: number) => (
                <button 
                  key={idx}
                  onClick={() => setActiveImage(idx)}
                  className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${activeImage === idx ? 'border-jewelry-gold' : 'border-transparent'}`}
                >
                  <img src={img} alt={`View ${idx}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-col">
          <p className="text-jewelry-gold uppercase tracking-[0.3em] font-bold text-sm mb-4">{product.category}</p>
          <h1 className="text-4xl lg:text-5xl font-serif font-bold mb-4">{product.name}</h1>
          
          <div className="flex items-center space-x-2 mb-6">
            <div className="flex text-jewelry-gold">
              {[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4 fill-current" />)}
            </div>
            <span className="text-sm text-gray-400 font-medium">(24 reviews)</span>
          </div>

          <p className="text-3xl font-bold mb-8">₹{product.price.toLocaleString('en-IN')}</p>
          
          <div className="prose prose-gray mb-10 max-w-none">
            <p className="text-gray-600 leading-relaxed text-lg">{product.description}</p>
          </div>

          <div className="flex flex-col mb-10">
            <button 
              onClick={() => {
                addToCart(product);
                toast.success('Added to bag');
              }}
              disabled={product.stock <= 0}
              className="bg-gray-900 text-white flex items-center justify-center space-x-3 py-4 rounded-full font-bold hover:bg-jewelry-gold transition-colors disabled:opacity-50 shadow-xl shadow-gray-900/10"
            >
              <ShoppingCart className="w-5 h-5" />
              <span>{product.stock <= 0 ? 'Out of Stock' : 'Add to Bag'}</span>
            </button>
          </div>

          {/* Highlights */}
          <div className="space-y-6 pt-10 border-t border-gray-100">
            <div className="flex items-start space-x-4">
              <Truck className="w-6 h-6 text-jewelry-gold shrink-0" />
              <div>
                <p className="font-bold text-sm">Complimentary Shipping</p>
                <p className="text-xs text-gray-500">Includes secure, insured delivery within India.</p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <Shield className="w-6 h-6 text-jewelry-gold shrink-0" />
              <div>
                <p className="font-bold text-sm">Lifetime Warranty</p>
                <p className="text-xs text-gray-500">Every piece is guaranteed for craftsmanship & authenticity.</p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <Info className="w-6 h-6 text-jewelry-gold shrink-0" />
              <div>
                <p className="font-bold text-sm">BIS Hallmark Certified</p>
                <p className="text-xs text-gray-500">Authentic 22K/18K Gold purity assured with official hallmarking.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
