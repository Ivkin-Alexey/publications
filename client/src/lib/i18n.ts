// Простая система локализации для приложения
// В реальном приложении стоит использовать библиотеку i18next

interface TranslationMap {
  [key: string]: string;
}

// Русские переводы
const ruTranslations: TranslationMap = {
  // Общие
  "app.title": "Публикации ученого",
  "app.loading": "Загрузка...",
  "app.error": "Произошла ошибка",
  
  // Заголовки
  "header.addPublication": "Добавить публикацию",
  "header.export": "Экспорт",
  
  // Поиск и фильтры
  "search.title": "Поиск публикаций",
  "search.placeholder": "Введите запрос для поиска...",
  "search.filters": "Фильтры",
  "search.databases": "Базы данных",
  "search.apply": "Применить фильтры",
  
  "filter.author": "Автор",
  "filter.university": "Университет",
  "filter.yearFrom": "Год публикации с",
  "filter.yearTo": "Год публикации по",
  "filter.journal": "Журнал",
  "filter.category": "Категория журнала",
  
  "category.all": "Все категории",
  "category.q1q2": "Статьи Q1-Q2",
  "category.q3q4": "Статьи Q3-Q4",
  "category.vak": "Статьи ВАК",
  "category.rinc": "Статьи РИНЦ",
  "category.patents": "Патенты",
  "category.dissertations": "Диссертации",
  
  "database.scopus": "Scopus",
  "database.scopus.description": "Международная база данных научных публикаций",
  "database.googleScholar": "Google Scholar",
  "database.googleScholar.description": "Поисковая система по научным публикациям",
  "database.elibrary": "eLIBRARY",
  "database.elibrary.description": "Российская научная электронная библиотека",
  
  // Результаты поиска
  "results.title": "Результаты поиска",
  "results.count": "Найдено: {count} публикаций",
  "results.sortBy": "Сортировать по:",
  "results.empty": "Публикации не найдены. Попробуйте изменить параметры поиска.",
  
  "sort.dateDesc": "Дате (сначала новые)",
  "sort.dateAsc": "Дате (сначала старые)",
  "sort.title": "Названию",
  "sort.journal": "Журналу",
  
  // Публикации
  "publication.authors": "Авторы:",
  "publication.journal": "Журнал:",
  "publication.type": "Тип:",
  "publication.doi": "DOI:",
  "publication.patentNumber": "№ патента:",
  "publication.view": "Просмотр",
  "publication.cite": "Цитировать",
  
  // Просмотр публикации
  "view.abstract": "Аннотация",
  "view.year": "Год",
  "view.volume": "Том",
  "view.issue": "Номер",
  "view.pages": "Страницы",
  "view.url": "URL",
  
  // Цитирование
  "cite.title": "Цитирование по ГОСТ Р 7.0.100-2018",
  "cite.description": "Вы можете скопировать готовое цитирование",
  "cite.copy": "Копировать",
  "cite.copied": "Скопировано!",
  "cite.copyError": "Ошибка копирования",
  
  // Выбранные публикации
  "selected.title": "Выбранные публикации",
  "selected.empty": "Нет выбранных публикаций",
  "selected.count": "Выбрано публикаций: {count}",
  "selected.remove": "Удалить",
  "selected.clear": "Очистить",
  "selected.copy": "Копировать",
  "selected.export": "Экспорт",
  
  // Добавление публикации
  "add.title": "Добавление публикации",
  "add.upload": "Загрузка PDF",
  "add.manual": "Ручной ввод",
  "add.dragdrop": "Перетащите PDF файл сюда или",
  "add.selectFile": "Выберите файл",
  "add.uploading": "Загрузка и обработка...",
  "add.extractedData": "Распознанные данные",
  
  "add.publicationType": "Тип публикации",
  "add.publicationTitle": "Название публикации",
  "add.authors": "Авторы",
  "add.authorsHint": "Укажите авторов через запятую, например: Иванов И.И., Петров П.П.",
  "add.publication": "Издание",
  "add.year": "Год",
  "add.volume": "Том",
  "add.issue": "Номер",
  "add.pages": "Страницы",
  "add.doi": "DOI",
  "add.url": "URL",
  "add.category": "Категория",
  "add.abstract": "Аннотация",
  "add.cancel": "Отмена",
  "add.save": "Сохранить",
  "add.saving": "Сохранение...",
  "add.success": "Публикация добавлена",
  "add.error": "Ошибка добавления публикации",
  
  // Типы публикаций
  "type.article": "Научная статья",
  "type.patent": "Патент",
  "type.dissertation": "Диссертация",
  "type.book": "Книга",
  "type.conference": "Материалы конференции",
  
  // Экспорт
  "export.title": "Экспорт публикаций",
  "export.format": "Формат экспорта",
  "export.include": "Включить в экспорт",
  "export.includeAbstract": "Аннотации",
  "export.includeDoi": "DOI",
  "export.includeCategories": "Категории журналов",
  "export.docx": "Microsoft Word (.docx)",
  "export.pdf": "PDF (.pdf)",
  "export.bibtex": "BibTeX (.bib)",
  "export.txt": "Текстовый файл (.txt)",
  "export.cancel": "Отмена",
  "export.submit": "Экспортировать",
  "export.exporting": "Экспорт...",
  "export.success": "{count} публикаций экспортировано в формате {format}",
  "export.error": "Ошибка экспорта",
};

// Текущая локаль
let currentLocale = 'ru';

// Функция для получения перевода
export function t(key: string, params: Record<string, any> = {}): string {
  let translation = ruTranslations[key] || key;
  
  // Замена параметров в строке
  Object.entries(params).forEach(([param, value]) => {
    translation = translation.replace(`{${param}}`, String(value));
  });
  
  return translation;
}

// Функция для форматирования даты
export function formatDate(date: Date | string): string {
  if (typeof date === 'string') {
    date = new Date(date);
  }
  
  return date.toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// Функция для форматирования чисел
export function formatNumber(num: number): string {
  return num.toLocaleString('ru-RU');
}

// Экспортируем локализационные утилиты
export default {
  t,
  formatDate,
  formatNumber,
  currentLocale,
};
