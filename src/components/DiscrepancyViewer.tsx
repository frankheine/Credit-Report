/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CreditReport, Discrepancy, FlaggedItem } from '../types';
import { AlertCircle, AlertTriangle, CheckCircle, FileSpreadsheet, ShieldAlert, Users, Radio, Info } from 'lucide-react';

interface DiscrepancyViewerProps {
  reports: CreditReport[];
  discrepancies: Discrepancy[];
  flaggedItems: FlaggedItem[];
}

export default function DiscrepancyViewer({ reports, discrepancies, flaggedItems }: DiscrepancyViewerProps) {
  
  // Format currency
  const formatCurrency = (val: any) => {
    if (typeof val === 'number') {
      return `$${val.toLocaleString()}`;
    }
    return val || '—';
  };

  // Group accounts by a standard name for cross-bureau layout alignment
  const getStandardKey = (name: string): string => {
    const lower = name.toLowerCase();
    if (lower.includes('chase')) return 'Chase Credit Card';
    if (lower.includes('wells fargo')) return 'Wells Fargo Personal Loan';
    if (lower.includes('macy')) return "Macy's Store Card";
    if (lower.includes('target')) return 'Target REDcard';
    if (lower.includes('comcast')) return 'Comcast Cable Service';
    return name;
  };

  const getAccountForBureau = (standardName: string, bureau: string) => {
    const report = reports.find(r => r.bureauName === bureau);
    if (!report) return null;
    return report.accounts.find(a => getStandardKey(a.accountName) === standardName);
  };

  // Unique standard account names
  const allStandardAccountNames = Array.from(new Set(
    reports.flatMap(r => r.accounts.map(a => getStandardKey(a.accountName)))
  ));

  const hasDiscrepancy = (standardName: string, field: string) => {
    return discrepancies.some(d => d.accountName.toLowerCase() === standardName.toLowerCase() && d.fieldName === field);
  };

  const isItemFlagged = (standardName: string) => {
    return flaggedItems.some(f => f.itemTitle.toLowerCase().includes(standardName.toLowerCase()));
  };

  const getFlaggedItemType = (standardName: string) => {
    const found = flaggedItems.find(f => f.itemTitle.toLowerCase().includes(standardName.toLowerCase()));
    return found ? found.type : null;
  };

  return (
    <div id="discrepancy-viewer-section" className="flex flex-col gap-8 mb-8">
      
      {/* 1. DISCREPANCIES HIGHLIGHT HEADER BAR */}
      {discrepancies.length > 0 && (
        <div className="bg-neutral-900/20 border border-neutral-500/30 rounded-xl p-5 text-neutral-200 shadow-none">
          <div className="flex gap-4">
            <div className="p-2 bg-neutral-500/10 border border-neutral-500/30 text-neutral-400 rounded-xl shrink-0 h-fit">
              <AlertTriangle className="w-5 h-5 text-neutral-400 " />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-400    flex items-center gap-2">
                Cross-Bureau Ledger Mismatch Detected
              </h3>
              <p className="text-xs text-neutral-300 mt-1.5 leading-relaxed">
                Under FCRA regulations, credit repositories must report 100% accurate data. We compared credit records across the four national agencies. These discrepancies in balances, dates, or statuses are direct evidence of erroneous reporting and constitute statutory grounds for deletion.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
                {discrepancies.map((disc) => (
                  <div key={disc.id} className="bg-[#0a0a0a] p-3.5 rounded-xl border border-neutral-500/20 text-xs shadow-inner">
                    <div className="flex items-center justify-between text-neutral-400 font-bold  text-[10px] ">
                      <span>{disc.accountName}</span>
                      <span className="px-1.5 py-0.5 bg-neutral-500/10 text-neutral-400 border border-neutral-500/20 rounded-xl  font-bold text-[9px]">{disc.fieldName}</span>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-neutral-300 border-t border-neutral-900/60 pt-2 ">
                      <div className="border-r border-neutral-900/80 pr-2">
                        <p className="text-[9px] text-neutral-500 font-medium">{disc.bureauA}</p>
                        <p className="font-bold text-neutral-200 mt-0.5">{disc.valueA}</p>
                      </div>
                      <div className="pl-2">
                        <p className="text-[9px] text-neutral-500 font-medium">{disc.bureauB}</p>
                        <p className="font-bold text-neutral-400 mt-0.5">{disc.valueB}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. PERSONAL INFO SIDE-BY-SIDE ALIGNMENT */}
      <div className="bg-[#050505] rounded-xl border border-neutral-800 overflow-hidden shadow-none ">
        <div className="bg-[#0a0a0a] border-b border-neutral-800 p-4 flex items-center justify-between">
          <h3 className="text-sm font-bold text-neutral-200 flex items-center gap-1.5 ">
            <Users className="w-4 h-4 text-white " /> PII IDENTITY CROSS-REFERENCE
          </h3>
          <span className="text-[9px] bg-neutral-900 border border-neutral-700 text-white px-2 py-0.5 rounded-xl font-bold   ">
            Four Repositories Normalized
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-neutral-800 bg-[#0a0a0a] text-[10px] font-bold text-neutral-400   ">
                <th className="p-4">Identity Attribute</th>
                <th className="p-4 border-l border-neutral-800/40">Experian File</th>
                <th className="p-4 border-l border-neutral-800/40">TransUnion File</th>
                <th className="p-4 border-l border-neutral-800/40">Equifax File</th>
                <th className="p-4 border-l border-neutral-800/40">Innovis File</th>
              </tr>
            </thead>
            <tbody className="text-xs divide-y divide-neutral-900 font-sans">
              <tr className="hover:bg-neutral-900/10">
                <td className="p-4 font-semibold text-neutral-400 bg-[#0a0a0a] ">Full Name</td>
                <td className="p-4 text-neutral-200 border-l border-neutral-900/40">{reports.find(r => r.bureauName === 'Experian')?.personalInfo.name || '—'}</td>
                <td className="p-4 text-neutral-200 border-l border-neutral-900/40">{reports.find(r => r.bureauName === 'TransUnion')?.personalInfo.name || '—'}</td>
                <td className="p-4 text-neutral-200 border-l border-neutral-900/40">{reports.find(r => r.bureauName === 'Equifax')?.personalInfo.name || '—'}</td>
                <td className="p-4 text-neutral-200 border-l border-neutral-900/40">{reports.find(r => r.bureauName === 'Innovis')?.personalInfo.name || '—'}</td>
              </tr>
              <tr className="hover:bg-neutral-900/10">
                <td className="p-4 font-semibold text-neutral-400 bg-[#0a0a0a] ">SSN (Surgical mask)</td>
                {['Experian', 'TransUnion', 'Equifax', 'Innovis'].map(b => (
                  <td key={b} className="p-4 border-l border-neutral-900/40 ">
                    <span className="bg-neutral-900/80 border border-neutral-800/30 text-neutral-400 px-2 py-0.5 font-bold text-[9px] rounded-xl select-none">████-██-████</span>
                  </td>
                ))}
              </tr>
              <tr className="hover:bg-neutral-900/10">
                <td className="p-4 font-semibold text-neutral-400 bg-[#0a0a0a] ">Date of Birth</td>
                <td className="p-4 text-neutral-200 border-l border-neutral-900/40 ">{reports.find(r => r.bureauName === 'Experian')?.personalInfo.dob || '—'}</td>
                <td className="p-4 text-neutral-200 border-l border-neutral-900/40 ">{reports.find(r => r.bureauName === 'TransUnion')?.personalInfo.dob || '—'}</td>
                <td className="p-4 text-neutral-200 border-l border-neutral-900/40 ">{reports.find(r => r.bureauName === 'Equifax')?.personalInfo.dob || '—'}</td>
                <td className="p-4 text-neutral-200 border-l border-neutral-900/40 ">{reports.find(r => r.bureauName === 'Innovis')?.personalInfo.dob || '—'}</td>
              </tr>
              <tr className="hover:bg-neutral-900/10">
                <td className="p-4 font-semibold text-neutral-400 bg-[#0a0a0a] ">Current Address</td>
                <td className="p-4 text-neutral-200 border-l border-neutral-900/40">{reports.find(r => r.bureauName === 'Experian')?.personalInfo.address || '—'}</td>
                <td className="p-4 text-neutral-200 border-l border-neutral-900/40">{reports.find(r => r.bureauName === 'TransUnion')?.personalInfo.address || '—'}</td>
                <td className="p-4 text-neutral-200 border-l border-neutral-900/40">{reports.find(r => r.bureauName === 'Equifax')?.personalInfo.address || '—'}</td>
                <td className="p-4 text-neutral-200 border-l border-neutral-900/40">{reports.find(r => r.bureauName === 'Innovis')?.personalInfo.address || '—'}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. CREDIT ACCOUNTS SIDE-BY-SIDE MATRIX */}
      <div className="bg-[#050505] rounded-xl border border-neutral-800 overflow-hidden shadow-none ">
        <div className="bg-[#0a0a0a] border-b border-neutral-800 p-4 flex items-center justify-between">
          <h3 className="text-sm font-bold text-neutral-200 flex items-center gap-1.5 ">
            <FileSpreadsheet className="w-4 h-4 text-white" /> LEDGER INTEGRITY MATRIX
          </h3>
          <span className="text-[9px] bg-neutral-500/20 border border-neutral-500/30 text-neutral-400 px-2.5 py-0.5 rounded-xl font-bold   ">
            Matched Credit Ledgers
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-neutral-800 bg-[#0a0a0a] text-[10px] font-bold text-neutral-400   ">
                <th className="p-4 w-[240px]">Account Entity</th>
                <th className="p-4 border-l border-neutral-800/40">Experian File</th>
                <th className="p-4 border-l border-neutral-800/40">TransUnion File</th>
                <th className="p-4 border-l border-neutral-800/40">Equifax File</th>
                <th className="p-4 border-l border-neutral-800/40">Innovis File</th>
              </tr>
            </thead>
            <tbody className="text-xs divide-y divide-neutral-900">
              {allStandardAccountNames.map(stdName => {
                const flaggedType = getFlaggedItemType(stdName);
                const isFlagged = isItemFlagged(stdName);

                // Row borders and background depending on flagged status
                let rowBgClass = '';
                if (flaggedType === 'fraud') rowBgClass = 'bg-neutral-900/10 hover:bg-neutral-900/15 border-l-2 border-l-neutral-500';
                else if (flaggedType === 'error') rowBgClass = 'bg-neutral-900/10 hover:bg-neutral-900/15 border-l-2 border-l-neutral-500';
                else rowBgClass = 'hover:bg-neutral-900/20';

                return (
                  <tr key={stdName} className={`${rowBgClass} transition-colors group`}>
                    
                    {/* LEFT COLUMN: ACCOUNT NAME */}
                    <td className="p-4 bg-[#0a0a0a] align-top border-r border-neutral-900 ">
                      <div className="flex flex-col gap-1.5">
                        <span className="font-bold text-neutral-100 text-xs">{stdName}</span>
                        {flaggedType === 'fraud' && (
                          <span className="flex items-center gap-1 text-[8px] font-bold text-neutral-400 bg-neutral-900/60 border border-neutral-800/30 px-1.5 py-0.5 rounded-xl   w-fit">
                            <ShieldAlert className="w-3 h-3 text-neutral-400 " /> Identity Theft
                          </span>
                        )}
                        {flaggedType === 'error' && (
                          <span className="flex items-center gap-1 text-[8px] font-bold text-neutral-400 bg-neutral-900/60 border border-neutral-800/30 px-1.5 py-0.5 rounded-xl   w-fit">
                            <AlertTriangle className="w-3 h-3 text-neutral-400" /> Ledger Error
                          </span>
                        )}
                        {!isFlagged && (
                          <span className="flex items-center gap-1 text-[8px] font-bold text-white bg-neutral-900/60 border border-neutral-800/30 px-1.5 py-0.5 rounded-xl   w-fit">
                            <CheckCircle className="w-3 h-3 text-white" /> Clean Match
                          </span>
                        )}
                      </div>
                    </td>

                    {/* BUREAUS SIDE-BY-SIDE CELLS */}
                    {['Experian', 'TransUnion', 'Equifax', 'Innovis'].map(bureau => {
                      const acc = getAccountForBureau(stdName, bureau);
                      if (!acc) {
                        return (
                          <td key={bureau} className="p-4 align-top text-neutral-600 italic font-medium bg-[#0a0a0a] border-r border-neutral-900/60 ">
                            Not Reported
                          </td>
                        );
                      }

                      // Check for specific field errors to paint them
                      const balanceError = hasDiscrepancy(stdName, 'Balance');
                      const dateError = hasDiscrepancy(stdName, 'Date Opened');

                      return (
                        <td key={bureau} className="p-4 align-top border-r border-neutral-900/60 ">
                          <div className="flex flex-col gap-2">
                            {/* Account Balance block */}
                            <div>
                              <p className="text-[9px] text-neutral-500  font-medium">Balance</p>
                              <p className={`font-bold text-xs mt-0.5 ${balanceError ? 'text-neutral-400 font-bold bg-neutral-900/60 border border-neutral-800/40 px-1.5 py-0.5 rounded-xl w-fit shadow-none' : 'text-neutral-200'}`}>
                                {formatCurrency(acc.balance)}
                              </p>
                            </div>
                            
                            {/* Date Opened block */}
                            <div>
                              <p className="text-[9px] text-neutral-500  font-medium">Date Opened</p>
                              <p className={`font-medium text-xs mt-0.5 ${dateError ? 'text-neutral-400 font-bold bg-neutral-900/60 border border-neutral-800/40 px-1.5 py-0.5 rounded-xl w-fit' : 'text-neutral-400'}`}>
                                {acc.dateOpened || '—'}
                              </p>
                            </div>

                            {/* Status block */}
                            <div>
                              <p className="text-[9px] text-neutral-500  font-medium">Status</p>
                              <p className={`font-semibold mt-0.5 text-[10px] tracking-wide ${
                                acc.accountStatus.toLowerCase().includes('past due') || acc.accountStatus.toLowerCase().includes('charged off')
                                  ? 'text-neutral-400 bg-neutral-900/40 px-1.5 py-0.5 border border-neutral-800/20 rounded-xl w-fit'
                                  : 'text-neutral-300'
                              }`}>
                                {acc.accountStatus}
                              </p>
                            </div>

                            {/* Masked Account Number */}
                            <div>
                              <p className="text-[9px] text-neutral-500  font-medium">Acct #</p>
                              <p className=" text-[10px] text-neutral-500 mt-0.5">
                                XXXX-XXXX-{acc.accountNumber.slice(-4)}
                              </p>
                            </div>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. RECENT INQUIRIES SIDE-BY-SIDE MATRIX */}
      <div className="bg-[#050505] rounded-xl border border-neutral-800 overflow-hidden shadow-none ">
        <div className="bg-[#0a0a0a] border-b border-neutral-800 p-4 flex items-center justify-between">
          <h3 className="text-sm font-bold text-neutral-200 flex items-center gap-1.5 ">
            <AlertCircle className="w-4 h-4 text-white" /> HARD INQUIRIES CHRONOLOGY
          </h3>
          <span className="text-[9px] bg-neutral-800/60 border border-neutral-700/50 text-neutral-300 px-2.5 py-0.5 rounded-xl font-bold   ">
            Active 24-Month Window
          </span>
        </div>
        <div className="p-4 grid grid-cols-1 sm:grid-cols-4 gap-4 bg-[#0a0a0a]">
          {['Experian', 'TransUnion', 'Equifax', 'Innovis'].map(bName => {
            const r = reports.find(report => report.bureauName === bName);
            const inqList = r ? r.inquiries : [];
            return (
              <div key={bName} className="bg-[#0a0a0a] p-4 rounded-xl border border-neutral-800/80 flex flex-col gap-3">
                <span className="text-xs font-bold text-neutral-300 border-b border-neutral-800/60 pb-1.5  text-white">{bName} Hard List</span>
                {inqList.length === 0 ? (
                  <p className="text-xs text-neutral-500 italic ">No hard inquiries logged.</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {inqList.map(inq => (
                      <div key={inq.id} className="bg-[#0a0a0a] p-2.5 rounded-xl border border-neutral-900 flex flex-col gap-1 shadow-none ">
                        <span className={`text-[10px] font-bold ${inq.inquirer.includes('TARGET') || inq.inquirer.includes('COMCAST') ? 'text-neutral-400' : 'text-neutral-200'}`}>
                          {inq.inquirer}
                        </span>
                        <span className="text-[9px] text-neutral-500">{inq.inquiryDate}</span>
                        {(inq.inquirer.includes('TARGET') || inq.inquirer.includes('COMCAST')) && (
                          <span className="text-[7px] font-bold text-neutral-400 bg-neutral-900/60 border border-neutral-800/20 px-1 py-0.5 rounded-xl   w-fit mt-1">
                            Inquiry Unrecognized
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
