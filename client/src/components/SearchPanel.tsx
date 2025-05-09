import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { type SearchPublicationParams } from "@shared/schema";
import { useDebounce } from "../hooks/use-debounce";
import Pagination from "./Pagination";
import { ChevronLeft, Search, User, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

// Определяем интерфейс для автора
interface Author {
  authorId: string;
  name: string;
  surname: string;
  givenName: string;
  affiliation: string;
  documentCount: number;
}

interface SearchPanelProps {
  onSearch: (params: SearchPublicationParams) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function SearchPanel({ onSearch, currentPage, totalPages, onPageChange }: SearchPanelProps) {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [author, setAuthor] = useState("");
  const [authorQuery, setAuthorQuery] = useState("");
  const [university, setUniversity] = useState("");
  const [yearFrom, setYearFrom] = useState<string>("");
  const [yearTo, setYearTo] = useState<string>("");
  const [journal, setJournal] = useState("");
  const [journalQuery, setJournalQuery] = useState("");
  const [showJournalDropdown, setShowJournalDropdown] = useState(false);
  const [selectedJournal, setSelectedJournal] = useState<{Title: string, 'SJR Quartile': string, ISSN?: string, 'E-ISSN'?: string} | null>(null);
  const [category, setCategory] = useState("");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showAuthorDropdown, setShowAuthorDropdown] = useState(false);
  const [selectedAuthor, setSelectedAuthor] = useState<Author | null>(null);
  
  // Ссылки на выпадающие списки для обработки клика вне списка
  const authorDropdownRef = useRef<HTMLDivElement>(null);
  const journalDropdownRef = useRef<HTMLDivElement>(null);
  
  // Обработчик клика вне выпадающего списка авторов
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (authorDropdownRef.current && !authorDropdownRef.current.contains(event.target as Node)) {
        setShowAuthorDropdown(false);
      }
      if (journalDropdownRef.current && !journalDropdownRef.current.contains(event.target as Node)) {
        setShowJournalDropdown(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  
  // Создаем отложенные значения для полей ввода, чтобы не делать запросы при каждом нажатии клавиши
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const debouncedAuthor = useDebounce(author, 500);
  const debouncedAuthorQuery = useDebounce(authorQuery, 500);
  const debouncedUniversity = useDebounce(university, 500);
  const debouncedYearFrom = useDebounce(yearFrom, 500);
  const debouncedYearTo = useDebounce(yearTo, 500);
  const debouncedJournal = useDebounce(journal, 500);
  const debouncedJournalQuery = useDebounce(journalQuery, 500);
  
  // Запрос к API для поиска авторов
  const { 
    data: authorsData, 
    isLoading: isLoadingAuthors,
    error: authorsError 
  } = useQuery<{data: Author[], total: number}>({
    queryKey: ['/api/scopus/authors', debouncedAuthorQuery],
    queryFn: async ({ queryKey }) => {
      const [_, query] = queryKey as [string, string];
      
      if (!query || query.length < 2) return { data: [], total: 0 };
      
      const response = await fetch(`/api/scopus/authors?query=${encodeURIComponent(query)}`);
      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }
      return response.json();
    },
    enabled: !!debouncedAuthorQuery && debouncedAuthorQuery.length >= 2, // Запрос выполняется только если есть хотя бы 2 символа
  });
  
  // Запрос к API для поиска журналов
  const { 
    data: journalsData, 
    isLoading: isLoadingJournals,
    error: journalsError 
  } = useQuery<{data: Array<{Title: string, 'SJR Quartile': string, ISSN: string, 'E-ISSN': string}>, total: number}>({
    queryKey: ['/api/journals/search', debouncedJournalQuery],
    queryFn: async ({ queryKey }) => {
      const [_, query] = queryKey as [string, string];
      
      if (!query || query.length < 2) return { data: [], total: 0 };
      
      const response = await fetch(`/api/journals/search?query=${encodeURIComponent(query)}`);
      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }
      return response.json();
    },
    enabled: !!debouncedJournalQuery && debouncedJournalQuery.length >= 2, // Запрос выполняется только если есть хотя бы 2 символа
  });
  
  // Функция применения фильтров
  const applyFilters = () => {
    // Валидация годов
    const parsedYearFrom = yearFrom ? parseInt(yearFrom, 10) : undefined;
    const parsedYearTo = yearTo ? parseInt(yearTo, 10) : undefined;
    
    // Проверяем валидность диапазона годов
    if (parsedYearFrom && parsedYearTo && parsedYearFrom > parsedYearTo) {
      console.log("Неверный диапазон годов: год начала больше года окончания");
      // Продолжаем выполнение запроса, но с исправленными параметрами
      // В интерфейсе уже отображается сообщение об ошибке
    }
    
    console.log("Применение фильтров поиска:", {
      query: searchQuery,
      author,
      yearFrom: parsedYearFrom,
      yearTo: parsedYearTo,
      category,
      database: ["Scopus"]
    });

    const params: SearchPublicationParams = {
      query: searchQuery,
      author: author || undefined,
      university: university || undefined,
      yearFrom: parsedYearFrom,
      yearTo: parsedYearTo,
      journal: journal || undefined,
      category: category === "all" ? undefined : category,
      database: ["Scopus"], // Всегда ищем в Scopus
      page: 1,
      limit: 10,
      sortBy: "year",
      sortDirection: "desc"
    };
    console.log("Применение фильтров поиска:", params);
    onSearch(params);
  };
  
  // Функция для обработки нажатия кнопки поиска
  const handleSearch = () => {
    applyFilters();
  };
  
  // Автоматическое применение фильтров при изменении значений полей
  useEffect(() => {
    if (debouncedSearchQuery || debouncedAuthor || debouncedUniversity || 
        debouncedYearFrom || debouncedYearTo || debouncedJournal || category) {
      applyFilters();
    }
  }, [debouncedSearchQuery, debouncedAuthor, debouncedUniversity, 
      debouncedYearFrom, debouncedYearTo, debouncedJournal, category]);

  return (
    <section className={`mb-8 bg-white rounded-lg shadow-md overflow-hidden relative transition-all duration-300 ${isCollapsed ? 'w-12' : ''}`}>
      {/* Кнопка сворачивания сайдбара */}
      <Button 
        variant="ghost" 
        size="sm" 
        className="absolute right-0 top-2 z-10"
        onClick={() => setIsCollapsed(prev => !prev)}
      >
        <ChevronLeft className={`h-5 w-5 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} />
      </Button>
      
      {/* Фильтры в сайдбаре */}
      <div className={`space-y-4 transition-all duration-300 ${isCollapsed ? 'opacity-0 h-0 overflow-hidden' : 'opacity-100 p-4'}`}>
        <h3 className="text-lg font-semibold text-neutral-800 mb-2">Фильтры</h3>
        <div className="space-y-2">
          <Label className="block text-sm font-medium text-neutral-700 mb-1">Автор</Label>
          <div className="relative">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Input
                  type="text"
                  placeholder="Введите имя автора или выберите из Scopus..."
                  value={author}
                  onChange={(e) => {
                    setAuthor(e.target.value);
                    // Если начинаем вводить в поле автора, дублируем значение и в поле поиска Scopus
                    if (!selectedAuthor) {
                      setAuthorQuery(e.target.value);
                      if (e.target.value.length >= 2) {
                        setShowAuthorDropdown(true);
                      } else {
                        setShowAuthorDropdown(false);
                      }
                    }
                  }}
                  onFocus={() => {
                    if (authorQuery.length >= 2) setShowAuthorDropdown(true);
                  }}
                />
                
                {/* Выпадающий список с авторами */}
                {showAuthorDropdown && debouncedAuthorQuery.length >= 2 && (
                  <div 
                    ref={authorDropdownRef}
                    className="absolute z-50 top-full left-0 w-full mt-1 bg-white rounded-md border shadow-lg max-h-60 overflow-auto">
                    {isLoadingAuthors ? (
                      <div className="p-2 text-center flex items-center justify-center">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        <span>Поиск авторов в Scopus...</span>
                      </div>
                    ) : authorsError ? (
                      <div className="p-2 text-center text-red-500">
                        Ошибка при поиске авторов
                      </div>
                    ) : authorsData?.data?.length ? (
                      <div>
                        {authorsData.data.map((author, index) => (
                          <div
                            key={`author-${author.authorId}-${index}`}
                            className="p-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                            onClick={() => {
                              setSelectedAuthor(author);
                              setAuthor(`${author.surname}, ${author.givenName}`);
                              setAuthorQuery(`${author.surname}, ${author.givenName}`);
                              setShowAuthorDropdown(false);
                            }}
                          >
                            <div className="font-medium">{author.surname}, {author.givenName}</div>
                            <div className="text-xs text-gray-500">
                              {author.affiliation} • {author.documentCount} публикаций
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-2 text-center text-gray-500">
                        Авторы не найдены
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <Button 
                type="button" 
                variant="outline"
                title="Поиск автора в Scopus"
                onClick={() => {
                  setShowAuthorDropdown(prev => !prev);
                  if (!showAuthorDropdown && author.length >= 2) {
                    setAuthorQuery(author);
                  } else if (authorQuery.length < 2) {
                    setAuthorQuery('');
                  }
                }}
              >
                <User className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Отображаем выбранного автора */}
          {selectedAuthor && (
            <div className="p-2 bg-blue-50 rounded-md mt-2">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium">{selectedAuthor.surname}, {selectedAuthor.givenName}</div>
                  <div className="text-xs text-gray-600">{selectedAuthor.affiliation}</div>
                  <div className="text-xs text-gray-500">{selectedAuthor.documentCount} публикаций</div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedAuthor(null);
                    setAuthor('');
                  }}
                  className="h-6 w-6 p-0"
                >
                  &times;
                </Button>
              </div>
            </div>
          )}
        </div>
        
        <div>
          <Label className="block text-sm font-medium text-neutral-700 mb-1">Год публикации</Label>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <Input 
                type="number" 
                className="w-full" 
                placeholder="От"
                value={yearFrom}
                min={1900}
                max={new Date().getFullYear() + 1}
                onChange={(e) => {
                  const value = e.target.value;
                  setYearFrom(value);
                  // Автоматически применяем фильтры при изменении
                  if (!value || !isNaN(parseInt(value, 10))) {
                    // Небольшая задержка, чтобы не делать слишком много запросов при быстром вводе
                    setTimeout(() => applyFilters(), 200);
                  }
                }}
              />
            </div>
            <span className="text-gray-500">—</span>
            <div className="flex-1">
              <Input 
                type="number" 
                className="w-full" 
                placeholder="До"
                value={yearTo}
                min={1900}
                max={new Date().getFullYear() + 1}
                onChange={(e) => {
                  const value = e.target.value;
                  setYearTo(value);
                  // Автоматически применяем фильтры при изменении
                  if (!value || !isNaN(parseInt(value, 10))) {
                    // Небольшая задержка, чтобы не делать слишком много запросов при быстром вводе
                    setTimeout(() => applyFilters(), 200);
                  }
                }}
              />
            </div>
          </div>
          {yearFrom && yearTo && parseInt(yearFrom) > parseInt(yearTo) && (
            <p className="text-xs text-red-500 mt-1">Год начала не может быть больше года окончания</p>
          )}
        </div>
        
        <div>
          <Label className="block text-sm font-medium text-neutral-700 mb-1">Журнал</Label>
          <div className="relative">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Input 
                  type="text" 
                  className="w-full" 
                  placeholder="Введите название журнала..."
                  value={journal}
                  onChange={(e) => {
                    setJournal(e.target.value);
                    // Если начинаем вводить в поле журнала, дублируем значение для поиска
                    if (!selectedJournal) {
                      setJournalQuery(e.target.value);
                      if (e.target.value.length >= 2) {
                        setShowJournalDropdown(true);
                      } else {
                        setShowJournalDropdown(false);
                      }
                    }
                  }}
                  onFocus={() => {
                    if (journalQuery.length >= 2) setShowJournalDropdown(true);
                  }}
                />
                
                {/* Выпадающий список с журналами */}
                {showJournalDropdown && debouncedJournalQuery.length >= 2 && (
                  <div 
                    ref={journalDropdownRef}
                    className="absolute z-50 top-full left-0 w-full mt-1 bg-white rounded-md border shadow-lg max-h-60 overflow-auto"
                  >
                    {isLoadingJournals ? (
                      <div className="p-2 text-center flex items-center justify-center">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        <span>Поиск журналов...</span>
                      </div>
                    ) : journalsError ? (
                      <div className="p-2 text-center text-red-500">
                        Ошибка при поиске журналов
                      </div>
                    ) : journalsData?.data?.length ? (
                      <div>
                        {journalsData.data.map((journalItem, index) => (
                          <div
                            key={`journal-${index}`}
                            className="p-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                            onClick={() => {
                              setSelectedJournal(journalItem);
                              setJournal(journalItem.Title);
                              setJournalQuery(journalItem.Title);
                              setShowJournalDropdown(false);
                            }}
                          >
                            <div className="font-medium">{journalItem.Title}</div>
                            <div className="flex text-xs text-gray-500 justify-between">
                              <span>{journalItem['SJR Quartile'] || 'Нет данных о квартиле'}</span>
                              {journalItem.ISSN && <span>ISSN: {journalItem.ISSN}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-2 text-center text-gray-500">
                        Журналы не найдены
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <Button 
                type="button" 
                variant="outline"
                title="Поиск журнала"
                onClick={() => {
                  setShowJournalDropdown(prev => !prev);
                  if (!showJournalDropdown && journal.length >= 2) {
                    setJournalQuery(journal);
                  } else if (journalQuery.length < 2) {
                    setJournalQuery('');
                  }
                }}
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Отображаем выбранный журнал */}
          {selectedJournal && (
            <div className="p-2 bg-blue-50 rounded-md mt-2">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium">{selectedJournal.Title}</div>
                  <div className="text-xs text-gray-600">
                    {selectedJournal['SJR Quartile'] || 'Нет данных о квартиле'}
                  </div>
                  {selectedJournal.ISSN && (
                    <div className="text-xs text-gray-500">ISSN: {selectedJournal.ISSN}</div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedJournal(null);
                    setJournal('');
                  }}
                  className="h-6 w-6 p-0"
                >
                  &times;
                </Button>
              </div>
            </div>
          )}
        </div>
        
        <div>
          <Label className="block text-sm font-medium text-neutral-700 mb-1">Категория журнала</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Все категории" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все категории</SelectItem>
              <SelectItem value="Q1-Q2">Статьи Q1-Q2</SelectItem>
              <SelectItem value="Q3-Q4">Статьи Q3-Q4</SelectItem>
              <SelectItem value="ВАК">Статьи ВАК</SelectItem>
              <SelectItem value="РИНЦ">Статьи РИНЦ</SelectItem>
              <SelectItem value="Патенты">Патенты</SelectItem>
              <SelectItem value="Диссертации">Диссертации</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label className="block text-sm font-medium text-neutral-700 mb-1">Университет</Label>
          <Input 
            type="text" 
            className="w-full" 
            placeholder="Название университета"
            value={university}
            onChange={(e) => setUniversity(e.target.value)}
          />
        </div>
      </div>
      
      {/* Пагинация перенесена в Home.tsx и находится рядом с заголовком */}
    </section>
  );
}