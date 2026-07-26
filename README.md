# Steam Currency Converter

Steam mağazasındaki fiyatların yanına günlük referans kurla çevrilmiş tutarı ekleyen, bağımlılıksız Chrome Manifest V3 eklentisi.

## Özellikler

- Steam ürün, arama, kategori, indirim, istek listesi ve sepet fiyatlarını işler.
- Orijinal Steam fiyatını değiştirmez; çevrilmiş tutarı hemen yanında gösterir.
- Kurları [Frankfurter API](https://frankfurter.dev/) üzerinden otomatik çeker.
- Son başarılı kur verisini 24 saat önbelleğe alır; API çalışmazsa son veriyi kullanır.
- Otomatik veya manuel kaynak/hedef para birimi seçimi sunar.
- Türkçe, İngilizce, Almanca, İspanyolca, Fransızca, Brezilya Portekizcesi ve Rusça arayüz desteği içerir.
- API anahtarı, kullanıcı hesabı veya takip/analitik kodu kullanmaz.
- Popup içinde Patreon destek bağlantısı bulunur: <https://www.patreon.com/16358118/join>

## Desteklenen sayfalar

- Steam ürün sayfaları
- Arama sonuçları
- Kategori ve ana sayfa bölümleri
- İndirim sayfaları
- Wishlist
- Sepet

## Yerel kurulum

1. Chrome'da `chrome://extensions` adresini açın.
2. Sağ üstten **Geliştirici modu** seçeneğini açın.
3. **Paketlenmemiş öğe yükle** butonuna basın.
4. Bu proje klasörünü seçin.
5. Bir Steam mağaza sayfasını yenileyin.

## Test

```powershell
npm run check
```

Bu komut manifest, locale dosyaları, JavaScript syntax kontrolü ve testleri çalıştırır.

## Chrome Web Store paketi hazırlama

```powershell
Compress-Archive `
  -Path manifest.json,_locales,popup,src,assets\icons\icon-16.png,assets\icons\icon-32.png,assets\icons\icon-48.png,assets\icons\icon-128.png `
  -DestinationPath Steam-Currency-Converter-v1.0.0.zip
```

## Gizlilik

Eklenti Steam sayfalarındaki fiyat metinlerini yalnızca tarayıcı içinde işler. Kişisel veri, hesap bilgisi veya ödeme bilgisi toplamaz. Ayarlar Chrome storage içinde saklanır.

## Not

Gösterilen çevrim tutarları bilgilendirme amaçlı referans değerlerdir. Steam'in gerçek ödeme kuru, vergi ve bölgesel fiyatlandırması farklı olabilir.
