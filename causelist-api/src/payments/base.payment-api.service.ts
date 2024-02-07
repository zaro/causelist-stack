export interface CreateTransactionParameters {
  orderId: string;
  invoiceId?: string;
  amount: number;
  phone: string;
  email: string;
  extraParameters: string[];
}

export interface Transaction {
  id: string;
  orderId: string;
  amount: string;
  phone: string;
  email: string;
}

export interface StkPushResult {
  status: number;
  text: string;
}

export abstract class BasePaymentApiService {
  abstract createTransaction(
    txParams: CreateTransactionParameters,
  ): Promise<Transaction>;

  abstract triggerStkPush(tx: Transaction): Promise<StkPushResult>;
}
