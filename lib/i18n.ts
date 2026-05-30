const dictionary = {
  en: {
    config: "Configuration",
    preview: "Generated app",
    save: "Save config",
    importCsv: "Import CSV",
    notifications: "Notifications",
    warnings: "Runtime warnings"
  },
  hi: {
    config: "Configuration",
    preview: "Generated app",
    save: "Save config",
    importCsv: "CSV import",
    notifications: "Notifications",
    warnings: "Runtime warnings"
  }
};

export function t(locale: "en" | "hi", key: keyof typeof dictionary.en) {
  return dictionary[locale][key] || dictionary.en[key];
}
