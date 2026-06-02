/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Product } from '../types';
import { formatEuro } from '../utils';
import {
  UtensilsCrossed,
  Flame,
  Egg,
  Fish,
  Beef,
  Salad,
  Sandwich,
  Square,
  Beer,
  Wine,
  CupSoda,
  Droplet,
  Coffee,
  Cookie,
  Cake,
  Sparkles,
  Plus
} from 'lucide-react';

interface ProductCardProps {
  key?: string;
  product: Product;
  onAddToCart: (product: Product) => void;
}

// Map strings to Lucide components safely
const iconMap: { [key: string]: any } = {
  UtensilsCrossed,
  Flame,
  Egg,
  Fish,
  Beef,
  Salad,
  Sandwich,
  Square,
  Beer,
  Wine,
  CupSoda,
  Droplet,
  Coffee,
  Cookie,
  Cake,
  Sparkles
};

export default function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const IconComponent = iconMap[product.iconName] || UtensilsCrossed;

  // Custom colors depending on the category for high visual rhythm
  const getCategoryTheme = (category: string) => {
    switch (category) {
      case 'tapas':
        return {
          bg: 'bg-amber-50 hover:bg-amber-100 border-amber-200',
          iconBg: 'bg-amber-100 text-amber-700',
          priceColor: 'text-amber-800'
        };
      case 'bocadillos':
        return {
          bg: 'bg-orange-50 hover:bg-orange-100 border-orange-200',
          iconBg: 'bg-orange-100 text-orange-700',
          priceColor: 'text-orange-800'
        };
      case 'bebidas':
        return {
          bg: 'bg-sky-50 hover:bg-sky-100 border-sky-200',
          iconBg: 'bg-sky-100 text-sky-700',
          priceColor: 'text-sky-800'
        };
      case 'postres':
        return {
          bg: 'bg-rose-50 hover:bg-rose-100 border-rose-200',
          iconBg: 'bg-rose-100 text-rose-700',
          priceColor: 'text-rose-800'
        };
      default:
        return {
          bg: 'bg-slate-50 hover:bg-slate-100 border-slate-200',
          iconBg: 'bg-slate-100 text-slate-700',
          priceColor: 'text-slate-800'
        };
    }
  };

  const theme = getCategoryTheme(product.category);

  return (
    <button
      id={`btn-product-${product.id}`}
      onClick={() => onAddToCart(product)}
      className={`relative w-full text-left p-4 rounded-2xl border transition-all duration-200 active:scale-97 select-none cursor-pointer flex flex-col justify-between h-40 shadow-xs hover:shadow-md ${theme.bg}`}
    >
      <div className="flex gap-3 items-start justify-between w-full">
        <div className={`p-2.5 rounded-xl ${theme.iconBg} shrink-0 shadow-2xs`}>
          <IconComponent className="w-6 h-6 stroke-[2.25]" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-900 text-base leading-tight tracking-tight break-words">
            {product.name}
          </h3>
          <p className="text-xs text-slate-500 line-clamp-2 mt-1 font-normal leading-normal">
            {product.description}
          </p>
        </div>
      </div>

      <div className="flex items-end justify-between mt-3">
        <div>
          <span className="text-2xs font-semibold text-slate-400 block uppercase tracking-wider">
            PVP con IVA
          </span>
          <span className={`text-lg font-bold ${theme.priceColor} tracking-tight`}>
            {formatEuro(product.price)}
          </span>
        </div>
        <div className={`p-1.5 rounded-full ${theme.iconBg} hover:scale-110 active:scale-90 transition-transform`}>
          <Plus className="w-5 h-5 stroke-[2.5]" />
        </div>
      </div>
    </button>
  );
}
