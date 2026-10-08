import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

function walk(dir: string, fileList: string[] = []): string[] {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      walk(filePath, fileList);
    } else {
      if (filePath.endsWith('.ts') || filePath.endsWith('.tsx') || filePath.endsWith('.js') || filePath.endsWith('.jsx')) {
        fileList.push(filePath);
      }
    }
  }
  return fileList;
}

describe('Google Fonts', () => {
  it('should not import next/font/google anywhere in src', () => {
    const srcPath = path.join(__dirname);
    const files = walk(srcPath);
    const violatingFiles = [];
    
    // We break the string to avoid self-match
    const target = 'next/font/' + 'google';
    
    for (const file of files) {
      if (file.endsWith('no-google-fonts.test.ts')) continue;
      
      const content = fs.readFileSync(file, 'utf-8');
      if (content.includes(target)) {
        violatingFiles.push(file);
      }
    }
    
    expect(violatingFiles).toEqual([]);
  });
});
