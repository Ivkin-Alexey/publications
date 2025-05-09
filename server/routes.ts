import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  searchPublicationSchema, 
  insertPublicationSchema, 
  exportPublicationSchema,
  type SearchPublicationParams
} from "@shared/schema";
import multer from "multer";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { searchScopusPublications, getPublicationCitations, searchScopusAuthors } from "./services/scopusService";
import { searchJournals, findJournalQuartile } from "./services/journalQuartiles";

// Настройка multer для загрузки файлов
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // API для получения списка публикаций с фильтрацией и пагинацией
  app.get("/api/publications", async (req: Request, res: Response) => {
    try {
      const params: SearchPublicationParams = searchPublicationSchema.parse({
        query: req.query.query as string,
        author: req.query.author as string,
        university: req.query.university as string,
        yearFrom: req.query.yearFrom ? Number(req.query.yearFrom) : undefined,
        yearTo: req.query.yearTo ? Number(req.query.yearTo) : undefined,
        journal: req.query.journal as string,
        category: req.query.category as string,
        database: req.query.database 
          ? Array.isArray(req.query.database) 
            ? req.query.database as string[] 
            : [req.query.database as string]
          : undefined,
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 10,
        sortBy: req.query.sortBy as string,
        sortDirection: req.query.sortDirection as string,
      });

      // Проверяем, есть ли запрос на поиск в Scopus
      if (params.database && params.database.includes("Scopus")) {
        try {
          console.log("Redirecting search to Scopus API with query:", params.query);
          // Передаем параметры года в запрос к Scopus API
          const scopusResult = await searchScopusPublications(
            params.query || '', 
            params.page, 
            params.limit,
            params.sortBy,
            params.sortDirection,
            params.yearFrom,   // Добавляем параметр года
            params.yearTo      // Добавляем максимальный год
          );
          return res.json({
            data: scopusResult.publications,
            total: scopusResult.total,
            source: "Scopus API"
          });
        } catch (error) {
          console.error('Error searching Scopus:', error);
          // Если произошла ошибка при поиске в Scopus, продолжим поиск в локальном хранилище
          console.log('Falling back to local storage search...');
        }
      }

      const result = await storage.getPublications(params);
      res.json(result);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          message: fromZodError(error).message,
        });
      } else {
        res.status(500).json({
          message: "Внутренняя ошибка сервера",
        });
      }
    }
  });

  // API для получения одной публикации по ID
  app.get("/api/publications/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Некорректный ID публикации" });
      }

      const publication = await storage.getPublication(id);
      if (!publication) {
        return res.status(404).json({ message: "Публикация не найдена" });
      }

      res.json(publication);
    } catch (error) {
      res.status(500).json({ message: "Внутренняя ошибка сервера" });
    }
  });

  // API для создания новой публикации
  app.post("/api/publications", async (req: Request, res: Response) => {
    try {
      const publicationData = insertPublicationSchema.parse(req.body);
      const publication = await storage.createPublication(publicationData);
      res.status(201).json(publication);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          message: fromZodError(error).message,
        });
      } else {
        res.status(500).json({ message: "Внутренняя ошибка сервера" });
      }
    }
  });

  // API для обновления публикации
  app.put("/api/publications/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Некорректный ID публикации" });
      }

      const publicationData = insertPublicationSchema.partial().parse(req.body);
      const publication = await storage.updatePublication(id, publicationData);
      
      if (!publication) {
        return res.status(404).json({ message: "Публикация не найдена" });
      }

      res.json(publication);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          message: fromZodError(error).message,
        });
      } else {
        res.status(500).json({ message: "Внутренняя ошибка сервера" });
      }
    }
  });

  // API для удаления публикации
  app.delete("/api/publications/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Некорректный ID публикации" });
      }

      const success = await storage.deletePublication(id);
      if (!success) {
        return res.status(404).json({ message: "Публикация не найдена" });
      }

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Внутренняя ошибка сервера" });
    }
  });

  // API для получения списка публикаций по ID
  app.post("/api/publications/batch", async (req: Request, res: Response) => {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids)) {
        return res.status(400).json({ message: "Некорректный формат IDs" });
      }

      const publications = await storage.getPublicationsByIds(ids);
      res.json(publications);
    } catch (error) {
      res.status(500).json({ message: "Внутренняя ошибка сервера" });
    }
  });

  // API для загрузки и распознавания PDF файла
  app.post("/api/publications/pdf", upload.single("file"), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Файл не был загружен" });
      }

      // В реальном приложении здесь был бы код для извлечения метаданных из PDF
      // Для примера просто вернем заглушечные данные
      const extractedData = {
        title: "Автоматически распознанное название публикации",
        authors: "Иванов И.И., Петров П.П.",
        journal: "Журнал наук и технологий",
        year: new Date().getFullYear(),
        volume: "10",
        issue: "2",
        pages: "123-145",
        doi: "10.1234/example.2023.5678",
      };

      res.json(extractedData);
    } catch (error) {
      res.status(500).json({ message: "Ошибка при обработке PDF файла" });
    }
  });

  // API для экспорта публикаций
  app.post("/api/publications/export", async (req: Request, res: Response) => {
    try {
      const params = exportPublicationSchema.parse(req.body);
      const publications = await storage.getPublicationsByIds(params.ids);

      if (publications.length === 0) {
        return res.status(404).json({ message: "Публикации не найдены" });
      }

      // В реальном приложении здесь был бы код для формирования файла экспорта
      // Для MVP просто вернем информацию о том, что был сформирован экспорт
      res.json({ 
        message: "Экспорт выполнен успешно", 
        format: params.format,
        count: publications.length,
        includeAbstract: params.includeAbstract,
        includeDoi: params.includeDoi,
        includeCategories: params.includeCategories,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          message: fromZodError(error).message,
        });
      } else {
        res.status(500).json({ message: "Внутренняя ошибка сервера" });
      }
    }
  });
  
  // API для поиска публикаций в Scopus
  app.get("/api/scopus", async (req: Request, res: Response) => {
    try {
      const query = req.query.query as string;
      const author = req.query.author as string;
      const page = req.query.page ? Number(req.query.page) : 1;
      const limit = req.query.limit ? Number(req.query.limit) : 10;
      const yearFrom = req.query.yearFrom ? Number(req.query.yearFrom) : undefined;
      const yearTo = req.query.yearTo ? Number(req.query.yearTo) : undefined;
      const sortBy = req.query.sortBy as string || 'date';
      const sortDirection = req.query.sortDirection as string || 'desc';
      
      // Формирование поискового запроса с учетом автора
      let searchQuery = query || "";
      
      // Если указан автор, добавляем его в поисковый запрос
      if (author && author.trim()) {
        if (searchQuery) {
          // Если есть и автор, и основной запрос, объединяем их
          searchQuery = `${searchQuery} AND AUTHOR-NAME(${author})`;
        } else {
          // Если есть только автор, ищем по автору
          searchQuery = `AUTHOR-NAME(${author})`;
        }
      }
      
      // Проверяем, есть ли хоть какой-то параметр для поиска
      if ((!searchQuery || searchQuery.trim().length === 0) && 
          (!author || author.trim().length === 0) && 
          !yearFrom && !yearTo) {
        return res.status(400).json({ message: "Необходимо указать хотя бы один параметр поиска" });
      }
      
      // Передаем все параметры поиска, включая год
      const result = await searchScopusPublications(
        searchQuery, 
        page, 
        limit, 
        sortBy, 
        sortDirection,
        yearFrom,
        yearTo
      );
      
      res.json({
        data: result.publications,
        total: result.total,
        source: "Scopus API"
      });
    } catch (error) {
      console.error('Error searching Scopus:', error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Ошибка при поиске в Scopus API"
      });
    }
  });
  
  // API для поиска авторов в Scopus
  app.get("/api/scopus/authors", async (req: Request, res: Response) => {
    try {
      const query = req.query.query as string;
      
      if (!query || query.trim().length === 0) {
        return res.status(400).json({ message: "Поисковый запрос не должен быть пустым" });
      }
      
      const authors = await searchScopusAuthors(query);
      res.json({
        data: authors,
        total: authors.length,
        query: query
      });
    } catch (error) {
      console.error('Error searching Scopus authors:', error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Ошибка при поиске авторов в Scopus API"
      });
    }
  });

  // API для получения цитирований публикации из Scopus
  app.get("/api/scopus/citations/:id", async (req: Request, res: Response) => {
    try {
      const scopusId = req.params.id;
      
      if (!scopusId || scopusId.trim().length === 0) {
        return res.status(400).json({ message: "ID публикации не должен быть пустым" });
      }
      
      const citations = await getPublicationCitations(scopusId);
      res.json({
        data: citations,
        total: citations.length,
        scopusId: scopusId
      });
    } catch (error) {
      console.error('Error fetching citations:', error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Ошибка при получении цитирований из Scopus API"
      });
    }
  });

  // API для поиска журналов по названию
  app.get("/api/journals/search", async (req: Request, res: Response) => {
    try {
      const query = req.query.query as string;
      
      if (!query || query.trim().length < 2) {
        return res.status(400).json({ message: "Поисковый запрос должен содержать не менее 2 символов" });
      }
      
      const journals = searchJournals(query);
      res.json({
        data: journals,
        total: journals.length,
        query: query
      });
    } catch (error) {
      console.error('Error searching journals:', error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Ошибка при поиске журналов" 
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
