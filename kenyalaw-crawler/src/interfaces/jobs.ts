export interface ICorrectionJob {
  type: string;
  id: string;
  status: string;
  sha1: string;
  fileName: string;
  finishedOn: number;
}

export interface IAutomatedJob {
  type: string;
  id: string;
  status: string;
  crawlTime: string;
  finishedOn: number;
}
