import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Eye, Quote } from "lucide-react";
import { getCategoryColorClass } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useState } from "react";
import { type Publication } from "@shared/schema";
import { formatPublicationGOST, copyToClipboard } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface PublicationCardProps {
  publication: Publication;
  isSelected: boolean;
  onSelect: (id: number | string, isSelected: boolean) => void;
}

export default function PublicationCard({ publication, isSelected, onSelect }: PublicationCardProps) {
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showCiteDialog, setShowCiteDialog] = useState(false);
  const [showAbstractDialog, setShowAbstractDialog] = useState(false);
  const { toast } = useToast();

  const handleCheckboxChange = (checked: boolean) => {
    // Получаем ID публикации из Scopus или обычный ID
    let pubId;
    
    if (publication.metadata?.scopusId) {
      // Для публикаций из Scopus используем числовую часть идентификатора
      pubId = publication.metadata.scopusId.replace(/\D/g, '');
    } else {
      // Для обычных публикаций используем числовой ID, преобразованный в строку
      pubId = (publication.id || Math.floor(Math.random() * 10000)).toString();
    }
    
    console.log("Выбрана публикация:", pubId, checked);
    
    // Вызываем функцию выбора с ID публикации и статусом чекбокса
    onSelect(pubId, checked);
  };

  const handleCopy = async () => {
    const text = formatPublicationGOST(publication);
    const success = await copyToClipboard(text);
    
    toast({
      title: success ? 'Скопировано!' : 'Ошибка копирования',
      description: success ? 'Цитирование скопировано в буфер обмена' : 'Не удалось скопировать текст',
      variant: success ? 'default' : 'destructive',
    });
  };

  const categoryColor = getCategoryColorClass(publication.category || '');

  return (
    <>
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-5">
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1 pr-4">
              <button 
                className="text-lg font-medium text-primary mb-0 text-left hover:text-primary-dark flex items-center cursor-pointer w-full"
                onClick={() => publication.abstract ? setShowAbstractDialog(true) : null}
                title={publication.abstract ? "Нажмите, чтобы посмотреть аннотацию" : ""}
              >
                <span className={`${publication.abstract ? 'hover:underline border-b border-dotted border-gray-300' : ''}`}>
                  {publication.title}
                </span>

              </button>
            </div>
            <div className="flex items-center">
              <Checkbox 
                id={`select-publication-${publication.id || publication.title?.slice(0, 10)}`}
                className="h-5 w-5 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground cursor-pointer border-2 mt-0.5 ml-2" 
                checked={isSelected}
                onCheckedChange={handleCheckboxChange}
              />
            </div>
          </div>
          
          <div className="mb-3 text-sm text-neutral-700">
            <span className="font-medium">Авторы:</span> {publication.authors}
          </div>
          
          {publication.journal && (
            <div className="mb-3 text-sm text-neutral-700">
              <span className="font-medium">Журнал:</span> {publication.journal}
            </div>
          )}
          
          {publication.type === 'patent' && publication.patentNumber && (
            <div className="mb-3 text-sm text-neutral-700">
              <span className="font-medium">№ патента:</span> {publication.patentNumber}
            </div>
          )}
          
          <div className="flex flex-wrap mb-3 gap-2">
            {publication.category && (
              <Badge className={`${categoryColor.bg} ${categoryColor.text}`}>
                {publication.category}
              </Badge>
            )}
            <Badge variant="neutral">{publication.year}</Badge>
            {publication.database?.split(',').map((db) => (
              <Badge key={`db-${publication.id || publication.title?.slice(0, 10)}-${db.trim()}`} variant="neutral">{db.trim()}</Badge>
            ))}
          </div>
          
          {publication.doi && (
            <div className="mb-3 text-sm text-neutral-700 flex">
              <span className="font-medium mr-2">DOI:</span>
              <a 
                href={`https://doi.org/${publication.doi}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-neutral-900 hover:underline"
              >
                {publication.doi}
              </a>
            </div>
          )}
          
          <div className="flex justify-end flex-wrap gap-2">
            {/* Кнопка цитирований удалена по запросу */}
          </div>
        </div>
      </div>

      {/* Диалог просмотра публикации */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{publication.title}</DialogTitle>
            <DialogDescription>
              {publication.authors}, {publication.year}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 my-6">
            {publication.abstract && (
              <div>
                <h4 className="font-medium text-primary">Аннотация</h4>
                <p className="text-sm text-neutral-700 mt-1">{publication.abstract}</p>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              {publication.journal && (
                <div>
                  <h4 className="font-medium text-primary">Журнал</h4>
                  <p className="text-sm text-neutral-700 mt-1">{publication.journal}</p>
                </div>
              )}
              
              <div>
                <h4 className="font-medium text-primary">Год</h4>
                <p className="text-sm text-neutral-700 mt-1">{publication.year}</p>
              </div>
              
              {publication.volume && (
                <div>
                  <h4 className="font-medium text-primary">Том</h4>
                  <p className="text-sm text-neutral-700 mt-1">{publication.volume}</p>
                </div>
              )}
              
              {publication.issue && (
                <div>
                  <h4 className="font-medium text-primary">Номер</h4>
                  <p className="text-sm text-neutral-700 mt-1">{publication.issue}</p>
                </div>
              )}
              
              {publication.pages && (
                <div>
                  <h4 className="font-medium text-primary">Страницы</h4>
                  <p className="text-sm text-neutral-700 mt-1">{publication.pages}</p>
                </div>
              )}
              
              {publication.doi && (
                <div>
                  <h4 className="font-medium text-primary">DOI</h4>
                  <p className="text-sm text-neutral-700 mt-1">
                    <a 
                      href={`https://doi.org/${publication.doi}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-neutral-900 hover:underline"
                    >
                      {publication.doi}
                    </a>
                  </p>
                </div>
              )}
            </div>
            
            {publication.url && (
              <div>
                <h4 className="font-medium text-primary">URL</h4>
                <p className="text-sm text-neutral-700 mt-1">
                  <a 
                    href={publication.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-secondary hover:underline break-all"
                  >
                    {publication.url}
                  </a>
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Диалог цитирования */}
      <Dialog open={showCiteDialog} onOpenChange={setShowCiteDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Цитирование по ГОСТ Р 7.0.100-2018</DialogTitle>
            <DialogDescription>
              Вы можете скопировать готовое цитирование
            </DialogDescription>
          </DialogHeader>
          
          <div className="my-6">
            <div className="bg-neutral-50 p-4 rounded-md font-mono text-sm">
              {formatPublicationGOST(publication)}
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button className="bg-blue-500 hover:bg-blue-600 text-white" onClick={handleCopy}>
              Копировать
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Диалог с аннотацией */}
      {publication.abstract && (
        <Dialog open={showAbstractDialog} onOpenChange={setShowAbstractDialog}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="text-xl text-primary">Аннотация</DialogTitle>

            </DialogHeader>
            
            <div className="my-6 bg-gray-50 p-4 rounded-md border border-gray-100">
              <p className="text-base leading-relaxed text-neutral-700">{publication.abstract}</p>
            </div>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Диалог с цитированиями удален */}
    </>
  );
}
