import { Button } from "@/components/ui/button";
import { Trash, Copy, Download } from "lucide-react";
import { type Publication } from "@shared/schema";
import { formatPublicationGOST, copyToClipboard } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import ExportModal from "./ExportModal";

interface SelectedPublicationsProps {
  publications: Publication[];
  onRemove: (id: number | string) => void;
  onClear: () => void;
}

export default function SelectedPublications({ 
  publications,
  onRemove,
  onClear
}: SelectedPublicationsProps) {
  const { toast } = useToast();
  const [showExportModal, setShowExportModal] = useState(false);

  const handleCopyAll = async () => {
    const text = publications.map(pub => formatPublicationGOST(pub)).join('\n\n');
    const success = await copyToClipboard(text);
    
    toast({
      title: success ? 'Скопировано!' : 'Ошибка копирования',
      description: success ? 'Список публикаций скопирован в буфер обмена' : 'Не удалось скопировать текст',
      variant: success ? 'default' : 'destructive',
    });
  };

  if (publications.length === 0) {
    return (
      <section className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-serif font-bold text-primary mb-4">Выбранные публикации</h2>
        <p className="text-neutral-500 italic">Нет выбранных публикаций</p>
      </section>
    );
  }

  return (
    <section className="bg-white p-6 rounded-lg shadow-md mb-8">
      <h2 className="text-xl font-serif font-bold text-primary mb-4">Выбранные публикации</h2>
      
      <div className="mb-4">
        {publications.map(publication => {
          // Определяем ID для ключа и для функции удаления
          const pubKey = publication.metadata?.scopusId || publication.id || publication.title?.slice(0, 10);
          const pubId = publication.id || (publication.metadata?.scopusId ? publication.metadata.scopusId.replace(/\D/g, '') : null);
          
          return (
            <div key={`selected-${pubKey}`} className="border-b border-neutral-200 pb-3 mb-3">
              <div className="mb-2 text-sm leading-relaxed bg-neutral-50 p-3 rounded">
                {formatPublicationGOST(publication)}
              </div>
              <div className="flex justify-end">
                <Button 
                  variant="ghost" 
                  className="text-red-500 hover:text-red-700 text-sm"
                  onClick={() => pubId && onRemove(pubId)}
                >
                  <Trash className="h-4 w-4 mr-1" />
                  Удалить
                </Button>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="flex justify-between items-center">
        <div>
          <span className="text-neutral-700">Выбрано публикаций: {publications.length}</span>
        </div>
        <div className="flex space-x-3">
          <Button 
            variant="ghost" 
            className="text-red-500 hover:text-red-700 flex items-center"
            onClick={onClear}
          >
            <Trash className="h-4 w-4 mr-2" />
            Очистить
          </Button>
          <Button 
            className="bg-blue-500 hover:bg-blue-600 text-white"
            onClick={handleCopyAll}
          >
            <Copy className="h-4 w-4 mr-2" />
            Копировать
          </Button>
          <Button 
            variant="default" 
            className="bg-[#ED7D31] hover:bg-[#D26520] text-white"
            onClick={() => setShowExportModal(true)}
          >
            <Download className="h-4 w-4 mr-2" />
            Экспорт
          </Button>
        </div>
      </div>

      {showExportModal && (
        <ExportModal 
          onClose={() => setShowExportModal(false)} 
          publicationIds={publications.map(p => 
            typeof p.id === 'number' ? p.id : undefined
          ).filter((id): id is number => id !== undefined)} 
        />
      )}
    </section>
  );
}
