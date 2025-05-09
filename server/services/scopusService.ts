import fetch from 'node-fetch';
import { type InsertPublication } from '../../shared/schema';
import { findJournalQuartile, findJournalQuartileByISSN } from './journalQuartiles';

const SCOPUS_API_KEY = process.env.SCOPUS_API_KEY;
const BASE_URL = 'https://api.elsevier.com/content';

// Интерфейс для цитирования
export interface Citation {
  title: string;
  authors: string;
  year: number;
  journal: string | null;
  doi: string | null;
  url: string | null;
}

export interface ScopusAuthor {
  authorId: string;
  name: string;
  surname: string;
  givenName: string;
  affiliation: string;
  documentCount: number;
}

/**
 * Выполняет поиск публикаций в Scopus API
 * @param query - поисковый запрос
 * @param page - номер страницы (начиная с 1)
 * @param limit - количество результатов на странице
 * @param sortBy - поле для сортировки
 * @param sortDirection - направление сортировки (asc или desc)
 * @returns Объект с массивом публикаций и общим количеством результатов
 */
export async function searchScopusPublications(
  query: string, 
  page: number = 1, 
  limit: number = 10,
  sortBy: string = 'date-desc',
  sortDirection: string = 'desc',
  yearFrom?: number, // Добавляем параметр для года публикации
  yearTo?: number    // Добавляем параметр для максимального года публикации
): Promise<{ publications: InsertPublication[], total: number }> {
  if (!SCOPUS_API_KEY) {
    throw new Error('Scopus API key is not defined');
  }

  // Формируем URL с параметрами поиска
  const url = new URL(`${BASE_URL}/search/scopus`);
  
  // Вычисляем начальную позицию для пагинации (Scopus использует начало с 0)
  const start = (page - 1) * limit;
  
  // Создаем массив для частей запроса
  const queryParts: string[] = [];
  
  // Добавляем основной запрос, если он есть
  if (query && query.trim()) {
    queryParts.push(`TITLE-ABS-KEY(${query})`);
  }
  
  // Добавляем поиск по годам
  if (yearFrom) {
    queryParts.push(`PUBYEAR >= ${yearFrom}`);
  }
  
  if (yearTo) {
    queryParts.push(`PUBYEAR <= ${yearTo}`);
  }
  
  // Если нет ни одного условия поиска, добавляем поиск по всем публикациям
  const finalQuery = queryParts.length > 0 ? queryParts.join(' AND ') : 'ALL';
  
  // Добавляем параметры поиска
  url.searchParams.append('query', finalQuery); // Объединяем все условия поиска
  url.searchParams.append('count', limit.toString()); // Количество результатов на странице
  url.searchParams.append('start', start.toString()); // Начальная позиция
  url.searchParams.append('view', 'STANDARD'); // Стандартный вид результатов
  
  try {
    console.log(`Searching Scopus API with query: ${query}`);
    console.log(`Request URL: ${url.toString()}`);
    
    // Распечатаем URL запроса и API-ключ для отладки
    console.log(`Full request URL: ${url.toString()}`);
    console.log(`API Key is defined: ${!!SCOPUS_API_KEY}`);
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'X-ELS-APIKey': SCOPUS_API_KEY ?? '',
        'Accept': 'application/json',
        'Host': 'api.elsevier.com',
        'User-Agent': 'Mozilla/5.0'
      }
    });

    console.log(`Scopus API response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Scopus API error response: ${errorText}`);
      throw new Error(`Scopus API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as any;
    console.log(`Scopus API response data:`, JSON.stringify(data).substring(0, 200) + '...');
    
    // Полный вывод данных для анализа
    console.log('Полные данные результатов Scopus API:');
    console.log(JSON.stringify(data, null, 2));
    
    // Получаем общее количество результатов
    const totalResults = parseInt(data['search-results']['opensearch:totalResults'] || '0');
    
    // Проверяем, есть ли результаты поиска
    if (!data['search-results'] || !data['search-results'].entry || data['search-results'].entry.length === 0) {
      console.log('No results found in Scopus API response');
      return { publications: [], total: 0 };
    }

    // Преобразуем результаты поиска в формат публикаций
    const publications = data['search-results'].entry.map((entry: any) => {
      console.log(`Processing entry:`, JSON.stringify(entry).substring(0, 200) + '...');
      
      // Извлечение аффилиации (университета) из данных, если она доступна
      let university = null;
      if (entry['affiliation'] && entry['affiliation'].length > 0) {
        university = entry['affiliation'][0]['affilname'] || null;
      }
      
      // Обработка авторов, если доступен массив авторов
      let authors = entry['dc:creator'] || 'Неизвестный автор';
      if (entry['author'] && entry['author'].length > 0) {
        authors = entry['author']
          .map((author: any) => {
            const given = author['given-name'] || '';
            const surname = author['surname'] || '';
            return `${given} ${surname}`.trim();
          })
          .join(', ');
      }
      
      // Определяем квартиль журнала, если доступно
      const journalName = entry['prism:publicationName'] || null;
      const issn = entry['prism:issn'] || null;
      const eissn = entry['prism:eIssn'] || null;
      
      // Сначала пробуем найти по ISSN, затем по названию
      let quartile = null;
      if (issn || eissn) {
        quartile = findJournalQuartileByISSN(issn, eissn);
      }
      if (!quartile && journalName) {
        quartile = findJournalQuartile(journalName);
      }
      
      // Формируем категорию на основе квартиля, если он найден
      let category = 'Scopus';
      if (quartile) {
        category = `Scopus ${quartile}`;
      }
      
      const publication: InsertPublication = {
        title: entry['dc:title'] || 'Без названия',
        authors: authors,
        year: parseInt(entry['prism:coverDate']?.split('-')[0]) || new Date().getFullYear(),
        journal: journalName,
        volume: entry['prism:volume'] || null,
        issue: entry['prism:issueIdentifier'] || null,
        pages: entry['prism:pageRange'] || null,
        doi: entry['prism:doi'] || null,
        abstract: entry['dc:description'] || null,
        url: entry['link']?.find((link: any) => link['@ref'] === 'scopus' || link['@ref'] === 'full-text')?.['@href'] || null,
        university: university,
        category: category,
        database: 'Scopus',
        type: entry['subtypeDescription'] || 'article',
        patentNumber: null,
        metadata: {
          scopusId: entry['dc:identifier'] || '',
          eid: entry['eid'] || '',
          citedByCount: parseInt(entry['citedby-count'] || '0'),
          // Добавляем дополнительные метаданные
          wos: entry['wos'] || null,
          eissn: eissn,
          issn: issn,
          pubmed: entry['pubmed-id'] || null,
          quartile: quartile
        }
      };

      return publication;
    });

    console.log(`Converted ${publications.length} publications from Scopus API response (total: ${totalResults})`);
    return { publications, total: totalResults };
  } catch (error) {
    console.error('Error fetching data from Scopus API:', error);
    throw error;
  }
}

/**
 * Получает список цитирований для публикации по её идентификатору в Scopus
 * @param scopusId - идентификатор публикации в Scopus (например, SCOPUS_ID:85193737259)
 * @returns Массив цитирований
 */
/**
 * Выполняет поиск авторов в Scopus API
 * @param query Поисковый запрос по имени автора
 * @param limit Количество результатов на странице
 * @returns Массив авторов
 */
export async function searchScopusAuthors(query: string, limit: number = 10): Promise<ScopusAuthor[]> {
  if (!SCOPUS_API_KEY) {
    throw new Error('Scopus API key is not defined');
  }

  // Проверка наличия запроса
  if (!query || query.trim().length === 0) {
    return [];
  }

  // Парсим имя и фамилию автора
  let firstName = '';
  let lastName = '';
  
  // Разбираем запрос на имя и фамилию
  const parts = query.split(/\s+/);
  if (parts.length >= 2) {
    // Если введено несколько слов, считаем первое имя, остальное - фамилия
    firstName = parts[0];
    lastName = parts.slice(1).join(' ');
  } else if (parts.length === 1) {
    // Если введено одно слово, считаем его фамилией
    lastName = parts[0];
  }
  
  // Вместо напрямую поиска авторов используем поиск публикаций с ограничением по автору
  // Это обходной путь, когда нет доступа к API поиска авторов
  const url = new URL(`${BASE_URL}/search/scopus`);
  
  // Формируем запрос поиска публикаций по автору
  let authorQuery = '';
  if (firstName && lastName) {
    authorQuery = `AUTHOR-NAME(${lastName}, ${firstName})`;
  } else {
    authorQuery = `AUTHOR-NAME(${query})`;
  }
  
  console.log(`Formatted Scopus author query via publications: ${authorQuery}`);
  
  url.searchParams.append('query', authorQuery);
  url.searchParams.append('count', '25'); // Получаем больше публикаций для более точного определения авторов
  url.searchParams.append('view', 'STANDARD'); // Стандартное представление, доступное с базовым API-ключом

  try {
    console.log(`Searching Scopus Publications API with author query: ${query}`);
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'X-ELS-APIKey': SCOPUS_API_KEY ?? '',
        'Accept': 'application/json',
        'Host': 'api.elsevier.com',
        'User-Agent': 'Mozilla/5.0'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Scopus Publications API error response: ${errorText}`);
      throw new Error(`Scopus API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as any;
    
    // Проверяем, есть ли результаты поиска
    if (!data['search-results'] || 
        !data['search-results']['entry'] || 
        data['search-results']['entry'].length === 0) {
      return [];
    }

    // Создаем Map для группировки авторов
    const authorsMap = new Map<string, ScopusAuthor>();
    
    // Обрабатываем каждую публикацию
    data['search-results']['entry'].forEach((entry: any) => {
      try {
        // Простое извлечение автора из поля dc:creator
        if (entry['dc:creator']) {
          const creatorName = entry['dc:creator'];
          // Попытка разделить имя на части
          const nameParts = creatorName.split(/\s+/);
          let surname = '';
          let givenName = '';
          
          if (nameParts.length > 0) {
            // Берем первую часть как фамилию
            surname = nameParts[0];
            // Все остальное (если есть) считаем именем
            if (nameParts.length > 1) {
              givenName = nameParts.slice(1).join(' ');
            }
          }
          
          // Простое сравнение имени автора с запросом
          const fullName = creatorName.toLowerCase();
          const queryLower = query.toLowerCase();
          const matchesQuery = fullName.includes(queryLower) || 
                              (surname.toLowerCase().includes(queryLower)) || 
                              (givenName.toLowerCase().includes(queryLower));
          
          if (matchesQuery) {
            // Создаем уникальный ключ для автора
            const authorKey = creatorName;
            
            // Если автор уже есть в карте, увеличиваем счетчик публикаций
            if (authorsMap.has(authorKey)) {
              const existingAuthor = authorsMap.get(authorKey)!;
              existingAuthor.documentCount += 1;
            } else {
              // Получаем аффилиацию из публикации, если доступна
              let affiliation = 'Нет данных';
              
              if (entry['affiliation'] && Array.isArray(entry['affiliation']) && entry['affiliation'].length > 0) {
                if (entry['affiliation'][0]['affilname']) {
                  affiliation = entry['affiliation'][0]['affilname'];
                }
              }
              
              // Создаем новую запись автора
              const newAuthor: ScopusAuthor = {
                authorId: entry['dc:identifier'] || '',
                name: givenName,
                surname: surname,
                givenName: givenName,
                affiliation: affiliation,
                documentCount: 1
              };
              
              authorsMap.set(authorKey, newAuthor);
            }
          }
        }
        
        // Дополнительная обработка, если доступен массив авторов
        if (entry['author'] && Array.isArray(entry['author'])) {
          entry['author'].forEach((author: any) => {
            // Проверяем, что имя автора соответствует запросу
            const authorSurname = author['surname'] || '';
            const authorGivenName = author['given-name'] || '';
            
            // Простое сравнение имени автора с запросом
            const fullName = `${authorSurname} ${authorGivenName}`.toLowerCase();
            const matchesQuery = fullName.includes(query.toLowerCase());
            
            if (matchesQuery) {
              // Создаем уникальный ключ для автора
              const authorKey = `${authorSurname}|${authorGivenName}`;
              
              // Если автор уже есть в карте, увеличиваем счетчик публикаций
              if (authorsMap.has(authorKey)) {
                const existingAuthor = authorsMap.get(authorKey)!;
                existingAuthor.documentCount += 1;
              } else {
                // Получаем аффилиацию автора, если доступна
                let affiliation = 'Нет данных';
                
                if (entry['affiliation'] && Array.isArray(entry['affiliation']) && entry['affiliation'].length > 0) {
                  affiliation = entry['affiliation'][0]['affilname'] || 'Нет данных';
                }
                
                // Создаем новую запись автора
                const newAuthor: ScopusAuthor = {
                  authorId: author['authid'] || entry['dc:identifier'] || '',
                  name: authorGivenName,
                  surname: authorSurname,
                  givenName: authorGivenName,
                  affiliation: affiliation,
                  documentCount: 1
                };
                
                authorsMap.set(authorKey, newAuthor);
              }
            }
          });
        }
      } catch (e) {
        console.error('Error processing entry:', e);
      }
    });
    
    // Преобразуем Map в массив авторов и сортируем по количеству публикаций
    const authors = Array.from(authorsMap.values())
      .sort((a, b) => b.documentCount - a.documentCount)
      .slice(0, limit);
    
    console.log(`Found ${authors.length} authors for query: ${query}`);
    return authors;
  } catch (error) {
    console.error('Error fetching authors from Scopus API:', error);
    throw error;
  }
}

export async function getPublicationCitations(scopusId: string): Promise<Citation[]> {
  if (!SCOPUS_API_KEY) {
    throw new Error('Scopus API key is not defined');
  }

  // Извлекаем чистый ID из формата SCOPUS_ID:XXXXXXXXX
  const cleanId = scopusId.includes(':') ? scopusId.split(':')[1] : scopusId;
  
  // Используем альтернативный метод получения цитирований через поиск
  // по ссылкам на исходную публикацию (REF/SCOPUS_ID) - он доступен с обычным API-ключом
  const url = new URL(`${BASE_URL}/search/scopus`);
  url.searchParams.append('query', `REFEID(${cleanId})`);
  url.searchParams.append('count', '25');
  url.searchParams.append('start', '0');
  url.searchParams.append('view', 'STANDARD');
  
  try {
    console.log(`Fetching citations for publication with ID: ${scopusId}`);
    console.log(`Citations URL: ${url.toString()}`);
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'X-ELS-APIKey': SCOPUS_API_KEY ?? '',
        'Accept': 'application/json',
        'Host': 'api.elsevier.com',
        'User-Agent': 'Mozilla/5.0'
      }
    });
    
    console.log(`Citations API response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Citations API error response: ${errorText}`);
      throw new Error(`Citations API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json() as any;
    
    // Проверяем, есть ли результаты цитирований
    if (!data['search-results'] || 
        !data['search-results']['entry'] || 
        data['search-results']['entry'].length === 0) {
      console.log('No citations found');
      return [];
    }
    
    // Преобразуем результаты в формат цитирований
    const citations = data['search-results']['entry'].map((cite: any) => {
      // Обработка авторов
      const authors = cite['author'] ? 
        cite['author'].map((a: any) => `${a['given-name'] ? a['given-name'] : ''} ${a['surname'] ? a['surname'] : ''}`).join(', ') : 
        'Неизвестный автор';
      
      const citation: Citation = {
        title: cite['dc:title'] || 'Без названия',
        authors: authors,
        year: cite['prism:coverDate'] ? parseInt(cite['prism:coverDate'].substring(0, 4)) : new Date().getFullYear(),
        journal: cite['prism:publicationName'] || null,
        doi: cite['prism:doi'] || null,
        url: cite['link'] ? 
          cite['link'].find((l: any) => l['@ref'] === 'scopus') ? 
          cite['link'].find((l: any) => l['@ref'] === 'scopus')['@href'] : null 
          : null
      };
      
      return citation;
    });
    
    console.log(`Found ${citations.length} citations for publication ${scopusId}`);
    return citations;
  } catch (error) {
    console.error('Error fetching citations from Scopus API:', error);
    throw error;
  }
}