import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import SearchPanel from "@/components/SearchPanel";
import PublicationCard from "@/components/PublicationCard";
import SelectedPublications from "@/components/SelectedPublications";
import Pagination from "@/components/Pagination";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search } from "lucide-react";
import { SearchPublicationParams, Publication } from "@shared/schema";

export default function Home() {
  const [searchParams, setSearchParams] = useState<SearchPublicationParams>({
    page: 1,
    limit: 10,
    sortBy: "year",
    sortDirection: "desc",
  });
  const [selectedPublications, setSelectedPublications] = useState<Publication[]>([]);
  const [sortBy, setSortBy] = useState<string>("date-desc");

  // Query для загрузки публикаций
  const { data, isLoading, isError } = useQuery({
    queryKey: ["/api/publications", searchParams],
    queryFn: async ({ queryKey }) => {
      const [_, params] = queryKey;
      
      // Формируем URL с параметрами
      const queryParams = new URLSearchParams();
      Object.entries(params as Record<string, any>).forEach(([key, value]) => {
        if (value !== undefined) {
          if (Array.isArray(value)) {
            value.forEach(val => queryParams.append(key, val));
          } else {
            queryParams.append(key, String(value));
          }
        }
      });
      
      const response = await fetch(`/api/publications?${queryParams}`);
      if (!response.ok) {
        throw new Error("Ошибка загрузки публикаций");
      }
      return response.json();
    },
  });

  // Обработка смены страницы
  const handlePageChange = (page: number) => {
    setSearchParams(prev => ({ ...prev, page }));
  };

  // Обработка поиска и фильтрации
  const handleSearch = (params: SearchPublicationParams) => {
    setSearchParams(prev => ({ ...prev, ...params, page: 1 }));
  };

  // Обработка сортировки
  const handleSortChange = (value: string) => {
    setSortBy(value);
    
    let sortBy = "year";
    let sortDirection = "desc";
    
    switch (value) {
      case "date-desc":
        sortBy = "year";
        sortDirection = "desc";
        break;
      case "date-asc":
        sortBy = "year";
        sortDirection = "asc";
        break;
      case "title":
        sortBy = "title";
        sortDirection = "asc";
        break;
      case "journal":
        sortBy = "journal";
        sortDirection = "asc";
        break;
    }
    
    setSearchParams(prev => ({ ...prev, sortBy, sortDirection }));
  };

  // Управление выбранными публикациями (множественный выбор)
  const handleSelectPublication = (id: number | string, isSelected: boolean) => {
    console.log("Нажатие на выбор публикации", id);
    
    // Преобразуем id в строку для выполнения сравнений
    const stringId = id.toString();
    
    // Если снимаем выбор с публикации
    if (!isSelected) {
      setSelectedPublications(prev => prev.filter(pub => 
        (pub.id !== undefined && pub.id.toString() !== stringId) && 
        (!pub.metadata?.scopusId || pub.metadata.scopusId.replace(/\D/g, '') !== stringId)
      ));
      return;
    }
    
    // Если выбираем публикацию - добавляем её к списку выбранных
    const publication = data?.data.find((pub: Publication) => 
      (pub.id !== undefined && pub.id.toString() === stringId) || 
      (pub.metadata?.scopusId && pub.metadata.scopusId.replace(/\D/g, '') === stringId)
    );
    
    if (publication) {
      setSelectedPublications(prev => [...prev, publication]);
    }
  };

  const handleRemoveSelected = (id: number | string) => {
    // Преобразуем id в строку для сравнения
    const stringId = id.toString();
    
    setSelectedPublications(prev => prev.filter(pub => {
      // Проверяем как обычный ID, так и Scopus ID
      const pubIdStr = pub.id?.toString() || '';
      const scopusIdStr = pub.metadata?.scopusId?.replace(/\D/g, '') || '';
      
      return pubIdStr !== stringId && scopusIdStr !== stringId;
    }));
  };

  const handleClearSelected = () => {
    setSelectedPublications([]);
  };

  // Вычисление общего количества страниц
  const totalPages = data ? Math.ceil(data.total / searchParams.limit) : 0;

  return (
    <div className="bg-neutral-50 min-h-screen">
      <Header />
      
      <main className="container mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Сайдбар с фильтрами */}
          <div className="lg:flex transition-all duration-300">
            <SearchPanel 
              onSearch={handleSearch} 
              currentPage={searchParams.page || 1}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
          
          {/* Основное содержимое */}
          <div className="flex-1">
            {/* Строка поиска над вкладками */}
            <div className="bg-white rounded-lg shadow-md p-4 mb-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-serif font-bold text-primary mr-4">Поиск публикаций</h2>
                
                {/* Пагинация рядом с заголовком */}
                {!isLoading && !isError && data?.data.length > 0 && data?.total > 0 && 
                  React.createElement(Pagination, {
                    currentPage: searchParams.page || 1,
                    totalPages: Math.ceil((data?.total || 0) / (searchParams.limit || 10)),
                    onPageChange: (page) => {
                      setSearchParams(prev => ({ ...prev, page, database: ["Scopus"] }));
                      handleSearch({ ...searchParams, page, database: ["Scopus"] });
                    }
                  })
                }
              </div>
              
              <div className="flex">
                <div className="relative flex-grow">
                  <Input 
                    type="text" 
                    placeholder="Введите запрос для поиска..." 
                    className="w-full"
                    value={searchParams.query || ""}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                      setSearchParams(prev => ({ ...prev, query: e.target.value, database: ["Scopus"] }))}
                    onKeyDown={(e: React.KeyboardEvent) => 
                      e.key === 'Enter' && handleSearch({...searchParams, database: ["Scopus"]})}
                  />
                </div>
                <Button 
                  variant="default"
                  className="ml-2 bg-primary hover:bg-primary-dark text-white flex items-center justify-center w-10 h-10 p-0"
                  onClick={() => handleSearch({...searchParams, database: ["Scopus"]})}
                >
                  <Search className="h-5 w-5" />
                </Button>
              </div>
            </div>
            
            <Tabs defaultValue="search" className="mt-0" id="external-search">
              <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger value="search" className="text-base">Результаты поиска</TabsTrigger>
                <TabsTrigger value="selected" className="text-base">
                  Выбранные публикации
                  {selectedPublications.length > 0 && (
                    <span className="ml-2 bg-primary text-white rounded-full px-2 py-0.5 text-xs">
                      {selectedPublications.length}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="search" className="mt-0">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                  <div className="mb-4 md:mb-0 flex items-center">
                    <h2 className="text-xl font-serif font-bold text-primary mr-4">Результаты поиска</h2>
                    
                    <p className="text-neutral-600 ml-4">
                      {isLoading ? "..." : data?.total || 0}
                    </p>
                  </div>
                  
                  <div className="flex items-center">
                    <span className="mr-2 text-neutral-700">Сортировать по:</span>
                    <Select value={sortBy} onValueChange={handleSortChange}>
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Сортировка" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="date-desc">Дате (сначала новые)</SelectItem>
                        <SelectItem value="date-asc">Дате (сначала старые)</SelectItem>
                        <SelectItem value="title">Названию</SelectItem>
                        <SelectItem value="authors">Автору</SelectItem>
                        <SelectItem value="university">Университету</SelectItem>
                        <SelectItem value="journal">Журналу</SelectItem>
                        <SelectItem value="category">Категории журнала</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {isLoading ? (
                  <div className="py-10 text-center text-neutral-500">Загрузка публикаций...</div>
                ) : isError ? (
                  <div className="py-10 text-center text-red-500">
                    Ошибка при загрузке публикаций. Пожалуйста, попробуйте позже.
                  </div>
                ) : data.data.length === 0 ? (
                  <div className="py-10 text-center text-neutral-500">
                    Публикации не найдены. Попробуйте изменить параметры поиска.
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                      {data.data.map((publication: Publication) => (
                        <PublicationCard 
                          key={`pub-${publication.metadata?.scopusId || publication.id || publication.title?.slice(0, 10)}`}
                          publication={publication}
                          isSelected={selectedPublications.some(p => 
                            // Проверяем обычный ID
                            (p.id !== undefined && publication.id !== undefined && p.id === publication.id) ||
                            // Проверяем Scopus ID если они существуют
                            (p.metadata?.scopusId && publication.metadata?.scopusId && 
                             p.metadata.scopusId.replace(/\D/g, '') === publication.metadata.scopusId.replace(/\D/g, ''))
                          )}
                          onSelect={handleSelectPublication}
                        />
                      ))}
                    </div>
                    
                    {/* Пагинация в конце страницы */}
                    <div className="flex justify-center mt-6 mb-4">
                      {!isLoading && !isError && data?.data.length > 0 && data?.total > 0 && 
                        React.createElement(Pagination, {
                          currentPage: searchParams.page || 1,
                          totalPages: Math.ceil((data?.total || 0) / (searchParams.limit || 10)),
                          onPageChange: (page) => {
                            setSearchParams(prev => ({ ...prev, page, database: ["Scopus"] }));
                            handleSearch({ ...searchParams, page, database: ["Scopus"] });
                          }
                        })
                      }
                    </div>
                  </>
                )}
              </TabsContent>
              
              <TabsContent value="selected" className="mt-0">
                <SelectedPublications 
                  publications={selectedPublications}
                  onRemove={handleRemoveSelected}
                  onClear={handleClearSelected}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
}
