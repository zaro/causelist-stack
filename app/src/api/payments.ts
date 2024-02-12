export interface IpayAfricaPaymentTxParameters {
  live?: number;
  mpesa?: number;
  bonga?: number;
  airtel?: number;
  equity?: number;
  mobilebanking?: number;
  creditcard?: number;
  unionpay?: number;
  mvisa?: number;
  vooma?: number;
  pesalink?: number;
  autopay?: number;
  oid: string;
  inv?: string;
  ttl: number;
  tel: string;
  eml: string;
  vid?: string;
  curr: 'USD' | 'KES';
  p1?: string;
  p2?: string;
  p3?: string;
  p4?: string;
  cbk?: string;
  lbk?: string;
  cst?: number;
  crl?: number;
  hsh?: string;
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  CANCELED = 'canceled',
  FAILED = 'failed',
  INSUFFICIENT_AMOUNT = 'insufficient_amount',
}

export interface IOrderStatus {
  orderId: string;
  status: PaymentStatus;
}
