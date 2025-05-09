import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { X } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface ExportModalProps {
  onClose: () => void;
  publicationIds?: number[];
}

export default function ExportModal({ onClose, publicationIds = [] }: ExportModalProps) {
  const [format, setFormat] = useState("docx");
  const [includeAbstract, setIncludeAbstract] = useState(false);
  const [includeDoi, setIncludeDoi] = useState(true);
  const [includeCategories, setIncludeCategories] = useState(true);
  const { toast } = useToast();

  const exportMutation = useMutation({
    mutationFn: async (data: {
      ids: number[];
      format: string;
      includeAbstract: boolean;
      includeDoi: boolean;
      includeCategories: boolean;
    }) => {
      const response = await apiRequest("POST", "/api/publications/export", data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Экспорт выполнен",
        description: `${data.count} публикаций экспортировано в формате ${data.format}`,
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Ошибка экспорта",
        description: `Не удалось экспортировать публикации: ${error}`,
        variant: "destructive",
      });
    },
  });

  const handleExport = () => {
    const data = {
      ids: publicationIds,
      format,
      includeAbstract,
      includeDoi,
      includeCategories,
    };
    exportMutation.mutate(data);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle className="text-xl font-serif font-bold text-primary">Экспорт публикаций</DialogTitle>
            <Button variant="ghost" onClick={onClose} className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div>
            <h3 className="text-sm font-medium text-neutral-700 mb-2">Формат экспорта</h3>
            <RadioGroup value={format} onValueChange={setFormat} className="space-y-3">
              <div className="flex items-center">
                <RadioGroupItem value="docx" id="format-docx" />
                <Label htmlFor="format-docx" className="ml-2">Microsoft Word (.docx)</Label>
              </div>
              <div className="flex items-center">
                <RadioGroupItem value="pdf" id="format-pdf" />
                <Label htmlFor="format-pdf" className="ml-2">PDF (.pdf)</Label>
              </div>
              <div className="flex items-center">
                <RadioGroupItem value="bibtex" id="format-bibtex" />
                <Label htmlFor="format-bibtex" className="ml-2">BibTeX (.bib)</Label>
              </div>
              <div className="flex items-center">
                <RadioGroupItem value="txt" id="format-txt" />
                <Label htmlFor="format-txt" className="ml-2">Текстовый файл (.txt)</Label>
              </div>
            </RadioGroup>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-neutral-700 mb-2">Включить в экспорт</h3>
            <div className="space-y-2">
              <div className="flex items-center">
                <Checkbox 
                  id="include-abstract" 
                  checked={includeAbstract} 
                  onCheckedChange={(checked) => setIncludeAbstract(checked === true)}
                />
                <Label htmlFor="include-abstract" className="ml-2">Аннотации</Label>
              </div>
              <div className="flex items-center">
                <Checkbox 
                  id="include-doi" 
                  checked={includeDoi} 
                  onCheckedChange={(checked) => setIncludeDoi(checked === true)}
                />
                <Label htmlFor="include-doi" className="ml-2">DOI</Label>
              </div>
              <div className="flex items-center">
                <Checkbox 
                  id="include-categories" 
                  checked={includeCategories} 
                  onCheckedChange={(checked) => setIncludeCategories(checked === true)}
                />
                <Label htmlFor="include-categories" className="ml-2">Категории журналов</Label>
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={onClose}>
            Отмена
          </Button>
          <Button 
            type="button" 
            onClick={handleExport} 
            disabled={exportMutation.isPending || publicationIds.length === 0}
          >
            {exportMutation.isPending ? "Экспорт..." : "Экспортировать"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
