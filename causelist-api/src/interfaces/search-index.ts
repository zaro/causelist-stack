export interface CaseIndex {
  meta: any;
  title: string;
  url: string;
  case_id: string;
  case_number: string;
  parties: string;
  date_delivered_human: string;
  date_delivered: Date;
  date_delivered_ms: number;
  case_class: string;
  court: string;
  case_action: string;
  judge: string;
  citation: string;
  disclaimer: string;
  html: string;
  txt: string;
}
