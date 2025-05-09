import { type InsertPublication } from "@shared/schema";

// Интерфейс для извлеченных метаданных из PDF
export interface ExtractedPdfData {
  title?: string;
  authors?: string;
  journal?: string;
  year?: number;
  volume?: string;
  issue?: string;
  pages?: string;
  doi?: string;
  abstract?: string;
}

// Функция для отправки PDF на сервер для обработки
export async function parsePdf(file: File): Promise<InsertPublication> {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/publications/pdf', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Ошибка при обработке PDF: ${response.statusText}`);
    }

    const data = await response.json();
    return data as InsertPublication;
  } catch (error) {
    console.error('Ошибка при обработке PDF:', error);
    throw error;
  }
}

// Функция для поиска DOI в тексте
export function extractDoi(text: string): string | null {
  // Регулярное выражение для поиска DOI
  const doiRegex = /\b(10\.\d{4,}(?:\.\d+)*\/(?:(?!["&\'<>])\S)+)\b/i;
  const match = text.match(doiRegex);
  return match ? match[1] : null;
}

// Функция для определения вероятного заголовка статьи
export function extractTitle(text: string): string | null {
  // Обычно заголовок находится в начале PDF
  // Это упрощенная логика, в реальном приложении будет сложнее
  const lines = text.split('\n').filter(line => line.trim().length > 0);
  if (lines.length > 0) {
    // Предположим, что первая непустая строка - это заголовок
    return lines[0].trim();
  }
  return null;
}

// Функция для определения авторов
export function extractAuthors(text: string): string | null {
  // Упрощенная логика для демонстрации
  // В реальном приложении нужно использовать более сложные алгоритмы
  const authorRegex = /(?:Authors?|Авторы?):\s*([^.]+)/i;
  const match = text.match(authorRegex);
  return match ? match[1].trim() : null;
}
