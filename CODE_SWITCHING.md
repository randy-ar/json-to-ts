# Code Switching Commands

## Overview

Tool ini menyediakan 3 commands untuk manage dummy vs live code di service API files:

1. **`json-to-ts use-dummy`** - Switch ke dummy mode
2. **`json-to-ts use-live`** - Switch ke live/production mode  
3. **`json-to-ts clean-dummy`** - Hapus semua dummy code (production ready)

---

## Format File Service

Service file Anda harus menggunakan marker comments untuk menandai block dummy dan live code:

```typescript
async getSingle(id: number): Promise<BaseApiResponse<User> | undefined> {
  // DUMMY_START
  return await dummyGetSingle(id);
  // DUMMY_END
  
  // LIVE_START
  try {
    const path = `${this.basePath}/${id}`;
    return await httpClient<BaseApiResponse<User>>(path);
  } catch (error) {
    if (axios.isAxiosError<BaseApiResponse<User>>(error)) {
      return error.response?.data;
    }
    return undefined;
  }
  // LIVE_END
}
```

**Markers:**
- `// DUMMY_START` - Awal block dummy code
- `// DUMMY_END` - Akhir block dummy code
- `// LIVE_START` - Awal block live/production code
- `// LIVE_END` - Akhir block live/production code

---

## Commands Usage

### 1. Switch to Dummy Mode

Aktifkan dummy implementation (uncomment dummy, comment live):

```bash
# Process specific files
json-to-ts use-dummy --files src/services/api/user.ts src/services/api/product.ts

# Process all files in directory
json-to-ts use-dummy --directory src/services/api

# Process files matching pattern
json-to-ts use-dummy --directory src/services/api --pattern "closing"
```

**Result:**
```typescript
async getSingle(id: number) {
  // DUMMY_START
  return await dummyGetSingle(id);
  // DUMMY_END
  
  // LIVE_START
  // try {
  //   const path = `${this.basePath}/${id}`;
  //   return await httpClient<BaseApiResponse<User>>(path);
  // } catch (error) {
  //   // error handling
  // }
  // LIVE_END
}
```

---

### 2. Switch to Live Mode

Aktifkan live/production implementation (comment dummy, uncomment live):

```bash
# Process specific files
json-to-ts use-live --files src/services/api/user.ts

# Process all files in directory
json-to-ts use-live --directory src/services/api

# Process files matching pattern
json-to-ts use-live --directory src/services --pattern "api"
```

**Result:**
```typescript
async getSingle(id: number) {
  // DUMMY_START
  // return await dummyGetSingle(id);
  // DUMMY_END
  
  // LIVE_START
  try {
    const path = `${this.basePath}/${id}`;
    return await httpClient<BaseApiResponse<User>>(path);
  } catch (error) {
    // error handling
  }
  // LIVE_END
}
```

---

### 3. Clean Dummy Code (Production Ready)

Hapus semua dummy code blocks dan markers untuk production build:

```bash
# Process specific files
json-to-ts clean-dummy --files src/services/api/user.ts

# Process all files in directory
json-to-ts clean-dummy --directory src/services/api

# Clean all API services
json-to-ts clean-dummy --directory src/services --pattern "api"
```

**Result:**
```typescript
async getSingle(id: number) {
  try {
    const path = `${this.basePath}/${id}`;
    return await httpClient<BaseApiResponse<User>>(path);
  } catch (error) {
    // error handling
  }
}
```

**Note:** Semua dummy code dan marker comments dihapus. File siap untuk production!

---

## Options

### `--files` / `-f`
Specify specific files to process (multiple files allowed):
```bash
json-to-ts use-dummy -f file1.ts file2.ts file3.ts
```

### `--directory` / `-d`
Scan directory for TypeScript files:
```bash
json-to-ts use-dummy -d src/services/api
```

### `--pattern` / `-p`
Filter files by name pattern (used with `--directory`):
```bash
json-to-ts use-dummy -d src/services -p "closing"
# Will process: closing.ts, closing-api.ts, etc.
```

---

## Workflow Examples

### Development Workflow

```bash
# 1. Generate dummy data
json-to-ts dummy -i data.json -t types.ts -n User -f getDummyUser

# 2. Add markers to service file manually or use template

# 3. Switch to dummy mode for development
json-to-ts use-dummy -d src/services/api

# 4. Develop and test with dummy data
npm run dev

# 5. Switch to live mode for testing with real API
json-to-ts use-live -d src/services/api

# 6. Test with real API
npm run dev
```

### Production Build

```bash
# Clean all dummy code before production build
json-to-ts clean-dummy -d src/services/api

# Build for production
npm run build
```

---

## Example Service File Template

```typescript
import axios from 'axios';
import { BaseApiService } from '@/services/api/base';
import { User } from '@/types/api/user';
import { BaseApiResponse } from '@/types/api/api-general';
import { httpClient } from '@/services/http/client';
import { dummyGetUser } from './user.dummy';

export class UserApiService extends BaseApiService<User, null, null> {
  constructor(basePath: string) {
    super(basePath);
  }

  async getSingle(id: number): Promise<BaseApiResponse<User> | undefined> {
    // DUMMY_START
    return await dummyGetUser(id);
    // DUMMY_END
    
    // LIVE_START
    try {
      const path = `${this.basePath}/${id}`;
      return await httpClient<BaseApiResponse<User>>(path);
    } catch (error) {
      if (axios.isAxiosError<BaseApiResponse<User>>(error)) {
        return error.response?.data;
      }
      return undefined;
    }
    // LIVE_END
  }
}

export const UserApi = new UserApiService('/users');
```

---

## Tips

1. **Always commit before switching** - Gunakan git untuk track changes
2. **Use pattern matching** - Filter files dengan `--pattern` untuk avoid processing wrong files
3. **Test after switching** - Selalu test setelah switch mode
4. **Clean before production** - Jangan lupa `clean-dummy` sebelum production build
5. **Keep markers consistent** - Gunakan exact marker format yang sama di semua files

---

## Troubleshooting

**Q: File tidak berubah setelah run command?**
- Pastikan file menggunakan marker comments yang benar
- Check file permissions
- Verify file path

**Q: Syntax error setelah switching?**
- Pastikan indentation di dalam blocks sudah benar
- Check closing braces/brackets

**Q: Ingin undo changes?**
- Gunakan git: `git checkout -- <file>`
- Atau run command sebaliknya (use-dummy ↔ use-live)
