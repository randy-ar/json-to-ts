import * as fs from "fs";
import * as path from "path";

/**
 * Markers for code blocks
 */
const MARKERS = {
  DUMMY_START: "// DUMMY_START",
  DUMMY_END: "// DUMMY_END",
  LIVE_START: "// LIVE_START",
  LIVE_END: "// LIVE_END",
} as const;

/**
 * Switch code to use dummy implementation
 */
export function switchToDummy(filePath: string): void {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  const result: string[] = [];

  let inDummyBlock = false;
  let inLiveBlock = false;

  for (const line of lines) {
    // Check for markers
    if (line.trim() === MARKERS.DUMMY_START) {
      inDummyBlock = true;
      result.push(line);
      continue;
    }

    if (line.trim() === MARKERS.DUMMY_END) {
      inDummyBlock = false;
      result.push(line);
      continue;
    }

    if (line.trim() === MARKERS.LIVE_START) {
      inLiveBlock = true;
      result.push(line);
      continue;
    }

    if (line.trim() === MARKERS.LIVE_END) {
      inLiveBlock = false;
      result.push(line);
      continue;
    }

    // Process lines based on current block
    if (inDummyBlock) {
      // Uncomment dummy code
      if (line.trim().startsWith("//")) {
        result.push(line.replace(/^(\s*)\/\/\s?/, "$1"));
      } else {
        result.push(line);
      }
    } else if (inLiveBlock) {
      // Comment live code
      if (!line.trim().startsWith("//") && line.trim().length > 0) {
        const indent = line.match(/^(\s*)/)?.[1] || "";
        result.push(`${indent}// ${line.trimStart()}`);
      } else {
        result.push(line);
      }
    } else {
      // Outside blocks, keep as is
      result.push(line);
    }
  }

  fs.writeFileSync(filePath, result.join("\n"), "utf-8");
}

/**
 * Switch code to use live implementation
 */
export function switchToLive(filePath: string): void {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  const result: string[] = [];

  let inDummyBlock = false;
  let inLiveBlock = false;

  for (const line of lines) {
    // Check for markers
    if (line.trim() === MARKERS.DUMMY_START) {
      inDummyBlock = true;
      result.push(line);
      continue;
    }

    if (line.trim() === MARKERS.DUMMY_END) {
      inDummyBlock = false;
      result.push(line);
      continue;
    }

    if (line.trim() === MARKERS.LIVE_START) {
      inLiveBlock = true;
      result.push(line);
      continue;
    }

    if (line.trim() === MARKERS.LIVE_END) {
      inLiveBlock = false;
      result.push(line);
      continue;
    }

    // Process lines based on current block
    if (inDummyBlock) {
      // Comment dummy code
      if (!line.trim().startsWith("//") && line.trim().length > 0) {
        const indent = line.match(/^(\s*)/)?.[1] || "";
        result.push(`${indent}// ${line.trimStart()}`);
      } else {
        result.push(line);
      }
    } else if (inLiveBlock) {
      // Uncomment live code
      if (line.trim().startsWith("//")) {
        result.push(line.replace(/^(\s*)\/\/\s?/, "$1"));
      } else {
        result.push(line);
      }
    } else {
      // Outside blocks, keep as is
      result.push(line);
    }
  }

  fs.writeFileSync(filePath, result.join("\n"), "utf-8");
}

/**
 * Remove all dummy code blocks and markers (production ready)
 */
export function cleanDummy(filePath: string): void {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  const result: string[] = [];

  let inDummyBlock = false;
  let inLiveBlock = false;
  let skipEmptyLines = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check for markers
    if (line.trim() === MARKERS.DUMMY_START) {
      inDummyBlock = true;
      skipEmptyLines = 1; // Skip one empty line after removing block
      continue;
    }

    if (line.trim() === MARKERS.DUMMY_END) {
      inDummyBlock = false;
      continue;
    }

    if (line.trim() === MARKERS.LIVE_START) {
      inLiveBlock = true;
      continue;
    }

    if (line.trim() === MARKERS.LIVE_END) {
      inLiveBlock = false;
      skipEmptyLines = 1; // Skip one empty line after removing marker
      continue;
    }

    // Skip dummy block entirely
    if (inDummyBlock) {
      continue;
    }

    // In live block, uncomment and keep
    if (inLiveBlock) {
      if (line.trim().startsWith("//")) {
        result.push(line.replace(/^(\s*)\/\/\s?/, "$1"));
      } else {
        result.push(line);
      }
      continue;
    }

    // Skip empty lines after removed blocks
    if (skipEmptyLines > 0 && line.trim() === "") {
      skipEmptyLines--;
      continue;
    }

    // Keep everything else
    result.push(line);
  }

  fs.writeFileSync(filePath, result.join("\n"), "utf-8");
}

/**
 * Process multiple files
 */
export function processFiles(
  files: string[],
  mode: "dummy" | "live" | "clean"
): { processed: string[]; errors: string[] } {
  const processed: string[] = [];
  const errors: string[] = [];

  for (const file of files) {
    try {
      const resolvedPath = path.resolve(process.cwd(), file);

      if (!fs.existsSync(resolvedPath)) {
        errors.push(`File not found: ${file}`);
        continue;
      }

      switch (mode) {
        case "dummy":
          switchToDummy(resolvedPath);
          break;
        case "live":
          switchToLive(resolvedPath);
          break;
        case "clean":
          cleanDummy(resolvedPath);
          break;
      }

      processed.push(file);
    } catch (error) {
      errors.push(
        `Error processing ${file}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  return { processed, errors };
}
