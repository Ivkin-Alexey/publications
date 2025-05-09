import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Loader2, User } from "lucide-react";
import { Publication } from "@shared/schema";
import PublicationCard from "./PublicationCard";
import { Card, CardContent } from "@/components/ui/card";
import { apiRequest, getQueryFn, queryClient } from "@/lib/queryClient";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useDebounce } from "@/hooks/use-debounce";

// Определяем интерфейс для автора
interface Author {
  authorId: string;
  name: string;
  surname: string;
  givenName: string;
  affiliation: string;
  documentCount: number;
}

export default function ScopusSearchPanel() {
  const [query, setQuery] = useState("");
  const [authorFilter, setAuthorFilter] = useState("");
  const [authorQuery, setAuthorQuery] = useState("");
  const [searchParams, setSearchParams] = useState({ query: "", author: "" });
  const [showAuthorDropdown, setShowAuthorDropdown] = useState(false);
  const [selectedPublications, setSelectedPublications] = useState<Set<string>>(new Set());
  const [selectedAuthor, setSelectedAuthor] = useState<Author | null>(null);
  
  // Ссылка на выпадающий список для обработки клика вне списка
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  
  // Обработчик клика вне выпадающего списка
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowAuthorDropdown(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  
  // Добавляем debounce для поиска авторов
  const debouncedAuthorQuery = useDebounce(authorQuery, 500);
  
  // Добавляем запрос к API для поиска авторов
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

  // Запрос к API для поиска в Scopus с учетом автора
  const { data, isLoading, error } = useQuery<{data: Publication[], total: number}>({
    queryKey: ['/api/scopus', searchParams],
    queryFn: async ({ queryKey }) => {
      const [_, params] = queryKey as [string, { query: string, author: string }];
      
      if (!params.query && !params.author) return { data: [], total: 0 };
      
      // Формируем URL с параметрами
      const queryString = new URLSearchParams();
      if (params.query) queryString.append('query', params.query);
      if (params.author) queryString.append('author', params.author);
      
      const response = await fetch(`/api/scopus?${queryString.toString()}`);
      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }
      return response.json();
    },
    enabled: !!(searchParams.query || searchParams.author), // Запрос выполняется только если есть хотя бы один параметр
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams({ query, author: authorFilter });
  };

  const handlePublicationSelect = (id: number | string, isSelected: boolean) => {
    console.log("Нажатие на выбор публикации в Scopus", id, isSelected);
    
    // Убедимся, что id преобразован в строку для использования с Set<string>
    const stringId = id.toString();
    
    // Клонируем множество выбранных публикаций
    const newSelectedPublications = new Set(selectedPublications);
    
    // Добавляем или удаляем выбранный ID
    if (isSelected) {
      newSelectedPublications.add(stringId);
    } else {
      newSelectedPublications.delete(stringId);
    }
    
    console.log("Выбранные публикации Scopus:", Array.from(newSelectedPublications));
    
    // Обновляем состояние
    setSelectedPublications(newSelectedPublications);
  };

  const handleAddToLibrary = async () => {
    if (selectedPublications.size === 0 || !data?.data) return;

    // Найти публикации, ID которых есть в выбранных (или ID из scopusId)
    const selectedPubs = data.data.filter((pub: Publication) => {
      // Получаем ID в виде строки, чтобы можно было сравнить с Set<string>
      let pubIdStr;
      
      if (pub.metadata?.scopusId) {
        // Извлекаем только числовую часть идентификатора Scopus
        pubIdStr = pub.metadata.scopusId.replace(/\D/g, '');
      } else {
        // Используем обычный ID, преобразованный в строку
        pubIdStr = (pub.id || 0).toString();
      }
      
      return selectedPublications.has(pubIdStr);
    });

    try {
      // Добавляем каждую выбранную публикацию в библиотеку
      for (const pub of selectedPubs) {
        await fetch('/api/publications', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(pub)
        });
      }

      // Очищаем выбранные публикации и обновляем результаты поиска
      setSelectedPublications(new Set());
      alert(`Добавлено ${selectedPubs.length} публикаций в библиотеку`);
      
      // Инвалидируем кеш для обновления списка публикаций
      queryClient.invalidateQueries({ queryKey: ['/api/publications'] });
    } catch (error) {
      console.error('Error adding publications to library:', error);
      alert('Ошибка при добавлении публикаций в библиотеку');
    }
  };

  return (
    <Card className="w-full">
      <CardContent className="pt-6">
        <Tabs defaultValue="scopus">
          <TabsList className="mb-4">
            <TabsTrigger value="scopus">Scopus</TabsTrigger>
            <TabsTrigger value="elibrary" disabled>eLIBRARY</TabsTrigger>
            <TabsTrigger value="google-scholar" disabled>Google Scholar</TabsTrigger>
          </TabsList>

          <TabsContent value="scopus" className="space-y-4">
            <form onSubmit={handleSearch} className="space-y-3">
              <div className="flex gap-2">
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Введите поисковый запрос..."
                  className="flex-1"
                />
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Search className="h-4 w-4 mr-2" />
                  )}
                  Поиск
                </Button>
              </div>
              
              <div className="flex flex-col gap-2">
                <div className="w-full">
                  <label htmlFor="author-filter" className="text-sm font-medium text-neutral-700 mb-1 block">
                    Поиск по автору
                  </label>
                  <Input
                    id="author-filter"
                    value={authorFilter}
                    onChange={(e) => setAuthorFilter(e.target.value)}
                    placeholder="Введите имя автора вручную"
                  />
                </div>
                
                <div className="w-full">
                  <label htmlFor="author-search" className="text-sm font-medium text-neutral-700 mb-1 block">
                    Поиск автора в Scopus
                  </label>
                  <div className="relative">
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <Input
                          id="author-search"
                          value={authorQuery}
                          onChange={(e) => {
                            setAuthorQuery(e.target.value);
                            setShowAuthorDropdown(true);
                          }}
                          placeholder="Начните вводить имя автора..."
                          onFocus={() => {
                            if (authorQuery.length >= 2) setShowAuthorDropdown(true);
                          }}
                          className="flex-1"
                        />
                        
                        {/* Выпадающий список с авторами */}
                        {showAuthorDropdown && debouncedAuthorQuery.length >= 2 && (
                          <div 
                            ref={dropdownRef}
                            className="absolute z-50 top-full left-0 w-full mt-1 bg-white rounded-md border shadow-lg max-h-60 overflow-auto">
                            {isLoadingAuthors ? (
                              <div className="p-2 text-center flex items-center justify-center">
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                <span>Поиск авторов...</span>
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
                                      setAuthorFilter(`${author.surname}, ${author.givenName}`);
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
                        onClick={() => {
                          setShowAuthorDropdown(prev => !prev);
                          if (authorQuery.length < 2) {
                            setAuthorQuery('');
                          }
                        }}
                      >
                        <User className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                
                {/* Отображаем выбранного автора */}
                {selectedAuthor && (
                  <div className="p-2 bg-blue-50 rounded-md">
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
                          setAuthorFilter('');
                        }}
                        className="h-6 w-6 p-0"
                      >
                        &times;
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </form>

            {selectedPublications.size > 0 && (
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-md mb-4">
                <span>
                  Выбрано публикаций: <strong>{selectedPublications.size}</strong>
                </span>
                <Button onClick={handleAddToLibrary} className="bg-blue-500 hover:bg-blue-600">
                  Добавить в библиотеку
                </Button>
              </div>
            )}

            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : error ? (
              <div className="p-4 text-center text-red-500">
                Ошибка при поиске публикаций. Пожалуйста, попробуйте позже.
              </div>
            ) : data?.data?.length ? (
              <div className="grid gap-4 pt-4">
                {data.data.map((publication: Publication, index: number) => (
                  <PublicationCard
                    key={`scopus-publication-${index}-${publication.metadata?.scopusId || publication.id}`}
                    publication={publication}
                    isSelected={
                      publication.metadata?.scopusId
                        ? selectedPublications.has(publication.metadata.scopusId.replace(/\D/g, ''))
                        : selectedPublications.has((publication.id || 0).toString())
                    }
                    onSelect={handlePublicationSelect}
                  />
                ))}
              </div>
            ) : (searchParams.query || searchParams.author) ? (
              <div className="p-4 text-center text-gray-500">
                Публикации не найдены. Попробуйте изменить поисковый запрос.
              </div>
            ) : null}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}