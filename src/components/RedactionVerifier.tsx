/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { redactText } from '../utils/redactor';
import { RAW_MOCK_REPORTS } from '../utils/parsers';
import { Shield, Eye, FileText, CheckCircle2, AlertTriangle, Terminal, Upload, Clipboard, Radio, Cpu, Lock } from 'lucide-react';

interface RedactionVerifierProps {
  onVerified: (redactedReportsText: { [key: string]: string }, isDemo: boolean) => void;
}

export default function RedactionVerifier({ onVerified }: RedactionVerifierProps) {
  const [activeTab, setActiveTab] = useState<'demo' | 'paste' | 'upload'>('demo');
  
  // States for Paste tab
  const [selectedBureau, setSelectedBureau] = useState<'Experian' | 'TransUnion' | 'Equifax' | 'Innovis'>('Experian');
  const [rawText, setRawText] = useState('');
  const [redactedText, setRedactedText] = useState('');
  const [ssnMatchCount, setSsnMatchCount] = useState(0);
  const [acctMatchCount, setAcctMatchCount] = useState(0);

  // States for Demo tab
  const [demoSelectedBureaus, setDemoSelectedBureaus] = useState({
    Experian: true,
    TransUnion: true,
    Equifax: true,
    Innovis: true
  });
  const [demoRedactedResults, setDemoRedactedResults] = useState<{ [key: string]: { original: string; redacted: string; ssnCount: number; acctCount: number } }>({});

  // General States
  const [isVerified, setIsVerified] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');

  // Run redaction on Paste rawText changes
  useEffect(() => {
    if (activeTab === 'paste') {
      if (!rawText.trim()) {
        setRedactedText('');
        setSsnMatchCount(0);
        setAcctMatchCount(0);
        return;
      }
      const result = redactText(rawText);
      setRedactedText(result.redactedText);
      setSsnMatchCount(result.ssnMatchesCount);
      setAcctMatchCount(result.accountMatchesCount);
    }
  }, [rawText, activeTab]);

  // Run redaction on Demo raw texts on mount/change
  useEffect(() => {
    const results: typeof demoRedactedResults = {};
    Object.keys(RAW_MOCK_REPORTS).forEach((bureau) => {
      const origText = RAW_MOCK_REPORTS[bureau as keyof typeof RAW_MOCK_REPORTS];
      const result = redactText(origText);
      results[bureau] = {
        original: origText,
        redacted: result.redactedText,
        ssnCount: result.ssnMatchesCount,
        acctCount: result.accountMatchesCount
      };
    });
    setDemoRedactedResults(results);
  }, []);

  const handleToggleDemoBureau = (bureau: 'Experian' | 'TransUnion' | 'Equifax' | 'Innovis') => {
    setDemoSelectedBureaus(prev => ({
      ...prev,
      [bureau]: !prev[bureau]
    }));
  };

  const handleVerifyAndProceed = () => {
    if (activeTab === 'demo') {
      const selectedText: { [key: string]: string } = {};
      Object.keys(demoRedactedResults).forEach(bureau => {
        if (demoSelectedBureaus[bureau as keyof typeof demoSelectedBureaus]) {
          selectedText[bureau] = demoRedactedResults[bureau].redacted;
        }
      });
      if (Object.keys(selectedText).length === 0) {
        alert("Please select at least one credit bureau report to analyze.");
        return;
      }
      onVerified(selectedText, true);
      setIsVerified(true);
    } else if (activeTab === 'paste') {
      if (!rawText.trim()) {
        alert("Please paste credit report text first.");
        return;
      }
      const data = { [selectedBureau]: redactedText };
      onVerified(data, false);
      setIsVerified(true);
    } else if (activeTab === 'upload') {
      if (!rawText.trim()) {
        alert("Please upload or drag a credit report file first.");
        return;
      }
      const data = { [selectedBureau]: redactedText };
      onVerified(data, false);
      setIsVerified(true);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    setUploadedFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string || '';
      const result = redactText(text);
      setRawText(text);
      setRedactedText(result.redactedText);
      setSsnMatchCount(result.ssnMatchesCount);
      setAcctMatchCount(result.accountMatchesCount);
    };
    reader.readAsText(file);
  };

  const renderHighlightPreview = (text: string) => {
    if (!text) return <p className="text-neutral-500 italic  text-xs">Waiting for tactical input feed...</p>;
    
    // Highlight redacted regions visually to look like physical blackouts
    const parts = text.split(/(\[REDACTED SSN\]|XXXX-XXXX-\d{4})/g);
    return (
      <div className=" text-[11px] whitespace-pre-wrap leading-relaxed text-neutral-300 h-[320px] overflow-y-auto bg-black/40 backdrop-blur-md content-card p-4 rounded-xl border border-neutral-800/80 custom-scrollbar">
        {parts.map((part, index) => {
          if (part === '[REDACTED SSN]') {
            return (
              <span key={index} className="inline-block bg-neutral-500 text-black px-1.5 font-bold rounded-xl text-[10px]  select-none mx-0.5 border border-neutral-400/30" title="SSN Physically Redacted Client-Side">
                ████-██-████
              </span>
            );
          } else if (part.startsWith('XXXX-XXXX-')) {
            return (
              <span key={index} className="inline-block bg-neutral-500 text-black px-1.5 font-bold rounded-xl text-[10px] select-none mx-0.5 border border-neutral-400/30" title="Account Number Partially Masked">
                ████-████-{part.slice(-4)}
              </span>
            );
          }
          return <span key={index}>{part}</span>;
        })}
      </div>
    );
  };

  return (
    <div id="redaction-verifier-card" className="bg-black/30 backdrop-blur-md content-card rounded-xl shadow-none border border-neutral-800 overflow-hidden mb-8 ">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-neutral-950 to-neutral-900 p-6 border-b border-neutral-800 text-white relative">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-neutral-900 border border-neutral-700 rounded-xl text-white ">
            <Lock className="w-6 h-6 " />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight  text-neutral-100 flex items-center gap-2">
              CLIENT-SIDE ENDPOINT SHIELD <span className="text-xs bg-neutral-900 text-white px-1.5 py-0.5 rounded-xl font-bold   ">ACTIVE</span>
            </h2>
            <p className="text-xs text-neutral-400 mt-1">
              Federal Credit Repair Act (CROA) compliance buffer. Sensitive consumer IDs are sanitized locally before compile.
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left column: Input and controls */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          
          {/* Tab Selector */}
          <div className="flex bg-black/40 backdrop-blur-md content-card p-1 rounded-xl border border-neutral-800">
            <button
              onClick={() => { setActiveTab('demo'); setRawText(''); }}
              className={`flex-1 py-2 text-xs  font-semibold rounded-xl transition-all cursor-pointer ${activeTab === 'demo' ? 'bg-neutral-800 text-white border border-neutral-700/50 shadow-none' : 'text-neutral-400 hover:text-neutral-200'}`}
            >
              Demo Collective Set
            </button>
            <button
              onClick={() => { setActiveTab('paste'); setRawText(''); }}
              className={`flex-1 py-2 text-xs  font-semibold rounded-xl transition-all cursor-pointer ${activeTab === 'paste' ? 'bg-neutral-800 text-white border border-neutral-700/50 shadow-none' : 'text-neutral-400 hover:text-neutral-200'}`}
            >
              Raw Input Terminal
            </button>
            <button
              onClick={() => { setActiveTab('upload'); setRawText(''); }}
              className={`flex-1 py-2 text-xs  font-semibold rounded-xl transition-all cursor-pointer ${activeTab === 'upload' ? 'bg-neutral-800 text-white border border-neutral-700/50 shadow-none' : 'text-neutral-400 hover:text-neutral-200'}`}
            >
              Inject Credit File
            </button>
          </div>

          {/* DEMO PROFILE CONTROLS */}
          {activeTab === 'demo' && (
            <div className="bg-black/40 backdrop-blur-md content-card content-card p-5 rounded-xl border border-neutral-800 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-200   ">SUBJECT FILE: Natasha K.</span>
                <span className="px-2 py-0.5 bg-neutral-500/10 border border-neutral-500/20 text-neutral-400 text-[10px] font-bold rounded-full   ">
                  DISCREPANCIES PRESENT
                </span>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed font-sans">
                We have prepared complete credit files for all four nationwide credit repositories. These containing overlapping credit ledgers, address mismatches, and fraudulent loan listings representing real-life identity theft profiles.
              </p>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                {(['Experian', 'TransUnion', 'Equifax', 'Innovis'] as const).map(bureau => (
                  <label key={bureau} className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer select-none transition-all ${demoSelectedBureaus[bureau] ? 'bg-neutral-900 border-neutral-700 text-white font-bold' : 'bg-black/40 backdrop-blur-md content-card border-neutral-800 text-neutral-500 hover:text-neutral-300'}`}>
                    <input
                      type="checkbox"
                      checked={demoSelectedBureaus[bureau]}
                      onChange={() => handleToggleDemoBureau(bureau)}
                      className="rounded-xl border-neutral-800 bg-neutral-900 text-white focus:ring-white"
                    />
                    <span className="text-xs ">{bureau}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* PASTE CONTROLS */}
          {activeTab === 'paste' && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-200   ">REPOSITORY SELECTOR</span>
                <div className="flex gap-1 bg-black/40 backdrop-blur-md content-card p-0.5 rounded-xl border border-neutral-800">
                  {(['Experian', 'TransUnion', 'Equifax', 'Innovis'] as const).map(b => (
                    <button
                      key={b}
                      onClick={() => setSelectedBureau(b)}
                      className={`px-2 py-1 text-[10px]  font-bold rounded-xl ${selectedBureau === b ? 'bg-neutral-800 text-white' : 'text-neutral-500 hover:text-neutral-300'}`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Paste the raw credit report plain text here... Make sure to include private markers like (SSN: 321-55-9081) to verify real-time local blackouts."
                className="w-full h-[220px] p-4 text-xs  border border-neutral-800 rounded-xl focus:ring-1 focus:ring-white focus:border-neutral-700 bg-black/40 backdrop-blur-md content-card text-neutral-200 placeholder-neutral-600 leading-relaxed"
              />
            </div>
          )}

          {/* UPLOAD CONTROLS */}
          {activeTab === 'upload' && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-200    ">TARGET REPOSITORY</span>
                <select
                  value={selectedBureau}
                  onChange={(e) => setSelectedBureau(e.target.value as any)}
                  className="bg-black/40 backdrop-blur-md content-card content-card border border-neutral-800 text-xs text-neutral-300  rounded-xl px-3 py-1.5 focus:ring-1 focus:ring-white"
                >
                  <option value="Experian">Experian National File</option>
                  <option value="TransUnion">TransUnion National File</option>
                  <option value="Equifax">Equifax National File</option>
                  <option value="Innovis">Innovis National File</option>
                </select>
              </div>

              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all flex flex-col items-center justify-center cursor-pointer ${dragActive ? 'border-neutral-700 bg-neutral-900/15' : 'border-neutral-800 bg-black/40 backdrop-blur-md content-card hover:bg-black/40 backdrop-blur-md content-card hover:border-neutral-700'}`}
                onClick={() => document.getElementById('file-upload-input')?.click()}
              >
                <input
                  id="file-upload-input"
                  type="file"
                  accept=".txt,.json,.xml,.csv"
                  className="hidden"
                  onChange={handleFileInput}
                />
                <Upload className="w-8 h-8 text-neutral-500 mb-2 animate-bounce" />
                <p className="text-xs font-semibold text-neutral-200 ">
                  {uploadedFileName ? `Injected: ${uploadedFileName}` : 'Drag & drop credit report document, or click to scan'}
                </p>
                <p className="text-[10px] text-neutral-500 mt-1.5 ">Supports raw .txt, .json, or plain-text files</p>
              </div>
            </div>
          )}

          {/* REDACTION STATUS METRICS */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-black/30 backdrop-blur-md content-card p-3.5 rounded-xl border border-neutral-800 flex items-center justify-between shadow-none">
              <div>
                <p className="text-[10px] font-bold text-neutral-500   ">SSN Redactions</p>
                <p className="text-xl  font-bold text-white mt-0.5">
                  {activeTab === 'demo' 
                    ? (Object.values(demoRedactedResults) as { original: string; redacted: string; ssnCount: number; acctCount: number }[]).reduce((sum, res) => sum + (demoSelectedBureaus[res.redacted.includes('EXPERIAN') ? 'Experian' : res.redacted.includes('TRANSUNION') ? 'TransUnion' : res.redacted.includes('EQUIFAX') ? 'Equifax' : 'Innovis'] ? res.ssnCount : 0), 0)
                    : ssnMatchCount}
                </p>
              </div>
              <CheckCircle2 className="w-6 h-6 text-white " />
            </div>
            
            <div className="bg-black/30 backdrop-blur-md content-card p-3.5 rounded-xl border border-neutral-800 flex items-center justify-between shadow-none">
              <div>
                <p className="text-[10px] font-bold text-neutral-500   ">Account Maskings</p>
                <p className="text-xl  font-bold text-neutral-400 mt-0.5">
                  {activeTab === 'demo' 
                    ? (Object.values(demoRedactedResults) as { original: string; redacted: string; ssnCount: number; acctCount: number }[]).reduce((sum, res) => sum + (demoSelectedBureaus[res.redacted.includes('EXPERIAN') ? 'Experian' : res.redacted.includes('TRANSUNION') ? 'TransUnion' : res.redacted.includes('EQUIFAX') ? 'Equifax' : 'Innovis'] ? res.acctCount : 0), 0)
                    : acctMatchCount}
                </p>
              </div>
              <Eye className="w-6 h-6 text-neutral-500" />
            </div>
          </div>

          <button
            onClick={handleVerifyAndProceed}
            className="w-full bg-white hover:bg-white text-black  font-bold py-3 px-4 rounded-xl text-xs transition-all shadow-none flex items-center justify-center gap-2 cursor-pointer"
          >
            <Shield className="w-4 h-4 text-black" /> COMPILE SANITIZED PROFILE & INITIALIZE CROSS-REFERENCE
          </button>
        </div>

        {/* Right column: High Fidelity Visual Redaction Preview */}
        <div className="lg:col-span-5 flex flex-col gap-4 bg-black/40 backdrop-blur-md content-card p-4 rounded-xl border border-neutral-800/80">
          <span className="text-xs font-bold text-neutral-200   flex items-center gap-2 ">
            <Terminal className="w-4 h-4 text-white" /> Output Preview
          </span>
          
          {activeTab === 'demo' ? (
            <div className="flex flex-col gap-3">
              <div className="text-[10px] bg-neutral-900/40 border border-neutral-700 text-white p-2.5 rounded-xl  leading-relaxed">
                Previewing sample Experian credit report. Selected files will be processed and normalized for discrepancy analysis.
              </div>
              {demoRedactedResults['Experian'] ? (
                renderHighlightPreview(demoRedactedResults['Experian'].redacted)
              ) : (
                <div className="h-[300px] flex items-center justify-center bg-black/40 backdrop-blur-md content-card rounded-xl border border-dashed border-neutral-800">
                  <span className="text-neutral-600 text-xs  ">Processing file...</span>
                </div>
              )}
            </div>
          ) : (
            renderHighlightPreview(redactedText)
          )}

          {/* CROA Security Advisory Box */}
          <div className="bg-neutral-900/50 p-4 rounded-xl border border-neutral-800 text-neutral-400 text-xs flex flex-col gap-2 leading-relaxed">
            <div className="flex items-center gap-2 font-semibold  text-neutral-500">
              <AlertTriangle className="w-4 h-4 text-neutral-500 shrink-0" />
              <span>DATA INTEGRITY VERIFICATION</span>
            </div>
            <p className="text-[11px] text-neutral-400 font-sans">
              No private consumer profiles are ever synchronized or sent to server databases. Redaction processes execute entirely within transient browser thread memory. Close the tab to destroy all loaded objects permanently.
            </p>
          </div>
        </div>
      </div>

      {/* Network Layer Proof Footer */}
      <div className="bg-black/40 backdrop-blur-md content-card content-card border-t border-neutral-800 p-5 text-xs text-neutral-500 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 ">
        <span className="flex items-center gap-2 font-semibold text-neutral-300">
          <Cpu className="w-4 h-4 text-white " /> NETWORK ENVELOPE AUDIT PROOF
        </span>
        <p className="max-w-3xl text-[10px] leading-relaxed text-neutral-500 lg:text-right">
          You can prove that no raw SSN leaves your sandbox. Open Chrome/Firefox DevTools (F12) → Network tab → press "Compile". Inspect the outbound payload sent to /api/generate-dispute. You will verify that the plain text SSN has been permanently overwritten with client-side block markers.
        </p>
      </div>
    </div>
  );
}
