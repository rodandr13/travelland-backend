export const GP_WEB_PAY_FIELD_ORDER = [
  'OPERATION',
  'ORDERNUMBER',
  'MERORDERNUM',
  'MD',
  'PRCODE',
  'SRCODE',
  'RESULTTEXT',
  'ADDINFO',
  'TOKEN',
  'EXPIRY',
  'ACSRES',
  'ACCODE',
  'PANPATTERN',
  'TOKENREGSTATUS',
  'ACRC',
  'RRN',
  'PAR',
  'TRACEID',
];

export const SIGN_KEYS = [
  'MERCHANTNUMBER',
  'OPERATION',
  'ORDERNUMBER',
  'AMOUNT',
  'CURRENCY',
  'DEPOSITFLAG',
  'MERORDERNUM',
  'URL',
  'DESCRIPTION',
  'MD',
  'PAYMETHOD',
  'PAYMETHODS',
  'EMAIL',
  'REFERENCENUMBER',
];

export const CURRENCY = {
  EUR: 978,
};

export const DEPOSIT_FLAG = {
  ON: '0',
  OFF: '1',
};

export const PAYMENT_METHOD = {
  CARD: 'CRD',
};

export const PRCODE_MESSAGES = {
  DUPLICATE_ORDER_NUMBER: '14',
};
