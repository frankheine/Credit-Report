/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { FlaggedItem, ChecklistItem } from '../types';
import { CheckSquare, Square, ExternalLink, ShieldCheck, ClipboardCheck, Info, Calendar } from 'lucide-react';

interface RepairWalkthroughProps {
  flaggedItems: FlaggedItem[];
  onToggleStep: (itemId: string, stepId: string) => void;
}

export default function RepairWalkthrough({ flaggedItems, onToggleStep }: RepairWalkthroughProps) {
  
  // Calculate completion percentage for an item
  const getCompletionStats = (item: FlaggedItem) => {
    const total = item.checklist.length;
    const completed = item.checklist.filter(c => c.completed).length;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { completed, total, pct };
  };

  return (
    <div id="repair-walkthrough-section" className="flex flex-col gap-6">
      
      {/* Informational Intro Header */}
      <div className="bg-[#050505] rounded-xl border border-neutral-800 p-5 shadow-none ">
        <h3 className="text-sm font-bold text-neutral-200 flex items-center gap-1.5 ">
          <ClipboardCheck className="w-4 h-4 text-white " /> GUIDED REPAIR ACTION PORTAL
        </h3>
        <p className="text-xs text-neutral-400 mt-1.5 leading-relaxed font-sans">
          These steps must be performed in physical sequence to satisfy dispute verification guidelines. Check off each action point as you execute them with her on her end.
        </p>
      </div>

      {/* Grid of Action Checklist Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {flaggedItems.map(item => {
          const { completed, total, pct } = getCompletionStats(item);
          const isFraud = item.type === 'fraud';

          return (
            <div 
              key={item.id} 
              className={`bg-[#050505] rounded-xl border p-5 flex flex-col justify-between shadow-none transition-all  ${
                pct === 100 
                  ? 'border-neutral-700  bg-neutral-900/5' 
                  : isFraud 
                    ? 'border-neutral-800 hover:border-neutral-500/30' 
                    : 'border-neutral-800 hover:border-neutral-500/30'
              }`}
            >
              <div>
                
                {/* Header Line */}
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-neutral-800/80">
                  <div className="flex flex-col ">
                    <span className="text-xs font-bold text-neutral-200 tracking-wide ">{item.itemTitle}</span>
                    <span className="text-[10px] text-neutral-500 mt-0.5">REPOSITORY: {item.bureau}</span>
                  </div>
                  <span className={`text-[8px] font-bold px-2 py-0.5 rounded-xl    ${
                    isFraud ? 'bg-neutral-900/60 border border-neutral-800/30 text-neutral-400' : 'bg-neutral-900/60 border border-neutral-800/30 text-neutral-400'
                  }`}>
                    {item.type}
                  </span>
                </div>

                {/* Description Details */}
                <p className="text-[11px] text-neutral-400 bg-[#0a0a0a] p-3 rounded-xl border border-neutral-900 mb-4 leading-relaxed ">
                  {item.details}
                </p>

                {/* Progress Bar Header */}
                <div className="flex items-center justify-between text-[10px] mb-2 text-neutral-400 font-bold   ">
                  <span>Task milestones</span>
                  <span className={pct === 100 ? 'text-white font-bold' : 'text-neutral-300'}>
                    {completed}/{total} Completed ({pct}%)
                  </span>
                </div>

                {/* Progress Bar Track */}
                <div className="w-full bg-[#0a0a0a] border border-neutral-900 h-2.5 rounded-full overflow-hidden mb-5">
                  <div 
                    className={`h-full transition-all duration-500 ${pct === 100 ? 'bg-white shadow-none' : isFraud ? 'bg-neutral-500 shadow-none' : 'bg-neutral-500 shadow-none'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                {/* Checklist Steps */}
                <div className="flex flex-col gap-2.5">
                  {item.checklist.map(step => {
                    const isFTCStep = step.text.includes('identitytheft.gov');
                    const is30DayStep = step.text.includes('30-day');
                    
                    return (
                      <div 
                        key={step.id} 
                        onClick={() => onToggleStep(item.id, step.id)}
                        className={`flex items-start gap-3 p-2.5 rounded-xl cursor-pointer transition-all border select-none bg-[#0a0a0a] ${
                          step.completed 
                            ? 'opacity-50 border-neutral-900 hover:bg-[#0a0a0a]' 
                            : 'border-neutral-800/60 hover:bg-neutral-900/40 hover:border-neutral-700'
                        }`}
                      >
                        <div className="shrink-0 mt-0.5">
                          {step.completed ? (
                            <CheckSquare className="w-4 h-4 text-white" />
                          ) : (
                            <Square className="w-4 h-4 text-neutral-600 hover:text-neutral-400" />
                          )}
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className={`text-xs text-neutral-300 leading-snug font-medium ${step.completed ? 'line-through text-neutral-500' : ''}`}>
                            {step.text}
                          </span>
                          
                          {/* Anchor links / context helpers */}
                          {isFTCStep && !step.completed && (
                            <a 
                              href="https://www.identitytheft.gov" 
                              target="_blank" 
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()} // Prevent checkbox toggle on link click
                              className="text-[9px]  font-bold text-white hover:text-white flex items-center gap-1 w-fit mt-1.5 bg-neutral-900/60 border border-neutral-700 px-2 py-0.5 rounded-xl"
                            >
                              Go to IdentityTheft.gov <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}

                          {is30DayStep && !step.completed && (
                            <div className="flex items-center gap-1 text-[9px]  font-bold text-neutral-400 bg-neutral-900/60 border border-neutral-800/20 px-2 py-0.5 rounded-xl w-fit mt-1.5">
                              <Calendar className="w-3 h-3" /> Ends in: {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Completed Message */}
              {pct === 100 && (
                <div className="mt-5 bg-neutral-900/60 p-3 rounded-xl border border-neutral-700 text-white text-xs  font-semibold flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-white shrink-0" />
                  <span>All tasks completed! Document any responses or letters received within 30 days.</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
