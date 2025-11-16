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
  name: '',
  address1: '',
  address2: '',
  city: '',
  state: '',
  stateCode: '',
  pincode: '',
  gstin: '',
  mobile1: '',
  mobile2: '',
  officePhone: '',
  email: '',
  bankDetails: {
    accountHolder: '',
    bankName: '',
    accountNumber: '',
    branch: '',
    ifscCode: '',
  },
  invoicePrefix: '',
};

