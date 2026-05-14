"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useStore } from "@/hooks/useStore";
import { 
  Plus, Trash2, Edit2, Sparkles, Calendar, Tag, 
  Settings, Send, Shield, Download, Sliders, Palette, 
  CheckCircle2, Clock, Briefcase, Smile, Heart, Hash, X, 
  ArrowUpDown, Lock, RefreshCw, Search, HelpCircle, Bot, Check, XCircle, Info, ExternalLink,
  LayoutGrid, LayoutList, Copy, ChevronRight, ChevronLeft, CheckSquare, Type, Palette as PaletteIcon, Zap,
  Printer, FileSpreadsheet, Upload, Move
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type StatusType = "todo" | "in-progress" | "done";
type AppStyleType = "modern" | "business" | "playful" | "feminine";
type SortOrderType = "newest" | "oldest" | "az" | "za";
type ViewMode = "grid" | "board";
type NoteType = "text" | "checklist";
type AnimationStyle = "instant" | "spring";

interface View {
  id: string;
  label: string;
  color: string;
}

interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

interface Note {
  id: string;
  title: string;
  content: string;
  date: string;
  deadline?: string;
  tags: string[];
  status: StatusType;
  view: string;
  noteType: NoteType;
  checklistItems?: ChecklistItem[];
  bgColor?: string;
}

interface Template {
  id: string;
  title: string;
  content: string;
  tags: string[];
  view: string;
  checklistItems?: ChecklistItem[];
  noteType: NoteType;
  bgColor?: string;
}

interface AppSettings {
  telegramBotToken: string;
  telegramChatId: string;
  notifications: boolean;
  compactMode: boolean;
  confirmDelete: boolean;
  autoArchive: boolean;
  theme: "light" | "dark" | "system";
  fontSize: "small" | "medium" | "large";
  appStyle: AppStyleType;
  appTitle: string;
  appSubtitle: string;
  customViews: View[];
  sortOrder: SortOrderType;
  moveDoneToBottom: boolean;
  showDates: boolean;
  clickToEdit: boolean;
  closeOnSave: boolean;
  pinCode: string;
  templates: Template[];
  viewMode: ViewMode;
  themeColor: string;
  animationStyle: AnimationStyle;
}

const STATUSES: { value: StatusType; label: string }[] = [
  { value: "todo", label: "К выполнению" },
  { value: "in-progress", label: "В процессе" },
  { value: "done", label: "Готово" },
];

const SORT_OPTIONS = [
  { value: "newest" as SortOrderType, label: "Сначала новые" },
  { value: "oldest" as SortOrderType, label: "Сначала старые" },
  { value: "az" as SortOrderType, label: "По алфавиту (А-Я)" },
  { value: "za" as SortOrderType, label: "По алфавиту (Я-А)" },
];

const STYLES = [
  { value: "modern" as AppStyleType, label: "Современный", icon: Sparkles },
  { value: "business" as AppStyleType, label: "Деловой", icon: Briefcase },
  { value: "playful" as AppStyleType, label: "Детский", icon: Smile },
  { value: "feminine" as AppStyleType, label: "Женский", icon: Heart },
];

const PREDEFINED_COLORS = [
  { value: "bg-blue-500", label: "Синий" },
  { value: "bg-rose-500", label: "Розовый" },
  { value: "bg-emerald-500", label: "Зеленый" },
  { value: "bg-amber-500", label: "Желтый" },
  { value: "bg-purple-500", label: "Фиолетовый" },
  { value: "bg-indigo-500", label: "Индиго" },
  { value: "bg-orange-500", label: "Оранжевый" },
  { value: "bg-slate-500", label: "Серый" },
];

const CARD_COLORS = [
  { value: "", label: "По умолчанию" },
  { value: "bg-red-500/10", label: "Красный" },
  { value: "bg-orange-500/10", label: "Оранжевый" },
  { value: "bg-amber-500/10", label: "Янтарный" },
  { value: "bg-green-500/10", label: "Зеленый" },
  { value: "bg-emerald-500/10", label: "Изумрудный" },
  { value: "bg-cyan-500/10", label: "Бирюзовый" },
  { value: "bg-blue-500/10", label: "Синий" },
  { value: "bg-indigo-500/10", label: "Индиго" },
  { value: "bg-violet-500/10", label: "Фиолетовый" },
  { value: "bg-fuchsia-500/10", label: "Фуксия" },
  { value: "bg-pink-500/10", label: "Розовый" },
  { value: "bg-rose-500/10", label: "Роза" },
  { value: "bg-slate-500/10", label: "Серый" },
];

const DEFAULT_VIEWS: View[] = [
  { id: "work", label: "Работа", color: "bg-blue-500" },
  { id: "family", label: "Семья", color: "bg-rose-500" },
  { id: "personal", label: "Личное", color: "bg-emerald-500" },
];

const MOM_TEMPLATES: Template[] = [
  {
    id: "tpl-shopping",
    title: "🛒 Список покупок",
    content: "",
    tags: ["магазин", "еда"],
    view: "family",
    noteType: "checklist",
    bgColor: "bg-amber-500/10",
    checklistItems: [
      { id: "1", text: "Хлебобулочные изделия", done: false },
      { id: "2", text: "Молоко / Сыр / Яйца", done: false },
      { id: "3", text: "Овощи и фрукты", done: false },
      { id: "4", text: "Мясо / Рыба", done: false },
      { id: "5", text: "Крупы / Макароны", done: false },
      { id: "6", text: "Средства гигиены", done: false },
    ]
  },
  {
    id: "tpl-routine",
    title: "🌅 Утренняя рутина",
    content: "1. Почистить зубы\n2. Сделать зарядку\n3. Позавтракать\n4. Собрать детей в школу",
    tags: ["план", "день"],
    view: "family",
    noteType: "text",
    bgColor: "bg-emerald-500/10",
  }
];

const DEFAULT_NOTES: Note[] = [
  {
    id: "1",
    title: "Проект GigaStudio",
    content: "Реализовать интерфейс для нового проекта. Учесть все требования дизайн-системы.",
    date: new Date().toLocaleDateString("ru-RU"),
    deadline: "2024-12-31",
    tags: ["dev", "ui", "urgent"],
    status: "in-progress",
    view: "work",
    noteType: "text",
    bgColor: "bg-blue-500/10",
  },
  {
    id: "2",
    title: "Купить продукты",
    content: "Молоко, хлеб, яйца, фрукты для детей.",
    date: new Date().toLocaleDateString("ru-RU"),
    deadline: "2024-10-25",
    tags: ["shop", "home"],
    status: "todo",
    view: "family",
    noteType: "checklist",
    bgColor: "bg-rose-500/10",
    checklistItems: [
      { id: "c1", text: "Молоко", done: true },
      { id: "c2", text: "Хлеб", done: false },
      { id: "c3", text: "Яблоки", done: false },
    ]
  },
];

const DEFAULT_SETTINGS: AppSettings = {
  telegramBotToken: "",
  telegramChatId: "",
  notifications: true,
  compactMode: false,
  confirmDelete: true,
  autoArchive: false,
  theme: "system",
  fontSize: "medium",
  appStyle: "modern",
  appTitle: "Мой Блокнот",
  appSubtitle: "Ваши мысли, задачи и идеи в одном месте",
  customViews: DEFAULT_VIEWS,
  sortOrder: "newest",
  moveDoneToBottom: true,
  showDates: true,
  clickToEdit: false,
  closeOnSave: true,
  pinCode: "0000",
  templates: MOM_TEMPLATES,
  viewMode: "grid",
  themeColor: "#000000",
  animationStyle: "spring",
};

const getContrastYiq = (hexcolor: string) => {
  if (!hexcolor) return 'rgb(15, 23, 42)';
  const color = hexcolor.replace('#', '');
  const r = parseInt(color.substr(0, 2), 16);
  const g = parseInt(color.substr(2, 2), 16);
  const b = parseInt(color.substr(4, 2), 16);
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return (yiq >= 128) ? 'rgb(15, 23, 42)' : 'rgb(255, 255, 255)';
};

export default function NotebookPage() {
  const [notes, setNotes, notesLoaded] = useStore<Note[]>("notebook-notes", DEFAULT_NOTES);
  const [settings, setSettings, settingsLoaded] = useStore<AppSettings>("notebook-settings", DEFAULT_SETTINGS);

  // Parallax State
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (settingsLoaded) {
      const sizeMap = { small: "text-sm", medium: "text-base", large: "text-lg" };
      const newClass = sizeMap[settings.fontSize];
      document.body.classList.remove("text-sm", "text-base", "text-lg");
      if (newClass) document.body.classList.add(newClass);
    }
  }, [settings.fontSize, settingsLoaded]);

  useEffect(() => {
    if (settingsLoaded && settings.themeColor) {
      document.documentElement.style.setProperty('--primary', settings.themeColor);
      document.documentElement.style.setProperty('--primary-foreground', getContrastYiq(settings.themeColor));
      document.documentElement.style.setProperty('--ring', settings.themeColor);
    }
  }, [settings.themeColor, settingsLoaded]);

  // Parallax Effect (Mouse & Touch)
  useEffect(() => {
    const handleMove = (clientX: number, clientY: number) => {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      
      const moveX = (clientX - centerX) / centerX;
      const moveY = (clientY - centerY) / centerY;
      
      setMousePosition({ x: moveX, y: moveY });
    };

    const handleMouseMove = (event: MouseEvent) => {
      handleMove(event.clientX, event.clientY);
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (event.touches.length > 0) {
        handleMove(event.touches[0].clientX, event.touches[0].clientY);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  // Increased multiplier for more visible parallax
  const parallaxX1 = mousePosition.x * 100; 
  const parallaxY1 = mousePosition.y * 100;
  const parallaxX2 = mousePosition.x * 200; 
  const parallaxY2 = mousePosition.y * 200;

  const isInitialized = useRef(false);
  const [tempPin, setTempPin] = useState("");
  const [confirmTempPin, setConfirmTempPin] = useState("");

  useEffect(() => {
    if (settingsLoaded && settings.pinCode === undefined) {
      setSettings({ ...settings, pinCode: "0000" });
      setTempPin("0000");
      setConfirmTempPin("0000");
    } else if (settingsLoaded && settings.pinCode !== undefined) {
      setTempPin(settings.pinCode);
      setConfirmTempPin(settings.pinCode);
    }
  }, [settingsLoaded]);

  useEffect(() => {
    if (tempPin === confirmTempPin) {
      if (settings.pinCode !== tempPin) {
        setSettings({ ...settings, pinCode: tempPin });
      }
    }
  }, [tempPin, confirmTempPin]);

  const [isLocked, setIsLocked] = useState(false);
  const [enteredPin, setEnteredPin] = useState("");
  const [isRecoveryDialogOpen, setIsRecoveryDialogOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isPrintOpen, setIsPrintOpen] = useState(false); // For print trigger if needed via dialog
  
  const [selectedView, setSelectedView] = useState<string>("all");
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [quickAddText, setQuickAddText] = useState("");

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [isCreatingNewTemplate, setIsCreatingNewTemplate] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [deadline, setDeadline] = useState("");
  const [tags, setTags] = useState("");
  const [status, setStatus] = useState<StatusType>("todo");
  const [view, setView] = useState<string>("personal");
  const [noteType, setNoteType] = useState<NoteType>("text");
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [cardColor, setCardColor] = useState<string>("");

  const [newViewName, setNewViewName] = useState("");
  const [newViewColor, setNewViewColor] = useState(PREDEFINED_COLORS[0].value);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Drag and Drop State
  const [draggedNoteId, setDraggedNoteId] = useState<string | null>(null);
  
  useEffect(() => {
    if (!isInitialized.current && settingsLoaded) {
      if (settings.pinCode && settings.pinCode.length > 0) {
        setIsLocked(true);
      } else {
        setIsLocked(false);
      }
      isInitialized.current = true;
    }
  }, [settingsLoaded]); 

  const HighlightText = ({ text, query }: { text: string; query: string }) => {
    if (!query) return <>{text}</>;
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedQuery})`, 'gi');
    const parts = text.split(regex);
    return (
      <>
        {parts.map((part, i) =>
          regex.test(part) ? (
            <mark key={i} className="bg-yellow-200/80 dark:bg-yellow-500/40 text-foreground rounded px-0.5 font-medium">
              {part}
            </mark>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </>
    );
  };

  const isOverdue = (dateString?: string) => {
    if (!dateString) return false;
    return new Date(dateString) < new Date(new Date().setHours(0,0,0,0));
  };

  const getStatusColor = (status: StatusType) => {
    switch(status) {
      case 'done': return 'text-green-500 bg-green-500/10 border-green-500/20';
      case 'in-progress': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      default: return 'text-muted-foreground bg-muted/50';
    }
  };

  const getStatusIcon = (status: StatusType) => {
     switch(status) {
      case 'done': return <CheckCircle2 className="h-3 w-3 mr-1" />;
      case 'in-progress': return <Clock className="h-3 w-3 mr-1" />;
      default: return null;
    }
  };

  const fontSizeClass = {
    small: "text-sm",
    medium: "text-base",
    large: "text-lg",
  }[settings.fontSize];

  const themeConfig = {
    modern: {
      background: "bg-background",
      deco1: "bg-primary/30 rounded-full blur-3xl animate-pulse pointer-events-none", // Increased opacity + pointer-events-none
      deco2: "bg-purple-500/30 rounded-full blur-3xl animate-pulse delay-700 pointer-events-none", // Increased opacity + pointer-events-none
      card: "bg-card/60 backdrop-blur-md border-white/10 hover:border-primary/30 shadow-lg hover:shadow-2xl hover:shadow-primary/5 rounded-xl",
      title: "font-bold tracking-tight",
      button: "shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
    },
    business: {
      background: "bg-slate-50 dark:bg-slate-950",
      deco1: "bg-slate-200 dark:bg-slate-800 rounded-none opacity-50 blur-2xl pointer-events-none",
      deco2: "hidden",
      card: "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md rounded-none",
      title: "font-semibold tracking-tight uppercase text-slate-800 dark:text-slate-200",
      button: "border-slate-900 dark:border-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
    },
    playful: {
      background: "bg-amber-50 dark:bg-orange-950/20",
      deco1: "bg-blue-400/60 rounded-[3rem] blur-2xl animate-bounce pointer-events-none", // Increased opacity
      deco2: "bg-yellow-300/60 rounded-[3rem] blur-2xl animate-bounce delay-1000 pointer-events-none", // Increased opacity
      card: "bg-white dark:bg-slate-900 border-4 border-slate-900 dark:border-white rounded-[2rem] shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] hover:-translate-y-1 hover:translate-x-1 hover:shadow-[0px_0px_0px_0px_rgba(15,23,42,1)] transition-all",
      title: "font-black italic tracking-wider text-slate-900",
      button: "bg-blue-500 text-white border-2 border-slate-900 rounded-full hover:bg-blue-400 hover:scale-105 transition-transform font-bold shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]"
    },
    feminine: {
      background: "bg-rose-50/50 dark:bg-pink-950/10",
      deco1: "bg-pink-200/60 rounded-full blur-[100px] animate-pulse pointer-events-none", // Increased opacity
      deco2: "bg-rose-200/60 rounded-full blur-[100px] animate-pulse delay-500 pointer-events-none", // Increased opacity
      card: "bg-white/80 dark:bg-slate-900/60 backdrop-blur-sm border-rose-100 dark:border-rose-900/30 rounded-2xl shadow-[0_8px_30px_rgb(244,63,94,0.08)] hover:shadow-[0_12px_40px_rgb(244,63,94,0.12)] transition-all",
      title: "font-medium tracking-wide text-rose-900 dark:text-rose-100",
      button: "bg-gradient-to-r from-rose-400 to-pink-400 text-white rounded-full hover:from-rose-300 hover:to-pink-300 shadow-md transition-all"
    }
  };

  const currentStyle = themeConfig[settings.appStyle] || themeConfig['modern'];

  // --- Drag & Drop Handlers ---
  const handleDragStart = (e: React.DragEvent, noteId: string) => {
    setDraggedNoteId(noteId);
    e.dataTransfer.effectAllowed = "move";
    // Optional: Create a custom drag image
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Necessary to allow dropping
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetStatus: StatusType) => {
    e.preventDefault();
    if (!draggedNoteId) return;

    setNotes(prev => prev.map(note => 
      note.id === draggedNoteId ? { ...note, status: targetStatus } : note
    ));
    setDraggedNoteId(null);
  };
  // -----------------------------

  const handleUnlock = () => {
    if (enteredPin === "0000") {
      if (settings.pinCode !== "0000") {
        setSettings({ ...settings, pinCode: "0000" });
        setTempPin("0000");
        setConfirmTempPin("0000");
        toast.success("PIN-код сброшен на 0000");
      } else {
        toast.success("Приложение разблокировано");
      }
      setIsLocked(false);
      setEnteredPin("");
      return;
    }

    if (enteredPin === settings.pinCode) {
      setIsLocked(false);
      setEnteredPin("");
      toast.success("Приложение разблокировано");
    } else {
      toast.error("Неверный PIN-код");
      setEnteredPin("");
    }
  };

  const handleHardReset = () => {
    if (confirm("ВНИМАНИЕ: Это полностью удалит все ваши настройки и заметки! Вы уверены, что хотите сбросить приложение?")) {
      localStorage.removeItem("notebook-settings");
      localStorage.removeItem("notebook-notes");
      window.location.reload();
    }
  };

  const handleSimulateBotRecovery = () => {
    setIsRecoveryDialogOpen(false);
    setIsLocked(false);
    toast.success("Приложение разблокировано через Telegram бота");
  };

  const resetForm = () => {
    setTitle("");
    setContent("");
    setDeadline("");
    setTags("");
    setStatus("todo");
    const defaultViewId = settings.customViews.length > 0 ? settings.customViews[0].id : "personal";
    setView(defaultViewId);
    setEditingId(null);
    setEditingTemplateId(null);
    setIsCreatingNewTemplate(false);
    setNoteType("text");
    setChecklistItems([]);
    setCardColor("");
  };

  const handleOpenDialog = (note?: Note) => {
    if (note) {
      setEditingId(note.id);
      setTitle(note.title);
      setContent(note.content);
      setDeadline(note.deadline || "");
      setTags(note.tags.join(", "));
      setStatus(note.status);
      setView(note.view);
      setNoteType(note.noteType || "text");
      setChecklistItems(note.checklistItems || []);
      setCardColor(note.bgColor || "");
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleCreateTemplate = () => {
    setIsSettingsOpen(false);
    setTimeout(() => {
        resetForm();
        setIsCreatingNewTemplate(true);
        setIsDialogOpen(true);
    }, 100);
  };

  const handleQuickAdd = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!quickAddText.trim()) return;

    const newNote: Note = {
      id: Date.now().toString(),
      title: quickAddText.trim(),
      content: "",
      date: new Date().toLocaleDateString("ru-RU"),
      tags: [],
      status: "todo",
      view: settings.customViews.length > 0 ? settings.customViews[0].id : "personal",
      noteType: "text",
    };

    setNotes([newNote, ...notes]);
    setQuickAddText("");
    toast("Быстрая заметка создана");
  };

  const handleSaveNote = () => {
    if (!title.trim() && !content.trim() && checklistItems.length === 0) return;

    let validView = settings.customViews.find(v => v.id === view)?.id;
    if (!validView) {
        validView = settings.customViews.length > 0 ? settings.customViews[0].id : "general";
    }

    const cleanedChecklistItems = checklistItems.filter(item => item.text.trim() !== "");

    const noteData = {
      title: title.trim() || "Без названия",
      content: noteType === 'text' ? content.trim() : "",
      checklistItems: noteType === 'checklist' ? cleanedChecklistItems : [],
      deadline: deadline || undefined,
      tags: tags.split(",").map(t => t.trim()).filter(Boolean),
      status,
      view: validView,
      noteType,
      bgColor: cardColor,
    };

    if (isCreatingNewTemplate) {
        const newTemplate: Template = {
            id: Date.now().toString(),
            title: title,
            content: content,
            tags: tags.split(",").map(t => t.trim()).filter(Boolean),
            view: view,
            noteType: noteType,
            checklistItems: cleanedChecklistItems,
            bgColor: cardColor,
        };
        setSettings({ ...settings, templates: [...settings.templates, newTemplate] });
        toast("Шаблон создан");
        setIsCreatingNewTemplate(false);
        setIsDialogOpen(false);
        return;
    }

    if (editingTemplateId) {
      setSettings({
        ...settings,
        templates: settings.templates.map(t => 
          t.id === editingTemplateId ? {
             ...t, ...noteData, deadline: undefined, status: undefined
          } : t
        )
      });
      toast("Шаблон обновлен");
      setIsSettingsOpen(true);
      resetForm();
      setIsDialogOpen(false);
      return;
    }

    if (editingId) {
      setNotes(notes.map(n => n.id === editingId ? { ...n, ...noteData, date: n.date } : n));
      toast("Заметка обновлена");
    } else {
      const newNote: Note = {
        id: Date.now().toString(),
        ...noteData,
        date: new Date().toLocaleDateString("ru-RU"),
      };
      setNotes([newNote, ...notes]);
      toast("Заметка создана");
    }

    resetForm();
    if (settings.closeOnSave) {
      setIsDialogOpen(false);
    }
  };

  const handleDeleteNote = (id: string) => {
    if (settings.confirmDelete && !confirm("Вы уверены, что хотите удалить эту заметку?")) return;
    setNotes(notes.filter((note) => note.id !== id));
    toast("Заметка удалена");
  };

  const handleSendToTelegram = (note: Note) => {
    if (!settings.telegramBotToken || !settings.telegramChatId) {
      toast.error("Сначала настройте Telegram в настройках");
      setIsSettingsOpen(true);
      return;
    }
    console.log("Sending to Telegram:", note);
    toast.success("Заметка отправлена в Telegram");
  };

  const handleMoveNoteStatus = (id: string, direction: 'left' | 'right') => {
    const note = notes.find(n => n.id === id);
    if (!note) return;

    const statusOrder: StatusType[] = ['todo', 'in-progress', 'done'];
    const currentIndex = statusOrder.indexOf(note.status);
    let newIndex = currentIndex;

    if (direction === 'left' && currentIndex > 0) newIndex--;
    if (direction === 'right' && currentIndex < statusOrder.length - 1) newIndex++;

    if (newIndex !== currentIndex) {
      setNotes(notes.map(n => n.id === id ? { ...n, status: statusOrder[newIndex] } : n));
    }
  };

  const handleToggleCheckItem = (noteId: string, itemId: string) => {
    setNotes(notes.map(n => {
      if (n.id !== noteId) return n;
      const newItems = n.checklistItems?.map(i =>
        i.id === itemId ? { ...i, done: !i.done } : i
      ) || [];
      return { ...n, checklistItems: newItems };
    }));
  };

  const handleExportData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(notes));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "notes_backup.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    toast("Данные экспортированы");
  };

  // CSV Export
  const handleExportCSV = () => {
    // Create CSV Header
    const headers = ["ID", "Title", "Status", "Category", "Tags", "Content", "Deadline", "Date"];
    
    // Format Data
    const rows = notes.map(n => {
        const cleanContent = n.content.replace(/(\r\n|\n|\r)/gm, " ").replace(/"/g, '""');
        const cleanTags = n.tags.join(";").replace(/"/g, '""');
        return `"${n.id}","${n.title}","${n.status}","${n.view}","${cleanTags}","${cleanContent}","${n.deadline || ''}","${n.date}"`;
    });

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(",")].concat(rows).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "notebook_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast("Экспорт в Excel (CSV) выполнен");
  };

  // CSV Import
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
        const text = evt.target?.result;
        if (!text) return;

        // Simple CSV Parser (Assumes quotes are handled by split logic roughly)
        const lines = text.split("\n");
        const importedNotes: Note[] = [];
        
        // Skip header if "Title" is in first line
        const startIndex = lines[0].includes("Title") ? 1 : 0;

        for (let i = startIndex; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            // Basic CSV parsing (handling quoted fields is complex, simplified here)
            // We'll try to match the regex for quoted values
            const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
            if (matches && matches.length >= 3) {
                const rawTitle = matches[1].replace(/^"|"$/g, '').replace(/""/g, '"');
                const rawStatus = matches[2].replace(/^"|"$/g, '').replace(/""/g, '"');
                const rawView = matches[3] ? matches[3].replace(/^"|"$/g, '').replace(/""/g, '"') : "personal";
                const rawTags = matches[4] ? matches[4].replace(/^"|"$/g, '').replace(/""/g, '"') : "";
                const rawContent = matches[5] ? matches[5].replace(/^"|"$/g, '').replace(/""/g, '"') : "";
                
                // Validate Status
                if (["todo", "in-progress", "done"].includes(rawStatus)) {
                    importedNotes.push({
                        id: Date.now().toString() + Math.random(), // New ID
                        title: rawTitle,
                        content: rawContent,
                        date: new Date().toLocaleDateString("ru-RU"),
                        status: rawStatus as StatusType,
                        view: rawView,
                        tags: rawTags ? rawTags.split(";") : [],
                        noteType: "text",
                    });
                }
            }
        }

        if (importedNotes.length > 0) {
            setNotes([...importedNotes, ...notes]);
            toast(`Импортировано ${importedNotes.length} заметок`);
        } else {
            toast.error("Не удалось прочитать файл. Проверьте формат.");
        }
        
        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.readAsText(file);
  };

  const handleWipeData = () => {
    if (confirm("ВНИМАНИЕ: Все заметки будут безвозвратно удалены! Продолжить?")) {
      setNotes([]);
      setIsSettingsOpen(false);
      toast("Все данные удалены");
    }
  };

  const handleAddView = () => {
    if (!newViewName.trim()) return;
    const newView: View = {
      id: newViewName.toLowerCase().replace(/\s+/g, '-'),
      label: newViewName,
      color: newViewColor,
    };
    
    if (settings.customViews.some(v => v.id === newView.id)) {
        toast("Категория с таким названием уже существует");
        return;
    }

    setSettings({ ...settings, customViews: [...settings.customViews, newView] });
    setNewViewName("");
    setNewViewColor(PREDEFINED_COLORS[0].value);
    toast("Категория создана");
  };

  const handleDeleteView = (id: string) => {
    if (settings.confirmDelete && !confirm("Удалить эту категорию? Заметки в ней останутся, но потеряют категорию.")) return;
    
    const newViews = settings.customViews.filter(v => v.id !== id);
    const fallbackView = newViews.length > 0 ? newViews[0].id : "all";
    
    setNotes(notes.map(n => n.view === id ? { ...n, view: fallbackView } : n));
    setSettings({ ...settings, customViews: newViews });
    
    if (selectedView === id) {
      setSelectedView("all");
    }
    toast("Категория удалена");
  };

  const cycleSortOrder = () => {
    const currentIndex = SORT_OPTIONS.findIndex(o => o.value === settings.sortOrder);
    const nextIndex = (currentIndex + 1) % SORT_OPTIONS.length;
    setSettings({ ...settings, sortOrder: SORT_OPTIONS[nextIndex].value });
    toast(`Сортировка: ${SORT_OPTIONS[nextIndex].label}`);
  };

  const handleUseTemplate = (templateId: string) => {
    const template = settings.templates.find(t => t.id === templateId);
    if (!template) return;

    resetForm();
    setTitle(template.title);
    setContent(template.content);
    setTags(template.tags.join(", "));
    setView(template.view);
    setNoteType(template.noteType);
    setChecklistItems(template.checklistItems || []);
    setCardColor(template.bgColor || "");
    setIsDialogOpen(true);
    toast("Шаблон загружен");
  };

  const handleEditTemplate = (templateId: string) => {
    const template = settings.templates.find(t => t.id === templateId);
    if (!template) return;

    setIsSettingsOpen(false);
    setTimeout(() => {
      setEditingTemplateId(templateId);
      setTitle(template.title);
      setContent(template.content);
      setTags(template.tags.join(", "));
      setView(template.view);
      setNoteType(template.noteType);
      setChecklistItems(template.checklistItems || []);
      setCardColor(template.bgColor || "");
      setIsDialogOpen(true);
    }, 100);
  };

  const handleSaveAsTemplate = () => {
    if (!title.trim()) return toast("Введите название заметки");
    const cleanedChecklistItems = checklistItems.filter(item => item.text.trim() !== "");
    const newTemplate: Template = {
      id: Date.now().toString(),
      title: title,
      content: content,
      tags: tags.split(",").map(t => t.trim()).filter(Boolean),
      view: view,
      noteType: noteType,
      checklistItems: cleanedChecklistItems,
      bgColor: cardColor,
    };

    if (settings.templates.some(t => t.id === newTemplate.id)) {
        toast("Шаблон с таким ID уже существует"); 
        return;
    }

    setSettings({ ...settings, templates: [...settings.templates, newTemplate] });
    toast("Заметка сохранена как шаблон");
  };

  const handleDeleteTemplate = (templateId: string) => {
    if (!confirm("Удалить этот шаблон?")) return;
    setSettings({ ...settings, templates: settings.templates.filter(t => t.id !== templateId) });
    toast("Шаблон удален");
  };

  const filteredNotes = notes.filter(note => {
    const isArchived = settings.autoArchive && note.status === "done";
    if (isArchived) return false;

    if (filterTag) {
      return note.tags.includes(filterTag);
    }
    
    if (selectedView !== "all") {
      const viewExists = settings.customViews.some(v => v.id === note.view);
      if (!viewExists) return false; 
      return note.view === selectedView;
    }
    
    return true;
  });

  const searchedNotes = filteredNotes.filter(note => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      note.title.toLowerCase().includes(q) ||
      note.content.toLowerCase().includes(q) ||
      note.tags.some(t => t.toLowerCase().includes(q))
    );
  });

  const displayNotes = useMemo(() => {
    let sorted = [...searchedNotes];

    const primarySort = (a: Note, b: Note) => {
      if (settings.sortOrder === 'newest') return b.id.localeCompare(a.id);
      if (settings.sortOrder === 'oldest') return a.id.localeCompare(b.id);
      if (settings.sortOrder === 'az') return a.title.localeCompare(b.title, 'ru');
      if (settings.sortOrder === 'za') return b.title.localeCompare(a.title, 'ru');
      return 0;
    };

    if (settings.moveDoneToBottom && settings.viewMode !== 'board') {
      const done = sorted.filter(n => n.status === 'done');
      const notDone = sorted.filter(n => n.status !== 'done');
      return [...notDone.sort(primarySort), ...done.sort(primarySort)];
    }

    return sorted.sort(primarySort);
  }, [searchedNotes, settings.sortOrder, settings.moveDoneToBottom, settings.viewMode]);


  if (!notesLoaded || !settingsLoaded) {
    return <div className="flex h-screen items-center justify-center text-muted-foreground">Загрузка данных...</div>;
  }

  if (isLocked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-sm p-8 space-y-6"
        >
          <div className="flex flex-col items-center space-y-2 text-center">
            <div className="p-4 rounded-full bg-primary/10">
              <Lock className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">Приложение заблокировано</h2>
            <p className="text-sm text-muted-foreground">Введите PIN-код для доступа к заметкам</p>
          </div>
          <div className="space-y-4">
            <Input 
              type="password" 
              placeholder="PIN-код"
              value={enteredPin}
              onChange={(e) => setEnteredPin(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
              maxLength={6}
              className="text-center text-2xl tracking-[1em]"
            />
            <Button onClick={handleUnlock} className="w-full" size="lg">
              Разблокировать
            </Button>
            
            <div className="pt-4 border-t flex flex-col gap-3">
                <button 
                    onClick={() => setIsRecoveryDialogOpen(true)}
                    className="w-full flex items-center justify-center gap-2 text-xs text-primary hover:text-primary/80 transition-colors"
                >
                    <HelpCircle className="h-3 w-3" />
                    Забыли PIN-код?
                </button>
                <button 
                    onClick={handleHardReset}
                    className="w-full flex items-center justify-center gap-2 text-xs text-destructive hover:text-destructive/80 transition-colors"
                >
                    <RefreshCw className="h-3 w-3" />
                    Полный сброс приложения
                </button>
            </div>
          </div>
        </motion.div>
        
        <Dialog open={isRecoveryDialogOpen} onOpenChange={setIsRecoveryDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Восстановление доступа</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <p className="text-sm text-muted-foreground">
                        Если вы забыли PIN-код, вы можете сбросить его на значение по умолчанию.
                    </p>
                    <div className="p-4 bg-secondary/50 rounded-lg border space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold">Код сброса PIN:</span>
                            <Badge variant="outline" className="font-mono text-lg">0000</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Введите этот код на экране блокировки, чтобы сбросить старый PIN.
                        </p>
                    </div>
                    <div className="pt-4 border-t flex flex-col gap-3">
                        <p className="text-xs text-center text-muted-foreground mb-2">
                            Или используйте имитацию ответа от Telegram бота:
                        </p>
                        <Button onClick={handleSimulateBotRecovery} className="w-full" variant="outline">
                            <Send className="mr-2 h-4 w-4" /> Сымитировать команду разблокировки
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className={cn("relative min-h-screen overflow-hidden transition-colors duration-500", currentStyle.background)}>
      {/* Parallax Background Blobs */}
      <div 
        className={cn("fixed top-0 left-1/4 w-96 h-96 -z-10 transition-all duration-100 ease-out", currentStyle.deco1)} 
        style={{ transform: `translate(${parallaxX1}px, ${parallaxY1}px)` }}
      />
      <div 
        className={cn("fixed bottom-0 right-1/4 w-96 h-96 -z-10 transition-all duration-100 ease-out", currentStyle.deco2)} 
        style={{ transform: `translate(${parallaxX2}px, ${parallaxY2}px)` }}
      />

      {/* Print Header (Hidden on screen, visible on print) */}
      <div className="hidden print:flex print:flex-col print:items-center print:justify-center print:border-b-2 print:border-black print:pb-4 print:mb-8 print:bg-white print:text-black print:fixed print:top-0 print:w-full print:z-50">
          <h1 className="text-3xl font-bold uppercase tracking-widest">{settings.appTitle || "NoteBook Pro"}</h1>
          <p className="text-sm font-mono mt-1 text-gray-600">Система: NEURAL_ARCHITECT_PREMIUM++v8.3</p>
          <p className="text-xs text-gray-400 mt-1">Пользователь: {settings.appSubtitle}</p>
          <p className="text-xs text-gray-400 mt-1">Дата печати: {new Date().toLocaleString('ru-RU')}</p>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12 relative z-10 flex flex-col items-center print:px-0 print:max-w-none">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-6xl flex flex-col items-center gap-8 mb-8 print:hidden"
        >
          <div className="text-center space-y-2">
            <h1 className={cn("text-5xl md:text-6xl bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/60 mb-4", currentStyle.title)}>
              {settings.appTitle || DEFAULT_SETTINGS.appTitle}
            </h1>
            <p className="text-muted-foreground text-lg">{settings.appSubtitle || DEFAULT_SETTINGS.appSubtitle}</p>
          </div>

          <div className="flex flex-wrap justify-center gap-3 w-full">
            <Button 
              variant="outline"
              size="lg" 
              onClick={() => setIsSettingsOpen(true)}
              className={cn(settings.appStyle === 'playful' ? "rounded-full border-2 border-slate-900 bg-white font-bold" : "")}
            >
              <Settings className="mr-2 h-5 w-5" />
              <span>Настройки</span>
            </Button>

            <Button 
              variant="ghost"
              size="icon"
              className={cn(settings.appStyle === 'playful' ? "rounded-full border-2 border-slate-900 bg-white font-bold w-12 h-12" : "")}
              onClick={() => setIsAboutOpen(true)}
              title="О приложении"
            >
              <Info className="h-5 w-5" />
            </Button>
            
            <Button 
              size="lg" 
              className={cn(currentStyle.button, "flex items-center px-8")}
              onClick={() => handleOpenDialog()}
            >
              <Plus className="mr-2 h-5 w-5" /> 
              <span className="font-medium">Создать</span>
            </Button>

            <Button 
              variant="outline"
              size="lg"
              onClick={() => window.print()}
              className={cn(settings.appStyle === 'playful' ? "rounded-full border-2 border-slate-900 bg-white font-bold" : "")}
              title="Печать на фирменном бланке"
            >
              <Printer className="mr-2 h-5 w-5" />
              <span className="hidden sm:inline">Печать</span>
            </Button>
          </div>

          <div className="flex flex-col items-center gap-4 w-full max-w-4xl">
             <div className="flex gap-2 w-full max-w-3xl">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Поиск по заметкам..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <Button 
                    variant="outline" 
                    size="icon"
                    onClick={cycleSortOrder}
                    title="Сменить сортировку"
                >
                    <ArrowUpDown className="h-4 w-4" />
                </Button>
                <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => setSettings({ ...settings, viewMode: settings.viewMode === 'grid' ? 'board' : 'grid' })}
                    title={settings.viewMode === 'grid' ? "Показать доской" : "Показать карточками"}
                >
                    {settings.viewMode === 'grid' ? <LayoutList className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}
                </Button>
             </div>

            <div className="flex flex-wrap justify-center gap-2 p-1 bg-muted/40 rounded-xl backdrop-blur-sm w-full">
              <Button
                variant={selectedView === "all" && !filterTag ? "default" : "ghost"}
                size="sm"
                onClick={() => { setSelectedView("all"); setFilterTag(null); }}
                className={cn(
                  "rounded-lg transition-all",
                  selectedView === "all" && !filterTag ? "bg-slate-500 text-white shadow-md" : "hover:bg-muted-foreground/10"
                )}
              >
                Все
              </Button>
              {settings.customViews.map((v) => (
                <Button
                  key={v.id}
                  variant={selectedView === v.id && !filterTag ? "default" : "ghost"}
                  size="sm"
                  onClick={() => { setSelectedView(v.id); setFilterTag(null); }}
                  className={cn(
                    "rounded-lg transition-all",
                    selectedView === v.id && !filterTag ? `${v.color} text-white shadow-md` : "hover:bg-muted-foreground/10"
                  )}
                >
                  {v.label}
                </Button>
              ))}
            </div>

            {filterTag && (
              <div className="flex items-center gap-2 text-sm animate-in slide-in-from-top-2 fade-in">
                <span className="text-muted-foreground">Фильтр по тегу:</span>
                <Badge variant="secondary" className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors" onClick={() => setFilterTag(null)}>
                  #{filterTag} <X className="h-3 w-3 ml-1" />
                </Badge>
              </div>
            )}
          </div>
        </motion.div>

        <form onSubmit={handleQuickAdd} className="w-full max-w-3xl mb-8 print:hidden">
            <div className="flex gap-2">
                <Input 
                    placeholder="Быстрая заметка... (Нажмите Enter)" 
                    value={quickAddText}
                    onChange={(e) => setQuickAddText(e.target.value)}
                    className="bg-card/50 backdrop-blur-sm border-border"
                />
                <Button type="submit" size="icon" className="shadow-md">
                    <Plus className="h-5 w-5" />
                </Button>
            </div>
        </form>

        {settings.viewMode === 'grid' ? (
          <>
            {displayNotes.length === 0 && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20 text-muted-foreground/60 w-full flex justify-center"
              >
                <div className="flex flex-col items-center gap-4">
                  <div className="p-6 rounded-full bg-muted/30">
                    <Sparkles className="h-12 w-12 opacity-30" />
                  </div>
                  <p className="text-xl font-medium">Нет заметок</p>
                </div>
              </motion.div>
            )}

            <div className="columns-1 md:columns-2 lg:columns-3 gap-6 w-full space-y-6 print:columns-1 print:max-w-4xl print:mx-auto print:block">
              <AnimatePresence mode="popLayout">
                {displayNotes.map((note) => {
                    const currentViewData = settings.customViews.find(v => v.id === note.view);
                    const isChecklist = note.noteType === "checklist";
                    const totalItems = note.checklistItems?.length || 0;
                    const doneItems = note.checklistItems?.filter(i => i.done).length || 0;
                    const remainingItems = totalItems - doneItems;
                    const progress = totalItems > 0 ? (doneItems / totalItems) * 100 : 0;

                    return (
                    <motion.div
                      key={note.id}
                      layout
                      transition={settings.animationStyle === 'spring' 
                        ? { type: "spring", stiffness: 300, damping: 30 } 
                        : { duration: 0.2 }
                      }
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                      className="break-inside-avoid mb-6 print:mb-4 print:break-inside-auto"
                    >
                      <Card 
                        className={cn(
                          "group h-full flex flex-col transition-all duration-300",
                          currentStyle.card,
                          settings.clickToEdit && "cursor-pointer hover:bg-accent/20",
                          settings.compactMode && "py-2",
                          note.bgColor,
                          "print:shadow-none print:border print:border-gray-300 print:bg-white print:rounded-none print:p-4"
                        )}
                        onClick={() => settings.clickToEdit && handleOpenDialog(note)}
                      >
                        <CardHeader className={cn("flex flex-row items-start justify-between space-y-0 pb-3", settings.compactMode && "pb-2 px-4")}>
                          <div className="flex-1 pointer-events-none">
                            <div className="flex items-center gap-2 mb-2">
                              {currentViewData && (
                                <Badge 
                                  variant="outline" 
                                  className={cn("text-xs font-semibold", currentViewData.color, "text-white border-0", settings.compactMode && "text-[10px] px-1.5 py-0", "print:text-black print:bg-white print:border-black")}
                                >
                                  {currentViewData.label}
                                </Badge>
                              )}
                              {note.deadline && (
                                <Badge 
                                  variant="outline" 
                                  className={cn("text-xs", isOverdue(note.deadline) ? 'text-red-500 bg-red-500/10 border-red-500/20' : 'text-muted-foreground', settings.compactMode && "hidden", "print:text-black print:bg-white print:border-gray-400")}
                                >
                                  {isOverdue(note.deadline) && <span className="mr-1">⚠️</span>}
                                  {new Date(note.deadline).toLocaleDateString("ru-RU", { day: 'numeric', month: 'short' })}
                                </Badge>
                              )}
                            </div>
                            <CardTitle className={cn("leading-tight group-hover:text-primary transition-colors", currentStyle.title, settings.compactMode ? "text-base" : "text-xl", "print:text-black print:font-bold print:text-lg")}>
                              <HighlightText text={note.title} query={searchQuery} />
                            </CardTitle>
                          </div>
                          <div className="flex gap-1 pointer-events-auto print:hidden" onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleSendToTelegram(note)}
                              className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-500/10 transition-colors"
                              title="Отправить в Telegram"
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenDialog(note)}
                              className="h-8 w-8 text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteNote(note.id)}
                              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className={cn("space-y-4 flex-1 flex flex-col", settings.compactMode && "space-y-2 px-4 pb-4")}>
                          <div className="flex-1">
                            {isChecklist ? (
                                <>
                                    {totalItems > 0 && (
                                        <div className="mb-3 space-y-1 pointer-events-none print:hidden">
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="text-muted-foreground font-medium">{doneItems}/{totalItems} выполнено</span>
                                                {remainingItems > 0 && <span className="text-primary font-bold">осталось {remainingItems}</span>}
                                            </div>
                                            <div className="w-full bg-secondary/50 h-1.5 rounded-full overflow-hidden">
                                                <div 
                                                    className="bg-primary h-full rounded-full transition-all duration-500"
                                                    style={{ width: `${progress}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    )}
                                    
                                    <div className="space-y-2 pointer-events-auto">
                                        {note.checklistItems?.map((item, idx) => (
                                            <div key={item.id} className={cn("flex items-start gap-2 text-sm group", item.done && "opacity-50", "print:block")}>
                                                <button 
                                                    role="checkbox"
                                                    aria-checked={item.done}
                                                    aria-label={item.done ? "Отметить как невыполненное" : "Отметить как выполненное"}
                                                    className={cn("mt-1 w-4 h-4 rounded border border-foreground/20 flex items-center justify-center shrink-0 transition-colors cursor-pointer print:hidden", item.done ? "bg-primary border-primary text-primary-foreground" : "hover:bg-accent")}
                                                    onClick={() => handleToggleCheckItem(note.id, item.id)}
                                                >
                                                    {item.done && <Check className="h-3 w-3" />}
                                                </button>
                                                <div className="print:hidden"><span className={cn("text-sm break-words", item.done && "line-through text-muted-foreground")}><HighlightText text={item.text} query={searchQuery} /></span></div>
                                                <span className="hidden print:inline print:text-black">• {item.text}</span>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <div className="whitespace-pre-wrap text-sm leading-relaxed text-card-foreground/80 font-light space-y-1 pointer-events-none print:text-black">
                                    {contentToLines(note.content).map((line, i) => (
                                        <div key={i} className="flex gap-2">
                                            {isNumberedList(line) && <span className="text-muted-foreground text-xs font-mono print:text-black">{i+1}.</span>}
                                            <span className={cn(isNumberedList(line) && "flex-1")}>
                                                <HighlightText text={line.replace(/^\d+\.\s*/, '')} query={searchQuery} />
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                          </div>
                          
                          <div className={cn("pt-2 border-t border-border/40", settings.compactMode && "pt-1 pointer-events-none", "print:mt-4 print:border-t print:border-gray-300")}>
                            <div className="flex items-center justify-between mb-2">
                              {settings.showDates && (
                                <span className="text-xs text-muted-foreground print:text-black">
                                  {note.date}
                                </span>
                              )}
                              <Badge className={cn("text-xs border", getStatusColor(note.status), settings.compactMode && "text-[10px]", "print:text-black print:bg-white print:border-gray-400")}>
                                {getStatusIcon(note.status)}
                                {STATUSES.find(s => s.value === note.status)?.label}
                              </Badge>
                            </div>

                            {!settings.compactMode && note.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 pointer-events-auto" onClick={(e) => e.stopPropagation()}>
                                {note.tags.map((tag, idx) => (
                                  <button 
                                    key={idx} 
                                    onClick={() => setFilterTag(tag)}
                                    className="text-xs px-2 py-0.5 rounded-full bg-secondary/50 text-secondary-foreground/80 hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer flex items-center gap-1"
                                  >
                                    <Hash className="h-2.5 w-2.5" /> {tag}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                    );
                })}
              </AnimatePresence>
            </div>
          </>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full items-start print:grid-cols-1 print:max-w-4xl print:mx-auto">
            {STATUSES.map((status) => (
                <div key={status.value} className="bg-muted/30 rounded-xl p-4 space-y-4 border border-border/40 print:bg-white print:border-gray-300 print:p-0 print:mb-12">
                    <div className="flex items-center justify-between sticky top-0 bg-background/95 backdrop-blur p-1 rounded-lg border border-border z-10 print:hidden">
                        <div className="flex items-center gap-2">
                            <div className={cn("w-3 h-3 rounded-full", getStatusColor(status.value).split(' ')[2])} />
                            <h3 className="font-semibold text-sm">{status.label}</h3>
                            <Badge variant="secondary" className="text-xs">
                                {displayNotes.filter(n => n.status === status.value).length}
                            </Badge>
                        </div>
                        <Button size="icon-sm" variant="ghost" onClick={() => {
                            resetForm();
                            setStatus(status.value as StatusType);
                            handleOpenDialog();
                        }}>
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>
                    
                    {/* Print-only Header for Board Columns */}
                    <div className="hidden print:block print:border-b-2 print:border-black print:mb-4 print:pb-2 print:uppercase print:tracking-widest print:font-bold">
                        {status.label}
                    </div>

                    <ScrollArea className="h-[60vh] pr-2 print:h-auto print:overflow-visible">
                        <div className="space-y-3" 
                             onDragOver={handleDragOver} 
                             onDrop={(e) => handleDrop(e, status.value)}
                             className={cn(draggedNoteId && "bg-accent/20 transition-colors min-h-[100px] rounded-lg p-2 border-2 border-dashed border-transparent", draggedNoteId && "border-primary/50")}
                        >
                            {displayNotes.filter(n => n.status === status.value).map((note) => (
                                <Card 
                                    key={note.id}
                                    draggable={true}
                                    onDragStart={(e) => handleDragStart(e, note.id)}
                                    className={cn(
                                        "p-4 shadow-sm hover:shadow-md transition-all cursor-pointer group border-l-4 select-none",
                                        currentStyle.card,
                                        getStatusColor(note.status).split(' ').slice(2).join(' ').replace('border-', 'border-l-'),
                                        note.bgColor,
                                        "print:shadow-none print:border print:border-gray-300 print:bg-white print:rounded-none print:p-4 print:mb-6"
                                    )}
                                    onClick={() => handleOpenDialog(note)}
                                >
                                    <div className="flex justify-between items-start mb-2 print:flex-col">
                                        <h4 className="font-medium text-sm line-clamp-2 flex-1 print:text-black print:text-lg print:font-bold">
                                            <HighlightText text={note.title} query={searchQuery} />
                                        </h4>
                                        <div className="flex gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity print:hidden">
                                            <Button 
                                                size="icon-sm" 
                                                variant="ghost"
                                                onClick={(e) => { e.stopPropagation(); handleDeleteNote(note.id); }}
                                            >
                                                <Trash2 className="h-3 w-3 text-destructive" />
                                            </Button>
                                        </div>
                                    </div>
                                    
                                    {note.noteType === "checklist" && note.checklistItems && note.checklistItems.length > 0 && (
                                        <div className="mb-3">
                                            <div className="hidden print:block print:mb-2 print:font-bold print:uppercase print:text-xs">
                                                Чек-лист
                                            </div>
                                            <div className="space-y-1 pointer-events-auto">
                                                {note.checklistItems.map((item, idx) => (
                                                    <div key={item.id} className="flex items-start gap-2 group/item">
                                                        <button 
                                                            role="checkbox"
                                                            aria-checked={item.done}
                                                            aria-label={item.done ? "Отметить как невыполненное" : "Отметить как выполненное"}
                                                            className={cn("mt-0.5 w-4 h-4 rounded-sm border flex items-center justify-center cursor-pointer transition-colors print:hidden", item.done ? "bg-primary border-primary text-primary-foreground" : "border-foreground/30 hover:border-primary")}
                                                            onClick={() => handleToggleCheckItem(note.id, item.id)}
                                                        >
                                                            {item.done && <Check className="h-3 w-3" />}
                                                        </button>
                                                        <span className={cn("text-xs leading-snug break-words", item.done && "line-through text-muted-foreground", "print:block print:text-black")}>
                                                            {item.done ? <s>{item.text}</s> : item.text}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-border/50 print:border-t print:border-gray-300">
                                        {note.deadline && (
                                            <span className="text-xs text-muted-foreground flex items-center gap-1 print:text-black">
                                                <Calendar className="h-3 w-3" /> {new Date(note.deadline).toLocaleDateString('ru-RU', {day: 'numeric', month: 'short'})}
                                            </span>
                                        )}
                                        <div className="hidden print:flex print:uppercase print:text-xs print:font-bold print:tracking-wider">
                                            {note.view}
                                        </div>
                                        <div className="flex gap-1 print:hidden">
                                            <Button 
                                                size="icon-sm" 
                                                variant="outline" 
                                                disabled={status.value === 'todo'}
                                                onClick={(e) => { e.stopPropagation(); handleMoveNoteStatus(note.id, 'left'); }}
                                                title="Назад"
                                            >
                                                <ChevronLeft className="h-3 w-3" />
                                            </Button>
                                            <Button 
                                                size="icon-sm" 
                                                variant="outline" 
                                                disabled={status.value === 'done'}
                                                onClick={(e) => { e.stopPropagation(); handleMoveNoteStatus(note.id, 'right'); }}
                                                title="Вперед"
                                            >
                                                <ChevronRight className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </ScrollArea>
                </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
      }}>
        <DialogContent className="sm:max-w-[600px] border-primary/20 bg-card/95 backdrop-blur-xl h-[90vh] flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle className="flex items-center gap-2">
              {(isCreatingNewTemplate || editingTemplateId) && <Copy className="h-5 w-5 text-primary" />}
              {isCreatingNewTemplate ? "Создание шаблона" : (editingTemplateId ? "Редактирование шаблона" : (editingId ? "Редактирование заметки" : "Создание заметки"))}
            </DialogTitle>
          </DialogHeader>
          
          {!editingId && !editingTemplateId && !isCreatingNewTemplate && (
              <div className="mb-2 shrink-0">
                  <Label className="text-xs text-muted-foreground mb-2 block">Или начните с шаблона:</Label>
                  <div className="flex flex-wrap gap-2">
                      {settings.templates.map(t => (
                          <Button key={t.id} variant="outline" size="sm" onClick={() => handleUseTemplate(t.id)}>
                              <Copy className="h-3 w-3 mr-1" /> {t.title}
                          </Button>
                      ))}
                  </div>
              </div>
          )}

          <ScrollArea className="flex-1 pr-4 -mr-2 min-h-0">
            <div className="space-y-3 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Тип заметки</label>
                  <div className="flex gap-2 p-1 bg-muted/40 rounded-lg">
                    <button 
                        onClick={() => setNoteType('text')}
                        className={cn("flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md text-sm transition-all", noteType === 'text' ? "bg-background shadow-sm" : "hover:bg-background/50")}
                    >
                        <Type className="h-4 w-4" /> Текст
                    </button>
                    <button 
                        onClick={() => setNoteType('checklist')}
                        className={cn("flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md text-sm transition-all", noteType === 'checklist' ? "bg-background shadow-sm" : "hover:bg-background/50")}
                    >
                        <CheckSquare className="h-4 w-4" /> Чек-лист
                    </button>
                  </div>
                </div>
                {!isCreatingNewTemplate && !editingTemplateId && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Статус</label>
                      <Select value={status} onValueChange={(v: StatusType) => setStatus(v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Статус" />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUSES.map(s => (
                            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                )}
              </div>

              <Input
                placeholder="Заголовок"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-lg font-medium"
              />

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                   <PaletteIcon className="h-4 w-4 text-muted-foreground"/> Цвет карточки
                </label>
                <div className="flex flex-wrap gap-2">
                  {CARD_COLORS.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => setCardColor(color.value)}
                      className={cn(
                        "w-8 h-8 rounded-full border transition-transform hover:scale-110 relative shrink-0",
                        cardColor === color.value ? "ring-2 ring-offset-2 ring-primary" : "ring-offset-2",
                        color.value || "bg-muted"
                      )}
                      title={color.label}
                    >
                      {cardColor === color.value && <Check className="h-4 w-4 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-foreground" />}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Категория</label>
                  <Select value={view} onValueChange={setView}>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите категорию" />
                    </SelectTrigger>
                    <SelectContent>
                      {settings.customViews.map(v => (
                        <SelectItem key={v.id} value={v.id}>{v.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {!isCreatingNewTemplate && !editingTemplateId && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Дедлайн</label>
                      <Input
                        type="date"
                        value={deadline}
                        onChange={(e) => setDeadline(e.target.value)}
                      />
                    </div>
                )}
              </div>

              {noteType === 'text' ? (
                <div className="space-y-2">
                    <label className="text-sm font-medium">Содержание</label>
                    <Textarea
                        placeholder="Описание задачи..."
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        rows={4}
                        className="resize-none font-mono text-sm"
                    />
                    <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setContent(prev => prev + '\n1. ')}>+ Нумерованный список</Button>
                        <Button variant="ghost" size="sm" onClick={() => setContent(prev => prev + '\n- ')}>+ Маркированный</Button>
                    </div>
                </div>
              ) : (
                <div className="space-y-2">
                    <label className="text-sm font-medium flex justify-between">
                        <span>Список задач</span>
                        <span className="text-xs text-muted-foreground">{checklistItems.filter(i => i.done).length}/{checklistItems.length} выполнено</span>
                    </label>
                    <div className="border rounded-lg bg-background/50 flex flex-col">
                        <ScrollArea className="max-h-[500px] w-full pr-2">
                            <div className="p-2 space-y-2">
                                {checklistItems.map((item, idx) => (
                                    <div key={item.id} className="flex gap-2 items-center group">
                                        <button 
                                            onClick={() => setChecklistItems(checklistItems.map(i => i.id === item.id ? { ...i, done: !i.done } : i))}
                                            className={cn("w-5 h-5 rounded border flex items-center justify-center transition-colors shrink-0", item.done ? "bg-primary border-primary text-primary-foreground" : "border-foreground/20 hover:border-foreground")}
                                        >
                                            {item.done && <Check className="h-3 w-3" />}
                                        </button>
                                        <Input 
                                            value={item.text} 
                                            onChange={(e) => setChecklistItems(checklistItems.map(i => i.id === item.id ? { ...i, text: e.target.value } : i))}
                                            className="h-8 text-sm"
                                        />
                                        <Button 
                                            size="icon-sm" 
                                            variant="ghost" 
                                            onClick={() => setChecklistItems(checklistItems.filter(i => i.id !== item.id))}
                                            className="opacity-0 group-hover:opacity-100 text-destructive shrink-0"
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </div>
                                ))}
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="w-full justify-start text-muted-foreground border-dashed border"
                                    onClick={() => setChecklistItems([...checklistItems, { id: Date.now().toString(), text: '', done: false }])}
                                >
                                    <Plus className="h-4 w-4 mr-1" /> Добавить пункт
                                </Button>
                            </div>
                        </ScrollArea>
                    </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Теги</label>
                <Input
                  placeholder="через запятую"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                />
              </div>
            </div>
          </ScrollArea>

          <div className="flex justify-between pt-4 border-t shrink-0">
            <div>
                {!isCreatingNewTemplate && !editingId && !editingTemplateId && (
                    <Button variant="ghost" size="sm" onClick={handleSaveAsTemplate}>
                        <Copy className="h-4 w-4 mr-1" /> В шаблоны
                    </Button>
                )}
            </div>
            <div className="flex gap-3">
                <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>Отмена</Button>
                <Button onClick={handleSaveNote} className="shadow-md">
                    {isCreatingNewTemplate ? "Создать шаблон" : (editingTemplateId ? "Обновить шаблон" : (editingId ? "Сохранить изменения" : "Создать заметку"))}
                </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isSettingsOpen} onOpenChange={(open) => {
          setIsSettingsOpen(open);
          if (!open) {
             setTempPin(settings.pinCode);
             setConfirmTempPin(settings.pinCode);
          }
      }}>
        <DialogContent className="sm:max-w-[700px] max-h-[85vh] bg-card/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Settings className="h-6 w-6 text-primary" />
              Настройки
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-6 py-4">
              
              <div className="space-y-4">
                <h3 className="flex items-center gap-2 text-lg font-semibold">
                  <Sparkles className="h-4 w-4" /> Название приложения
                </h3>
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="app-title">Название</Label>
                    <Input 
                      id="app-title"
                      value={settings.appTitle || ""}
                      onChange={(e) => setSettings({...settings, appTitle: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="app-subtitle">Подзаголовок</Label>
                    <Input 
                      id="app-subtitle"
                      value={settings.appSubtitle || ""}
                      onChange={(e) => setSettings({...settings, appSubtitle: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="flex items-center gap-2 text-lg font-semibold">
                  <Shield className="h-4 w-4" /> Безопасность
                </h3>
                <div className="grid gap-4 p-4 rounded-lg border border-border/50 bg-secondary/20">
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="pin-code-new">Новый PIN-код</Label>
                      <Input 
                        id="pin-code-new"
                        type="password"
                        placeholder="Введите новый PIN"
                        value={tempPin}
                        onChange={(e) => setTempPin(e.target.value)}
                        maxLength={6}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pin-code-confirm">Подтвердите PIN-код</Label>
                      <div className="relative">
                        <Input 
                          id="pin-code-confirm"
                          type="password"
                          placeholder="Повторите PIN"
                          value={confirmTempPin}
                          onChange={(e) => setConfirmTempPin(e.target.value)}
                          maxLength={6}
                          className={cn(
                            confirmTempPin && 
                            (confirmTempPin === tempPin 
                              ? "border-green-500 text-green-700 focus-visible:ring-green-500" 
                              : "border-destructive text-destructive focus-visible:ring-destructive")
                          )}
                        />
                        {confirmTempPin && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            {confirmTempPin === tempPin ? 
                              <Check className="h-4 w-4 text-green-500" /> : 
                              <XCircle className="h-4 w-4 text-destructive" />
                            }
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {confirmTempPin === "" 
                          ? "PIN-код должен содержать от 1 до 6 цифр. Оставьте поля пустыми, чтобы отключить блокировку." 
                          : confirmTempPin === tempPin 
                            ? "PIN-коды совпадают" 
                            : "PIN-коды не совпадают"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="flex items-center gap-2 text-lg font-semibold">
                  <Briefcase className="h-4 w-4" /> Категории (Вкладки)
                </h3>
                
                <div className="flex flex-wrap gap-2 mb-4">
                    {settings.customViews.map((v) => (
                        <div key={v.id} className="flex items-center gap-2 p-2 rounded-md bg-secondary/20 border border-border/50 group">
                            <div className={cn("w-3 h-3 rounded-full", v.color)}></div>
                            <span className="text-sm font-medium">{v.label}</span>
                            <Button 
                                variant="ghost" 
                                size="icon-sm" 
                                className="h-6 w-6 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => handleDeleteView(v.id)}
                            >
                                <X className="h-3 w-3" />
                            </Button>
                        </div>
                    ))}
                </div>

                <div className="p-4 rounded-lg border border-border/50 bg-secondary/10">
                  <div className="grid grid-cols-[1fr_auto_auto] gap-2">
                    <Input 
                      placeholder="Название категории"
                      value={newViewName}
                      onChange={(e) => setNewViewName(e.target.value)}
                    />
                    <Select value={newViewColor} onValueChange={setNewViewColor}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PREDEFINED_COLORS.map(c => (
                            <SelectItem key={c.value} value={c.value}>
                                <div className="flex items-center gap-2">
                                    <div className={cn("w-3 h-3 rounded-full", c.value)}></div>
                                    {c.label}
                                </div>
                            </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button size="icon" onClick={handleAddView} disabled={!newViewName.trim()}>
                        <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="flex items-center gap-2 text-lg font-semibold">
                    <Copy className="h-4 w-4" /> Шаблоны
                    </h3>
                    <Button size="sm" variant="outline" onClick={handleCreateTemplate} className="h-8">
                        <Plus className="h-4 w-4 mr-1" /> Добавить
                    </Button>
                </div>
                <div className="space-y-2">
                    {settings.templates.length === 0 && <p className="text-sm text-muted-foreground">Нет шаблонов</p>}
                    {settings.templates.map(t => (
                        <div key={t.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                            <div className="flex-1">
                                <span className="font-medium text-sm">{t.title}</span>
                                <div className="text-xs text-muted-foreground mt-1">{t.tags.join(', ')}</div>
                            </div>
                            <div className="flex gap-2">
                                <Button 
                                    variant="ghost" 
                                    size="icon-sm" 
                                    onClick={() => handleEditTemplate(t.id)}
                                    className="text-primary hover:text-primary/70"
                                    title="Редактировать"
                                >
                                    <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button 
                                    variant="ghost" 
                                    size="icon-sm" 
                                    className="text-destructive hover:bg-destructive/10"
                                    onClick={() => handleDeleteTemplate(t.id)}
                                    title="Удалить"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="flex items-center gap-2 text-lg font-semibold">
                  <Palette className="h-4 w-4" /> Внешний вид
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2 col-span-2">
                    <Label>Стиль приложения</Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {STYLES.map((style) => {
                        const Icon = style.icon;
                        return (
                          <button
                            key={style.value}
                            onClick={() => setSettings({...settings, appStyle: style.value})}
                            className={cn(
                              "flex flex-col items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all",
                              settings.appStyle === style.value 
                                ? "border-primary bg-primary/5 ring-2 ring-primary/20" 
                                : "border-border hover:bg-accent/50"
                            )}
                          >
                            <Icon className={cn("h-5 w-5", settings.appStyle === style.value ? "text-primary" : "text-muted-foreground")} />
                            <span className="text-xs font-medium">{style.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Акцентный цвет системы</Label>
                    <div className="flex items-center gap-3 p-2 border rounded-lg bg-secondary/20">
                        <input 
                            type="color" 
                            value={settings.themeColor || "#000000"}
                            onChange={(e) => setSettings({...settings, themeColor: e.target.value})}
                            className="h-10 w-10 p-0.5 rounded cursor-pointer bg-transparent border-0"
                        />
                        <div className="flex-1 space-y-1">
                            <p className="text-sm font-medium">Выбор цвета</p>
                            <p className="text-xs text-muted-foreground">Меняет основные кнопки и акценты.</p>
                        </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Стиль анимации</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button 
                        variant={settings.animationStyle === 'instant' ? "default" : "outline"}
                        onClick={() => setSettings({...settings, animationStyle: 'instant'})}
                        className="text-sm"
                      >
                        Резкий
                      </Button>
                      <Button 
                        variant={settings.animationStyle === 'spring' ? "default" : "outline"}
                        onClick={() => setSettings({...settings, animationStyle: 'spring'})}
                        className="text-sm"
                      >
                        <Zap className="h-4 w-4 mr-2"/> Мягкий (Гравитация)
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Размер шрифта</Label>
                    <Select 
                      value={settings.fontSize} 
                      onValueChange={(value: any) => setSettings({...settings, fontSize: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="small">Маленький</SelectItem>
                        <SelectItem value="medium">Средний</SelectItem>
                        <SelectItem value="large">Большой</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="flex items-center gap-2 text-lg font-semibold">
                  <Sliders className="h-4 w-4" /> Поведение и Сортировка
                </h3>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-2">
                    <Label>Сортировка по умолчанию</Label>
                    <Select 
                      value={settings.sortOrder} 
                      onValueChange={(value: SortOrderType) => setSettings({...settings, sortOrder: value})}
                    >
                      <SelectTrigger>
                        <ArrowUpDown className="mr-2 h-4 w-4" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SORT_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Компактный вид</Label>
                      <p className="text-xs text-muted-foreground">Меньше деталей на карточке</p>
                    </div>
                    <Switch 
                      checked={settings.compactMode}
                      onCheckedChange={(checked) => setSettings({...settings, compactMode: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Выполненные внизу</Label>
                      <p className="text-xs text-muted-foreground">Перемещать готовые задачи в конец списка</p>
                    </div>
                    <Switch 
                      checked={settings.moveDoneToBottom}
                      onCheckedChange={(checked) => setSettings({...settings, moveDoneToBottom: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Показывать даты</Label>
                      <p className="text-xs text-muted-foreground">Отображать дату создания на карточке</p>
                    </div>
                    <Switch 
                      checked={settings.showDates}
                      onCheckedChange={(checked) => setSettings({...settings, showDates: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Клик по карточке</Label>
                      <p className="text-xs text-muted-foreground">Открывать редактирование при нажатии на заметку</p>
                    </div>
                    <Switch 
                      checked={settings.clickToEdit}
                      onCheckedChange={(checked) => setSettings({...settings, clickToEdit: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Закрыть после сохранения</Label>
                      <p className="text-xs text-muted-foreground">Автоматически закрывать окно редактирования</p>
                    </div>
                    <Switch 
                      checked={settings.closeOnSave}
                      onCheckedChange={(checked) => setSettings({...settings, closeOnSave: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Подтверждение удаления</Label>
                      <p className="text-xs text-muted-foreground">Спрашивать перед удалением</p>
                    </div>
                    <Switch 
                      checked={settings.confirmDelete}
                      onCheckedChange={(checked) => setSettings({...settings, confirmDelete: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Автоархивация</Label>
                      <p className="text-xs text-muted-foreground">Скрывать выполненные задачи</p>
                    </div>
                    <Switch 
                      checked={settings.autoArchive}
                      onCheckedChange={(checked) => setSettings({...settings, autoArchive: checked})}
                    />
                  </div>

                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="flex items-center gap-2 text-lg font-semibold text-primary">
                  <Send className="h-4 w-4" /> Интеграции
                </h3>
                <div className="grid gap-4 p-4 rounded-lg border border-border/50 bg-secondary/20">
                  <div className="space-y-2">
                    <Label htmlFor="bot-token">Telegram Bot Token</Label>
                    <Input 
                      id="bot-token" 
                      placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                      value={settings.telegramBotToken || ""}
                      onChange={(e) => setSettings({...settings, telegramBotToken: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="chat-id">Chat ID</Label>
                    <Input 
                      id="chat-id" 
                      placeholder="123456789"
                      value={settings.telegramChatId || ""}
                      onChange={(e) => setSettings({...settings, telegramChatId: e.target.value})}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Используйте @BotFather для создания бота и получения токена.
                  </p>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="flex items-center gap-2 text-lg font-semibold text-destructive">
                  <Shield className="h-4 w-4" /> Данные
                </h3>
                <div className="grid gap-3">
                  <Button variant="outline" className="justify-start" onClick={handleExportCSV}>
                    <FileSpreadsheet className="mr-2 h-4 w-4" /> Экспорт в Excel (CSV)
                  </Button>
                  <Button variant="outline" className="justify-start" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="mr-2 h-4 w-4" /> Импорт из CSV
                  </Button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept=".csv" 
                    onChange={handleImportCSV} 
                  />
                  <Button variant="outline" className="justify-start" onClick={handleExportData}>
                    <Download className="mr-2 h-4 w-4" /> Экспорт (JSON)
                  </Button>
                  <Button variant="destructive" className="justify-start" onClick={handleWipeData}>
                    <Trash2 className="mr-2 h-4 w-4" /> Удалить все данные
                  </Button>
                </div>
              </div>

            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <Dialog open={isAboutOpen} onOpenChange={setIsAboutOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Info className="h-6 w-6 text-primary" />
              Notebook
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-1">Авторское приложение</h2>
              <div className="h-px w-20 bg-primary/20 mx-auto"></div>
            </div>

            <div className="space-y-4 text-sm">
              <div className="flex items-center justify-between border-b pb-2">
                <span className="text-muted-foreground">Автор</span>
                <span className="font-medium">Смолянинова А.В.</span>
              </div>
              <div className="flex items-center justify-between border-b pb-2">
                <span className="text-muted-foreground">Система разработки</span>
                <span className="font-medium font-mono text-xs">NEURAL_ARCHITECT_PREMIUM++v8.3</span>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Контакты и ссылки</h3>
              <div className="grid gap-2">
                <a 
                  href="https://dzen.ru/asv_prod" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary/80 transition-colors group"
                >
                  <span className="flex items-center gap-2 font-medium">Дзен</span>
                  <span className="text-muted-foreground text-xs flex items-center gap-1 group-hover:text-primary">
                    dzen.ru/asv_prod <ExternalLink className="h-3 w-3" />
                  </span>
                </a>
                <a 
                  href="https://t.me/asv_prod" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary/80 transition-colors group"
                >
                  <span className="flex items-center gap-2 font-medium">Telegram</span>
                  <span className="text-muted-foreground text-xs flex items-center gap-1 group-hover:text-primary">
                    asv_prod <ExternalLink className="h-3 w-3" />
                  </span>
                </a>
                <a 
                  href="https://vk.com/smolyaninovchef" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary/80 transition-colors group"
                >
                  <span className="flex items-center gap-2 font-medium">ВК</span>
                  <span className="text-muted-foreground text-xs flex items-center gap-1 group-hover:text-primary">
                    smolyaninovchef <ExternalLink className="h-3 w-3" />
                  </span>
                </a>
              </div>
            </div>

            <div className="pt-4 border-t text-center">
              <p className="text-xs text-muted-foreground">
                По вопросам сотрудничества: dzen.ru/asv_prod и телеграмм и вк
              </p>
            </div>

            <div className="text-center pt-2">
              <p className="text-sm font-medium text-foreground">Смолянинова А.В., 2026</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function contentToLines(content: string): string[] {
    if (!content) return [];
    return content.split('\n');
}
function isNumberedList(line: string): boolean {
    return /^\d+\.\s+/.test(line);
}