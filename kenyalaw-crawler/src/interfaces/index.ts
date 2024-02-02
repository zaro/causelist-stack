export interface CauselistHeaderParsed {
  court: string[];
  date: string;
  judge: string;
  courtRoom: string;
  url: string;
  email: string;
  phone: string;
}

export type CauselistLineParsed = {
  caseNumber: string;
  num: string;
  additionalNumber?: string;
  partyA: string;
  partyB: string;
  description: string;
};

export interface CauselistSectionParsed {
  dateTime: Date;
  typeOfCause: string;
  cases: CauselistLineParsed[];
}

export interface CauseListParsed {
  type: 'CAUSE LIST';
  header: CauselistHeaderParsed;
  causeLists: CauselistSectionParsed[];
}

export interface UnassignedMattersHeaderParsed {
  date: string;
}

export type UnassignedMattersLineParsed = {
  typeOfCause: string;
  caseNumber: string;
  num: string;
  partyA: string;
  partyB: string;
  description: string;
};

export interface UnassignedMattersParsed {
  type: 'UNASSIGNED MATTERS';
  header: UnassignedMattersHeaderParsed;
  cases: UnassignedMattersLineParsed[];
}

export type CauseListDocumentParsed = CauseListParsed | UnassignedMattersParsed;

export type DocumentTypeHint =
  | 'AUTO'
  | UnassignedMattersParsed['type']
  | CauseListDocumentParsed['type']
  | 'NOTICE';
