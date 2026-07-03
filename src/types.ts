/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface PersonalInfo {
  name: string;
  ssn: string; // Will be redacted client-side
  dob: string;
  address: string;
  phone?: string;
}

export interface AccountItem {
  id: string;
  accountName: string;
  accountNumber: string; // Will be redacted down to last 4 digits client-side
  bureau: 'Experian' | 'TransUnion' | 'Equifax' | 'Innovis';
  balance: number;
  monthlyPayment?: number;
  dateOpened: string;
  accountStatus: string;
  accountType: string;
  disputeReason?: string;
}

export interface InquiryItem {
  id: string;
  inquirer: string;
  inquiryDate: string;
  bureau: 'Experian' | 'TransUnion' | 'Equifax' | 'Innovis';
}

export interface CreditReport {
  bureauName: 'Experian' | 'TransUnion' | 'Equifax' | 'Innovis';
  personalInfo: PersonalInfo;
  accounts: AccountItem[];
  inquiries: InquiryItem[];
}

export interface Discrepancy {
  id: string;
  accountName: string;
  fieldName: string;
  bureauA: string;
  valueA: string;
  bureauB: string;
  valueB: string;
  isAccountDiscrepancy: boolean;
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  link?: string;
}

export interface FlaggedItem {
  id: string;
  type: 'fraud' | 'error';
  source: 'account' | 'inquiry' | 'personal_info';
  itemTitle: string;
  bureau: string;
  details: string;
  disputeReason: string;
  checklist: ChecklistItem[];
  letterDraft?: string;
  isCustomDispute?: boolean;
}
