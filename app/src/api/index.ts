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

export interface CauseListDocumentParsed {
  // type: 'CAUSE LIST' | 'UNASSIGNED MATTERS';
  type: string;
  header: CauselistHeaderParsed;
  causeLists: CauselistSectionParsed[];
}
