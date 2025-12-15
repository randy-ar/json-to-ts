# @randy-ar/json-to-ts

Interactive CLI tool to convert JSON to TypeScript types and dummy data.

## ✨ Features

- 🎯 **Interactive Mode** - User-friendly prompts (default)
- 🚀 **CLI Mode** - For automation and scripts
- 📦 **Type Generation** - Convert JSON to TypeScript interfaces with deduplication
- 🎲 **Dummy Data** - Generate type-safe dummy data functions
- 🎨 **Colored Output** - Beautiful terminal output with progress indicators
- ✅ **Validation** - Input validation for file paths and names

## 📦 Installation

### Global Installation (Recommended)

```bash
cd /home/sweetpotet/Documents/projects/json-to-ts-cli
npm install
npm run build
npm link
```

Now you can use `json-to-ts` command anywhere!

### Local Installation

```bash
npm install /home/sweetpotet/Documents/projects/json-to-ts-cli
```

## 🚀 Usage

### Interactive Mode (Default)

Simply run:

```bash
json-to-ts
```

You'll be guided through interactive prompts:

```
🚀 JSON to TypeScript Interactive CLI

? What would you like to do?
  ❯ 📝 Generate TypeScript Types
    🎲 Generate Dummy Data
    ✨ Both (Types + Dummy)

? Input JSON file path: examples/closing-finance.json
? Type name (PascalCase): ClosingFinance
? Output location:
  ❯ Same directory as input
    Custom path
    Print to console
? Mark all fields as optional? No

✅ TypeScript types generated successfully!
📁 /path/to/closing-finance.d.ts
ℹ️  Generated 9 interfaces
```

### CLI Mode

#### Generate TypeScript Types

```bash
json-to-ts types -i data.json -o types.d.ts -n MyType
```

**Options:**
- `-i, --input <path>` - Input JSON file (required)
- `-o, --output <path>` - Output TypeScript file
- `-n, --name <name>` - Type name (required)
- `--optional` - Mark all fields as optional

#### Generate Dummy Data

```bash
json-to-ts dummy \
  -i data.json \
  -t types.d.ts \
  -n MyType \
  -f getDummyData \
  -o dummy.ts
```

**Options:**
- `-i, --input <path>` - Input JSON file (required)
- `-t, --types <path>` - TypeScript types file (required)
- `-n, --type-name <name>` - Type name (required)
- `-f, --function-name <name>` - Function name (required)
- `-o, --output <path>` - Output file
- `--no-async` - Generate synchronous function
- `--no-wrapper` - Don't wrap in BaseApiResponse

## 📝 Examples

### Example 1: Generate Types (Interactive)

```bash
json-to-ts
# Select "Generate TypeScript Types"
# Follow the prompts
```

### Example 2: Generate Types (CLI)

```bash
json-to-ts types \
  --input examples/closing-finance.json \
  --output src/types/closing-finance.d.ts \
  --name ClosingFinance
```

### Example 3: Generate Dummy Data

```bash
json-to-ts dummy \
  -i examples/closing-finance.json \
  -t src/types/closing-finance.d.ts \
  -n ClosingFinance \
  -f dummyGetClosingFinance \
  -o src/dummy/closing-finance.dummy.ts
```

### Example 4: Both Types and Dummy

```bash
json-to-ts
# Select "Both (Types + Dummy)"
# Follow the prompts for both
```

## 🎨 Output Examples

### Generated TypeScript Types

```typescript
export interface ClosingFinanceVolumeBase {
  total_birds: number;
  total_weight_kg: number;
}

export interface ClosingFinance {
  project_flock_id: number;
  period: number;
  project_type: string;
  volume_base: ClosingFinanceVolumeBase;
  // ... more fields
}
```

### Generated Dummy Data

```typescript
import { ClosingFinance } from './types';
import { BaseApiResponse } from '@/types/api/api-general';

const DUMMY_DATA: ClosingFinance = {
  // JSON data formatted as TypeScript
};

export async function dummyGetClosingFinance(
  id?: number
): Promise<BaseApiResponse<ClosingFinance>> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        code: 200,
        status: 'success',
        message: 'Data retrieved successfully',
        data: DUMMY_DATA,
      });
    }, 500);
  });
}
```

## 🔧 Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build
npm run build

# Link globally for testing
npm link
```

## 📂 Project Structure

```
json-to-ts-cli/
├── src/
│   ├── index.ts              # Main CLI entry point
│   ├── commands/
│   │   ├── interactive.ts    # Interactive mode
│   │   ├── types.ts          # Type generation command
│   │   └── dummy.ts          # Dummy data command
│   ├── lib/
│   │   ├── converter.ts      # Type conversion logic
│   │   ├── dummy-generator.ts # Dummy data logic
│   │   └── types.ts          # Type definitions
│   └── utils/
│       ├── prompts.ts        # Interactive prompts
│       └── logger.ts         # Colored output
├── dist/                     # Compiled output
└── examples/                 # Example JSON files
```

## 🎯 Use Cases

- Convert API response JSON to TypeScript types
- Generate type-safe dummy data for testing
- Quick prototyping with type safety
- Automate type generation in CI/CD pipelines

## 📄 License

MIT

## 👤 Author

Randy AR
