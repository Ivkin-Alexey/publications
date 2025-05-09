import { useState, useEffect } from 'react';

/**
 * Хук для создания отложенного значения, которое обновляется
 * только после указанной задержки с момента последнего изменения
 * оригинального значения.
 * 
 * @param value Исходное значение
 * @param delay Задержка в миллисекундах
 * @returns Отложенное значение
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Устанавливаем таймер, который обновит значение через delay мс
    const timeout = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Очищаем таймер при изменении value или при размонтировании компонента
    return () => {
      clearTimeout(timeout);
    };
  }, [value, delay]);

  return debouncedValue;
}