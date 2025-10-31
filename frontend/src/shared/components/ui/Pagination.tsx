'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export default function Pagination({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  className = '' 
}: PaginationProps) {
  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const handlePageClick = (page: number) => {
    onPageChange(page);
  };

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  if (totalPages <= 1) return null;

  return (
    <div className={`w-full flex justify-center items-center gap-6 ${className}`}>
      {/* Previous Button */}
      <button
        onClick={handlePrevious}
        disabled={currentPage === 1}
            className="flex items-center gap-1 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors text-base font-medium"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>Previous</span>
      </button>

      {/* Page Numbers */}
      <div className="flex gap-1">
        {getPageNumbers().map((page, index) => (
          <button
            key={index}
            onClick={() => typeof page === 'number' && handlePageClick(page)}
            disabled={page === '...'}
                className={`px-3 py-1 text-base font-medium transition-colors rounded ${
              page === currentPage
                ? 'bg-purple-100 text-purple-600'
                : page === '...'
                ? 'cursor-default text-gray-400'
                : 'text-gray-600 hover:text-gray-800 cursor-pointer'
            }`}
          >
            {page}
          </button>
        ))}
      </div>

      {/* Next Button */}
      <button
        onClick={handleNext}
        disabled={currentPage === totalPages}
            className="flex items-center gap-1 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors text-base font-medium"
      >
        <span>Next</span>
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}