import {
  CauselistMultiDocumentParsed,
  CauselistMultiDocumentParser1,
} from './causelist-parser-1.js';
import { CauselistMultiDocumentParser2 } from './causelist-parser-2.js';
import { FileLines } from './file-lines.js';
import { MultiParser } from './parser-base.js';

export class CauselistMultiDocumentParser extends MultiParser<CauselistMultiDocumentParsed> {
  constructor(file: FileLines) {
    super(file, [CauselistMultiDocumentParser1]);
    // TODO: make it works w/o errors
    // super(file, [CauselistMultiDocumentParser1, CauselistMultiDocumentParser2]);
  }
}
