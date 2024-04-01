import { PaymentStatus } from '../interfaces/payments.js';

export interface CreateTransactionParameters {
  orderId: string;
  invoiceId?: string;
  packageId: string;
  amount: number;
  phone: string;
  email: string;
  extraParameters?: string[];
}

export interface Transaction {
  id: string;
  sid: string;
  orderId: string;
  amount: number;
  phone: string;
  email: string;
}

export interface StkPushResult {
  orderId: string;
  status: number;
  success: boolean;
  text: string;
  errorCode?: number;
}

export interface checkTransactionResult {
  status: PaymentStatus;
}

export abstract class PaymentApiService {
  abstract isLiveMode(): boolean;
  abstract createTransaction(
    txParams: CreateTransactionParameters,
    forUserId: string,
  ): Promise<Transaction>;

  abstract triggerStkPush(tx: Transaction): Promise<StkPushResult>;
  abstract checkTransaction(orderId: string): Promise<any>;
  abstract validateTransaction(
    params: Record<string, string>,
  ): Promise<PaymentStatus>;
}
