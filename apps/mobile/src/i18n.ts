/**
 * RestoCash i18n — multi-locale dictionary with persistence.
 *
 * Architecture:
 *   - `dictionaries` holds one Dictionary per supported locale.
 *   - `getLocale()` reads/writes the current locale via AsyncStorage (or
 *     the expo-file-system fallback used elsewhere in this app).
 *   - `useT()` is the React hook screens should use; it re-renders on
 *     locale change so switching is live without an app reload.
 *   - `setLocale()` persists + notifies subscribers.
 *   - Western digits are kept for currency/timestamps/IDs regardless of
 *     locale — only the language strings change.
 */

import { useCallback, useSyncExternalStore } from "react";
import * as FileSystem from "expo-file-system";

export type Locale = "ar" | "pt-BR";
const DEFAULT_LOCALE: Locale = "ar";
const STORAGE_FILE = `${FileSystem.documentDirectory ?? ""}restocash-locale.txt`;

export const LOCALES: { code: Locale; label: string; flag: string }[] = [
  { code: "ar", label: "العربية", flag: "🇸🇦" },
  { code: "pt-BR", label: "Português", flag: "🇧🇷" },
];

export type Dictionary = {
  common: {
    total: string;
    items: string;
    item: string;
    items_plural: string;
    sales: string;
    sale: string;
    products: string;
    customer: string;
    cashier: string;
    operator: string;
    date: string;
    time: string;
    close: string;
    cancel: string;
    confirm: string;
    save: string;
    delete: string;
    edit: string;
    back: string;
    search: string;
    refresh: string;
    loading: string;
    error: string;
    retry: string;
    empty: string;
    today: string;
    yesterday: string;
  };
  payment: { CASH: string; PIX: string; CARD_DEBIT: string; CARD_CREDIT: string };
  paymentScreen: {
    title: string;
    totalLabel: string;
    methodSection: string;
    back: string;
    submit: string;
    submitError: string;
    selectMethod: string;
  };
  roles: { ADMIN: string; CASHIER: string; SUPER_ADMIN: string };
  login: {
    title: string;
    subtitle: string;
    email: string;
    password: string;
    emailPlaceholder: string;
    submit: string;
    submitting: string;
    fillBoth: string;
    failed: string;
    hint: string;
  };
  tabs: {
    dashboard: string;
    cashier: string;
    reports: string;
    orders: string;
    logout: string;
    language: string;
  };
  dashboard: {
    greeting: string;
    defaultUser: string;
    todaySales: string;
    orders: string;
    byMethod: string;
    topProducts: string;
    units: string;
    units_plural: string;
    recentSales: string;
    emptyToday: string;
    loadFailed: string;
    noTopProducts: string;
  };
  cashier: {
    all: string;
    noProducts: string;
    itemCount: (n: number) => string;
    viewCart: string;
  };
  cart: {
    title: (n: number) => string;
    clear: string;
    clearConfirmTitle: string;
    clearConfirmBody: string;
    empty: string;
    backToProducts: string;
    each: string;
    checkout: string;
  };
  confirmation: {
    success: string;
    saleNumber: string;
    paymentLabel: string;
    itemsLabel: string;
    newSale: string;
  };
  reports: {
    title: string;
    datePlaceholder: string;
    search: string;
    totalLabel: string;
    salesCount: (n: number) => string;
    byMethod: string;
    salesTitle: (n: number) => string;
    noSales: string;
    initialHint: string;
    selectDate: string;
    modalTitle: string;
    itemsSection: string;
    noItems: string;
    total: string;
    each: string;
    cashier: string;
    close: string;
    loadFailed: string;
    selectDateFirst: string;
  };
  orders: { title: string; placeholder: string; empty: string };
  logout: { title: string; body: string; cancel: string; confirm: string };
  saleStatus: { COMPLETED: string; CANCELLED: string; REFUNDED: string };
  users: {
    title: string;
    subtitle: string;
    addUser: string;
    empty: string;
    loadFailed: string;
    createFailed: string;
    updateFailed: string;
    deleteFailed: string;
    noPermission: string;
    salesCount: (n: number) => string;
    neverSold: string;
    youLabel: string;
    formTitle: { create: string; edit: string };
    fields: {
      name: string;
      email: string;
      password: string;
      passwordHint: string;
      role: string;
    };
    placeholders: { name: string; email: string; password: string };
    roles: { ADMIN: string; CASHIER: string; SUPER_ADMIN: string };
    save: string;
    cancel: string;
    delete: string;
    deleteConfirmTitle: string;
    deleteConfirmBody: (name: string) => string;
    deleteConfirm: string;
    lastAdminError: string;
    requiredFields: string;
    passwordTooShort: string;
  };
  languagePicker: { title: string; description: string; cancel: string };
};

const ar: Dictionary = {
  common: {
    total: "الإجمالي",
    items: "عناصر",
    item: "عنصر",
    items_plural: "عناصر",
    sales: "عمليات بيع",
    sale: "عملية بيع",
    products: "المنتجات",
    customer: "العميل",
    cashier: "الكاشير",
    operator: "المشغّل",
    date: "التاريخ",
    time: "الوقت",
    close: "إغلاق",
    cancel: "إلغاء",
    confirm: "تأكيد",
    save: "حفظ",
    delete: "حذف",
    edit: "تعديل",
    back: "رجوع",
    search: "بحث",
    refresh: "تحديث",
    loading: "جارٍ التحميل…",
    error: "حدث خطأ",
    retry: "إعادة المحاولة",
    empty: "لا توجد بيانات",
    today: "اليوم",
    yesterday: "أمس",
  },
  payment: {
    CASH: "نقدًا",
    PIX: "بيكس",
    CARD_DEBIT: "بطاقة خصم",
    CARD_CREDIT: "بطاقة ائتمان",
  },
  paymentScreen: {
    title: "الدفع",
    totalLabel: "الإجمالي للدفع",
    methodSection: "طريقة الدفع",
    back: "← رجوع",
    submit: "تأكيد ✓",
    submitError: "تعذّر إتمام البيع",
    selectMethod: "اختر طريقة الدفع للمتابعة",
  },
  roles: { ADMIN: "مدير", CASHIER: "كاشير", SUPER_ADMIN: "المالك" },
  login: {
    title: "ريستوكاش",
    subtitle: "نظام الكاشير",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    emailPlaceholder: "admin@restocash.local",
    submit: "تسجيل الدخول",
    submitting: "جارٍ الدخول…",
    fillBoth: "الرجاء إدخال البريد وكلمة المرور",
    failed: "فشل تسجيل الدخول",
    hint: "مدير: admin@restocash.local / admin123",
  },
  tabs: {
    dashboard: "لوحة التحكم",
    cashier: "الكاشير",
    reports: "التقارير",
    orders: "الطلبات",
    logout: "خروج",
    language: "اللغة",
  },
  dashboard: {
    greeting: "مرحبًا،",
    defaultUser: "المستخدم",
    todaySales: "مبيعات اليوم",
    orders: "طلبات",
    byMethod: "حسب طريقة الدفع",
    topProducts: "الأكثر مبيعًا",
    units: "وحدة",
    units_plural: "وحدات",
    recentSales: "آخر المبيعات",
    emptyToday: "لا توجد مبيعات اليوم. ابدأ البيع من الكاشير!",
    loadFailed: "تعذّر التحميل",
    noTopProducts: "لا توجد بيانات للمنتجات بعد",
  },
  cashier: {
    all: "الكل",
    noProducts: "لا توجد منتجات",
    itemCount: (n: number) => `${n} ${n === 1 ? "عنصر" : "عناصر"}`,
    viewCart: "عرض السلة ←",
  },
  cart: {
    title: (n: number) => `السلة (${n})`,
    clear: "إفراغ",
    clearConfirmTitle: "إفراغ السلة؟",
    clearConfirmBody: "سيتم حذف جميع العناصر.",
    empty: "السلة فارغة",
    backToProducts: "← العودة للمنتجات",
    each: "للقطعة",
    checkout: "إتمام البيع ←",
  },
  confirmation: {
    success: "تمت العملية بنجاح!",
    saleNumber: "رقم العملية",
    paymentLabel: "الدفع",
    itemsLabel: "العناصر",
    newSale: "عملية جديدة",
  },
  reports: {
    title: "التقرير اليومي",
    datePlaceholder: "YYYY-MM-DD",
    search: "بحث",
    totalLabel: "إجمالي اليوم",
    salesCount: (n: number) => `${n} ${n === 1 ? "عملية بيع" : "عمليات"}`,
    byMethod: "حسب طريقة الدفع",
    salesTitle: (n: number) => `المبيعات (${n})`,
    noSales: "لا توجد مبيعات في هذا اليوم",
    initialHint: "اختر تاريخًا واضغط بحث لعرض التقرير.",
    selectDate: "اختر تاريخًا",
    modalTitle: "تفاصيل العملية",
    itemsSection: "العناصر",
    noItems: "بدون عناصر",
    total: "الإجمالي",
    each: "للقطعة",
    cashier: "الكاشير",
    close: "إغلاق",
    loadFailed: "تعذّر تحميل العملية",
    selectDateFirst: "اختر تاريخًا أولاً",
  },
  orders: {
    title: "الطلبات",
    placeholder: "ميزة الطلبات قيد التطوير",
    empty: "لا توجد طلبات",
  },
  logout: {
    title: "تسجيل الخروج؟",
    body: "ستحتاج إلى تسجيل الدخول مرة أخرى للوصول إلى النظام.",
    cancel: "إلغاء",
    confirm: "نعم، خروج",
  },
  saleStatus: { COMPLETED: "مكتملة", CANCELLED: "ملغاة", REFUNDED: "مستردة" },
  users: {
    title: "المستخدمون",
    subtitle: "إدارة المستخدمين والصلاحيات",
    addUser: "إضافة مستخدم",
    empty: "لا يوجد مستخدمون",
    loadFailed: "تعذّر تحميل المستخدمين",
    createFailed: "تعذّر إنشاء المستخدم",
    updateFailed: "تعذّر تحديث المستخدم",
    deleteFailed: "تعذّر حذف المستخدم",
    noPermission: "هذه الشاشة للمدير فقط",
    salesCount: (n: number) => `${n} ${n === 1 ? "عملية بيع" : "عمليات"}`,
    neverSold: "لم يبع بعد",
    youLabel: "أنت",
    formTitle: { create: "إضافة مستخدم جديد", edit: "تعديل المستخدم" },
    fields: {
      name: "الاسم",
      email: "البريد الإلكتروني",
      password: "كلمة المرور",
      passwordHint: "اتركه فارغًا للإبقاء على كلمة المرور الحالية",
      role: "الصلاحية",
    },
    placeholders: {
      name: "اسم الموظف",
      email: "user@restocash.local",
      password: "6 أحرف على الأقل",
    },
    roles: {
      ADMIN: "مدير (وصول كامل)",
      CASHIER: "كاشير (بيع فقط)",
      SUPER_ADMIN: "المالك (صلاحيات كاملة + إدارة المديرين)",
    },
    save: "حفظ",
    cancel: "إلغاء",
    delete: "حذف",
    deleteConfirmTitle: "حذف المستخدم؟",
    deleteConfirmBody: (name: string) =>
      `سيتم حذف "${name}" نهائيًا. هذا الإجراء لا يمكن التراجع عنه.`,
    deleteConfirm: "نعم، احذف",
    lastAdminError: "لا يمكن حذف آخر مدير. رقِّه أو أضف مديرًا آخر أولاً.",
    requiredFields: "الاسم والبريد وكلمة المرور مطلوبة",
    passwordTooShort: "كلمة المرور يجب أن تكون 6 أحرف على الأقل",
  },
  languagePicker: {
    title: "اختر اللغة",
    description: "اختر لغة الواجهة. الأرقام والعملة تبقى دولية.",
    cancel: "إلغاء",
  },
};

const ptBR: Dictionary = {
  common: {
    total: "Total",
    items: "itens",
    item: "item",
    items_plural: "itens",
    sales: "vendas",
    sale: "venda",
    products: "Produtos",
    customer: "Cliente",
    cashier: "Caixa",
    operator: "Operador",
    date: "Data",
    time: "Hora",
    close: "Fechar",
    cancel: "Cancelar",
    confirm: "Confirmar",
    save: "Salvar",
    delete: "Excluir",
    edit: "Editar",
    back: "Voltar",
    search: "Buscar",
    refresh: "Atualizar",
    loading: "Carregando…",
    error: "Ocorreu um erro",
    retry: "Tentar novamente",
    empty: "Sem dados",
    today: "Hoje",
    yesterday: "Ontem",
  },
  payment: {
    CASH: "Dinheiro",
    PIX: "Pix",
    CARD_DEBIT: "Débito",
    CARD_CREDIT: "Crédito",
  },
  paymentScreen: {
    title: "Pagamento",
    totalLabel: "Total a pagar",
    methodSection: "Forma de pagamento",
    back: "← Voltar",
    submit: "Confirmar ✓",
    submitError: "Erro ao finalizar venda",
    selectMethod: "Selecione a forma de pagamento",
  },
  roles: { ADMIN: "Administrador", CASHIER: "Caixa", SUPER_ADMIN: "Proprietário" },
  login: {
    title: "RestoCash",
    subtitle: "Sistema de Caixa",
    email: "Email",
    password: "Senha",
    emailPlaceholder: "admin@restocash.local",
    submit: "Entrar",
    submitting: "Entrando…",
    fillBoth: "Preencha email e senha",
    failed: "Falha no login",
    hint: "ADMIN: admin@restocash.local / admin123",
  },
  tabs: {
    dashboard: "Painel",
    cashier: "Caixa",
    reports: "Relatório",
    orders: "Pedidos",
    logout: "Sair",
    language: "Idioma",
  },
  dashboard: {
    greeting: "Olá,",
    defaultUser: "Usuário",
    todaySales: "Vendas hoje",
    orders: "pedidos",
    byMethod: "Por método de pagamento",
    topProducts: "Produtos mais vendidos",
    units: "unidade",
    units_plural: "unidades",
    recentSales: "Últimas vendas",
    emptyToday: "Sem vendas hoje. Comece a vender no Caixa!",
    loadFailed: "Falha ao carregar",
    noTopProducts: "Ainda não há dados de produtos",
  },
  cashier: {
    all: "Todos",
    noProducts: "Nenhum produto",
    itemCount: (n: number) => `${n} ${n === 1 ? "item" : "itens"}`,
    viewCart: "Ver carrinho →",
  },
  cart: {
    title: (n: number) => `Carrinho (${n})`,
    clear: "Limpar",
    clearConfirmTitle: "Limpar carrinho?",
    clearConfirmBody: "Todos os itens serão removidos.",
    empty: "Carrinho vazio",
    backToProducts: "← Voltar para produtos",
    each: "cada",
    checkout: "Finalizar venda →",
  },
  confirmation: {
    success: "Venda realizada!",
    saleNumber: "Número da venda",
    paymentLabel: "Pagamento",
    itemsLabel: "Itens",
    newSale: "Nova venda",
  },
  reports: {
    title: "Relatório Diário",
    datePlaceholder: "AAAA-MM-DD",
    search: "Buscar",
    totalLabel: "Total do dia",
    salesCount: (n: number) => `${n} ${n === 1 ? "venda" : "vendas"}`,
    byMethod: "Por forma de pagamento",
    salesTitle: (n: number) => `Vendas (${n})`,
    noSales: "Nenhuma venda neste dia",
    initialHint: "Selecione uma data e toque em Buscar para ver o relatório.",
    selectDate: "Selecione uma data",
    modalTitle: "Detalhes da venda",
    itemsSection: "Itens",
    noItems: "Sem itens",
    total: "Total",
    each: "cada",
    cashier: "Operador",
    close: "Fechar",
    loadFailed: "Falha ao carregar venda",
    selectDateFirst: "Selecione uma data primeiro",
  },
  orders: {
    title: "Pedidos",
    placeholder: "Recurso de pedidos em desenvolvimento",
    empty: "Nenhum pedido",
  },
  logout: {
    title: "Sair do aplicativo?",
    body: "Você precisará fazer login novamente para acessar o sistema.",
    cancel: "Cancelar",
    confirm: "Sim, sair",
  },
  saleStatus: { COMPLETED: "Concluída", CANCELLED: "Cancelada", REFUNDED: "Reembolsada" },
  users: {
    title: "Usuários",
    subtitle: "Gerenciar usuários e permissões",
    addUser: "Adicionar usuário",
    empty: "Nenhum usuário",
    loadFailed: "Falha ao carregar usuários",
    createFailed: "Falha ao criar usuário",
    updateFailed: "Falha ao atualizar usuário",
    deleteFailed: "Falha ao excluir usuário",
    noPermission: "Esta tela é apenas para administradores",
    salesCount: (n: number) => `${n} ${n === 1 ? "venda" : "vendas"}`,
    neverSold: "Ainda não vendeu",
    youLabel: "Você",
    formTitle: { create: "Adicionar novo usuário", edit: "Editar usuário" },
    fields: {
      name: "Nome",
      email: "Email",
      password: "Senha",
      passwordHint: "Deixe vazio para manter a senha atual",
      role: "Permissão",
    },
    placeholders: {
      name: "Nome do funcionário",
      email: "user@restocash.local",
      password: "Mínimo 6 caracteres",
    },
    roles: {
      ADMIN: "Administrador (acesso total)",
      CASHIER: "Caixa (apenas vendas)",
      SUPER_ADMIN: "Proprietário (acesso total + gerencia admins)",
    },
    save: "Salvar",
    cancel: "Cancelar",
    delete: "Excluir",
    deleteConfirmTitle: "Excluir usuário?",
    deleteConfirmBody: (name: string) =>
      `"${name}" será excluído permanentemente. Esta ação não pode ser desfeita.`,
    deleteConfirm: "Sim, excluir",
    lastAdminError: "Não é possível excluir o último administrador. Promova outro usuário primeiro.",
    requiredFields: "Nome, email e senha são obrigatórios",
    passwordTooShort: "A senha deve ter pelo menos 6 caracteres",
  },
  languagePicker: {
    title: "Escolher idioma",
    description: "Escolha o idioma da interface. Números e moeda permanecem internacionais.",
    cancel: "Cancelar",
  },
};

const dictionaries: Record<Locale, Dictionary> = {
  ar,
  "pt-BR": ptBR,
};

/* ── Store ─────────────────────────────────────────────────── */

let currentLocale: Locale = DEFAULT_LOCALE;
const listeners = new Set<() => void>();

async function loadPersisted(): Promise<void> {
  try {
    const info = await FileSystem.getInfoAsync(STORAGE_FILE);
    if (!info.exists) return;
    const raw = await FileSystem.readAsStringAsync(STORAGE_FILE);
    const saved = raw.trim() as Locale;
    if (saved === "ar" || saved === "pt-BR") {
      currentLocale = saved;
      listeners.forEach((l) => l());
    }
  } catch {
    /* ignore */
  }
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function getSnapshot(): Locale {
  return currentLocale;
}

export async function setLocale(locale: Locale): Promise<void> {
  currentLocale = locale;
  listeners.forEach((l) => l());
  try {
    await FileSystem.writeAsStringAsync(STORAGE_FILE, locale);
  } catch {
    /* ignore persistence failure */
  }
}

export function getLocaleSync(): Locale {
  return currentLocale;
}

export function getDictionary(locale?: Locale): Dictionary {
  return dictionaries[locale ?? currentLocale];
}

export function useLocale(): [Locale, (next: Locale) => Promise<void>] {
  const locale = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const update = useCallback(async (next: Locale) => {
    await setLocale(next);
  }, []);
  return [locale, update];
}

export function useT(): Dictionary {
  const locale = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return dictionaries[locale];
}

void loadPersisted();

/* ── Formatters ─────────────────────────────────────────────── */

const localeToBcp: Record<Locale, string> = {
  ar: "ar-SA",
  "pt-BR": "pt-BR",
};

export function fmtMoney(value: number | string, _locale: Locale = currentLocale): string {
  const n = Number(value);
  if (Number.isNaN(n)) return "R$ 0.00";
  return `R$ ${n.toFixed(2).replace(".", ",")}`;
}

export function fmtTime(iso: string, locale: Locale = currentLocale): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString(localeToBcp[locale], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch {
    return "";
  }
}

export function fmtDateTime(iso: string, locale: Locale = currentLocale): string {
  try {
    const d = new Date(iso);
    const yyyy = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mo}-${dd} ${fmtTime(iso, locale)}`;
  } catch {
    return "";
  }
}