export interface ICorrectionJob {
  type: string;
  id: string;
  status: string;
  sha1: string;
  fileName: string;
  finishedOn: number;
}
