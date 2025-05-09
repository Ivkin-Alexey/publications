import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Book, FileText, ExternalLink, Loader2 } from "lucide-react";
import { Publication, PublicationMetadata } from "@shared/schema";

interface CitationsModalProps {
  publication: Publication;
  isOpen: boolean;
  onClose: () => void;
}

// Интерфейс для цитирования
interface Citation {
  title: string;
  authors: string;
  year: number;
  journal: string | null;
  doi: string | null;
  url: string | null;
}

export default function CitationsModal({ publication, isOpen, onClose }: CitationsModalProps) {
  // Получаем scopusId из метаданных публикации
  const scopusId = publication.metadata?.scopusId as string;
  
  // Запрос к API для получения цитирований
  const { data, isLoading, error } = useQuery<{data: Citation[], total: number}>({
    queryKey: ['/api/scopus/citations', scopusId],
    queryFn: async () => {
      if (!scopusId) return { data: [], total: 0 };
      const response = await fetch(`/api/scopus/citations/${encodeURIComponent(scopusId)}`);
      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }
      return response.json();
    },
    enabled: isOpen && !!scopusId, // Запрос выполняется только когда модальное окно открыто и есть ID публикации
  });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Цитирования публикации</DialogTitle>
          <DialogDescription className="text-base font-medium mt-1 text-primary">
            {publication.title}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex items-center gap-2 mt-2 mb-4">
          <Book className="h-5 w-5 text-primary" />
          <span className="text-sm text-gray-600">
            {publication.authors}, {publication.year}
          </span>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="p-4 text-center">
            <div className="text-red-500 mb-4">
              Ошибка при загрузке цитирований. Возможно, текущий API-ключ не имеет доступа к полной функциональности Scopus.
            </div>
            <div className="text-gray-600 text-sm">
              Для получения доступа к функции цитирований требуется расширенный API-ключ Scopus.
              <br />
              Вы можете посмотреть информацию о публикации и цитированиях напрямую через сайт Scopus.
            </div>
            {publication.metadata?.scopusId && (
              <div className="mt-4">
                <a 
                  href={`https://www.scopus.com/record/display.uri?eid=${publication.metadata.scopusId.replace('SCOPUS_ID:', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Посмотреть публикацию на сайте Scopus →
                </a>
              </div>
            )}
          </div>
        ) : !data || data.total === 0 ? (
          <div className="py-8 text-center text-gray-500">
            Цитирования не найдены для данной публикации.
          </div>
        ) : (
          <>
            <div className="mb-4">
              <h3 className="text-base font-semibold">
                Всего цитирований: <span className="text-primary">{data.total}</span>
              </h3>
            </div>
            
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Название</TableHead>
                    <TableHead>Авторы</TableHead>
                    <TableHead>Год</TableHead>
                    <TableHead>Журнал</TableHead>
                    <TableHead className="w-[100px]">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.data.map((citation, index) => (
                    <TableRow key={`${index}-${citation.title}`}>
                      <TableCell className="font-medium">{citation.title}</TableCell>
                      <TableCell>{citation.authors}</TableCell>
                      <TableCell>{citation.year}</TableCell>
                      <TableCell>{citation.journal}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {citation.doi && (
                            <a 
                              href={`https://doi.org/${citation.doi}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-500 hover:text-blue-700"
                            >
                              <FileText className="h-4 w-4" />
                            </a>
                          )}
                          {citation.url && (
                            <a 
                              href={citation.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-500 hover:text-blue-700"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
        
        <div className="flex justify-end mt-4">
          <Button onClick={onClose} variant="outline">
            Закрыть
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}