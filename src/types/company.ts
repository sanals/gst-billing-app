export interface BankDetails {
  accountHolder: string;
  bankName: string;
  accountNumber: string;
  branch: string;
  ifscCode: string;
}

export interface CompanySettings {
  name: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  stateCode: string;
  pincode: string;
  gstin: string;
  mobile1: string;
  mobile2?: string;
  officePhone?: string;
  email: string;
  bankDetails: BankDetails;
  invoicePrefix: string;
  logo?: string; // base64 or file path
}

export const DEFAULT_COMPANY_SETTINGS: CompanySettings = {
  name: 'JANAKI ENTERPRISES',
  address1: 'MP12/43, Greenilayam Shopping Complex, Appacchire',
  address2: 'Postitthol',
  city: 'Kottayam',
  state: 'Kerala',
  stateCode: '22',
  pincode: '834034',
  gstin: '22AAUPJ7SS1B12M',
  mobile1: '9838884048',
  mobile2: '9211055768',
  officePhone: '44929 799627',
  email: 'janakienterprises@gmail.com',
  bankDetails: {
    accountHolder: 'JANAKI ENTERPRISES',
    bankName: 'INDIAN BANK',
    accountNumber: '7926826378',
    branch: 'AKATHETRARIA',
    ifscCode: 'IDIBD00A007',
  },
  invoicePrefix: 'KTMVS',
};

