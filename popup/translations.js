(function initPopupTranslations(global) {
  'use strict';

  const dictionary = {
    en: {
      appName: 'Currency Converter', checking: 'Checking Steam page…', active: 'Conversion active', disabled: 'Extension disabled', notSteam: 'Open a Steam Store page', converted: '{count} prices converted from {source}', noPrices: 'No supported prices found yet', targetCurrency: 'Target currency', steamCurrency: 'Steam currency', automatic: 'Automatic', manual: 'Manual', language: 'Language', disclaimer: 'Reference rates only. Steam checkout prices are not changed.', support: 'Support me on Patreon', poweredBy: 'Rates by Frankfurter', apiError: 'Exchange rate unavailable', stale: 'Older cached rate in use', autoCurrency: 'Automatic ({currency})', oneUnit: '1 {source}', multipleSources: 'Multiple currencies detected'
    },
    tr: {
      appName: 'Para Birimi Dönüştürücü', checking: 'Steam sayfası kontrol ediliyor…', active: 'Dönüştürme aktif', disabled: 'Eklenti devre dışı', notSteam: 'Bir Steam mağaza sayfası aç', converted: '{source} üzerinden {count} fiyat çevrildi', noPrices: 'Henüz desteklenen fiyat bulunamadı', targetCurrency: 'Hedef para birimi', steamCurrency: 'Steam para birimi', automatic: 'Otomatik', manual: 'Manuel', language: 'Dil', disclaimer: 'Yalnızca referans kurdur. Steam ödeme fiyatları değiştirilmez.', support: 'Patreon’da beni destekle', poweredBy: 'Kurlar Frankfurter’dan', apiError: 'Kur bilgisi alınamadı', stale: 'Eski önbellek kuru kullanılıyor', autoCurrency: 'Otomatik ({currency})', oneUnit: '1 {source}', multipleSources: 'Birden fazla para birimi algılandı'
    },
    de: {
      appName: 'Währungsrechner', checking: 'Steam-Seite wird geprüft…', active: 'Umrechnung aktiv', disabled: 'Erweiterung deaktiviert', notSteam: 'Öffne eine Steam-Shopseite', converted: '{count} Preise aus {source} umgerechnet', noPrices: 'Noch keine unterstützten Preise gefunden', targetCurrency: 'Zielwährung', steamCurrency: 'Steam-Währung', automatic: 'Automatisch', manual: 'Manuell', language: 'Sprache', disclaimer: 'Nur Referenzkurse. Steam-Kassenpreise bleiben unverändert.', support: 'Unterstütze mich auf Patreon', poweredBy: 'Kurse von Frankfurter', apiError: 'Wechselkurs nicht verfügbar', stale: 'Älterer gespeicherter Kurs wird verwendet', autoCurrency: 'Automatisch ({currency})', oneUnit: '1 {source}', multipleSources: 'Mehrere Währungen erkannt'
    },
    es: {
      appName: 'Conversor de moneda', checking: 'Comprobando la página de Steam…', active: 'Conversión activa', disabled: 'Extensión desactivada', notSteam: 'Abre una página de la tienda Steam', converted: '{count} precios convertidos desde {source}', noPrices: 'Aún no se encontraron precios compatibles', targetCurrency: 'Moneda de destino', steamCurrency: 'Moneda de Steam', automatic: 'Automático', manual: 'Manual', language: 'Idioma', disclaimer: 'Solo tipos de referencia. Los precios de pago de Steam no cambian.', support: 'Apóyame en Patreon', poweredBy: 'Tipos de Frankfurter', apiError: 'Tipo de cambio no disponible', stale: 'Se usa un tipo anterior guardado', autoCurrency: 'Automático ({currency})', oneUnit: '1 {source}', multipleSources: 'Se detectaron varias monedas'
    },
    fr: {
      appName: 'Convertisseur de devises', checking: 'Vérification de la page Steam…', active: 'Conversion active', disabled: 'Extension désactivée', notSteam: 'Ouvrez une page du magasin Steam', converted: '{count} prix convertis depuis {source}', noPrices: 'Aucun prix compatible trouvé', targetCurrency: 'Devise cible', steamCurrency: 'Devise Steam', automatic: 'Automatique', manual: 'Manuel', language: 'Langue', disclaimer: 'Taux indicatifs uniquement. Les prix de paiement Steam ne changent pas.', support: 'Soutenez-moi sur Patreon', poweredBy: 'Taux par Frankfurter', apiError: 'Taux de change indisponible', stale: 'Ancien taux en cache utilisé', autoCurrency: 'Automatique ({currency})', oneUnit: '1 {source}', multipleSources: 'Plusieurs devises détectées'
    },
    pt_BR: {
      appName: 'Conversor de moedas', checking: 'Verificando a página da Steam…', active: 'Conversão ativa', disabled: 'Extensão desativada', notSteam: 'Abra uma página da loja Steam', converted: '{count} preços convertidos de {source}', noPrices: 'Nenhum preço compatível encontrado ainda', targetCurrency: 'Moeda de destino', steamCurrency: 'Moeda da Steam', automatic: 'Automático', manual: 'Manual', language: 'Idioma', disclaimer: 'Apenas taxas de referência. Os preços de pagamento da Steam não mudam.', support: 'Apoie-me no Patreon', poweredBy: 'Taxas por Frankfurter', apiError: 'Taxa de câmbio indisponível', stale: 'Usando taxa antiga em cache', autoCurrency: 'Automático ({currency})', oneUnit: '1 {source}', multipleSources: 'Várias moedas detectadas'
    },
    ru: {
      appName: 'Конвертер валют', checking: 'Проверка страницы Steam…', active: 'Конвертация активна', disabled: 'Расширение отключено', notSteam: 'Откройте страницу магазина Steam', converted: 'Пересчитано цен: {count}, валюта {source}', noPrices: 'Поддерживаемые цены пока не найдены', targetCurrency: 'Целевая валюта', steamCurrency: 'Валюта Steam', automatic: 'Автоматически', manual: 'Вручную', language: 'Язык', disclaimer: 'Только справочные курсы. Цены оплаты Steam не изменяются.', support: 'Поддержать меня на Patreon', poweredBy: 'Курсы Frankfurter', apiError: 'Курс валют недоступен', stale: 'Используется сохранённый старый курс', autoCurrency: 'Автоматически ({currency})', oneUnit: '1 {source}', multipleSources: 'Обнаружено несколько валют'
    }
  };

  global.SCCPopupTranslations = dictionary;
  if (typeof module !== 'undefined' && module.exports) module.exports = dictionary;
})(globalThis);
