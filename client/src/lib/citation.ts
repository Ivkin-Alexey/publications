import { Publication } from "@shared/schema";

// Форматы цитирования
export enum CitationFormat {
  GOST = "GOST", // ГОСТ Р 7.0.100-2018
  APA = "APA",
  MLA = "MLA",
  CHICAGO = "CHICAGO",
  HARVARD = "HARVARD",
  BIBTEX = "BIBTEX",
}

// Функция для форматирования публикации в соответствии с ГОСТ Р 7.0.100-2018
export function formatGOST(publication: Publication): string {
  if (!publication) return '';
  
  let result = '';
  
  // Получаем список авторов
  const authors = publication.authors ? publication.authors.split(',').map(author => author.trim()) : [];
  const firstAuthor = authors.length > 0 ? authors[0] : '';
  
  // Первый автор
  if (firstAuthor) {
    result += firstAuthor;
  }
  
  // Название публикации
  if (publication.title) {
    result += `, ${publication.title} / `;
  }
  
  // Все авторы с инициалами сначала (преобразование формата)
  if (authors.length > 0) {
    // Предполагаем, что авторы записаны как "Фамилия И.О."
    // Преобразуем в формат "И.О. Фамилия"
    const formattedAuthors = authors.map(author => {
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

// Функция для форматирования публикации в APA формате
export function formatAPA(publication: Publication): string {
  if (!publication) return '';
  
  let result = '';
  
  // Авторы
  if (publication.authors) {
    const authors = publication.authors.split(',').map(author => author.trim());
    result += authors.join(', ');
  }
  
  // Год
  if (publication.year) {
    result += ` (${publication.year}). `;
  }
  
  // Название публикации
  if (publication.title) {
    result += `${publication.title}. `;
  }
  
  // Журнал
  if (publication.journal) {
    result += `${publication.journal}`;
    
    // Том и номер
    if (publication.volume) {
      result += `, ${publication.volume}`;
      if (publication.issue) {
        result += `(${publication.issue})`;
      }
    }
    
    // Страницы
    if (publication.pages) {
      result += `, ${publication.pages}`;
    }
    
    result += '.';
  }
  
  // DOI
  if (publication.doi) {
    result += ` https://doi.org/${publication.doi}`;
  }
  
  return result;
}

// Функция для форматирования в формате BibTeX
export function formatBibTeX(publication: Publication): string {
  if (!publication) return '';
  
  // Создаем уникальный ключ для цитирования
  const firstAuthor = publication.authors.split(',')[0].trim().split(' ')[0];
  const key = `${firstAuthor}${publication.year}${publication.title.split(' ')[0].toLowerCase()}`;
  
  let result = '';
  
  if (publication.type === 'article') {
    result += `@article{${key},\n`;
  } else if (publication.type === 'book') {
    result += `@book{${key},\n`;
  } else if (publication.type === 'patent') {
    result += `@patent{${key},\n`;
  } else if (publication.type === 'dissertation') {
    result += `@phdthesis{${key},\n`;
  } else {
    result += `@misc{${key},\n`;
  }
  
  // Авторы
  if (publication.authors) {
    result += `  author = {${publication.authors}},\n`;
  }
  
  // Название
  if (publication.title) {
    result += `  title = {${publication.title}},\n`;
  }
  
  // Журнал
  if (publication.journal) {
    result += `  journal = {${publication.journal}},\n`;
  }
  
  // Год
  if (publication.year) {
    result += `  year = {${publication.year}},\n`;
  }
  
  // Том
  if (publication.volume) {
    result += `  volume = {${publication.volume}},\n`;
  }
  
  // Номер
  if (publication.issue) {
    result += `  number = {${publication.issue}},\n`;
  }
  
  // Страницы
  if (publication.pages) {
    result += `  pages = {${publication.pages}},\n`;
  }
  
  // DOI
  if (publication.doi) {
    result += `  doi = {${publication.doi}},\n`;
  }
  
  // URL
  if (publication.url) {
    result += `  url = {${publication.url}},\n`;
  }
  
  // Категория как примечание
  if (publication.category) {
    result += `  note = {${publication.category}`;
    if (publication.database) {
      result += `, ${publication.database}`;
    }
    result += `},\n`;
  }
  
  result += `}`;
  
  return result;
}

// Общая функция для форматирования публикации в нужном формате
export function formatCitation(publication: Publication, format: CitationFormat): string {
  switch (format) {
    case CitationFormat.GOST:
      return formatGOST(publication);
    case CitationFormat.APA:
      return formatAPA(publication);
    case CitationFormat.BIBTEX:
      return formatBibTeX(publication);
    // Другие форматы можно добавить при необходимости
    default:
      return formatGOST(publication);
  }
}
