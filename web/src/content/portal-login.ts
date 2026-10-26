/**
 * Copy from the public ReOS StartKey login screen
 * (https://startkey.re-os.com/Account/Login) in the four languages that page
 * actually publishes. Nothing here is AI-translated.
 */
export const PORTAL_LOGIN_LANGS = ["tr", "en", "az", "ru"] as const;

export type PortalLoginLang = (typeof PORTAL_LOGIN_LANGS)[number];

export type PortalLoginCopy = {
  htmlLang: string;
  title: string;
  currentLangName: string;
  heading: string;
  subtitle: string;
  emailPlaceholder: string;
  emailRequired: string;
  emailInvalid: string;
  passwordPlaceholder: string;
  passwordRequired: string;
  rememberMe: string;
  forgotPassword: string;
  submitLabel: string;
  submitProgress: string;
  or: string;
};

export const PORTAL_LOGIN_LANGUAGES: {
  code: PortalLoginLang;
  name: string;
  flag: string;
}[] = [
  { code: "tr", name: "Türkçe", flag: "/portal/flags/turkey.svg" },
  { code: "en", name: "English", flag: "/portal/flags/united-states.svg" },
  { code: "az", name: "Azerbaijani", flag: "/portal/flags/azerbaijan.svg" },
  { code: "ru", name: "Russian", flag: "/portal/flags/russia.svg" },
];

export const PORTAL_LOGIN_COPY: Record<PortalLoginLang, PortalLoginCopy> = {
  tr: {
    htmlLang: "tr",
    title: "Giriş - StartKey Emlak Sistemi",
    currentLangName: "Türkçe",
    heading: "Giriş Yap",
    subtitle: "Gayrimenkul CRM & MLS ve Dijital Pazarlama Platformu",
    emailPlaceholder: "E-Posta adresinizi giriniz.",
    emailRequired: "Lütfen e-mail adresinizi giriniz",
    emailInvalid: "Lütfen geçerli bir e-mail adresi giriniz.",
    passwordPlaceholder: "Şifrenizi giriniz.",
    passwordRequired: "Lütfen şifrenizi giriniz",
    rememberMe: "Beni Hatırla",
    forgotPassword: "Şifremi Unuttum",
    submitLabel: "Giriş",
    submitProgress: "Lütfen bekleyiniz",
    or: "VEYA",
  },
  en: {
    htmlLang: "en",
    title: "Giriş - StartKey Real Estate System",
    currentLangName: "English",
    heading: "Sign In",
    subtitle: "Real Estate CRM & MLS and Digital Marketing Platform",
    emailPlaceholder: "Please enter your e-mail address.",
    emailRequired: "Please enter your e-mail.",
    emailInvalid: "Please enter a valid e-mail address.",
    passwordPlaceholder: "Please enter your password.",
    passwordRequired: "Please enter your password.",
    rememberMe: "Remember Me.",
    forgotPassword: "I forgot my password.",
    submitLabel: "Sign In",
    submitProgress: "Please Wait",
    or: "OR",
  },
  az: {
    htmlLang: "az",
    title: "Giriş - StartKey Əmlak Sistemi",
    currentLangName: "Azerbaijani",
    heading: "Giriş",
    subtitle: "Əmlak CRM və MLS və Rəqəmsal Marketinq Platforması",
    emailPlaceholder: "E-Mail adresinizi daxil edin.",
    emailRequired: "Xahiş edirik e-mail adresinizi daxil edin",
    emailInvalid: "Xahişn edirik doğru bir e-mail adresi daxil edin.",
    passwordPlaceholder: "Şifrənizi daxil edin.",
    passwordRequired: "Xahiş edirik şifrənizi daxil edin",
    rememberMe: "Məni Xatırla",
    forgotPassword: "Şifrəmi Unutdum",
    submitLabel: "Daxil Ol",
    submitProgress: "Xahiş edirik gözləyin",
    or: "Və ya",
  },
  ru: {
    htmlLang: "ru",
    title: "Giriş - Система Недвижимости - StartKey Emlak Sistemi",
    currentLangName: "Russian",
    heading: "Войти в Систему",
    subtitle: "CRM и MLS для сферы недвижимости и платформа цифрового маркетинга",
    emailPlaceholder: "Пожалуйста, введите свой адрес электронной почты.",
    emailRequired: "Пожалуйста, введите свой адрес электронной почты",
    emailInvalid: "Пожалуйста, введите действующий адрес электронной почты.",
    passwordPlaceholder: "Введите ваш пароль.",
    passwordRequired: "Пожалуйста, введите ваш пароль",
    rememberMe: "Запомнить меня",
    forgotPassword: "Забыли пароль",
    submitLabel: "Вход",
    submitProgress: "Пожалуйста ждите",
    or: "ИЛИ ЖЕ",
  },
};

/** local@domain.tld. No TLD allowlist, so reserved suffixes such as .invalid pass. */
export const PORTAL_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isPortalLoginLang(value: string | undefined): value is PortalLoginLang {
  return value !== undefined && (PORTAL_LOGIN_LANGS as readonly string[]).includes(value);
}

export function portalLoginLangFromQuery(value: string | undefined): PortalLoginLang {
  return isPortalLoginLang(value) ? value : "tr";
}
