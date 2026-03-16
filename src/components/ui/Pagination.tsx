import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange?: (n: number) => void;
  itemsPerPageOptions?: number[];
  entityName?: string; // e.g. "invoices", "customers"
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  itemsPerPageOptions = [10, 25, 50],
  entityName = 'results',
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const start = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const end = Math.min(currentPage * itemsPerPage, totalItems);

  // Build page number array with ellipsis
  const getPageNumbers = (): (number | '...')[] => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | '...')[] = [];
    if (currentPage <= 4) {
      pages.push(1, 2, 3, 4, 5, '...', totalPages);
    } else if (currentPage >= totalPages - 3) {
      pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
    }
    return pages;
  };

  const btnBase =
    'w-9 h-9 flex items-center justify-center rounded-md text-sm font-medium transition-colors duration-150';
  const btnDefault =
    'bg-white dark:bg-[#1A1A1A] text-[#6B5E4A] dark:text-[#9A9A8A] hover:bg-[#FFF8E7] dark:hover:bg-[#2A2A1A] border border-[#E8E0D0] dark:border-[#2E2E2E]';
  const btnActive =
    'bg-[#B8860B] text-white border border-[#B8860B] shadow-[0_0_8px_rgba(184,134,11,0.4)]';
  const btnDisabled = 'opacity-40 cursor-not-allowed pointer-events-none';

  if (totalItems === 0) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 px-2">
      {/* Left: count label */}
      <div className="text-sm text-[#6B5E4A] dark:text-[#9A9A8A] whitespace-nowrap">
        Showing <span className="font-semibold text-[#1A1209] dark:text-[#F5F5F0]">{start}–{end}</span>{' '}
        of <span className="font-semibold text-[#1A1209] dark:text-[#F5F5F0]">{totalItems}</span>{' '}
        {entityName}
      </div>

      {/* Center: page buttons */}
      <div className="flex items-center gap-1">
        {/* First page */}
        <button
          className={`${btnBase} ${btnDefault} ${currentPage === 1 ? btnDisabled : ''} hidden sm:flex`}
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          title="First page"
        >
          <ChevronsLeft size={14} />
        </button>

        {/* Prev */}
        <button
          className={`${btnBase} ${btnDefault} ${currentPage === 1 ? btnDisabled : ''}`}
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          title="Previous page"
        >
          <ChevronLeft size={16} />
        </button>

        {/* Mobile: Page X of Y */}
        <span className="sm:hidden text-sm text-[#6B5E4A] dark:text-[#9A9A8A] px-2">
          Page {currentPage} of {totalPages}
        </span>

        {/* Desktop: page number buttons */}
        <div className="hidden sm:flex items-center gap-1">
          {getPageNumbers().map((pageNum, idx) =>
            pageNum === '...' ? (
              <span key={`ellipsis-${idx}`} className="w-9 text-center text-[#9A9A8A] text-sm">
                …
              </span>
            ) : (
              <button
                key={pageNum}
                className={`${btnBase} ${pageNum === currentPage ? btnActive : btnDefault}`}
                onClick={() => onPageChange(pageNum as number)}
              >
                {pageNum}
              </button>
            )
          )}
        </div>

        {/* Next */}
        <button
          className={`${btnBase} ${btnDefault} ${currentPage === totalPages ? btnDisabled : ''}`}
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          title="Next page"
        >
          <ChevronRight size={16} />
        </button>

        {/* Last page */}
        <button
          className={`${btnBase} ${btnDefault} ${currentPage === totalPages ? btnDisabled : ''} hidden sm:flex`}
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          title="Last page"
        >
          <ChevronsRight size={14} />
        </button>
      </div>

      {/* Right: items per page */}
      {onItemsPerPageChange && (
        <div className="flex items-center gap-2 text-sm text-[#6B5E4A] dark:text-[#9A9A8A]">
          <span className="whitespace-nowrap">Show:</span>
          <select
            value={itemsPerPage}
            onChange={(e) => {
              onItemsPerPageChange(Number(e.target.value));
              onPageChange(1);
            }}
            className="bg-white dark:bg-[#1A1A1A] border border-[#E8E0D0] dark:border-[#2E2E2E] text-[#1A1209] dark:text-[#F5F5F0] rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-[#B8860B] focus:outline-none"
          >
            {itemsPerPageOptions.map((n) => (
              <option key={n} value={n}>{n} / page</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};
