import * as fs from 'fs';
import * as path from 'path';
import Papa from 'papaparse';

interface JournalData {
  Title: string;
  'SJR Quartile': string;
  ISSN: string;
  'E-ISSN': string;
}

let journalData: JournalData[] = [];
let isDataLoaded = false;

/**
 * Загружает данные о журналах из CSV файла
 */
export async function loadJournalData(): Promise<void> {
  try {
    if (isDataLoaded) {
      return;
    }

    // Путь к файлу относительно корня проекта
    const filePath = path.join(process.cwd(), 'scimagojr_2023.csv');
    
    // Проверяем, существует ли файл
    if (!fs.existsSync(filePath)) {
      console.warn(`Файл данных о квартилях журналов не найден: ${filePath}`);
      return;
    }
    
    // Читаем содержимое файла
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    // Парсим CSV содержимое
    const parseResult = Papa.parse<JournalData>(fileContent, {
      header: true,
      skipEmptyLines: true
    });
    
    if (parseResult.errors && parseResult.errors.length > 0) {
      console.error('Ошибки при парсинге CSV файла:', parseResult.errors);
    }
    
    journalData = parseResult.data;
    isDataLoaded = true;
    console.log(`Загружены данные о ${journalData.length} журналах из CSV файла`);
  } catch (error) {
    console.error('Ошибка при загрузке данных о журналах:', error);
  }
}

/**
 * Находит квартиль журнала по его названию
 * @param journalTitle Название журнала
 * @returns Строка с информацией о квартиле (Q1, Q2, Q3, Q4) или null, если не найдено
 */
export function findJournalQuartile(journalTitle: string): string | null {
  if (!isDataLoaded || !journalTitle) {
    return null;
  }
  
  // Очищаем название от лишних символов и приводим к нижнему регистру для более точного сравнения
  const normalizedTitle = journalTitle.toLowerCase().trim();
  
  // Сначала ищем точное совпадение
  const exactMatch = journalData.find(
    journal => journal.Title.toLowerCase().trim() === normalizedTitle
  );
  
  if (exactMatch) {
    return exactMatch['SJR Quartile'];
  }
  
  // Если точное совпадение не найдено, ищем частичное совпадение
  const partialMatch = journalData.find(
    journal => journal.Title.toLowerCase().trim().includes(normalizedTitle) ||
              normalizedTitle.includes(journal.Title.toLowerCase().trim())
  );
  
  if (partialMatch) {
    return partialMatch['SJR Quartile'];
  }
  
  return null;
}

/**
 * Находит квартиль журнала по его ISSN
 * @param issn ISSN журнала
 * @param eissn E-ISSN журнала (необязательно)
 * @returns Строка с информацией о квартиле (Q1, Q2, Q3, Q4) или null, если не найдено
 */
export function findJournalQuartileByISSN(issn?: string, eissn?: string): string | null {
  if (!isDataLoaded || (!issn && !eissn)) {
    return null;
  }
  
  // Ищем по ISSN
  if (issn) {
    const issnMatch = journalData.find(
      journal => journal.ISSN === issn
    );
    
    if (issnMatch) {
      return issnMatch['SJR Quartile'];
    }
  }
  
  // Ищем по E-ISSN
  if (eissn) {
    const eissnMatch = journalData.find(
      journal => journal['E-ISSN'] === eissn
    );
    
    if (eissnMatch) {
      return eissnMatch['SJR Quartile'];
    }
  }
  
  return null;
}

/**
 * Ищет журналы в базе данных по части названия
 * @param searchQuery Поисковый запрос для названия журнала
 * @param limit Максимальное количество результатов
 * @returns Массив найденных журналов
 */
export function searchJournals(searchQuery: string, limit: number = 10): JournalData[] {
  if (!isDataLoaded || !searchQuery || searchQuery.length < 2) {
    console.log(`Поиск журналов: данные не загружены или запрос слишком короткий: "${searchQuery}"`);
    return [];
  }

  // Приводим запрос к нижнему регистру для поиска без учета регистра
  const query = searchQuery.toLowerCase().trim();
  
  console.log(`Выполняется поиск журналов по запросу: "${query}"`);
  
  // Выполняем поиск журналов, название которых содержит запрос
  const results = journalData
    .filter(journal => journal.Title.toLowerCase().includes(query))
    .slice(0, limit);
  
  console.log(`Найдено ${results.length} журналов по запросу "${query}"`);
  
  return results;
}

// Загружаем данные при импорте модуля
loadJournalData();