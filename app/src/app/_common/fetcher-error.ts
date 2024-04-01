export class FetcherError extends Error {
  constructor(
    msg: string,
    public readonly object: any,
    public readonly status: number
  ) {
    super(msg);
  }
}
