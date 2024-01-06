import { FileLines } from './file-lines.js';

export class NoticeParser {
  constructor(public file: FileLines) {}

  tryParse() {
    let max = 5;
    while (max--) {
      if (this.file.getNext()?.match(/\bnotice\b/i)) {
        return true;
      }
    }
    return false;
  }

  getParsed() {
    return {};
  }
}
