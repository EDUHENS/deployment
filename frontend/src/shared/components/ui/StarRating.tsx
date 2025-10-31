'use client';

import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  className?: string;
}

export default function StarRating({ rating, maxRating = 5, className = '' }: StarRatingProps) {
  return (
    <div className={`content-stretch flex gap-[4px] items-start relative shrink-0 ${className}`}>
      {Array.from({ length: maxRating }, (_, index) => (
        <Star 
          key={index} 
          className={`w-[15px] h-[15px] ${
            index < rating 
              ? 'text-yellow-400 fill-yellow-400' 
              : 'text-gray-300 fill-gray-300'
          }`} 
        />
      ))}
    </div>
  );
}
