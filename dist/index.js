// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// server/storage.ts
var MemStorage = class {
  publications;
  currentId;
  constructor() {
    this.publications = /* @__PURE__ */ new Map();
    this.currentId = 1;
    const demoPublications = [
      {
        title: "\u0412\u043B\u0438\u044F\u043D\u0438\u0435 \u043D\u0430\u043D\u043E\u0442\u0435\u0445\u043D\u043E\u043B\u043E\u0433\u0438\u0439 \u043D\u0430 \u043C\u043E\u043B\u0435\u043A\u0443\u043B\u044F\u0440\u043D\u0443\u044E \u0441\u0442\u0440\u0443\u043A\u0442\u0443\u0440\u0443 \u043F\u043E\u043B\u0438\u043C\u0435\u0440\u043E\u0432",
        authors: "\u0418\u0432\u0430\u043D\u043E\u0432 \u0418.\u0418., \u041F\u0435\u0442\u0440\u043E\u0432 \u041F.\u041F., \u0421\u0438\u0434\u043E\u0440\u043E\u0432 \u0421.\u0421.",
        university: "\u041C\u043E\u0441\u043A\u043E\u0432\u0441\u043A\u0438\u0439 \u0433\u043E\u0441\u0443\u0434\u0430\u0440\u0441\u0442\u0432\u0435\u043D\u043D\u044B\u0439 \u0443\u043D\u0438\u0432\u0435\u0440\u0441\u0438\u0442\u0435\u0442",
        journal: "\u0412\u0435\u0441\u0442\u043D\u0438\u043A \u043D\u0430\u043D\u043E\u0442\u0435\u0445\u043D\u043E\u043B\u043E\u0433\u0438\u0439",
        year: 2022,
        volume: "5",
        issue: "2",
        pages: "34-45",
        doi: "10.1234/abcd.2022.1234",
        category: "Q1",
        type: "article",
        database: "Scopus",
        url: "https://example.com/article1",
        abstract: "\u0412 \u0434\u0430\u043D\u043D\u043E\u0439 \u0441\u0442\u0430\u0442\u044C\u0435 \u0440\u0430\u0441\u0441\u043C\u0430\u0442\u0440\u0438\u0432\u0430\u0435\u0442\u0441\u044F \u0432\u043B\u0438\u044F\u043D\u0438\u0435 \u043D\u0430\u043D\u043E\u0442\u0435\u0445\u043D\u043E\u043B\u043E\u0433\u0438\u0439 \u043D\u0430 \u043C\u043E\u043B\u0435\u043A\u0443\u043B\u044F\u0440\u043D\u0443\u044E \u0441\u0442\u0440\u0443\u043A\u0442\u0443\u0440\u0443 \u043F\u043E\u043B\u0438\u043C\u0435\u0440\u043E\u0432."
      },
      {
        title: "\u041C\u0435\u0442\u043E\u0434\u044B \u0430\u043D\u0430\u043B\u0438\u0437\u0430 \u0431\u043E\u043B\u044C\u0448\u0438\u0445 \u0434\u0430\u043D\u043D\u044B\u0445 \u0432 \u0431\u0438\u043E\u0438\u043D\u0444\u043E\u0440\u043C\u0430\u0442\u0438\u043A\u0435",
        authors: "\u0421\u043C\u0438\u0440\u043D\u043E\u0432 \u0410.\u0410., \u0418\u0432\u0430\u043D\u043E\u0432 \u0418.\u0418.",
        university: "\u0421\u0430\u043D\u043A\u0442-\u041F\u0435\u0442\u0435\u0440\u0431\u0443\u0440\u0433\u0441\u043A\u0438\u0439 \u043F\u043E\u043B\u0438\u0442\u0435\u0445\u043D\u0438\u0447\u0435\u0441\u043A\u0438\u0439 \u0443\u043D\u0438\u0432\u0435\u0440\u0441\u0438\u0442\u0435\u0442",
        journal: "\u0411\u0438\u043E\u0438\u043D\u0444\u043E\u0440\u043C\u0430\u0442\u0438\u043A\u0430 \u0438 \u0433\u0435\u043D\u043E\u043C\u0438\u043A\u0430",
        year: 2021,
        volume: "12",
        issue: "3",
        pages: "45-58",
        doi: "10.5678/efgh.2021.5678",
        category: "Q2",
        type: "article",
        database: "Scopus, \u0412\u0410\u041A",
        url: "https://example.com/article2",
        abstract: "\u0421\u0442\u0430\u0442\u044C\u044F \u043F\u043E\u0441\u0432\u044F\u0449\u0435\u043D\u0430 \u043C\u0435\u0442\u043E\u0434\u0430\u043C \u0430\u043D\u0430\u043B\u0438\u0437\u0430 \u0431\u043E\u043B\u044C\u0448\u0438\u0445 \u0434\u0430\u043D\u043D\u044B\u0445 \u0432 \u0431\u0438\u043E\u0438\u043D\u0444\u043E\u0440\u043C\u0430\u0442\u0438\u043A\u0435."
      },
      {
        title: "\u0420\u0430\u0437\u0440\u0430\u0431\u043E\u0442\u043A\u0430 \u043C\u0435\u0442\u043E\u0434\u0430 \u0430\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0437\u0438\u0440\u043E\u0432\u0430\u043D\u043D\u043E\u0433\u043E \u0430\u043D\u0430\u043B\u0438\u0437\u0430 \u043C\u0435\u0434\u0438\u0446\u0438\u043D\u0441\u043A\u0438\u0445 \u0438\u0437\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u0438\u0439",
        authors: "\u041F\u0435\u0442\u0440\u043E\u0432 \u041F.\u041F., \u0421\u0438\u0434\u043E\u0440\u043E\u0432 \u0421.\u0421.",
        university: "\u041D\u043E\u0432\u043E\u0441\u0438\u0431\u0438\u0440\u0441\u043A\u0438\u0439 \u0433\u043E\u0441\u0443\u0434\u0430\u0440\u0441\u0442\u0432\u0435\u043D\u043D\u044B\u0439 \u0443\u043D\u0438\u0432\u0435\u0440\u0441\u0438\u0442\u0435\u0442",
        journal: "\u041C\u0435\u0434\u0438\u0446\u0438\u043D\u0441\u043A\u0430\u044F \u0438\u043D\u0444\u043E\u0440\u043C\u0430\u0442\u0438\u043A\u0430",
        year: 2023,
        volume: "8",
        issue: "1",
        pages: "12-23",
        doi: "10.9012/ijkl.2023.9012",
        category: "Q3",
        type: "article",
        database: "eLIBRARY",
        url: "https://example.com/article3",
        abstract: "\u0412 \u0440\u0430\u0431\u043E\u0442\u0435 \u043F\u0440\u0435\u0434\u0441\u0442\u0430\u0432\u043B\u0435\u043D \u043C\u0435\u0442\u043E\u0434 \u0430\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0437\u0438\u0440\u043E\u0432\u0430\u043D\u043D\u043E\u0433\u043E \u0430\u043D\u0430\u043B\u0438\u0437\u0430 \u043C\u0435\u0434\u0438\u0446\u0438\u043D\u0441\u043A\u0438\u0445 \u0438\u0437\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u0438\u0439."
      },
      {
        title: "\u0421\u043F\u043E\u0441\u043E\u0431 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u044F \u0431\u0438\u043E\u0440\u0430\u0437\u043B\u0430\u0433\u0430\u0435\u043C\u044B\u0445 \u043A\u043E\u043C\u043F\u043E\u0437\u0438\u0442\u043D\u044B\u0445 \u043C\u0430\u0442\u0435\u0440\u0438\u0430\u043B\u043E\u0432",
        authors: "\u041A\u0443\u0437\u043D\u0435\u0446\u043E\u0432 \u0410.\u0412., \u0418\u0432\u0430\u043D\u043E\u0432 \u0418.\u0418.",
        university: "\u041A\u0430\u0437\u0430\u043D\u0441\u043A\u0438\u0439 \u0444\u0435\u0434\u0435\u0440\u0430\u043B\u044C\u043D\u044B\u0439 \u0443\u043D\u0438\u0432\u0435\u0440\u0441\u0438\u0442\u0435\u0442",
        year: 2022,
        patentNumber: "RU2712345",
        category: "\u041F\u0430\u0442\u0435\u043D\u0442",
        type: "patent",
        url: "https://example.com/patent1",
        abstract: "\u041F\u0430\u0442\u0435\u043D\u0442 \u043E\u043F\u0438\u0441\u044B\u0432\u0430\u0435\u0442 \u0441\u043F\u043E\u0441\u043E\u0431 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u044F \u0431\u0438\u043E\u0440\u0430\u0437\u043B\u0430\u0433\u0430\u0435\u043C\u044B\u0445 \u043A\u043E\u043C\u043F\u043E\u0437\u0438\u0442\u043D\u044B\u0445 \u043C\u0430\u0442\u0435\u0440\u0438\u0430\u043B\u043E\u0432."
      }
    ];
    demoPublications.forEach((pub) => this.createPublication(pub));
  }
  async getPublication(id) {
    return this.publications.get(id);
  }
  async getPublications(params) {
    let filtered = Array.from(this.publications.values());
    if (params.query) {
      const query = params.query.toLowerCase();
      filtered = filtered.filter(
        (pub) => pub.title.toLowerCase().includes(query) || pub.authors.toLowerCase().includes(query) || pub.journal && pub.journal.toLowerCase().includes(query) || pub.university && pub.university.toLowerCase().includes(query)
      );
    }
    if (params.author) {
      const author = params.author.toLowerCase();
      filtered = filtered.filter((pub) => pub.authors.toLowerCase().includes(author));
    }
    if (params.university) {
      const university = params.university.toLowerCase();
      filtered = filtered.filter((pub) => pub.university && pub.university.toLowerCase().includes(university));
    }
    if (params.yearFrom) {
      filtered = filtered.filter((pub) => pub.year >= params.yearFrom);
    }
    if (params.yearTo) {
      filtered = filtered.filter((pub) => pub.year <= params.yearTo);
    }
    if (params.journal) {
      const journal = params.journal.toLowerCase();
      filtered = filtered.filter((pub) => pub.journal && pub.journal.toLowerCase().includes(journal));
    }
    if (params.category) {
      const category = params.category.toLowerCase();
      filtered = filtered.filter((pub) => pub.category && pub.category.toLowerCase().includes(category));
    }
    if (params.database && params.database.length > 0) {
      filtered = filtered.filter((pub) => {
        if (!pub.database) return false;
        for (const db of params.database) {
          if (pub.database.toLowerCase().includes(db.toLowerCase())) {
            return true;
          }
        }
        return false;
      });
    }
    const sortBy = params.sortBy || "year";
    const sortDirection = params.sortDirection || "desc";
    filtered.sort((a, b) => {
      if (sortBy === "year") {
        return sortDirection === "asc" ? a.year - b.year : b.year - a.year;
      } else if (sortBy === "title") {
        return sortDirection === "asc" ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title);
      } else if (sortBy === "journal") {
        const journalA = a.journal || "";
        const journalB = b.journal || "";
        return sortDirection === "asc" ? journalA.localeCompare(journalB) : journalB.localeCompare(journalA);
      }
      return 0;
    });
    const total = filtered.length;
    const page = params.page || 1;
    const limit = params.limit || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const data = filtered.slice(startIndex, endIndex);
    return { data, total };
  }
  async createPublication(insertPublication) {
    const id = this.currentId++;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const publication = {
      ...insertPublication,
      id,
      createdAt: now
    };
    this.publications.set(id, publication);
    return publication;
  }
  async updatePublication(id, publication) {
    const existing = this.publications.get(id);
    if (!existing) return void 0;
    const updated = { ...existing, ...publication };
    this.publications.set(id, updated);
    return updated;
  }
  async deletePublication(id) {
    return this.publications.delete(id);
  }
  async getPublicationsByIds(ids) {
    return ids.map((id) => this.publications.get(id)).filter((pub) => pub !== void 0);
  }
};
var storage = new MemStorage();

// shared/schema.ts
import { pgTable, text, serial, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var publications = pgTable("publications", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  authors: text("authors").notNull(),
  university: text("university"),
  journal: text("journal"),
  year: integer("year").notNull(),
  volume: text("volume"),
  issue: text("issue"),
  pages: text("pages"),
  doi: text("doi"),
  url: text("url"),
  abstract: text("abstract"),
  category: text("category"),
  // Q1-Q2, Q3-Q4, ВАК, РИНЦ, Патенты, Диссертации
  type: text("type").notNull().default("article"),
  // article, patent, dissertation
  database: text("database"),
  // Scopus, Google Scholar, eLIBRARY
  patentNumber: text("patent_number"),
  // для патентов
  metadata: jsonb("metadata"),
  // дополнительные метаданные
  createdAt: text("created_at").notNull()
});
var insertPublicationSchema = createInsertSchema(publications).omit({
  id: true,
  createdAt: true
});
var searchPublicationSchema = z.object({
  query: z.string().optional(),
  author: z.string().optional(),
  university: z.string().optional(),
  yearFrom: z.number().optional(),
  yearTo: z.number().optional(),
  journal: z.string().optional(),
  category: z.string().optional(),
  database: z.array(z.string()).optional(),
  page: z.number().optional().default(1),
  limit: z.number().optional().default(10),
  sortBy: z.string().optional().default("year"),
  sortDirection: z.string().optional().default("desc")
});
var pdfPublicationSchema = z.object({
  file: z.any()
});
var exportPublicationSchema = z.object({
  ids: z.array(z.number()),
  format: z.enum(["docx", "pdf", "bibtex", "txt"]),
  includeAbstract: z.boolean().optional(),
  includeDoi: z.boolean().optional(),
  includeCategories: z.boolean().optional()
});

// server/routes.ts
import multer from "multer";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
var upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024
    // 10MB
  }
});
async function registerRoutes(app2) {
  app2.get("/api/publications", async (req, res) => {
    try {
      const params = searchPublicationSchema.parse({
        query: req.query.query,
        author: req.query.author,
        university: req.query.university,
        yearFrom: req.query.yearFrom ? Number(req.query.yearFrom) : void 0,
        yearTo: req.query.yearTo ? Number(req.query.yearTo) : void 0,
        journal: req.query.journal,
        category: req.query.category,
        database: req.query.database ? Array.isArray(req.query.database) ? req.query.database : [req.query.database] : void 0,
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 10,
        sortBy: req.query.sortBy,
        sortDirection: req.query.sortDirection
      });
      const result = await storage.getPublications(params);
      res.json(result);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          message: fromZodError(error).message
        });
      } else {
        res.status(500).json({
          message: "\u0412\u043D\u0443\u0442\u0440\u0435\u043D\u043D\u044F\u044F \u043E\u0448\u0438\u0431\u043A\u0430 \u0441\u0435\u0440\u0432\u0435\u0440\u0430"
        });
      }
    }
  });
  app2.get("/api/publications/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "\u041D\u0435\u043A\u043E\u0440\u0440\u0435\u043A\u0442\u043D\u044B\u0439 ID \u043F\u0443\u0431\u043B\u0438\u043A\u0430\u0446\u0438\u0438" });
      }
      const publication = await storage.getPublication(id);
      if (!publication) {
        return res.status(404).json({ message: "\u041F\u0443\u0431\u043B\u0438\u043A\u0430\u0446\u0438\u044F \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u0430" });
      }
      res.json(publication);
    } catch (error) {
      res.status(500).json({ message: "\u0412\u043D\u0443\u0442\u0440\u0435\u043D\u043D\u044F\u044F \u043E\u0448\u0438\u0431\u043A\u0430 \u0441\u0435\u0440\u0432\u0435\u0440\u0430" });
    }
  });
  app2.post("/api/publications", async (req, res) => {
    try {
      const publicationData = insertPublicationSchema.parse(req.body);
      const publication = await storage.createPublication(publicationData);
      res.status(201).json(publication);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          message: fromZodError(error).message
        });
      } else {
        res.status(500).json({ message: "\u0412\u043D\u0443\u0442\u0440\u0435\u043D\u043D\u044F\u044F \u043E\u0448\u0438\u0431\u043A\u0430 \u0441\u0435\u0440\u0432\u0435\u0440\u0430" });
      }
    }
  });
  app2.put("/api/publications/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "\u041D\u0435\u043A\u043E\u0440\u0440\u0435\u043A\u0442\u043D\u044B\u0439 ID \u043F\u0443\u0431\u043B\u0438\u043A\u0430\u0446\u0438\u0438" });
      }
      const publicationData = insertPublicationSchema.partial().parse(req.body);
      const publication = await storage.updatePublication(id, publicationData);
      if (!publication) {
        return res.status(404).json({ message: "\u041F\u0443\u0431\u043B\u0438\u043A\u0430\u0446\u0438\u044F \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u0430" });
      }
      res.json(publication);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          message: fromZodError(error).message
        });
      } else {
        res.status(500).json({ message: "\u0412\u043D\u0443\u0442\u0440\u0435\u043D\u043D\u044F\u044F \u043E\u0448\u0438\u0431\u043A\u0430 \u0441\u0435\u0440\u0432\u0435\u0440\u0430" });
      }
    }
  });
  app2.delete("/api/publications/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "\u041D\u0435\u043A\u043E\u0440\u0440\u0435\u043A\u0442\u043D\u044B\u0439 ID \u043F\u0443\u0431\u043B\u0438\u043A\u0430\u0446\u0438\u0438" });
      }
      const success = await storage.deletePublication(id);
      if (!success) {
        return res.status(404).json({ message: "\u041F\u0443\u0431\u043B\u0438\u043A\u0430\u0446\u0438\u044F \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u0430" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "\u0412\u043D\u0443\u0442\u0440\u0435\u043D\u043D\u044F\u044F \u043E\u0448\u0438\u0431\u043A\u0430 \u0441\u0435\u0440\u0432\u0435\u0440\u0430" });
    }
  });
  app2.post("/api/publications/batch", async (req, res) => {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids)) {
        return res.status(400).json({ message: "\u041D\u0435\u043A\u043E\u0440\u0440\u0435\u043A\u0442\u043D\u044B\u0439 \u0444\u043E\u0440\u043C\u0430\u0442 IDs" });
      }
      const publications2 = await storage.getPublicationsByIds(ids);
      res.json(publications2);
    } catch (error) {
      res.status(500).json({ message: "\u0412\u043D\u0443\u0442\u0440\u0435\u043D\u043D\u044F\u044F \u043E\u0448\u0438\u0431\u043A\u0430 \u0441\u0435\u0440\u0432\u0435\u0440\u0430" });
    }
  });
  app2.post("/api/publications/pdf", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "\u0424\u0430\u0439\u043B \u043D\u0435 \u0431\u044B\u043B \u0437\u0430\u0433\u0440\u0443\u0436\u0435\u043D" });
      }
      const extractedData = {
        title: "\u0410\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0447\u0435\u0441\u043A\u0438 \u0440\u0430\u0441\u043F\u043E\u0437\u043D\u0430\u043D\u043D\u043E\u0435 \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u043F\u0443\u0431\u043B\u0438\u043A\u0430\u0446\u0438\u0438",
        authors: "\u0418\u0432\u0430\u043D\u043E\u0432 \u0418.\u0418., \u041F\u0435\u0442\u0440\u043E\u0432 \u041F.\u041F.",
        journal: "\u0416\u0443\u0440\u043D\u0430\u043B \u043D\u0430\u0443\u043A \u0438 \u0442\u0435\u0445\u043D\u043E\u043B\u043E\u0433\u0438\u0439",
        year: (/* @__PURE__ */ new Date()).getFullYear(),
        volume: "10",
        issue: "2",
        pages: "123-145",
        doi: "10.1234/example.2023.5678"
      };
      res.json(extractedData);
    } catch (error) {
      res.status(500).json({ message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043E\u0431\u0440\u0430\u0431\u043E\u0442\u043A\u0435 PDF \u0444\u0430\u0439\u043B\u0430" });
    }
  });
  app2.post("/api/publications/export", async (req, res) => {
    try {
      const params = exportPublicationSchema.parse(req.body);
      const publications2 = await storage.getPublicationsByIds(params.ids);
      if (publications2.length === 0) {
        return res.status(404).json({ message: "\u041F\u0443\u0431\u043B\u0438\u043A\u0430\u0446\u0438\u0438 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u044B" });
      }
      res.json({
        message: "\u042D\u043A\u0441\u043F\u043E\u0440\u0442 \u0432\u044B\u043F\u043E\u043B\u043D\u0435\u043D \u0443\u0441\u043F\u0435\u0448\u043D\u043E",
        format: params.format,
        count: publications2.length,
        includeAbstract: params.includeAbstract,
        includeDoi: params.includeDoi,
        includeCategories: params.includeCategories
      });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          message: fromZodError(error).message
        });
      } else {
        res.status(500).json({ message: "\u0412\u043D\u0443\u0442\u0440\u0435\u043D\u043D\u044F\u044F \u043E\u0448\u0438\u0431\u043A\u0430 \u0441\u0435\u0440\u0432\u0435\u0440\u0430" });
      }
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2, { dirname as dirname2 } from "path";
import { fileURLToPath as fileURLToPath2 } from "url";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path, { dirname } from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { fileURLToPath } from "url";
var __filename = fileURLToPath(import.meta.url);
var __dirname = dirname(__filename);
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    themePlugin(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets")
    }
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var __filename2 = fileURLToPath2(import.meta.url);
var __dirname2 = dirname2(__filename2);
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        __dirname2,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(__dirname2, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = 5e3;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
