import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Форматирование публикации по ГОСТ Р 7.0.100-2018
export function formatPublicationGOST(publication: any): string {
  if (!publication) return '';
  
  let result = '';
  
  // Получаем список авторов
  const authors = publication.authors ? publication.authors.split(',').map((author: string) => author.trim()) : [];
  const firstAuthor = authors.length > 0 ? authors[0] : '';
  
  // Первый автор
  if (firstAuthor) {
    result += firstAuthor;
  }
  
  // Название публикации
  if (publication.title) {
    result += ` ${publication.title} / `;
  }
  
  // Все авторы с инициалами сначала (преобразование формата)
  if (authors.length > 0) {
    // Предполагаем, что авторы записаны как "Фамилия И.О."
    // Преобразуем в формат "И.О. Фамилия"
    const formattedAuthors = authors.map((author: string) => {
      const parts = author.split(' ');
      if (parts.length >= 2) {
        const surname = parts[0];
        const initials = parts.slice(1).join(' ');
        return `${initials} ${surname}`;
      }
      return author;
    });
    
    result += formattedAuthors.join(', ');
  }
  
  // Разделитель перед журналом
  result += ' // ';
  
  // Журнал
  if (publication.journal) {
    result += publication.journal;
  }
  
  // Год
  if (publication.year) {
    result += `, ${publication.year}`;
  }
  
  // Том и номер
  if (publication.volume) {
    result += `, т. ${publication.volume}`;
  }
  
  if (publication.issue) {
    result += `, № ${publication.issue}`;
  }
  
  // Страницы
  if (publication.pages) {
    result += `, с. ${publication.pages}`;
  }
  
  // DOI
  if (publication.doi) {
    result += `, doi: ${publication.doi}`;
  }
  
  // Категория
  if (publication.category) {
    result += ` (${publication.category})`;
  }
  
  return result;
}

// Получение цвета метки для категории
export function getCategoryColorClass(category: string): { bg: string, text: string } {
  if (!category) return { bg: 'bg-neutral-100', text: 'text-neutral-800' };
  
  const lowerCategory = category.toLowerCase();
  
  // Обработка квартилей, включая формат "Scopus Q1"
  if (lowerCategory.includes('q1') || lowerCategory === 'q1-q2' || lowerCategory === 'scopus q1') {
    return { bg: 'bg-blue-100', text: 'text-blue-800' };
  } else if (lowerCategory.includes('q2') || lowerCategory === 'scopus q2') {
    return { bg: 'bg-green-100', text: 'text-green-800' };
  } else if (lowerCategory.includes('q3') || lowerCategory === 'q3-q4' || lowerCategory === 'scopus q3') {
    return { bg: 'bg-yellow-100', text: 'text-yellow-800' };
  } else if (lowerCategory.includes('q4') || lowerCategory === 'scopus q4') {
    return { bg: 'bg-orange-100', text: 'text-orange-800' };
  } else if (lowerCategory.includes('scopus')) {
    // Общая категория Scopus без указания квартиля
    return { bg: 'bg-sky-100', text: 'text-sky-800' };
  } else if (lowerCategory.includes('вак')) {
    return { bg: 'bg-indigo-100', text: 'text-indigo-800' };
  } else if (lowerCategory.includes('ринц')) {
    return { bg: 'bg-cyan-100', text: 'text-cyan-800' };
  } else if (lowerCategory.includes('wos')) {
    return { bg: 'bg-emerald-100', text: 'text-emerald-800' };
  } else if (lowerCategory.includes('патент')) {
    return { bg: 'bg-purple-100', text: 'text-purple-800' };
  } else if (lowerCategory.includes('диссертац')) {
    return { bg: 'bg-pink-100', text: 'text-pink-800' };
  }
  
  return { bg: 'bg-neutral-100', text: 'text-neutral-800' };
}

// Копирование в буфер обмена
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Не удалось скопировать текст в буфер обмена', err);
    return false;
  }
}

// Форматирование timestamp в дату
export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
