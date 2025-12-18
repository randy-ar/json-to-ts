#!/usr/bin/env node

/**
 * Test script untuk fitur generate dummy data dengan count
 */

import { generateDummyData } from './dist/lib/dummy-generator.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read test data
const jsonData = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'test-product.json'), 'utf-8')
);

console.log('🧪 Testing Dummy Data Generation with Count Feature\n');

// Test 1: Generate single data (count = 1)
console.log('Test 1: Generate single data (count = 1)');
console.log('='.repeat(50));
const result1 = generateDummyData(jsonData, {
  input: 'test-product.json',
  types: path.join(__dirname, 'test-product.d.ts'),
  typeName: 'Product',
  functionName: 'getDummyProduct',
  async: true,
  wrapper: true,
  count: 1,
});
console.log(result1);
console.log('\n');

// Test 2: Generate 5 data items
console.log('Test 2: Generate 5 data items (count = 5)');
console.log('='.repeat(50));
const result2 = generateDummyData(jsonData, {
  input: 'test-product.json',
  types: path.join(__dirname, 'test-product.d.ts'),
  typeName: 'Product',
  functionName: 'getDummyProducts',
  async: true,
  wrapper: true,
  count: 5,
});
console.log(result2);
console.log('\n');

// Test 3: Generate 3 data items without wrapper
console.log('Test 3: Generate 3 data items without wrapper (count = 3)');
console.log('='.repeat(50));
const result3 = generateDummyData(jsonData, {
  input: 'test-product.json',
  types: path.join(__dirname, 'test-product.d.ts'),
  typeName: 'Product',
  functionName: 'getProducts',
  async: false,
  wrapper: false,
  count: 3,
});
console.log(result3);
console.log('\n');

console.log('✅ All tests completed!');
