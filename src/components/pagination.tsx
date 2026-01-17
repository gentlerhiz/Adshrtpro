import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showFirstLast?: boolean;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  showFirstLast = true,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  const getVisiblePages = () => {
    const pages: number[] = [];
    const maxVisible = 5;
    
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  };

  const visiblePages = getVisiblePages();

  return (
    <div className="flex items-center justify-center gap-1">
      {showFirstLast && (
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(1)}
          disabled={!canGoPrevious}
          data-testid="button-pagination-first"
        >
          <ChevronsLeft className="w-4 h-4" />
        </Button>
      )}
      
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={!canGoPrevious}
        data-testid="button-pagination-prev"
      >
        <ChevronLeft className="w-4 h-4" />
      </Button>

      <div className="flex items-center gap-1">
        {visiblePages[0] > 1 && (
          <>
            <Button
              variant={currentPage === 1 ? "default" : "outline"}
              size="icon"
              onClick={() => onPageChange(1)}
              data-testid="button-pagination-1"
            >
              1
            </Button>
            {visiblePages[0] > 2 && (
              <span className="px-2 text-muted-foreground">...</span>
            )}
          </>
        )}
        
        {visiblePages.map((page) => (
          <Button
            key={page}
            variant={currentPage === page ? "default" : "outline"}
            size="icon"
            onClick={() => onPageChange(page)}
            data-testid={`button-pagination-${page}`}
          >
            {page}
          </Button>
        ))}
        
        {visiblePages[visiblePages.length - 1] < totalPages && (
          <>
            {visiblePages[visiblePages.length - 1] < totalPages - 1 && (
              <span className="px-2 text-muted-foreground">...</span>
            )}
            <Button
              variant={currentPage === totalPages ? "default" : "outline"}
              size="icon"
              onClick={() => onPageChange(totalPages)}
              data-testid={`button-pagination-${totalPages}`}
            >
              {totalPages}
            </Button>
          </>
        )}
      </div>

      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={!canGoNext}
        data-testid="button-pagination-next"
      >
        <ChevronRight className="w-4 h-4" />
      </Button>
      
      {showFirstLast && (
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(totalPages)}
          disabled={!canGoNext}
          data-testid="button-pagination-last"
        >
          <ChevronsRight className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}

export function usePagination<T>(items: T[], itemsPerPage: number = 10) {
  const totalPages = Math.ceil(items.length / itemsPerPage);
  
  const getPageItems = (page: number): T[] => {
    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return items.slice(start, end);
  };
  
  return { totalPages, getPageItems };
}
