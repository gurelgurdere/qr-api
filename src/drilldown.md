## Rapor Modülüne Drill-Down (Alt Rapor) Desteği Eklenmesi

### Genel Bakış

Rapor modülünde kullanıcıya drill-down yapabilme imkanı sağlanacak. Kullanıcı bir raporun datatable'ındaki bir satıra tıkladığında, o satırın bağlamına uygun bir alt rapora (sub-report) geçiş yapabilecek. Bu sayede örneğin müşteri bazında toplamları gören bir kullanıcı, bir müşteriye tıklayarak o müşterinin ürün bazındaki detaylarını, oradan da bir ürüne tıklayarak fatura bazındaki detaylarını görebilecek.

### Backend Response Yapısı

`POST /report/execute` endpoint'i artık response'ta `subReports` dizisi döndürüyor. Eğer raporun alt raporu yoksa bu alan response'ta yer almıyor.

```json
{
  "reportId": "sales-report-customer",
  "title": "Satış Raporu (Müşteri Bazında)",
  "description": "...",
  "columns": [...],
  "data": [...],
  "subReports": [
    {
      "id": "sales-report-product",
      "title": "Satış Raporu (Ürün Bazında)",
      "parameters": [
        { "id": "CUSTOMER_NAME", "type": "column", "source": "CUSTOMER_NAME" }
      ]
    }
  ]
}
```

**`subReports` alanındaki her bir eleman:**

- `id`: Alt raporun kimliği. Execute çağrısında `reportId` olarak kullanılacak.
- `title`: Alt raporun başlığı. Birden fazla alt rapor olduğunda kullanıcıya seçim listesi göstermek için kullanılacak.
- `parameters`: Tıklanan satırdan alınması gereken parametreler. Her birinin `source` alanı, satırdaki kolon adını belirtir.

### Satır Tıklama Davranışı

1. **`subReports` yoksa veya boşsa:** Satır tıklanamaz, herhangi bir aksiyon tetiklenmez. Rapor terminal (son) rapordur.

2. **`subReports` tek elemanlıysa:** Satıra tıklandığında doğrudan o alt rapora geçilir.

3. **`subReports` birden fazla elemanlıysa:** Satıra tıklandığında kullanıcıya alt rapor seçim listesi gösterilir (title'lar kullanılarak). Kullanıcı seçimini yaptıktan sonra ilgili alt rapora geçilir.

### Parametre Geçişi (Kritik)

Alt rapor çalıştırılırken parametreler iki kaynaktan birleştirilir:

1. **Inherited (miras) parametreler:** Mevcut raporun çalıştırılmasında kullanılan tüm parametreler (kullanıcının formda girdiği ve önceki drill-down seviyelerinden gelen parametreler) alt rapora olduğu gibi aktarılır. Bunların `subReports.parameters`'da listelenmesine gerek yoktur; otomatik olarak taşınırlar.

2. **Satır parametreleri:** `subReports.parameters` dizisindeki her bir parametre, tıklanan satırdaki ilgili kolondan (`source`) okunarak eklenir.

Bu ikisi merge edilerek `POST /report/execute` çağrısı yapılır.

**Örnek akış:**

```
Seviye 1: sales-report-customer
  Kullanıcı giriş parametreleri: { BEGIN_DATE: "2024-01-01", END_DATE: "2024-12-31" }
  Kullanıcı "BOSCH" satırına tıklıyor
  → subReports.parameters'dan: { CUSTOMER_NAME: "BOSCH SANAYİ VE TİCARET A.Ş." }

Seviye 2: sales-report-product
  Merge edilmiş parametreler: { BEGIN_DATE: "2024-01-01", END_DATE: "2024-12-31", CUSTOMER_NAME: "BOSCH SANAYİ VE TİCARET A.Ş." }
  Kullanıcı "CUTTEX HFB-11" satırına tıklıyor
  → subReports.parameters'dan: { PRODUCT_NAME: "CUTTEX HFB-11" }

Seviye 3: sales-report-invoice
  Merge edilmiş parametreler: { BEGIN_DATE: "2024-01-01", END_DATE: "2024-12-31", CUSTOMER_NAME: "BOSCH SANAYİ VE TİCARET A.Ş.", PRODUCT_NAME: "CUTTEX HFB-11" }
  Bu raporun subReports'u yok → satır tıklanamaz, son seviye.
```

### Navigasyon ve UX

- Kullanıcı drill-down yaptıkça bir breadcrumb veya geri dönüş mekanizması olmalı. Kullanıcı önceki seviyelere geri dönebilmeli.
- Her seviyedeki raporun title'ı görünür olmalı, kullanıcı hangi seviyede olduğunu bilmeli.
- Drill-down sonucunda açılan alt rapor da aynı datatable bileşeni ile render edilmeli (aggregation summary dahil).
