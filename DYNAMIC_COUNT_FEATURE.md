# Fitur Generate Dummy Data dengan Jumlah Dinamis

## 📋 Deskripsi

Fitur ini memungkinkan Anda untuk generate dummy data TypeScript dengan jumlah data yang dapat dikonfigurasi secara dinamis. Anda dapat membuat 1 objek tunggal atau array dengan banyak objek sekaligus.

## ✨ Fitur Utama

- **Jumlah Data Dinamis**: Generate 1 hingga N data sekaligus
- **Variasi Data Otomatis**: Setiap data memiliki variasi pada field `id`, `name`, dan `title`
- **Type Safety**: Return type otomatis menyesuaikan (single object atau array)
- **Fleksibel**: Mendukung async/sync dan dengan/tanpa BaseApiResponse wrapper

## 🚀 Cara Penggunaan

### Melalui CLI Interactive

1. Jalankan CLI tool:
   ```bash
   npm start
   # atau
   node dist/index.js
   ```

2. Pilih **"🎲 Generate Dummy Data"**

3. Ikuti prompt yang muncul:
   - **Input JSON file path**: Pilih file JSON sumber data
   - **TypeScript types file path**: Pilih file type definition
   - **Type name**: Masukkan nama type (contoh: `Product`)
   - **Dummy function name**: Masukkan nama fungsi (contoh: `getDummyProducts`)
   - **Berapa banyak data yang ingin di-generate?**: Masukkan jumlah (default: 1)
   - **Output location**: Pilih lokasi output
   - **Generate async function?**: Ya/Tidak
   - **Wrap in BaseApiResponse?**: Ya/Tidak

## 📊 Contoh Hasil

### Input JSON (`test-product.json`)
```json
{
  "id": 1,
  "name": "Product",
  "title": "Sample Product",
  "price": 100,
  "description": "This is a sample product",
  "category": "Electronics",
  "inStock": true
}
```

### Output dengan Count = 1 (Single Object)
```typescript
const dummyProduct: Product = {
  id: 1,
  name: 'Product',
  title: 'Sample Product',
  price: 100,
  description: 'This is a sample product',
  category: 'Electronics',
  inStock: true,
};

export async function getDummyProduct(): Promise<BaseApiResponse<Product>> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        code: 200,
        status: 'success',
        message: 'Data retrieved successfully',
        data: dummyProduct,
      });
    }, 500);
  });
}
```

### Output dengan Count = 5 (Array of Objects)
```typescript
const dummyProduct: Product[] = [
  {
    id: 1,
    name: 'Product 1',
    title: 'Sample Product 1',
    price: 100,
    description: 'This is a sample product',
    category: 'Electronics',
    inStock: true,
  },
  {
    id: 2,
    name: 'Product 2',
    title: 'Sample Product 2',
    price: 100,
    description: 'This is a sample product',
    category: 'Electronics',
    inStock: true,
  },
  // ... 3 data lainnya
];

export async function getDummyProducts(): Promise<BaseApiResponse<Product[]>> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        code: 200,
        status: 'success',
        message: 'Data retrieved successfully',
        data: dummyProduct,
      });
    }, 500);
  });
}
```

## 🎯 Logika Variasi Data

Saat `count > 1`, tool akan otomatis membuat variasi data dengan aturan:

1. **Field `id` (number)**: Ditambahkan dengan index (id + i)
2. **Field `id` (string)**: Ditambahkan suffix `_1`, `_2`, dst
3. **Field `name`**: Ditambahkan suffix angka (contoh: `Product 1`, `Product 2`)
4. **Field `title`**: Ditambahkan suffix angka (contoh: `Sample Product 1`)

## 🔧 Implementasi Teknis

### 1. Interface Options (`src/lib/types.ts`)
```typescript
export interface DummyGeneratorOptions {
  input: string;
  types: string;
  typeName: string;
  functionName: string;
  output?: string;
  async?: boolean;
  wrapper?: boolean;
  count?: number; // Jumlah data yang akan di-generate (default: 1)
}
```

### 2. Prompt CLI (`src/utils/prompts.ts`)
```typescript
{
  type: "number",
  name: "count",
  message: "Berapa banyak data yang ingin di-generate?",
  default: 1,
  validate: (value: number) => {
    if (!value || value < 1) {
      return "Minimal data adalah 1";
    }
    if (!Number.isInteger(value)) {
      return "Jumlah data harus berupa bilangan bulat";
    }
    return true;
  },
}
```

### 3. Generator Logic (`src/lib/dummy-generator.ts`)
```typescript
// Jika user minta lebih dari 1, buat array of objects
if (count > 1) {
  dataToFormat = Array.from({ length: count }, (_, i) => {
    if (typeof jsonData === 'object' && jsonData !== null) {
      const clonedData = JSON.parse(JSON.stringify(jsonData)) as any;
      
      // Update field 'id' jika ada
      if ('id' in clonedData) {
        if (typeof clonedData.id === 'number') {
          clonedData.id = clonedData.id + i;
        } else if (typeof clonedData.id === 'string') {
          clonedData.id = `${clonedData.id}_${i + 1}`;
        }
      }
      
      // Update field name dan title untuk variasi
      if ('name' in clonedData && typeof clonedData.name === 'string') {
        clonedData.name = `${clonedData.name} ${i + 1}`;
      }
      
      if ('title' in clonedData && typeof clonedData.title === 'string') {
        clonedData.title = `${clonedData.title} ${i + 1}`;
      }
      
      return clonedData;
    }
    return jsonData;
  });
}
```

## 💡 Tips Penggunaan

### Untuk Data yang Lebih Variatif

Jika Anda ingin variasi data yang lebih kompleks (misalnya nama random, tanggal berbeda, dll), Anda bisa:

1. **Mengintegrasikan Faker.js**: Tambahkan library faker untuk generate data random
2. **Custom Logic**: Modifikasi fungsi generator di `src/lib/dummy-generator.ts`
3. **Template String**: Gunakan template string dengan index untuk field tertentu

### Best Practices

1. **Gunakan count = 1** untuk single object API (GET by ID)
2. **Gunakan count > 1** untuk list/collection API (GET all)
3. **Sesuaikan nama fungsi** dengan jumlah data:
   - Single: `getDummyProduct()`
   - Multiple: `getDummyProducts()` (plural)

## 🧪 Testing

Jalankan test script untuk melihat berbagai skenario:

```bash
node test-count-feature.mjs
```

Test akan menampilkan:
- Generate single data (count = 1)
- Generate 5 data items (count = 5)
- Generate 3 data items tanpa wrapper (count = 3)

## 📝 Changelog

### Version 1.1.0
- ✅ Menambahkan properti `count` pada `DummyGeneratorOptions`
- ✅ Menambahkan prompt untuk input jumlah data
- ✅ Implementasi logika generate multiple data dengan variasi
- ✅ Auto-adjust return type berdasarkan count
- ✅ Variasi otomatis untuk field id, name, dan title

## 🤝 Kontribusi

Jika Anda ingin menambahkan variasi data yang lebih kompleks atau field lainnya, silakan modifikasi bagian generator logic di `src/lib/dummy-generator.ts`.

---

**Happy Coding! 🚀**
