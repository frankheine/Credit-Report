/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { FlaggedItem, PersonalInfo } from '../types';
import { BUREAU_ADDRESSES } from '../utils/parsers';
import { FileText, Copy, Download, Edit2, Check, RefreshCw, AlertTriangle, ShieldCheck, Terminal, Cpu, Info } from 'lucide-react';

interface DisputeLetterEditorProps {
  flaggedItems: FlaggedItem[];
  personalInfo: PersonalInfo;
  onUpdateDraft: (itemId: string, newDraft: string) => void;
}

export default function DisputeLetterEditor({ flaggedItems, personalInfo, onUpdateDraft }: DisputeLetterEditorProps) {
  const [selectedItemId, setSelectedItemId] = useState<string>(flaggedItems[0]?.id || '');
  const [isDrafting, setIsDrafting] = useState<{ [key: string]: boolean }>({});
  const [copiedId, setCopiedId] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editingText, setEditingText] = useState<string>('');

  const currentItem = flaggedItems.find(item => item.id === selectedItemId);

  const triggerAutoDraft = async (item: FlaggedItem) => {
    setIsDrafting(prev => ({ ...prev, [item.id]: true }));
    try {
      const response = await fetch('/api/generate-dispute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bureau: item.bureau,
          accountName: item.itemTitle.replace(' Account', '').replace(' Collection', ''),
          accountNumber: item.details.match(/Account #:\s*([^\s,]+)/)?.[1] || 'XXXX',
          disputeType: item.type,
          details: item.details,
          disputeReason: item.disputeReason,
          personalInfo: personalInfo
        })
      });

      const data = await response.json();
      if (response.ok && data.letter) {
        onUpdateDraft(item.id, data.letter);
        if (selectedItemId === item.id) {
          setEditingText(data.letter);
        }
      } else {
        throw new Error(data.error || "Failed to draft letter.");
      }
    } catch (err: any) {
      console.error(err);
      alert(`AI Drafting failed: ${err.message || "Ensure server is running and GEMINI_API_KEY is configured."}`);
    } finally {
      setIsDrafting(prev => ({ ...prev, [item.id]: false }));
    }
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleDownloadTxt = (item: FlaggedItem, text: string) => {
    const filename = `Dispute_${item.bureau}_${item.itemTitle.replace(/\s+/g, '_')}.txt`;
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleStartEdit = () => {
    if (currentItem) {
      setEditingText(currentItem.letterDraft || '');
      setIsEditing(true);
    }
  };

  const handleSaveEdit = () => {
    if (currentItem) {
      onUpdateDraft(currentItem.id, editingText);
      setIsEditing(false);
    }
  };

  return (
    <div id="dispute-letter-editor-section" className="bg-black/30 backdrop-blur-md content-card rounded-xl border border-neutral-800 overflow-hidden shadow-none  mb-8">
      
      {/* Editor Header */}
      <div className="bg-black/40 backdrop-blur-md content-card content-card border-b border-neutral-800 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-neutral-200 flex items-center gap-1.5 ">
            <FileText className="w-5 h-5 text-white " /> STATUTORY EVIDENCE COMPILE UNIT
          </h3>
          <p className="text-xs text-neutral-400 mt-1">
            Review, edit, and export formal dispute packets generated under Fair Credit Reporting Act (FCRA) parameters.
          </p>
        </div>
        <span className="px-2.5 py-1 bg-neutral-900 border border-neutral-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 self-start ">
          <ShieldCheck className="w-4 h-4 text-white" /> SECURE LEGAL DRAFTING
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-neutral-800/80">
        
        {/* Left selector sidebar: list of flagged items */}
        <div className="md:col-span-4 p-4 flex flex-col gap-2 bg-black/40 backdrop-blur-md content-card">
          <span className="text-[10px] font-bold text-neutral-500    mb-2 block text-white">
            DISPUTABLE ITEMS MATRIX ({flaggedItems.length})
          </span>
          {flaggedItems.map(item => {
            const isSelected = item.id === selectedItemId;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setSelectedItemId(item.id);
                  setIsEditing(false);
                  if (item.letterDraft) setEditingText(item.letterDraft);
                }}
                className={`w-full text-left p-3.5 rounded-xl border text-xs flex flex-col gap-1 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-neutral-900 border-neutral-700 shadow-none ring-1 ring-white text-white'
                    : 'bg-black/40 backdrop-blur-md content-card border-neutral-800/80 hover:border-neutral-700 text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <div className="flex items-center justify-between font-bold ">
                  <span className="truncate pr-1">{item.itemTitle}</span>
                  <span className={`text-[8px] px-1.5 py-0.5 rounded-xl font-bold   ${
                    item.type === 'fraud' ? 'bg-neutral-900/60 border border-neutral-800/30 text-neutral-400' : 'bg-neutral-900/60 border border-neutral-800/30 text-neutral-400'
                  }`}>
                    {item.type}
                  </span>
                </div>
                <div className="flex items-center justify-between text-neutral-500  text-[9px] mt-2 border-t border-neutral-900/50 pt-1.5">
                  <span>Bureau: {item.bureau}</span>
                  {item.letterDraft ? (
                    <span className="text-white font-bold flex items-center gap-0.5">
                      <Check className="w-3 h-3" /> Drafted
                    </span>
                  ) : (
                    <span className="text-neutral-500">Uncompleted</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Right editor panel */}
        <div className="md:col-span-8 p-6 flex flex-col gap-4 bg-black/40 backdrop-blur-md content-card">
          {currentItem ? (
            <div className="flex flex-col gap-4">
              
              {/* Header Info */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-neutral-800 pb-4 gap-3">
                <div className="">
                  <h4 className="text-sm font-bold text-neutral-100  tracking-wide">{currentItem.itemTitle} DISPATCH</h4>
                  <p className="text-xs text-neutral-400 mt-1">
                    Addressed to: <strong className="text-neutral-200 ">{currentItem.bureau}</strong> ({currentItem.type === 'fraud' ? 'Section 605B Block' : 'Section 611 Audit'})
                  </p>
                </div>
                
                {/* Draft Actions */}
                {currentItem.letterDraft && (
                  <div className="flex flex-wrap gap-2">
                    {isEditing ? (
                      <button
                        onClick={handleSaveEdit}
                        className="bg-white hover:bg-white text-black text-xs font-bold  px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1 shadow-none cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" /> Save Changes
                      </button>
                    ) : (
                      <button
                        onClick={handleStartEdit}
                        className="border border-neutral-700 hover:bg-neutral-800 text-neutral-200 text-xs font-bold  px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-white" /> Edit
                      </button>
                    )}
                    <button
                      onClick={() => handleCopyToClipboard(currentItem.letterDraft!)}
                      className="border border-neutral-700 hover:bg-neutral-800 text-neutral-200 text-xs font-bold  px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                    >
                      {copiedId ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-white" /> Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" /> Copy Text
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleDownloadTxt(currentItem, currentItem.letterDraft!)}
                      className="bg-neutral-900 hover:bg-neutral-800 text-neutral-100 text-xs font-bold  px-3 py-1.5 rounded-xl border border-neutral-700 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" /> Download TXT
                    </button>
                  </div>
                )}
              </div>

              {/* Dispute metadata briefing */}
              <div className="bg-black/40 backdrop-blur-md content-card content-card rounded-xl p-3.5 border border-neutral-800/60 text-xs text-neutral-300 flex flex-col gap-2 ">
                <span className="font-bold text-white  text-[9px]  block border-b border-neutral-900 pb-1">REPORTING INCONSISTENCY RECORD:</span>
                <p><strong className="text-neutral-400">Ledger Error:</strong> {currentItem.details}</p>
                <p><strong className="text-neutral-400">FCRA Claim:</strong> {currentItem.disputeReason}</p>
              </div>

              {/* Document Text Box */}
              {isDrafting[currentItem.id] ? (
                <div className="h-[300px] border border-dashed border-neutral-700 rounded-xl bg-black/40 backdrop-blur-md content-card flex flex-col items-center justify-center text-center p-6 gap-3">
                  <RefreshCw className="w-8 h-8 text-white animate-spin" />
                  <div>
                    <p className="text-xs font-bold text-neutral-200    ">Drafting FCRA Disputation Text...</p>
                    <p className="text-[10px] text-neutral-500 mt-1 ">Gemini is applying statutory citations and matching address structures...</p>
                  </div>
                </div>
              ) : currentItem.letterDraft ? (
                isEditing ? (
                  <textarea
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                    className="w-full h-[320px] p-4 text-xs  border border-neutral-700 rounded-xl focus:ring-1 focus:ring-white bg-black/40 backdrop-blur-md content-card text-neutral-200 leading-relaxed focus:border-neutral-700 focus:outline-hidden"
                  />
                ) : (
                  <div className="w-full h-[320px] p-4 text-xs  border border-neutral-800 rounded-xl bg-black/40 backdrop-blur-md content-card overflow-y-auto whitespace-pre-wrap leading-relaxed text-neutral-300 custom-scrollbar shadow-inner">
                    {currentItem.letterDraft}
                  </div>
                )
              ) : (
                <div className="h-[300px] border border-dashed border-neutral-800 rounded-xl bg-black/40 backdrop-blur-md content-card flex flex-col items-center justify-center text-center p-6 gap-4">
                  <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-500">
                    <Terminal className="w-8 h-8 text-neutral-500" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-neutral-200   ">Awaiting Document Compile</h5>
                    <p className="text-[11px] text-neutral-400 max-w-md mt-2 font-sans leading-relaxed">
                      Initialize secure client-side proxy to compile formal letters citing federal laws and address matching metrics.
                    </p>
                  </div>
                  <button
                    onClick={() => triggerAutoDraft(currentItem)}
                    className="bg-white hover:bg-white text-black text-xs font-bold  py-2.5 px-4 rounded-xl shadow-none flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" /> COMPILE SECURE FCRA LETTER
                  </button>
                </div>
              )}

              {/* Regulatory warning banner regarding Credit Repair Organizations Act (CROA) */}
              <div className="bg-black/40 backdrop-blur-md content-card content-card p-4 rounded-xl border border-neutral-800 text-neutral-400 text-xs flex flex-col gap-2 leading-relaxed">
                <div className="flex items-center gap-1.5 font-bold  text-neutral-400">
                  <AlertTriangle className="w-4 h-4 text-neutral-400 shrink-0" />
                  <span>REGULATORY DISCLOSURE: CROA PARAGRAPH COMPLIANCE</span>
                </div>
                <p className="text-[11px] text-neutral-400 font-sans leading-relaxed">
                  This system generates customized dispute packages for independent consumer printing and self-submission. It does not submit disputes, communicate with bureaus, or offer proprietary financial counseling. Consumers retain absolute, direct statutory rights to review and transmit files on their own behalf.
                </p>
              </div>

            </div>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-center text-neutral-500 text-xs ">
              Select an unverified profile record on the left grid to open document compiler.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
