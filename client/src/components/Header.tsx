import { Button } from "@/components/ui/button";
import { BookOpen, Plus, Download } from "lucide-react";
import { useState } from "react";
import AddPublicationModal from "./AddPublicationModal";
import ExportModal from "./ExportModal";

export default function Header() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  return (
    <header className="bg-primary text-white shadow-md">
      <div className="container mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between">
        <div className="flex items-center mb-4 md:mb-0">
          <BookOpen className="h-6 w-6 mr-3" />
          <h1 className="text-2xl font-serif font-bold">Публикации ученого</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button 
            variant="accent" 
            className="bg-[#ED7D31] hover:bg-[#D26520] text-white"
            onClick={() => setIsAddModalOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Добавить публикацию
          </Button>
          <Button 
            variant="accent" 
            className="bg-[#ED7D31] hover:bg-[#D26520] text-white"
            onClick={() => setIsExportModalOpen(true)}
          >
            <Download className="mr-2 h-4 w-4" />
            Экспорт
          </Button>
        </div>
      
        {isAddModalOpen && <AddPublicationModal onClose={() => setIsAddModalOpen(false)} />}
        {isExportModalOpen && <ExportModal onClose={() => setIsExportModalOpen(false)} />}
      </div>
    </header>
  );
}
