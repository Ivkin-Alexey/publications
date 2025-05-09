import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  // Всегда показываем пагинацию, даже если всего одна страница
  const effectiveTotalPages = Math.max(1, totalPages);
  const [pageInput, setPageInput] = useState<string>(currentPage.toString());

  // Определяем, какие страницы показывать
  const getPageNumbers = () => {
    const pageNumbers: (number)[] = [];
    
    if (effectiveTotalPages <= 5) {
      // Если страниц немного, показываем все
      for (let i = 1; i <= effectiveTotalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Показываем первые две страницы
      pageNumbers.push(1);
      pageNumbers.push(2);
      
      // Середина
      if (currentPage <= 3) {
        // Если текущая страница близка к началу
        pageNumbers.push(3);
      } else if (currentPage >= effectiveTotalPages - 2) {
        // Если текущая страница близка к концу
        pageNumbers.push(effectiveTotalPages - 2);
      } else {
        // Если текущая страница где-то в середине, показываем её
        pageNumbers.push(currentPage);
      }
      
      // Показываем последние две страницы
      pageNumbers.push(effectiveTotalPages - 1);
      pageNumbers.push(effectiveTotalPages);
    }
    
    return pageNumbers;
  };

  const pageNumbers = getPageNumbers();
  const showEllipsis = effectiveTotalPages > 5;

  // Функция для отрисовки страниц пагинации
  const renderPageNumbers = () => {
    return pageNumbers.map((page, index) => {
      // Если это третья страница и нужно показать многоточие
      if (index === 2 && showEllipsis) {
        // Возвращаем группу элементов
        return (
          <div key={`group-${page}`} className="flex items-center">
            <Button
              variant={currentPage === page ? "default" : "ghost"}
              className={`w-10 h-10 p-0 flex items-center justify-center rounded-md ${
                currentPage === page 
                  ? "bg-blue-500 text-white" 
                  : "text-blue-500 hover:bg-blue-50"
              }`}
              onClick={() => onPageChange(page)}
            >
              {page}
            </Button>
            <span className="text-blue-500 mx-1 flex items-center justify-center">...</span>
          </div>
        );
      }
      
      // Пропускаем средние элементы
      if (index > 2 && index < pageNumbers.length - 2 && showEllipsis) {
        return null;
      }
      
      // Для остальных страниц просто показываем кнопку
      return (
        <Button
          key={`page-${page}`}
          variant={currentPage === page ? "default" : "ghost"}
          className={`w-10 h-10 p-0 flex items-center justify-center rounded-md ${
            currentPage === page 
              ? "bg-blue-500 text-white" 
              : "text-blue-500 hover:bg-blue-50"
          }`}
          onClick={() => onPageChange(page)}
        >
          {page}
        </Button>
      );
    });
  };

  return (
    <div className="flex items-center justify-center mb-0">
      <div className="flex items-center gap-2">
        <nav className="flex items-center gap-1">
          <Button
            variant="ghost"
            className="w-10 h-10 p-0 flex items-center justify-center rounded-md text-blue-400 hover:bg-blue-50"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          
          {renderPageNumbers()}
          
          <Button
            variant="ghost"
            className="w-10 h-10 p-0 flex items-center justify-center rounded-md text-blue-400 hover:bg-blue-50"
            onClick={() => onPageChange(Math.min(effectiveTotalPages, currentPage + 1))}
            disabled={currentPage === effectiveTotalPages}
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </nav>
        
        <div className="flex items-center ml-3 hidden">
          <Input
            className="w-16 h-8 text-sm mr-2"
            value={pageInput}
            onChange={(e) => setPageInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const page = parseInt(pageInput);
                if (!isNaN(page) && page > 0 && page <= effectiveTotalPages) {
                  onPageChange(page);
                }
              }
            }}
          />
          <Button 
            variant="outline" 
            size="sm"
            className="h-8 text-xs px-2"
            onClick={() => {
              const page = parseInt(pageInput);
              if (!isNaN(page) && page > 0 && page <= effectiveTotalPages) {
                onPageChange(page);
              }
            }}
          >
            Перейти
          </Button>
        </div>
      </div>
    </div>
  );
}
