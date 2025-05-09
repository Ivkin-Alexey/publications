import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Tabs, CustomTabsList, CustomTabsTrigger, CustomTabsContent } from "@/components/ui/tabs";
import { Upload, Edit, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertPublicationSchema, type InsertPublication } from "@shared/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Progress } from "@/components/ui/progress";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

interface AddPublicationModalProps {
  onClose: () => void;
}

export default function AddPublicationModal({ onClose }: AddPublicationModalProps) {
  const [activeTab, setActiveTab] = useState("upload");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [pdfData, setPdfData] = useState<Partial<InsertPublication> | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Форма для ручного ввода
  const form = useForm<InsertPublication>({
    resolver: zodResolver(insertPublicationSchema),
    defaultValues: {
      title: "",
      authors: "",
      journal: "",
      year: new Date().getFullYear(),
      type: "article",
    },
  });

  // Форма для данных из PDF
  const pdfForm = useForm<InsertPublication>({
    resolver: zodResolver(insertPublicationSchema),
    defaultValues: pdfData || {
      title: "",
      authors: "",
      journal: "",
      year: new Date().getFullYear(),
      type: "article",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertPublication) => {
      const response = await apiRequest("POST", "/api/publications", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Публикация добавлена",
        description: "Публикация успешно добавлена в вашу коллекцию",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/publications"] });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: `Не удалось добавить публикацию: ${error}`,
        variant: "destructive",
      });
    },
  });

  const handleUploadFile = async (file: File) => {
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append("file", file);

    try {
      // Имитация прогресса загрузки
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = prev + 10;
          if (newProgress >= 100) {
            clearInterval(interval);
            return 100;
          }
          return newProgress;
        });
      }, 300);

      const response = await apiRequest("POST", "/api/publications/pdf", formData);
      const data = await response.json();

      clearInterval(interval);
      setUploadProgress(100);
      
      // Заполняем форму полученными данными
      setPdfData(data);
      pdfForm.reset(data);
      
      toast({
        title: "PDF обработан",
        description: "Данные из PDF файла успешно распознаны",
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось обработать PDF файл",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      handleUploadFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      handleUploadFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const onManualSubmit = form.handleSubmit((data) => {
    createMutation.mutate(data);
  });

  const onPdfSubmit = pdfForm.handleSubmit((data) => {
    createMutation.mutate(data);
  });

  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-serif font-bold text-primary">Добавление публикации</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <CustomTabsList className="mb-6">
            <CustomTabsTrigger value="upload">
              <Upload className="h-4 w-4 mr-2" />Загрузка PDF
            </CustomTabsTrigger>
            <CustomTabsTrigger value="manual">
              <Edit className="h-4 w-4 mr-2" />Ручной ввод
            </CustomTabsTrigger>
          </CustomTabsList>

          <CustomTabsContent value="upload">
            {!pdfData ? (
              <>
                <div 
                  className="border-2 border-dashed border-neutral-300 rounded-lg p-8 text-center mb-6"
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                >
                  <Upload className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
                  <p className="mb-4 text-neutral-700">Перетащите PDF файл сюда или</p>
                  <Label 
                    htmlFor="pdf-upload" 
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition duration-200 cursor-pointer inline-block"
                  >
                    <span>Выберите файл</span>
                    <Input 
                      id="pdf-upload" 
                      type="file" 
                      accept=".pdf" 
                      className="hidden" 
                      onChange={handleFileChange}
                    />
                  </Label>
                </div>

                {isUploading && (
                  <div className="mb-6">
                    <Progress value={uploadProgress} className="h-4" />
                    <p className="text-sm text-neutral-600 mt-2">
                      Загрузка и обработка... {uploadProgress}%
                    </p>
                  </div>
                )}
              </>
            ) : (
              <Form {...pdfForm}>
                <form onSubmit={onPdfSubmit} className="space-y-4">
                  <h3 className="font-medium text-lg mb-3 text-primary">Распознанные данные</h3>
                  
                  <div className="bg-neutral-50 p-4 rounded-md space-y-4">
                    <FormField
                      control={pdfForm.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Название публикации</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={pdfForm.control}
                      name="authors"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Авторы</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={pdfForm.control}
                      name="journal"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Журнал</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={pdfForm.control}
                        name="volume"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Том</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={pdfForm.control}
                        name="issue"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Номер</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={pdfForm.control}
                        name="pages"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Страницы</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={pdfForm.control}
                        name="year"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Год</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                {...field} 
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={pdfForm.control}
                      name="doi"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>DOI</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={pdfForm.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Категория</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Выберите категорию" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Q1">Q1</SelectItem>
                              <SelectItem value="Q2">Q2</SelectItem>
                              <SelectItem value="Q1-Q2">Q1-Q2</SelectItem>
                              <SelectItem value="Q3">Q3</SelectItem>
                              <SelectItem value="Q4">Q4</SelectItem>
                              <SelectItem value="Q3-Q4">Q3-Q4</SelectItem>
                              <SelectItem value="ВАК">ВАК</SelectItem>
                              <SelectItem value="РИНЦ">РИНЦ</SelectItem>
                              <SelectItem value="Патент">Патенты</SelectItem>
                              <SelectItem value="Диссертация">Диссертации</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <DialogFooter>
                    <Button type="button" variant="secondary" onClick={onClose}>
                      Отмена
                    </Button>
                    <Button type="submit" disabled={createMutation.isPending}>
                      {createMutation.isPending ? "Сохранение..." : "Сохранить"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            )}
          </CustomTabsContent>

          <CustomTabsContent value="manual">
            <Form {...form}>
              <form onSubmit={onManualSubmit} className="space-y-4">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Тип публикации</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите тип публикации" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="article">Научная статья</SelectItem>
                          <SelectItem value="patent">Патент</SelectItem>
                          <SelectItem value="dissertation">Диссертация</SelectItem>
                          <SelectItem value="book">Книга</SelectItem>
                          <SelectItem value="conference">Материалы конференции</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Название публикации *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Введите название публикации" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="authors"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Авторы *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Фамилия И.О., Фамилия И.О." 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                      <p className="text-xs text-neutral-500 mt-1">
                        Укажите авторов через запятую, например: Иванов И.И., Петров П.П.
                      </p>
                    </FormItem>
                  )}
                />
                
                {form.watch("type") !== "patent" && form.watch("type") !== "dissertation" && (
                  <FormField
                    control={form.control}
                    name="journal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Издание *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Название журнала или другого издания" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="year"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Год *</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="Год публикации" 
                            {...field} 
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {form.watch("type") !== "patent" && form.watch("type") !== "dissertation" && (
                    <>
                      <FormField
                        control={form.control}
                        name="volume"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Том</FormLabel>
                            <FormControl>
                              <Input placeholder="Том издания" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="issue"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Номер</FormLabel>
                            <FormControl>
                              <Input placeholder="Номер издания" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {form.watch("type") !== "patent" && form.watch("type") !== "dissertation" && (
                    <FormField
                      control={form.control}
                      name="pages"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Страницы</FormLabel>
                          <FormControl>
                            <Input placeholder="Например: 123-145" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  
                  {form.watch("type") === "patent" && (
                    <FormField
                      control={form.control}
                      name="patentNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Номер патента</FormLabel>
                          <FormControl>
                            <Input placeholder="Например: RU2712345" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  
                  <FormField
                    control={form.control}
                    name="doi"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>DOI</FormLabel>
                        <FormControl>
                          <Input placeholder="10.xxxx/xxxxx" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Категория</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите категорию" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Q1">Q1</SelectItem>
                          <SelectItem value="Q2">Q2</SelectItem>
                          <SelectItem value="Q1-Q2">Q1-Q2</SelectItem>
                          <SelectItem value="Q3">Q3</SelectItem>
                          <SelectItem value="Q4">Q4</SelectItem>
                          <SelectItem value="Q3-Q4">Q3-Q4</SelectItem>
                          <SelectItem value="ВАК">ВАК</SelectItem>
                          <SelectItem value="РИНЦ">РИНЦ</SelectItem>
                          <SelectItem value="Патент">Патенты</SelectItem>
                          <SelectItem value="Диссертация">Диссертации</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="abstract"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Аннотация</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Краткое описание публикации" 
                          rows={3} 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button type="button" variant="secondary" onClick={onClose}>
                    Отмена
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Сохранение..." : "Сохранить"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </CustomTabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
