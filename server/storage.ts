import { publications, type Publication, type InsertPublication, type SearchPublicationParams } from "@shared/schema";
import { nanoid } from "nanoid";

export interface IStorage {
  getPublication(id: number): Promise<Publication | undefined>;
  getPublications(params: SearchPublicationParams): Promise<{ data: Publication[], total: number }>;
  createPublication(publication: InsertPublication): Promise<Publication>;
  updatePublication(id: number, publication: Partial<InsertPublication>): Promise<Publication | undefined>;
  deletePublication(id: number): Promise<boolean>;
  getPublicationsByIds(ids: number[]): Promise<Publication[]>;
}

export class MemStorage implements IStorage {
  private publications: Map<number, Publication>;
  currentId: number;

  constructor() {
    this.publications = new Map();
    this.currentId = 1;
    
    // Для демонстрации создадим несколько публикаций
    const demoPublications: InsertPublication[] = [
      {
        title: "Влияние нанотехнологий на молекулярную структуру полимеров",
        authors: "Иванов И.И., Петров П.П., Сидоров С.С.",
        university: "Московский государственный университет",
        journal: "Вестник нанотехнологий",
        year: 2022,
        volume: "5",
        issue: "2",
        pages: "34-45",
        doi: "10.1234/abcd.2022.1234",
        category: "Q1",
        type: "article",
        database: "Scopus",
        url: "https://example.com/article1",
        abstract: "В данной статье рассматривается влияние нанотехнологий на молекулярную структуру полимеров.",
      },
      {
        title: "Методы анализа больших данных в биоинформатике",
        authors: "Смирнов А.А., Иванов И.И.",
        university: "Санкт-Петербургский политехнический университет",
        journal: "Биоинформатика и геномика",
        year: 2021,
        volume: "12",
        issue: "3",
        pages: "45-58",
        doi: "10.5678/efgh.2021.5678",
        category: "Q2",
        type: "article",
        database: "Scopus, ВАК",
        url: "https://example.com/article2",
        abstract: "Статья посвящена методам анализа больших данных в биоинформатике.",
      },
      {
        title: "Разработка метода автоматизированного анализа медицинских изображений",
        authors: "Петров П.П., Сидоров С.С.",
        university: "Новосибирский государственный университет",
        journal: "Медицинская информатика",
        year: 2023,
        volume: "8",
        issue: "1",
        pages: "12-23",
        doi: "10.9012/ijkl.2023.9012",
        category: "Q3",
        type: "article",
        database: "eLIBRARY",
        url: "https://example.com/article3",
        abstract: "В работе представлен метод автоматизированного анализа медицинских изображений.",
      },
      {
        title: "Способ получения биоразлагаемых композитных материалов",
        authors: "Кузнецов А.В., Иванов И.И.",
        university: "Казанский федеральный университет",
        year: 2022,
        patentNumber: "RU2712345",
        category: "Патент",
        type: "patent",
        url: "https://example.com/patent1",
        abstract: "Патент описывает способ получения биоразлагаемых композитных материалов.",
      }
    ];
    
    demoPublications.forEach(pub => this.createPublication(pub));
  }

  async getPublication(id: number): Promise<Publication | undefined> {
    return this.publications.get(id);
  }

  async getPublications(params: SearchPublicationParams): Promise<{ data: Publication[], total: number }> {
    let filtered = Array.from(this.publications.values());
    
    // Фильтрация по запросу
    if (params.query) {
      const query = params.query.toLowerCase();
      filtered = filtered.filter(pub => 
        pub.title.toLowerCase().includes(query) || 
        pub.authors.toLowerCase().includes(query) ||
        (pub.journal && pub.journal.toLowerCase().includes(query)) ||
        (pub.university && pub.university.toLowerCase().includes(query))
      );
    }
    
    // Фильтрация по автору
    if (params.author) {
      const author = params.author.toLowerCase();
      filtered = filtered.filter(pub => pub.authors.toLowerCase().includes(author));
    }
    
    // Фильтрация по университету
    if (params.university) {
      const university = params.university.toLowerCase();
      filtered = filtered.filter(pub => pub.university && pub.university.toLowerCase().includes(university));
    }
    
    // Фильтрация по годам
    if (params.yearFrom) {
      filtered = filtered.filter(pub => pub.year >= params.yearFrom!);
    }
    if (params.yearTo) {
      filtered = filtered.filter(pub => pub.year <= params.yearTo!);
    }
    
    // Фильтрация по журналу
    if (params.journal) {
      const journal = params.journal.toLowerCase();
      filtered = filtered.filter(pub => pub.journal && pub.journal.toLowerCase().includes(journal));
    }
    
    // Фильтрация по категории
    if (params.category) {
      const category = params.category.toLowerCase();
      filtered = filtered.filter(pub => pub.category && pub.category.toLowerCase().includes(category));
    }
    
    // Фильтрация по базе данных
    if (params.database && params.database.length > 0) {
      filtered = filtered.filter(pub => {
        if (!pub.database) return false;
        
        for (const db of params.database!) {
          if (pub.database.toLowerCase().includes(db.toLowerCase())) {
            return true;
          }
        }
        return false;
      });
    }
    
    // Сортировка
    const sortBy = params.sortBy || 'year';
    const sortDirection = params.sortDirection || 'desc';
    
    filtered.sort((a, b) => {
      if (sortBy === 'year') {
        return sortDirection === 'asc' ? a.year - b.year : b.year - a.year;
      } else if (sortBy === 'date-asc') {
        return a.year - b.year;
      } else if (sortBy === 'date-desc') {
        return b.year - a.year;
      } else if (sortBy === 'title') {
        return sortDirection === 'asc' 
          ? a.title.localeCompare(b.title) 
          : b.title.localeCompare(a.title);
      } else if (sortBy === 'journal') {
        const journalA = a.journal || '';
        const journalB = b.journal || '';
        return sortDirection === 'asc' 
          ? journalA.localeCompare(journalB) 
          : journalB.localeCompare(journalA);
      } else if (sortBy === 'authors') {
        const authorsA = a.authors || '';
        const authorsB = b.authors || '';
        return sortDirection === 'asc' 
          ? authorsA.localeCompare(authorsB) 
          : authorsB.localeCompare(authorsA);
      } else if (sortBy === 'university') {
        const universityA = a.university || '';
        const universityB = b.university || '';
        return sortDirection === 'asc' 
          ? universityA.localeCompare(universityB) 
          : universityB.localeCompare(universityA);
      } else if (sortBy === 'category') {
        const categoryA = a.category || '';
        const categoryB = b.category || '';
        return sortDirection === 'asc' 
          ? categoryA.localeCompare(categoryB) 
          : categoryB.localeCompare(categoryA);
      }
      return 0;
    });
    
    const total = filtered.length;
    
    // Пагинация
    const page = params.page || 1;
    const limit = params.limit || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    const data = filtered.slice(startIndex, endIndex);
    
    return { data, total };
  }

  async createPublication(insertPublication: InsertPublication): Promise<Publication> {
    const id = this.currentId++;
    const now = new Date().toISOString();
    const publication: Publication = { 
      ...insertPublication, 
      id, 
      createdAt: now,
    };
    this.publications.set(id, publication);
    return publication;
  }

  async updatePublication(id: number, publication: Partial<InsertPublication>): Promise<Publication | undefined> {
    const existing = this.publications.get(id);
    if (!existing) return undefined;
    
    const updated: Publication = { ...existing, ...publication };
    this.publications.set(id, updated);
    return updated;
  }

  async deletePublication(id: number): Promise<boolean> {
    return this.publications.delete(id);
  }

  async getPublicationsByIds(ids: number[]): Promise<Publication[]> {
    return ids
      .map(id => this.publications.get(id))
      .filter((pub): pub is Publication => pub !== undefined);
  }
}

export const storage = new MemStorage();
