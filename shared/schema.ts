import { pgTable, text, serial, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Тип для метаданных публикации
export const metadataSchema = z.object({
  scopusId: z.string().optional(),
  eid: z.string().optional(),
  scopusAffiliationId: z.string().optional(),
  citedByCount: z.number().optional(),
  wos: z.string().optional(),
  eissn: z.string().optional(),
  issn: z.string().optional(),
  pubmed: z.string().optional(),
  quartile: z.string().optional(), // Q1, Q2, Q3, Q4 для Scopus
});

// Основная таблица публикаций
export const publications = pgTable("publications", {
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
  category: text("category"), // Q1-Q2, Q3-Q4, ВАК, РИНЦ, Патенты, Диссертации
  type: text("type").notNull().default("article"), // article, patent, dissertation
  database: text("database"), // Scopus, Google Scholar, eLIBRARY
  patentNumber: text("patent_number"), // для патентов
  metadata: jsonb("metadata").$type<z.infer<typeof metadataSchema>>(), // дополнительные метаданные
  createdAt: text("created_at").notNull(),
});

export const insertPublicationSchema = createInsertSchema(publications).omit({
  id: true,
  createdAt: true,
});

export type InsertPublication = z.infer<typeof insertPublicationSchema>;
export type Publication = typeof publications.$inferSelect;
export type PublicationMetadata = z.infer<typeof metadataSchema>;

// Схема для поиска публикаций
export const searchPublicationSchema = z.object({
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
  sortDirection: z.string().optional().default("desc"),
});

export type SearchPublicationParams = z.infer<typeof searchPublicationSchema>;

// Схема для добавления публикации из PDF
export const pdfPublicationSchema = z.object({
  file: z.any(),
});

// Схема для экспорта публикаций
export const exportPublicationSchema = z.object({
  ids: z.array(z.number()),
  format: z.enum(["docx", "pdf", "bibtex", "txt"]),
  includeAbstract: z.boolean().optional(),
  includeDoi: z.boolean().optional(),
  includeCategories: z.boolean().optional(),
});

export type ExportPublicationParams = z.infer<typeof exportPublicationSchema>;
