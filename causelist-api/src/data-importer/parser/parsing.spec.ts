import * as fs from 'node:fs';
import * as path from 'node:path';
import { FileLines } from './file-lines.js';
import { CauselistMultiDocumentParser } from './causelist-parser.js';

const fixturesDir = 'src/data-importer/parser/__fixtures__/data';

describe('parsing', () => {
  describe('CauselistMultiDocumentParser', () => {
    const documents = fs
      .readdirSync(fixturesDir)
      .filter((f) => f.endsWith('.json'))
      .map((f) =>
        JSON.parse(fs.readFileSync(path.join(fixturesDir, f)).toString()),
      );
    it.each(documents)('should parse textContent', (document) => {
      const fileLines = new FileLines(document.textContent);
      const parser = new CauselistMultiDocumentParser(fileLines);
      parser.tryParse();
      // We must have consumed all text
      expect(parser.file.end()).toBe(true);

      expect(parser.getParsed()).toMatchSnapshot(document.textContentHash);
    });
  });
});
