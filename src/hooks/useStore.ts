import { useState, useEffect } from "react";

// Хук, который выбирает источник данных:
// Если запущено в Electron (есть window.electron) -> использует файл.
// Иначе -> использует LocalStorage (для веб-версии).

export function useStore<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        let data;
        if (window.electron) {
          // Electron Mode
          if (key === 'notes') data = await window.electron.loadNotes();
          else if (key === 'settings') data = await window.electron.loadSettings();
        } else {
          // Web / LocalStorage Mode
          const item = window.localStorage.getItem(key);
          if (item) data = JSON.parse(item);
        }

        if (isMounted) {
          if (data !== undefined && data !== null) {
            // Если initialValue это объект (но не массив), делаем merge.
            // Это необходимо, чтобы новые поля из DEFAULT_SETTINGS не переопределялись в undefined
            // при загрузке старого конфига, где этих полей не было.
            if (typeof initialValue === 'object' && !Array.isArray(initialValue) && initialValue !== null) {
              setStoredValue({ ...initialValue, ...data });
            } else {
              setStoredValue(data);
            }
          }
        }
      } catch (error) {
        console.error(`Error loading ${key}:`, error);
      } finally {
        if (isMounted) setIsLoaded(true);
      }
    };

    loadData();

    return () => { isMounted = false; };
  }, [key, initialValue]); // Добавил initialValue в зависимости для корректности, хотя в контексте useState это не обязательно

  const setValue = async (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);

      if (window.electron) {
        // Electron Mode
        if (key === 'notes') await window.electron.saveNotes(valueToStore as any);
        else if (key === 'settings') await window.electron.saveSettings(valueToStore as any);
      } else {
        // Web Mode
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(`Error saving ${key}:`, error);
    }
  };

  return [storedValue, setValue, isLoaded] as const;
}