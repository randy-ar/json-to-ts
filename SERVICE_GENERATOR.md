# Service API Generator

## Overview

Generate complete API service files with methods, type safety, and dummy/live code switching support.

---

## Command

```bash
json-to-ts service
```

This command runs in **interactive mode** and guides you through creating a complete API service file.

---

## Features

✅ **Interactive Configuration** - Step-by-step prompts for easy setup  
✅ **Multiple Methods** - Add as many methods as you need  
✅ **Type Generation** - Auto-generate types from JSON  
✅ **Dummy Data Integration** - Auto-generate dummy functions  
✅ **Code Switching Ready** - Built-in DUMMY/LIVE markers  
✅ **Smart Imports** - Automatic import management  
✅ **Error Handling** - Proper try-catch blocks  
✅ **TypeScript Types** - Full type safety  

---

## Workflow

### Step 1: Service Setup

```
? Output service file path: src/services/api/user.ts
? Service file mode: Create new service
? Base API endpoint path: /users
? Service class name: UserApiService
```

### Step 2: Method Configuration (Repeater)

For each method, you'll configure:

#### Basic Info
```
? Method name: getSingle
? HTTP method: GET
? Endpoint path: /{id}
```

#### Request Body (for POST/PUT/PATCH)
```
? Does this method have a request body? Yes
? Request body type name: CreateUserDto
```

#### Response Type
```
? Response data configuration:
  ❯ Use existing type
    Create new type from JSON
    No specific type (unknown)
```

**Option 1: Use Existing Type**
```
? Types file path: @/types/api/user
? Response type name: User
```

**Option 2: Create New Type**
```
? Input JSON file path: data/user.json
? Output types file path: src/types/api/user.ts
? Type name: User
```

#### Dummy Data
```
? Dummy data configuration:
  ❯ Skip (no dummy data)
    Use existing dummy function
    Generate new dummy data
```

**Generate New Dummy:**
```
? Input JSON file path: data/user.json
? Output dummy file path: src/services/api/user.dummy.ts
? Types file path: src/types/api/user.ts
? Type name: User
? Dummy function name: getDummyUser
```

#### Continue
```
? Add another method? (Y/n)
```

---

## Generated Output Example

### Service File: `user.ts`

```typescript
import axios from 'axios';
import { BaseApiService } from '@/services/api/base';
import { BaseApiResponse } from '@/types/api/api-general';
import { httpClient } from '@/services/http/client';
import { User, CreateUserDto } from '@/types/api/user';
// DUMMY_START
import { getDummyUser, getDummyUsers } from './user.dummy';
// DUMMY_END

export class UserApiService extends BaseApiService<any, null, null> {
  constructor(basePath: string) {
    super(basePath);
  }

  async getAll(): Promise<BaseApiResponse<User[]> | undefined> {
    // DUMMY_START
    return await getDummyUsers();
    // DUMMY_END
    
    // LIVE_START
    // try {
    //   const path = `${this.basePath}`;
    //   return await httpClient<BaseApiResponse<User[]>>(path);
    // } catch (error) {
    //   if (axios.isAxiosError<BaseApiResponse<User[]>>(error)) {
    //     return error.response?.data;
    //   }
    //   return undefined;
    // }
    // LIVE_END
  }

  async getSingle(id: number): Promise<BaseApiResponse<User> | undefined> {
    // DUMMY_START
    return await getDummyUser(id);
    // DUMMY_END
    
    // LIVE_START
    // try {
    //   const path = `${this.basePath}/${id}`;
    //   return await httpClient<BaseApiResponse<User>>(path);
    // } catch (error) {
    //   if (axios.isAxiosError<BaseApiResponse<User>>(error)) {
    //     return error.response?.data;
    //   }
    //   return undefined;
    // }
    // LIVE_END
  }

  async create(data: CreateUserDto): Promise<BaseApiResponse<User> | undefined> {
    // DUMMY_START
    return await createDummyUser();
    // DUMMY_END
    
    // LIVE_START
    // try {
    //   const path = `${this.basePath}`;
    //   return await httpClient<BaseApiResponse<User>>(path, {
    //     method: 'POST',
    //     data,
    //   });
    // } catch (error) {
    //   if (axios.isAxiosError<BaseApiResponse<User>>(error)) {
    //     return error.response?.data;
    //   }
    //   return undefined;
    // }
    // LIVE_END
  }
}

export const UserApi = new UserApiService('/users');
```

---

## Usage Example

```typescript
import { UserApi } from '@/services/api/user';

// Get all users
const users = await UserApi.getAll();

// Get single user
const user = await UserApi.getSingle(1);

// Create user
const newUser = await UserApi.create({
  name: 'John Doe',
  email: 'john@example.com',
});
```

---

## Code Switching

After generating the service, you can switch between dummy and live modes:

```bash
# Use dummy data (for development)
json-to-ts use-dummy --files src/services/api/user.ts

# Use live API (for testing)
json-to-ts use-live --files src/services/api/user.ts

# Clean for production
json-to-ts clean-dummy --files src/services/api/user.ts
```

---

## Tips

### 1. **Organize Your Files**
```
src/
├── services/
│   └── api/
│       ├── user.ts          # Service file
│       └── user.dummy.ts    # Dummy data
├── types/
│   └── api/
│       └── user.ts          # Type definitions
└── data/
    └── user.json            # Sample JSON
```

### 2. **Endpoint Patterns**

- **List**: `/` or empty
- **Single**: `/{id}`
- **Search**: `/search`
- **Nested**: `/{id}/posts`
- **Action**: `/{id}/activate`

### 3. **HTTP Methods**

- **GET**: Retrieve data
- **POST**: Create new resource
- **PUT**: Update entire resource
- **PATCH**: Partial update
- **DELETE**: Remove resource

### 4. **Type Reuse**

If you're creating multiple methods with the same response type:
1. Generate the type once
2. Use "existing type" for subsequent methods

### 5. **Dummy Data**

- Generate dummy data for development/testing
- Use realistic sample data
- Keep dummy files separate from service files

---

## Advanced Examples

### Example 1: CRUD Service

```bash
json-to-ts service

# Configure:
# - getAll() -> GET /
# - getSingle(id) -> GET /{id}
# - create(data) -> POST /
# - update(id, data) -> PUT /{id}
# - delete(id) -> DELETE /{id}
```

### Example 2: Nested Resources

```bash
# User posts service
Base path: /users
Methods:
  - getUserPosts(userId) -> GET /{userId}/posts
  - createUserPost(userId, data) -> POST /{userId}/posts
```

### Example 3: Search/Filter

```bash
Methods:
  - search(query) -> GET /search?q={query}
  - filter(params) -> POST /filter
```

---

## Troubleshooting

**Q: Import paths are wrong?**
- The generator creates relative imports automatically
- Check that your file structure matches the paths

**Q: Types not found?**
- Make sure the types file is generated first
- Verify the import path is correct

**Q: Dummy function not working?**
- Check that the dummy file exists
- Verify the function name matches

**Q: Want to add more methods later?**
- Run `json-to-ts service` again
- Choose "Add methods to existing service"
- (Note: Currently regenerates the whole file)

---

## Next Steps

After generating your service:

1. **Test with dummy data**
   ```bash
   json-to-ts use-dummy -f src/services/api/user.ts
   npm run dev
   ```

2. **Switch to live API**
   ```bash
   json-to-ts use-live -f src/services/api/user.ts
   ```

3. **Clean for production**
   ```bash
   json-to-ts clean-dummy -f src/services/api/user.ts
   npm run build
   ```

---

## Related Commands

- [`json-to-ts types`](./README.md#types-command) - Generate types only
- [`json-to-ts dummy`](./README.md#dummy-command) - Generate dummy data only
- [`json-to-ts use-dummy`](./CODE_SWITCHING.md#switch-to-dummy-mode) - Switch to dummy mode
- [`json-to-ts use-live`](./CODE_SWITCHING.md#switch-to-live-mode) - Switch to live mode
- [`json-to-ts clean-dummy`](./CODE_SWITCHING.md#clean-dummy-code) - Clean for production
