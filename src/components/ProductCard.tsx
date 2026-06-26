import React from 'react';
import { ShoppingCart, Heart, MessageSquare, AlertCircle, ShieldCheck } from 'lucide-react';
import { Product } from '../types';

interface ProductCardProps {
  key?: string | number;
  product: Product;
  onAddToCart: (product: Product) => void;
  onAddToWishlist: (product: Product) => void;
  isWishlisted: boolean;
  onOrderViaWhatsApp: (product: Product) => void;
  onSelectProduct: (product: Product) => void;
}

export default function ProductCard({
  product,
  onAddToCart,
  onAddToWishlist,
  isWishlisted,
  onOrderViaWhatsApp,
  onSelectProduct
}: ProductCardProps) {
  return (
    <div 
      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-blue-200 dark:hover:border-blue-900 transition-all duration-300 overflow-hidden flex flex-col group"
      id={`product-card-${product.id}`}
    >
      {/* Badge & Favorite Button */}
      <div className="relative pt-[70%] bg-slate-50 dark:bg-slate-950 overflow-hidden cursor-pointer" onClick={() => onSelectProduct(product)}>
        <img
          src={product.image}
          alt={product.name}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        
        {/* Availability Badge */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          {product.availability === 'In Stock' && (
            <span className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-400 text-[10px] font-bold px-2.5 py-1 rounded-full border border-emerald-100 dark:border-emerald-900/50 shadow-sm">
              In Stock
            </span>
          )}
          {product.availability === 'Requires Prescription' && (
            <span className="bg-amber-50 text-amber-700 dark:bg-amber-950/80 dark:text-amber-400 text-[10px] font-bold px-2.5 py-1 rounded-full border border-amber-100 dark:border-amber-900/50 shadow-sm flex items-center gap-1">
              <AlertCircle size={10} /> Prescription Required
            </span>
          )}
          {product.availability === 'Out of Stock' && (
            <span className="bg-rose-50 text-rose-700 dark:bg-rose-950/80 dark:text-rose-400 text-[10px] font-bold px-2.5 py-1 rounded-full border border-rose-100 dark:border-rose-900/50 shadow-sm">
              Out of Stock
            </span>
          )}
        </div>

        {/* Favorite Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddToWishlist(product);
          }}
          className={`absolute top-3 right-3 p-2 rounded-full border shadow-sm backdrop-blur-md transition-all z-10 ${
            isWishlisted
              ? 'bg-rose-50 border-rose-100 text-rose-500 hover:bg-rose-100'
              : 'bg-white/80 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 text-slate-400 hover:text-rose-500 hover:bg-white'
          }`}
          title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart size={16} fill={isWishlisted ? "currentColor" : "none"} />
        </button>
      </div>

      {/* Details Container */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Category */}
          <span className="text-[11px] font-semibold tracking-wide text-blue-600 dark:text-blue-400 uppercase">
            {product.category}
          </span>

          {/* Product Name */}
          <h3 
            className="text-base font-bold text-slate-800 dark:text-slate-100 mt-1 line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors cursor-pointer"
            onClick={() => onSelectProduct(product)}
          >
            {product.name}
          </h3>

          {/* Description */}
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
            {product.description}
          </p>

          {/* Rating */}
          <div className="flex items-center gap-1.5 mt-3">
            <div className="flex text-amber-400">
              {'★'.repeat(Math.round(product.rating))}
              {'☆'.repeat(5 - Math.round(product.rating))}
            </div>
            <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold">({product.reviewsCount})</span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
          {/* Price */}
          <div className="flex items-baseline gap-1">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">₦</span>
            <span className="text-lg font-extrabold text-slate-900 dark:text-white">
              {product.price.toLocaleString()}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 mt-3">
            <button
              onClick={() => onAddToCart(product)}
              disabled={product.availability === 'Out of Stock'}
              className={`w-full py-2.5 px-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm ${
                product.availability === 'Out of Stock'
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-700 dark:hover:bg-blue-600'
              }`}
              id={`add-to-cart-btn-${product.id}`}
            >
              <ShoppingCart size={13} />
              <span>Add to Cart</span>
            </button>

            <button
              onClick={() => onOrderViaWhatsApp(product)}
              className="w-full py-2.5 px-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50 hover:bg-emerald-500 hover:text-white dark:hover:bg-emerald-500 hover:border-emerald-500 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm"
              id={`order-wa-btn-${product.id}`}
            >
              <MessageSquare size={13} />
              <span>Order WhatsApp</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
