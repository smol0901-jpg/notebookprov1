# README

Отличная инструкция! Это именно то, что нужно.  
Ваш проект уже использует Next.js + Electron, но мы пытались запускать **Next.js-сервер внутри Electron** — это сложно и ненадёжно.  

Предложенный подход с **`output: 'export'`** (статический экспорт) и **IPC для файлов** — правильный путь для десктопного блокнота.  
Он решает наши проблемы:  
- не нужен сервер → не падает `next build` worker  
- данные хранятся локально через `app.getPath('userData')`  
- сборка в `.exe` становится стабильной.

## Что меняем в текущем проекте по вашей инструкции

### 1. Обновим `next.config.mjs` — добавим статический экспорт
```powershell
@"
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
"@ | Out-File -FilePath next.config.mjs -Encoding UTF8
```

### 2. Создадим `electron.js` (главный процесс) с поддержкой файлов
Уже лежит ваш код из инструкции — просто выполните в PowerShell:
```powershell
@"
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const isDev = require('electron-is-dev');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      enableRemoteModule: false,
    },
    autoHideMenuBar: true,
  });

  const startUrl = isDev
    ? 'http://localhost:3000'
    : `file://${path.join(__dirname, '../out/index.html')}`;
  mainWindow.loadURL(startUrl);

  mainWindow.on('closed', () => (mainWindow = null));
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) createWindow();
});

const NOTES_FILE = path.join(app.getPath('userData'), 'notes.json');
const SETTINGS_FILE = path.join(app.getPath('userData'), 'settings.json');

ipcMain.handle('load-notes', async () => {
  try {
    if (fs.existsSync(NOTES_FILE)) {
      const data = fs.readFileSync(NOTES_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (e) { console.error(e); }
  return [];
});

ipcMain.handle('save-notes', async (event, notes) => {
  try {
    fs.writeFileSync(NOTES_FILE, JSON.stringify(notes, null, 2));
    return true;
  } catch (e) { console.error(e); return false; }
});

ipcMain.handle('load-settings', async () => {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const data = fs.readFileSync(SETTINGS_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (e) { console.error(e); }
  return null;
});

ipcMain.handle('save-settings', async (event, settings) => {
  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
    return true;
  } catch (e) { console.error(e); return false; }
});
"@ | Out-File -FilePath electron.js -Encoding UTF8
```

### 3. Создадим `preload.js`
```powershell
@"
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  saveNotes: (notes) => ipcRenderer.invoke('save-notes', notes),
  loadNotes: () => ipcRenderer.invoke('load-notes'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  loadSettings: () => ipcRenderer.invoke('load-settings'),
});
"@ | Out-File -FilePath preload.js -Encoding UTF8
```

### 4. Установим недостающие пакеты
```powershell
npm install --save-dev electron-is-dev concurrently wait-on --legacy-peer-deps
```

### 5. Обновим `package.json` — скрипты и конфиг билда
Сначала посмотрим текущие скрипты (уже есть `electron:dev`, `electron:build`).  
Заменим их и добавим `main: "electron.js"`:
```powershell
$pkg = Get-Content package.json -Raw | ConvertFrom-Json
$pkg.main = "electron.js"
$pkg.scripts.dev = "next dev"
$pkg.scripts.build = "next build"
$pkg.scripts.electron = "electron ."
$pkg.scripts."electron:dev" = 'concurrently "npm run dev" "wait-on http://localhost:3000 && electron ."'
$pkg.scripts.dist = "npm run build && electron-builder"
$pkg.build = @{
    appId = "com.gigastudio.notebook"
    productName = "GigaStudio Notebook"
    directories = @{ output = "dist" }
    files = @("electron.js","preload.js","out/**/*","package.json")
    win = @{ target = @("nsis") }
    nsis = @{
        oneClick = $false
        allowToChangeInstallationDirectory = $true
        createDesktopShortcut = $true
        createStartMenuShortcut = $true
        shortcutName = "GigaStudio Notebook"
        uninstallDisplayName = "GigaStudio Notebook"
        license = "LICENSE.txt"
    }
}
$pkg | ConvertTo-Json -Depth 10 | Set-Content package.json
```

### 6. Сборка проекта
```powershell
npm run build   # создаст папку out
npm run dist    # создаст установщик в папке dist
```

## Что ещё важно проверить
Ваш фронтенд-код, скорее всего, уже использует `window.electron` (проверьте `src/hooks/useStore.ts`).  
Если там используется прямое обращение к `localStorage` или другим API, нужно заменить на вызовы из `window.electron`:
- `window.electron.loadNotes()` / `window.electron.saveNotes(notes)`
- `window.electron.loadSettings()` / `window.electron.saveSettings(settings)`

Если ваш код уже это делает — отлично, всё заработает.

**Попробуйте выполнить шаги 1–6 по порядку.**  
После `npm run build` должна появиться папка `out` с готовыми HTML-файлами, а после `npm run dist` — установщик в `dist`.  
Это должно решить все наши прошлые ошибки. Показывайте результат!

## Стек

- Next.js 15
- TypeScript
- Tailwind CSS
- shadcn/ui

## Локальный запуск
```bash
npm install
npm run dev
```

Откройте http://localhost:3000

## Деплой

[Документация Cloud.ru](https://cloud.ru/docs/container-apps-evolution/ug/topics/quickstart)
