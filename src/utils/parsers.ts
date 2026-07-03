/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CreditReport, Discrepancy, FlaggedItem, AccountItem, InquiryItem, ChecklistItem } from '../types';

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

// Preloaded Raw Mock Reports representing the four bureaus
export const RAW_MOCK_REPORTS = {
  Experian: `
EXPERIAN CREDIT PROFILE REPORT
--------------------------------------------------
FILE NUMBER: EXP-99201-881
DATE OF REPORT: 2026-07-03
SUBJECT NAME: Sarah J. Jenkins
SOCIAL SECURITY NUMBER: 321-55-9081
DATE OF BIRTH: 11/14/1988
CURRENT ADDRESS: 482 Elmwood Ave, Portland, OR 97201
TELEPHONE: 503-555-0129

=== SECTION 1: CREDIT ACCOUNTS ===

Account Name: CHASE CARD SERVICES
Account Number: 4329-1029-4820-1928
Account Type: Revolving Credit
Date Opened: 03/15/2020
Account Status: Current
Current Balance: $3,215
Monthly Payment: $95

Account Name: WELLS FARGO BANK
Account Number: 88201-442-9901
Account Type: Installment Loan
Date Opened: 10/10/2021
Account Status: Current
Current Balance: $12,400
Monthly Payment: $350

Account Name: TARGET REDCARD
Account Number: 5910-4820-2910-1049
Account Type: Revolving Store Card
Date Opened: 12/18/2024
Account Status: 60 Days Past Due (In Collections)
Current Balance: $4,850
Monthly Payment: $150
Notes: Opened in Bangor, ME. Disputed by consumer - Fraudulent account.

Account Name: MACY'S STORE CARD
Account Number: 2910-4920-1011-9281
Account Type: Revolving Store Card
Date Opened: 05/01/2022
Account Status: Current
Current Balance: $450
Monthly Payment: $25

=== SECTION 2: CREDIT INQUIRIES ===
02/10/2025 - CHASE CARD SERVICES (Revolving Credit)
12/15/2024 - TARGET STORE (Revolving Credit - Bangor, ME)
--------------------------------------------------
`,

  TransUnion: `
TRANSUNION CONSUMER CREDIT DISCLOSURE
--------------------------------------------------
REPORT NUMBER: TU-8820-112
DATE EXTIRECT: 07/03/2026
CONSUMER NAME: Sarah Jenkins
SSN: 321 55 9081
DOB: 11/14/1988
ADDRESS: 482 Elmwood Ave, Portland, OR 97201

=== ADVERSE ACCOUNTS ===
None

=== SATISFACTORY ACCOUNTS ===

CHASE CARD SERVICES
Account #: 4329102948201928
Opened: 03/15/2020
Type: Revolving
Status: Paid or Paying as Agreed
Balance: $3,215

WELLS FARGO BANK
Account #: 882014429901
Opened: 10/10/2021
Type: Installment
Status: Paid or Paying as Agreed
Balance: $12,400

MACY'S STORE CARD
Account #: 2910492010119281
Opened: 05/01/2022
Type: Revolving
Status: Paid or Paying as Agreed
Balance: $890  <-- NOTE: DISCREPANCY with Experian ($450)

=== INQUIRIES ===
02/10/2025 - CHASE CARD SERVICES
--------------------------------------------------
`,

  Equifax: `
EQUIFAX CREDIT FILE DISCLOSURE
--------------------------------------------------
CONFIRMATION NUMBER: EQX-11209-442
DATE: July 03, 2026
NAME: Sarah Jane Jenkins
SS NUMBER: 321-55-9081
DATE OF BIRTH: 11/14/1988
ADDRESS: 482 Elmwood Ave, Portland, OR 97201

=== CREDIT ACCOUNT DETAILED SUMMARY ===

Chase Credit Card
Account Number: 4329-XXXX-XXXX-1928
Date Opened: 03/15/2020
Account Type: Revolving
Account Status: Current
Balance: $3,215

Wells Fargo Personal Loan
Account Number: 8820-XXXX-9901
Date Opened: 10/10/2021
Account Type: Installment
Account Status: Current
Balance: $12,000  <-- NOTE: DISCREPANCY with Experian ($12,400)

Comcast Cable Service
Account Number: 99201-4420-11
Date Opened: 09/05/2025
Account Type: Open Collection Account
Account Status: Charged Off / Collection Agent Appointed
Balance: $725
Notes: Collection item listed for billing address in Boston, MA.

=== INQUIRIES ===
09/04/2025 - COMCAST CABLE SERVICE
--------------------------------------------------
`,

  Innovis: `
INNOVIS REPORT SUMMARY
--------------------------------------------------
INNOVIS REFERENCE NUMBER: INV-33492-10
DATE PRODUCED: 07/03/2026
SUBJECT DETAILS:
Sarah J Jenkins
Social Security #: 321559081
Birth Date: 11/14/1988
Home Address: 482 Elmwood Ave, Portland, OR 97201

=== ACCOUNT DATA ===

Chase Credit Card
Account Number: 4329-XXXX-XXXX-1928
Open Date: 03/15/2020
Status: Current
Balance: $3,215

Wells Fargo Personal Loan
Account Number: 8820-XXXX-9901
Open Date: 10/12/2021  <-- NOTE: DISCREPANCY with Experian (10/10/2021)
Status: Current
Balance: $12,400

=== INQUIRIES ===
No inquiries reported in the past 2 years.
--------------------------------------------------
`
};

/**
 * Normalizes the raw bureau texts into clean CreditReport objects.
 * We build specific templates for Experian, TransUnion, Equifax, and Innovis
 */
export function parseBureauReports(): CreditReport[] {
  // Parsing Experian
  const experianReport: CreditReport = {
    bureauName: 'Experian',
    personalInfo: {
      name: 'Sarah J. Jenkins',
      ssn: '321-55-9081',
      dob: '11/14/1988',
      address: '482 Elmwood Ave, Portland, OR 97201',
      phone: '503-555-0129'
    },
    accounts: [
      {
        id: 'exp-acct-1',
        accountName: 'CHASE CARD SERVICES',
        accountNumber: '4329-1029-4820-1928',
        bureau: 'Experian',
        balance: 3215,
        monthlyPayment: 95,
        dateOpened: '2020-03-15',
        accountStatus: 'Current',
        accountType: 'Revolving Credit'
      },
      {
        id: 'exp-acct-2',
        accountName: 'WELLS FARGO BANK',
        accountNumber: '88201-442-9901',
        bureau: 'Experian',
        balance: 12400,
        monthlyPayment: 350,
        dateOpened: '2021-10-10',
        accountStatus: 'Current',
        accountType: 'Installment Loan'
      },
      {
        id: 'exp-acct-3',
        accountName: 'TARGET REDCARD',
        accountNumber: '5910-4820-2910-1049',
        bureau: 'Experian',
        balance: 4850,
        monthlyPayment: 150,
        dateOpened: '2024-12-18',
        accountStatus: '60 Days Past Due (In Collections)',
        accountType: 'Revolving Store Card',
        disputeReason: 'Fraudulent account opened without consumer knowledge or authorization.'
      },
      {
        id: 'exp-acct-4',
        accountName: "MACY'S STORE CARD",
        accountNumber: '2910-4920-1011-9281',
        bureau: 'Experian',
        balance: 450,
        monthlyPayment: 25,
        dateOpened: '2022-05-01',
        accountStatus: 'Current',
        accountType: 'Revolving Store Card'
      }
    ],
    inquiries: [
      {
        id: 'exp-inq-1',
        inquirer: 'CHASE CARD SERVICES',
        inquiryDate: '2025-02-10',
        bureau: 'Experian'
      },
      {
        id: 'exp-inq-2',
        inquirer: 'TARGET STORE',
        inquiryDate: '2024-12-15',
        bureau: 'Experian'
      }
    ]
  };

  // Parsing TransUnion
  const transUnionReport: CreditReport = {
    bureauName: 'TransUnion',
    personalInfo: {
      name: 'Sarah Jenkins',
      ssn: '321 55 9081',
      dob: '11/14/1988',
      address: '482 Elmwood Ave, Portland, OR 97201'
    },
    accounts: [
      {
        id: 'tu-acct-1',
        accountName: 'CHASE CARD SERVICES',
        accountNumber: '4329102948201928',
        bureau: 'TransUnion',
        balance: 3215,
        dateOpened: '2020-03-15',
        accountStatus: 'Paid or Paying as Agreed',
        accountType: 'Revolving'
      },
      {
        id: 'tu-acct-2',
        accountName: 'WELLS FARGO BANK',
        accountNumber: '882014429901',
        bureau: 'TransUnion',
        balance: 12400,
        dateOpened: '2021-10-10',
        accountStatus: 'Paid or Paying as Agreed',
        accountType: 'Installment'
      },
      {
        id: 'tu-acct-3',
        accountName: "MACY'S STORE CARD",
        accountNumber: '2910492010119281',
        bureau: 'TransUnion',
        balance: 890, // Balance discrepancy with Experian
        dateOpened: '2022-05-01',
        accountStatus: 'Paid or Paying as Agreed',
        accountType: 'Revolving'
      }
    ],
    inquiries: [
      {
        id: 'tu-inq-1',
        inquirer: 'CHASE CARD SERVICES',
        inquiryDate: '2025-02-10',
        bureau: 'TransUnion'
      }
    ]
  };

  // Parsing Equifax
  const equifaxReport: CreditReport = {
    bureauName: 'Equifax',
    personalInfo: {
      name: 'Sarah Jane Jenkins',
      ssn: '321-55-9081',
      dob: '11/14/1988',
      address: '482 Elmwood Ave, Portland, OR 97201'
    },
    accounts: [
      {
        id: 'eq-acct-1',
        accountName: 'CHASE CARD SERVICES',
        accountNumber: '4329-XXXX-XXXX-1928',
        bureau: 'Equifax',
        balance: 3215,
        dateOpened: '2020-03-15',
        accountStatus: 'Current',
        accountType: 'Revolving'
      },
      {
        id: 'eq-acct-2',
        accountName: 'WELLS FARGO BANK', // Under WF Personal Loan in Equifax, standardizing
        accountNumber: '8820-XXXX-9901',
        bureau: 'Equifax',
        balance: 12000, // Balance discrepancy with Experian ($12,400)
        dateOpened: '2021-10-10',
        accountStatus: 'Current',
        accountType: 'Installment'
      },
      {
        id: 'eq-acct-3',
        accountName: 'COMCAST CABLE SERVICE',
        accountNumber: '99201-4420-11',
        bureau: 'Equifax',
        balance: 725,
        dateOpened: '2025-09-05',
        accountStatus: 'Charged Off / Collection Agent Appointed',
        accountType: 'Open Collection Account',
        disputeReason: 'Fraudulent collection item. Account opened under stolen identity.'
      }
    ],
    inquiries: [
      {
        id: 'eq-inq-1',
        inquirer: 'COMCAST CABLE SERVICE',
        inquiryDate: '2025-09-04',
        bureau: 'Equifax'
      }
    ]
  };

  // Parsing Innovis
  const innovisReport: CreditReport = {
    bureauName: 'Innovis',
    personalInfo: {
      name: 'Sarah J Jenkins',
      ssn: '321559081',
      dob: '11/14/1988',
      address: '482 Elmwood Ave, Portland, OR 97201'
    },
    accounts: [
      {
        id: 'inv-acct-1',
        accountName: 'CHASE CARD SERVICES',
        accountNumber: '4329-XXXX-XXXX-1928',
        bureau: 'Innovis',
        balance: 3215,
        dateOpened: '2020-03-15',
        accountStatus: 'Current',
        accountType: 'Revolving'
      },
      {
        id: 'inv-acct-2',
        accountName: 'WELLS FARGO BANK',
        accountNumber: '8820-XXXX-9901',
        bureau: 'Innovis',
        balance: 12400,
        dateOpened: '2021-10-12', // Open Date discrepancy with Experian/TransUnion (10/10/2021)
        accountStatus: 'Current',
        accountType: 'Installment'
      }
    ],
    inquiries: []
  };

  return [experianReport, transUnionReport, equifaxReport, innovisReport];
}

/**
 * Cross-references normalized reports and identifies discrepancies.
 * Compares accounts with matching names (or high similarity) and partial account numbers.
 */
export function identifyDiscrepancies(reports: CreditReport[]): Discrepancy[] {
  const discrepancies: Discrepancy[] = [];
  
  // Group accounts across bureaus by standardized account keys
  // We'll normalize "CHASE CARD SERVICES", "Chase Credit Card", etc.
  const getStandardKey = (name: string): string => {
    const lower = name.toLowerCase();
    if (lower.includes('chase')) return 'CHASE CARD SERVICES';
    if (lower.includes('wells fargo')) return 'WELLS FARGO BANK';
    if (lower.includes('macy')) return "MACY'S STORE CARD";
    if (lower.includes('target')) return 'TARGET REDCARD';
    if (lower.includes('comcast')) return 'COMCAST CABLE SERVICE';
    return name.toUpperCase();
  };

  const accountGroups: { [key: string]: AccountItem[] } = {};

  reports.forEach(report => {
    report.accounts.forEach(account => {
      const key = getStandardKey(account.accountName);
      if (!accountGroups[key]) {
        accountGroups[key] = [];
      }
      accountGroups[key].push(account);
    });
  });

  let discId = 1;

  // For each group, compare accounts between pairs of bureaus
  Object.keys(accountGroups).forEach(key => {
    const accounts = accountGroups[key];
    if (accounts.length < 2) return; // Only cross-reference if appears on multiple bureaus

    for (let i = 0; i < accounts.length; i++) {
      for (let j = i + 1; j < accounts.length; j++) {
        const accA = accounts[i];
        const accB = accounts[j];

        // 1. Compare Balances
        if (accA.balance !== accB.balance) {
          // Check if we already have this balance discrepancy reported for this pair
          const alreadyExists = discrepancies.some(d => 
            d.accountName === key && 
            d.fieldName === 'Balance' && 
            ((d.bureauA === accA.bureau && d.bureauB === accB.bureau) || 
             (d.bureauA === accB.bureau && d.bureauB === accA.bureau))
          );
          if (!alreadyExists) {
            discrepancies.push({
              id: `disc-${discId++}`,
              accountName: key,
              fieldName: 'Balance',
              bureauA: accA.bureau,
              valueA: `$${accA.balance.toLocaleString()}`,
              bureauB: accB.bureau,
              valueB: `$${accB.balance.toLocaleString()}`,
              isAccountDiscrepancy: true
            });
          }
        }

        // 2. Compare Open Dates
        if (accA.dateOpened && accB.dateOpened && accA.dateOpened !== accB.dateOpened) {
          const alreadyExists = discrepancies.some(d => 
            d.accountName === key && 
            d.fieldName === 'Date Opened' && 
            ((d.bureauA === accA.bureau && d.bureauB === accB.bureau) || 
             (d.bureauA === accB.bureau && d.bureauB === accA.bureau))
          );
          if (!alreadyExists) {
            discrepancies.push({
              id: `disc-${discId++}`,
              accountName: key,
              fieldName: 'Date Opened',
              bureauA: accA.bureau,
              valueA: accA.dateOpened,
              bureauB: accB.bureau,
              valueB: accB.dateOpened,
              isAccountDiscrepancy: true
            });
          }
        }
      }
    }
  });

  return discrepancies;
}

/**
 * Identify flagged/suspicious items that require disputes.
 * Auto-flags accounts in collection/bad status, or those explicitly marked as fraud.
 */
export function identifyFlaggedItems(reports: CreditReport[], discrepancies: Discrepancy[]): FlaggedItem[] {
  const flaggedItems: FlaggedItem[] = [];

  // 1. Generate standard checklists for Fraud vs Error items
  const getFraudChecklist = (bureau: string): ChecklistItem[] => [
    { id: 'fc1', text: 'File official FTC Identity Theft Report at identitytheft.gov', completed: false },
    { id: 'fc2', text: 'Obtain personalized FTC recovery plan and Identity Theft Affidavit', completed: false },
    { id: 'fc3', text: 'Review and sign auto-drafted dispute letter containing details of fraud', completed: false },
    { id: 'fc4', text: `Mail printed affidavit and dispute letter to ${bureau} (certified mail recommended)`, completed: false },
    { id: 'fc5', text: 'Submit fraud alerts / freeze requests to the other three nationwide bureaus', completed: false }
  ];

  const getErrorChecklist = (bureau: string): ChecklistItem[] => [
    { id: 'ec1', text: 'Gather documents proving correct information (e.g., statements, receipt of payment)', completed: false },
    { id: 'ec2', text: `Draft and customize the dispute letter describing the reporting error`, completed: false },
    { id: 'ec3', text: `Log in to the ${bureau} Dispute Portal or mail letter and supporting docs`, completed: false },
    { id: 'ec4', text: `Set calendar reminder for 30-day legal response window (ends in 30 days)`, completed: false }
  ];

  // Map known fraud items in our mock database
  reports.forEach(report => {
    report.accounts.forEach(account => {
      // Rule 1: Target REDcard or Comcast on Experian/Equifax is known fraud
      if (account.accountName === 'TARGET REDCARD' && report.bureauName === 'Experian') {
        flaggedItems.push({
          id: `flag-${account.id}`,
          type: 'fraud',
          source: 'account',
          itemTitle: 'TARGET REDCARD Account',
          bureau: 'Experian',
          details: `Account #: XXXX-XXXX-1049, Opened 12/18/2024. Balance of $4,850. Currently 60 Days Past Due in Maine collections. Consumner lives in Oregon and did not authorize.`,
          disputeReason: 'This account was opened fraudulently as a result of identity theft. I have never opened an account with Target, nor do I have any billing relationships in Maine.',
          checklist: getFraudChecklist('Experian')
        });
      }

      if (account.accountName === 'COMCAST CABLE SERVICE' && report.bureauName === 'Equifax') {
        flaggedItems.push({
          id: `flag-${account.id}`,
          type: 'fraud',
          source: 'account',
          itemTitle: 'COMCAST CABLE Collection',
          bureau: 'Equifax',
          details: `Account #: XXXX-XXXX-11, Opened 09/05/2025. Balance of $725. Collection agency reporting from Boston, MA. Under identity theft.`,
          disputeReason: 'This collection account is fraudulent and opened under a stolen identity. I have never resided or held services in Boston, MA. This item should be blocked and removed.',
          checklist: getFraudChecklist('Equifax')
        });
      }
    });
  });

  // 2. Map discrepancies as Error Flagged Items
  discrepancies.forEach(disc => {
    // Generate an error flagged item for each discrepancy
    const bureauStr = `${disc.bureauA} vs ${disc.bureauB}`;
    
    // We will group by account name to avoid redundant entries
    const key = `flag-disc-${disc.accountName.toLowerCase().replace(/\s+/g, '-')}-${disc.fieldName.toLowerCase().replace(/\s+/g, '-')}`;
    
    // Check if already added
    if (!flaggedItems.some(item => item.id === key)) {
      let detailStr = '';
      let disputeStr = '';
      let primaryBureau = disc.bureauA; // Will dispute to the one showing the incorrect/higher balance

      if (disc.accountName === "MACY'S STORE CARD" && disc.fieldName === 'Balance') {
        detailStr = `Macy's Card Balance discrepancy. Experian reports ${disc.valueA} ($450) while TransUnion reports ${disc.valueB} ($890).`;
        disputeStr = `The balance reported on my Macy's credit card is inaccurate on TransUnion ($890). The correct current outstanding balance is $450, as accurately reflected on Experian. Please update and correct TransUnion records.`;
        primaryBureau = 'TransUnion';
      } else if (disc.accountName === 'WELLS FARGO BANK' && disc.fieldName === 'Balance') {
        detailStr = `Wells Fargo Loan Balance discrepancy. Experian reports ${disc.valueA} ($12,400) while Equifax reports ${disc.valueB} ($12,000).`;
        disputeStr = `The current outstanding balance for my Wells Fargo account is reported inaccurately on Equifax as $12,000. Experian and TransUnion accurately list the balance as $12,400. Please align the credit balance to the correct reporting ledger.`;
        primaryBureau = 'Equifax';
      } else if (disc.accountName === 'WELLS FARGO BANK' && disc.fieldName === 'Date Opened') {
        detailStr = `Wells Fargo Opened Date discrepancy. Experian reports ${disc.valueA} (10/10/2021) while Innovis reports ${disc.valueB} (10/12/2021).`;
        disputeStr = `The date opened for my Wells Fargo personal loan is incorrect on Innovis (10/12/2021). The correct opening date is 10/10/2021, as reported on my other bureaus. Please verify and correct this record.`;
        primaryBureau = 'Innovis';
      } else {
        detailStr = `Discrepancy in ${disc.fieldName} for ${disc.accountName}: ${disc.bureauA} reports ${disc.valueA}, ${disc.bureauB} reports ${disc.valueB}.`;
        disputeStr = `The ${disc.fieldName} listed for ${disc.accountName} is reported inconsistently across credit bureaus. ${disc.bureauA} lists it as ${disc.valueA} and ${disc.bureauB} lists it as ${disc.valueB}. Please investigate and update the record to reflect correct billing files.`;
      }

      flaggedItems.push({
        id: key,
        type: 'error',
        source: 'account',
        itemTitle: `${disc.accountName} - ${disc.fieldName} Error`,
        bureau: primaryBureau,
        details: detailStr,
        disputeReason: disputeStr,
        checklist: getErrorChecklist(primaryBureau)
      });
    }
  });

  return flaggedItems;
}

/**
 * Address directories of the major credit bureaus for dispute letter headers.
 */
export const BUREAU_ADDRESSES = {
  Experian: 'Experian Credit Dispute Center\nP.O. Box 4500\nAllen, TX 75013',
  TransUnion: 'TransUnion LLC\nConsumer Dispute Center\nP.O. Box 2000\nChester, PA 19016',
  Equifax: 'Equifax Information Services LLC\nP.O. Box 740256\nAtlanta, GA 30374',
  Innovis: 'Innovis Consumer Assistance\nP.O. Box 1689\nPittsburgh, PA 15230'
};
