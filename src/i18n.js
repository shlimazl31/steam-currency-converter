(function initI18n(global) {
  'use strict';

  const messages = {
    tr: {
      convertedPrice: 'Referans kurla çevrildi', apiUnavailable: 'Kur bilgisi alınamadı', staleRate: 'Önbellekteki eski kur kullanılıyor'
    },
    en: {
      convertedPrice: 'Converted using a reference rate', apiUnavailable: 'Exchange rate unavailable', staleRate: 'Using an older cached rate'
    },
    de: {
      convertedPrice: 'Mit Referenzkurs umgerechnet', apiUnavailable: 'Wechselkurs nicht verfügbar', staleRate: 'Älterer gespeicherter Kurs wird verwendet'
    },
    es: {
      convertedPrice: 'Convertido con un tipo de referencia', apiUnavailable: 'Tipo de cambio no disponible', staleRate: 'Usando un tipo guardado anterior'
    },
    fr: {
      convertedPrice: 'Converti avec un taux de référence', apiUnavailable: 'Taux de change indisponible', staleRate: 'Ancien taux en cache utilisé'
    },
    pt_BR: {
      convertedPrice: 'Convertido com uma taxa de referência', apiUnavailable: 'Taxa de câmbio indisponível', staleRate: 'Usando uma taxa antiga em cache'
    },
    ru: {
      convertedPrice: 'Пересчитано по справочному курсу', apiUnavailable: 'Курс валют недоступен', staleRate: 'Используется сохранённый старый курс'
    }
  };

  function resolveLanguage(setting, locale) {
    return setting && setting !== 'auto' && messages[setting] ? setting : SCC.languageForLocale(locale);
  }

  function t(key, language, locale) {
    const resolved = resolveLanguage(language, locale);
    return messages[resolved]?.[key] || messages.en[key] || key;
  }

  global.SCCI18n = { messages, resolveLanguage, t };
  if (typeof module !== 'undefined' && module.exports) module.exports = global.SCCI18n;
})(globalThis);
