
'use client';

import * as React from 'react';
import ReactPaginate from 'react-paginate';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';

interface PaginationProps {
  pageCount: number;
  onPageChange: (selectedItem: { selected: number }) => void;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({ pageCount, onPageChange, className }) => {
  if (pageCount <= 1) {
    return null;
  }

  return (
    <ReactPaginate
      breakLabel="..."
      nextLabel={<ChevronRight className="h-4 w-4" />}
      onPageChange={onPageChange}
      pageRangeDisplayed={3}
      pageCount={pageCount}
      previousLabel={<ChevronLeft className="h-4 w-4" />}
      renderOnZeroPageCount={null}
      containerClassName={cn("flex items-center justify-center space-x-2 py-4", className)}
      pageClassName="hidden sm:inline-block"
      pageLinkClassName={cn(buttonVariants({ variant: 'outline', size: 'icon' }), "h-9 w-9")}
      previousClassName=""
      previousLinkClassName={cn(buttonVariants({ variant: 'outline', size: 'icon' }), "h-9 w-9")}
      nextClassName=""
      nextLinkClassName={cn(buttonVariants({ variant: 'outline', size: 'icon' }), "h-9 w-9")}
      activeLinkClassName="bg-primary text-primary-foreground"
      breakClassName="hidden sm:inline-block"
      breakLinkClassName={cn(buttonVariants({ variant: 'outline', size: 'icon' }), "h-9 w-9")}
      // Custom first and last page buttons
      children={
        <>
            <button
                onClick={() => onPageChange({ selected: 0 })}
                className={cn(buttonVariants({ variant: 'outline', size: 'icon' }), "h-9 w-9 mr-2")}
                disabled={pageCount === 0}
            >
                <ChevronsLeft className="h-4 w-4" />
            </button>
            <button
                onClick={() => onPageChange({ selected: pageCount - 1 })}
                className={cn(buttonVariants({ variant: 'outline', size: 'icon' }), "h-9 w-9 ml-2")}
                disabled={pageCount === 0}
            >
                <ChevronsRight className="h-4 w-4" />
            </button>
        </>
      }
    />
  );
};
