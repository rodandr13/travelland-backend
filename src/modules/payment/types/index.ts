export type PaymentParams = {
  [key: string]: string;
};

export type PaymentResponseParams = {
  OPERATION: GPWebPayOperations;
  ORDERNUMBER: string;
  MERORDERNUM?: string;
  MD?: string;
  PRCODE: string;
  SRCODE: string;
  RESULTTEXT?: string;
  ADDINFO?: string;
  TOKEN?: string;
  EXPIRY?: string;
  ACSRES?: string;
  ACCODE?: string;
  PANPATTERN?: string;
  DAYTOCAPTURE?: string;
  TOKENREGSTATUS?: string;
  ACRC?: string;
  RRN?: string;
  PAR?: string;
  TRACEID?: string;
  DIGEST: string;
  DIGEST1: string;
};

export type PaymentResponseWithoutDigest = Omit<
  PaymentResponseParams,
  'DIGEST' | 'DIGEST1'
>;

export enum GPWebPayOperations {
  CREATE_ORDER = 'CREATE_ORDER',
}

export enum PaymentStatusResponse {
  SUCCESS = 'success',
  FAILURE = 'failure',
}

export type PaymentResultResponse = {
  token: string;
};
