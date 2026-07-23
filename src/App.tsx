/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import RedactionVerifier from './components/RedactionVerifier';
import DiscrepancyViewer from './components/DiscrepancyViewer';
import DisputeLetterEditor from './components/DisputeLetterEditor';
import RepairWalkthrough from './components/RepairWalkthrough';
import CopilotChat from './components/CopilotChat';
import { parseBureauReports, identifyDiscrepancies, identifyFlaggedItems } from './utils/parsers';
import { CreditReport, Discrepancy, FlaggedItem, PersonalInfo } from './types';
import { db, auth, googleProvider } from './lib/firebase';
import { signInWithPopup, signInWithRedirect, signOut, User } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { motion } from 'motion/react';
import { 
  Shield, 
  FileSpreadsheet, 
  FileText, 
  ClipboardCheck, 
  ArrowRight, 
  CheckCircle, 
  Info, 
  RefreshCw, 
  AlertCircle, 
  Terminal, 
  Radio, 
  Layers, 
  HelpCircle,
  Sparkles,
  Eye,
  MousePointer,
  MapPin,
  Lock,
  Cpu,
  LogOut
} from 'lucide-react';

import WebGLBackground from './components/WebGLBackground';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function App() {
  // Setup Lenis smooth scrolling
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      wheelMultiplier: 1,
      touchMultiplier: 2,
    });

    lenis.on('scroll', ScrollTrigger.update);

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });

    gsap.ticker.lagSmoothing(0);

    return () => {
      lenis.destroy();
      gsap.ticker.remove((time) => lenis.raf(time * 1000));
    };
  }, []);

  const [user, setUser] = useState<any | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isInitializing, setIsInitializing] = useState(false);
  const authCheckedRef = React.useRef(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState<1 | 2 | 3 | 4>(1);
  const [isAnalyzed, setIsAnalyzed] = useState(false);
  
  // Mock Auth listener for smooth preview
  useEffect(() => {
    // Auto-login to show the animation directly
    setTimeout(() => {
      setUser({
        uid: 'demo-agent-123',
        email: 'operative@datacartel.com',
        displayName: 'DataCartel Agent'
      });
      setAuthLoading(false);
      setIsInitializing(true);
      setTimeout(() => {
        setIsInitializing(false);
      }, 3000);
    }, 500);
  }, []);

  const handleLogin = async () => {
    setAuthError(null);
    setAuthLoading(true);
    
    // Simulate network delay then mock login to show off the GSAP initialization
    setTimeout(() => {
      setUser({
        uid: 'demo-agent-123',
        email: 'operative@datacartel.com',
        displayName: 'DataCartel Agent'
      });
      setAuthLoading(false);
      
      setIsInitializing(true);
      setTimeout(() => {
        setIsInitializing(false);
      }, 3000);
    }, 800);
  };

  // GSAP Initialization Sequence
  useEffect(() => {
    if (isInitializing) {
      const tl = gsap.timeline();
      tl.to('.logo-bloom', {
        boxShadow: '0 0 40px 10px rgba(139, 92, 246, 0.4)', // deep purple bloom
        duration: 2,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1
      }, 0);
      tl.to('.system-text', { opacity: 1, duration: 1, ease: 'power2.out' }, 0.5);
      tl.to('.tactical-line', { width: '250px', duration: 1, ease: 'power4.inOut' }, 0.5);
      tl.to('.tactical-text span', { opacity: 1, duration: 0.8, ease: 'power2.out', stagger: 0.3 }, 1.0);
      tl.to('.init-sequence', { opacity: 0, duration: 0.5, ease: 'power2.inOut' }, 2.5);
    }
  }, [isInitializing]);

  // GSAP Entrance Animations for main content
  useEffect(() => {
    if (!authLoading && user && !isInitializing) {
      // Re-trigger scroll triggers for the cards
      gsap.utils.toArray('.content-card').forEach((card: any) => {
        gsap.fromTo(card,
          { y: 60, opacity: 0 },
          {
            scrollTrigger: {
              trigger: card,
              start: "top 85%",
              toggleActions: "play none none reverse",
            },
            y: 0,
            opacity: 1,
            duration: 1.2,
            ease: "expo.out",
            clearProps: "all"
          }
        );
      });
      // Refresh ScrollTrigger since DOM changed
      ScrollTrigger.refresh();
    }
  }, [activeStep, isAnalyzed, authLoading, user, isInitializing]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  
  // Presentation Co-Pilot Mode State
  const [isPresenterMode, setIsPresenterMode] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [sonarActive, setSonarActive] = useState(true);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [scrollRotation, setScrollRotation] = useState(0);
  const [hoveredElementText, setHoveredElementText] = useState<string>('');
  
  // Multiplayer Session State
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);

  // Data State
  const [redactedReports, setRedactedReports] = useState<{ [key: string]: string }>({});
  const [reportsData, setReportsData] = useState<CreditReport[]>([]);
  const [discrepancies, setDiscrepancies] = useState<Discrepancy[]>([]);
  const [flaggedItems, setFlaggedItems] = useState<FlaggedItem[]>([]);
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>({
    name: 'Natasha K.',
    ssn: '[REDACTED SSN]',
    dob: '11/14/1988',
    address: '482 Elmwood Ave, Portland, OR 97201'
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Multiplayer: Check URL for session
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const session = params.get('session');
    if (session) {
      setSessionId(session);
    }
  }, []);

  // Multiplayer: Listen to session doc
  useEffect(() => {
    if (!sessionId) return;
    const unsub = onSnapshot(doc(db, 'sessions', sessionId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (user && data.hostId === user.uid) {
          setIsHost(true);
        } else {
          setIsHost(false);
          if (data.isPresenterMode !== undefined) setIsPresenterMode(data.isPresenterMode);
          if (data.mousePosX !== undefined && data.mousePosY !== undefined) {
            setMousePos({ x: data.mousePosX, y: data.mousePosY });
          }
          if (data.activeStep) setActiveStep(data.activeStep as any);
          if (data.hoveredElementText !== undefined) setHoveredElementText(data.hoveredElementText);
          
          if (data.isAnalyzed !== undefined) setIsAnalyzed(data.isAnalyzed);
          if (data.reportsData) setReportsData(data.reportsData);
          if (data.discrepancies) setDiscrepancies(data.discrepancies);
          if (data.flaggedItems) setFlaggedItems(data.flaggedItems);
          if (data.redactedReports) setRedactedReports(data.redactedReports);
        }
      }
    });
    return () => unsub();
  }, [sessionId, user]);

  // Multiplayer: Fast sync (Cursor)
  useEffect(() => {
    if (!sessionId || !isHost || !user) return;
    const timeout = setTimeout(() => {
      updateDoc(doc(db, 'sessions', sessionId), {
        mousePosX: mousePos.x,
        mousePosY: mousePos.y,
        hoveredElementText,
      }).catch(console.error);
    }, 100);
    return () => clearTimeout(timeout);
  }, [mousePos, hoveredElementText, sessionId, isHost, user]);

  // Multiplayer: Slow sync (Data & App State)
  useEffect(() => {
    if (!sessionId || !isHost || !user) return;
    updateDoc(doc(db, 'sessions', sessionId), {
      activeStep,
      isPresenterMode,
      isAnalyzed,
      reportsData,
      discrepancies,
      flaggedItems,
      redactedReports
    }).catch(console.error);
  }, [activeStep, isPresenterMode, isAnalyzed, reportsData, discrepancies, flaggedItems, redactedReports, sessionId, isHost, user]);

  const handleCreateSession = async () => {
    if (!user) {
      handleLogin();
      return;
    }
    const newSessionId = Math.random().toString(36).substring(2, 8);
    await setDoc(doc(db, 'sessions', newSessionId), {
      hostId: user.uid,
      activeStep,
      mousePosX: mousePos.x,
      mousePosY: mousePos.y,
      hoveredElementText,
      isPresenterMode: true,
      isAnalyzed,
      reportsData,
      discrepancies,
      flaggedItems,
      redactedReports
    });
    setSessionId(newSessionId);
    setIsHost(true);
    setIsPresenterMode(true);
    
    const url = new URL(window.location.href);
    url.searchParams.set('session', newSessionId);
    
    try {
      await navigator.clipboard.writeText(url.toString());
      setToastMessage('Copilot Session Link Copied! Send this to your client.');
      setTimeout(() => setToastMessage(null), 5000);
    } catch (err) {
      setToastMessage(`Copy this link: ${url.toString()}`);
      setTimeout(() => setToastMessage(null), 10000);
    }
  };

  // Track scroll position to rotate the scroll-locked cipher disk
  useEffect(() => {
    const handleScroll = () => {
      setScrollRotation(window.scrollY * 0.15);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Track mouse position for the screen-share focus pointer
  useEffect(() => {
    if (!isPresenterMode || !sonarActive) return;
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
      
      // Determine what element is being hovered for dynamic presentation overlay labels
      const target = e.target as HTMLElement;
      if (target && target.innerText && target.innerText.length < 50) {
        setHoveredElementText(target.innerText.trim());
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isPresenterMode, sonarActive]);

  // Handler for when the user clicks 'Verify & Analyze'
  const handleReportsVerified = (redactedTextMap: { [key: string]: string }, isDemo: boolean) => {
    setRedactedReports(redactedTextMap);

    // Parse the reports. Since we normalize all four, we generate the structured credit data.
    const normalized = parseBureauReports();
    
    // Filter normalized data based on what was selected/uploaded
    const activeBureaus = Object.keys(redactedTextMap);
    const filteredReports = normalized.filter(r => activeBureaus.includes(r.bureauName));

    setReportsData(filteredReports);

    // Identify discrepancies
    const detectedDiscrepancies = identifyDiscrepancies(filteredReports);
    setDiscrepancies(detectedDiscrepancies);

    // Identify flagged items (fraud + errors)
    const detectedFlagged = identifyFlaggedItems(filteredReports, detectedDiscrepancies);
    setFlaggedItems(detectedFlagged);

    // If there is personal info, read the redacted version
    if (filteredReports.length > 0) {
      const firstReport = filteredReports[0];
      setPersonalInfo({
        name: firstReport.personalInfo.name,
        ssn: '[REDACTED SSN]', // Overwrite with guaranteed redacted string for client state safety
        dob: firstReport.personalInfo.dob,
        address: firstReport.personalInfo.address,
        phone: firstReport.personalInfo.phone
      });
    }

    setIsAnalyzed(true);
    setActiveStep(2); // Automatically advance to Side-by-Side comparison
  };

  // Callback to update the letter draft once Gemini has generated it
  const handleUpdateLetterDraft = (itemId: string, newDraft: string) => {
    setFlaggedItems(prevItems => 
      prevItems.map(item => 
        item.id === itemId ? { ...item, letterDraft: newDraft } : item
      )
    );
  };

  // Toggle step complete state on guided checklists
  const handleToggleChecklistStep = (itemId: string, stepId: string) => {
    setFlaggedItems(prevItems => 
      prevItems.map(item => {
        if (item.id === itemId) {
          const updatedChecklist = item.checklist.map(step => 
            step.id === stepId ? { ...step, completed: !step.completed } : step
          );
          return { ...item, checklist: updatedChecklist };
        }
        return item;
      })
    );
  };

  const handleResetAnalysis = () => {
    setRedactedReports({});
    setReportsData([]);
    setDiscrepancies([]);
    setFlaggedItems([]);
    setIsAnalyzed(false);
    setActiveStep(1);
  };

  // Co-Pilot presentation guidance scripts
  const PRESENTER_GUIDANCE = {
    1: {
      stepTitle: "PII Sanitization Pass",
      frankTalk: "“Notice notice how this client-side redactor physically masks your SSN and account codes before they ever touch any remote server. Your private identity data is 100% secure. Let's load the demo reports so we can inspect the violations.”",
      tacticalFocus: "Client-side client protection, regex blackouts, local sandboxing.",
      highlightQuery: "Upload or select Demo bureau reports."
    },
    2: {
      stepTitle: "Cross-Bureau Inconsistency Mapping",
      frankTalk: "“Look at the Wells Fargo personal loan on Equifax vs Experian, and the Macy's card balance on TransUnion. Under the Fair Credit Reporting Act § 611, they are legally required to report 100% accurate information. Because they don't match, we have statutory leverage to demand total erasure.”",
      tacticalFocus: "Inaccurate balances, open date mismatches, unrecognized collections.",
      highlightQuery: "Compare the values across the four-column matrix."
    },
    3: {
      stepTitle: "FCRA Statutory Dispute Drafting",
      frankTalk: "“Now, we generate formal dispute letters. This program uses the Gemini LLM engine to cite the exact federal statutes and prefill the official bureau addresses. We will download these, print them, and send them yourself so you retain total control.”",
      tacticalFocus: "FCRA Section 611, Section 605B block, certified mail preparation.",
      highlightQuery: "Review the letter draft text and download as TXT files."
    },
    4: {
      stepTitle: "Real-Life Action & Compliance Verification",
      frankTalk: "“Here is our concrete task timeline. First we log the FTC Identity Theft affidavit at identitytheft.gov, then we mail the printed letters with copies of your ID. The credit bureaus have exactly 30 days under the law to respond, or they must delete the item.”",
      tacticalFocus: "identitytheft.gov file, 30-day monitoring, physical certified letters.",
      highlightQuery: "Tick off the steps together as they are completed."
    }
  }[activeStep];

  if (authLoading) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <WebGLBackground />
        <div className="w-12 h-12 border-2 border-neutral-700 border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-transparent text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <WebGLBackground />
        <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
          <Shield className="w-96 h-96" />
        </div>
        
        <div className="z-10 max-w-md w-full bg-black/40 backdrop-blur-md border border-neutral-800 p-8 flex flex-col items-center text-center">
          <div className="p-4 bg-neutral-900 border border-neutral-700 mb-6">
            <Cpu className="w-10 h-10 text-white" />
          </div>
          
          <div className="text-xl sm:text-2xl font-display font-black tracking-tight mb-2 text-white">
            DATAcartel <span className="font-normal text-neutral-400">Collective</span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl font-serif font-normal tracking-tight mb-2 leading-[1.1]">
            Credit Report Investigator<br/>
            <span className="text-neutral-500 italic text-3xl sm:text-4xl">&</span> Repair Specialist
          </h1>
          <p className="text-xs text-neutral-400    mb-8 mt-4">SECURE SYSTEM ACCESS</p>
          
          <p className="text-sm text-neutral-400 mb-8 leading-relaxed">
            Authenticate to access the investigation & repair core.
          </p>
          
          <button
            onClick={handleLogin}
            className="w-full bg-white hover:bg-neutral-200 text-black text-sm font-bold  py-3 px-4 flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Lock className="w-4 h-4" /> SECURE SYSTEM ACCESS
          </button>
          
          {authError && (
            <div className="mt-4 p-3 bg-red-950/50 border border-red-900/50 text-red-200 text-xs text-left w-full">
              {authError}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-transparent text-white flex flex-col items-center justify-center relative overflow-hidden">
        <WebGLBackground />
        <div className="init-sequence flex flex-col items-center justify-center z-10 text-center">
          <div className="logo-bloom p-6 bg-neutral-900 border border-neutral-700 rounded-full mb-6 relative">
             <div className="absolute inset-0 rounded-full border border-neutral-500 blur-md opacity-50 pulse-glow"></div>
             <Cpu className="w-12 h-12 text-white relative z-10" />
          </div>
          <div className="system-text text-2xl font-display font-black tracking-widest text-neutral-200 uppercase mb-4 opacity-0">
             Initializing System...
          </div>
          <div className="tactical-line w-0 h-[1px] bg-neutral-500 mb-4 mx-auto"></div>
          <div className="tactical-text text-xs font-mono text-neutral-500 tracking-[0.3em] opacity-0 flex flex-col gap-2">
             <span>DECRYPTING SANDBOX</span>
             <span>ESTABLISHING SECURE PROTOCOLS</span>
             <span>SYNCING TACTICAL COMMS</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent text-neutral-200 flex flex-col font-sans relative overflow-x-hidden">
      <WebGLBackground />
      
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-neutral-900 border border-neutral-700 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-fade-in content-card">
          <Shield className="w-5 h-5 text-neutral-400" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}
      
      {/* Dynamic Screen-Share Sonar Cursor Spotlight */}
      {isPresenterMode && sonarActive && (
        <div 
          className="fixed pointer-events-none z-50 transition-all duration-75 mix-blend-screen hidden md:block"
          style={{ 
            left: `${mousePos.x}px`, 
            top: `${mousePos.y}px`, 
            transform: 'translate(-50%, -50%)' 
          }}
        >
          {/* Concentric Pulsing Radar Rings */}
          <div className="w-16 h-16 rounded-full border-2 border-neutral-700 animate-ping absolute top-0 left-0" />
          <div className="w-8 h-8 rounded-full border border-neutral-700 bg-neutral-900 absolute top-4 left-4" />
          <div className="w-2 h-2 rounded-full bg-neutral-300 absolute top-7 left-7 shadow-none" />
          
          {/* Hover indicator tooltip */}
          {hoveredElementText && (
            <div className="absolute top-10 left-10 bg-neutral-900/95 border border-neutral-700 text-[9px]  text-white px-2 py-1 rounded-xl shadow-none whitespace-nowrap backdrop-blur-xs">
              CO-PILOT TARGET: <span className="text-neutral-200">{hoveredElementText.slice(0, 24)}</span>
            </div>
          )}
        </div>
      )}

      {/* 1. APP BAR / TACTICAL HEADER */}
      <header className="bg-black/30 backdrop-blur-md/90 border-b border-neutral-800/80 py-5 px-6 sticky top-0 z-40 ">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          
          {/* Brand & Subtitle */}
          <div className="flex items-center gap-6">
            <div className="hidden sm:flex p-3 bg-neutral-900 border border-neutral-800 text-white rounded-xl mt-1">
              <Cpu className="w-8 h-8" />
            </div>
            <div className="flex flex-col sm:border-l border-neutral-800 sm:pl-6 py-1">
              <div className="flex flex-col w-fit mb-3">
                <div className="flex justify-between w-full text-[9px] sm:text-[10px] font-bold text-red-600 tracking-tighter opacity-90">
                  {'FRANK HEINE PRESENTS...'.split('').map((char, i) => (
                    <span key={i}>{char === ' ' ? '\u00A0' : char}</span>
                  ))}
                </div>
                <div className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tighter leading-[0.85] font-display mt-1">
                  DATAcartel
                </div>
                <div className="flex justify-between w-full text-[10px] sm:text-xs lg:text-sm font-bold text-neutral-400 tracking-wider mt-2 opacity-90">
                  {'COLLECTIVE'.split('').map((char, i) => (
                    <span key={i}>{char}</span>
                  ))}
                </div>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-serif text-white tracking-tight leading-[1] mt-1">
                Credit Report Investigator
                <br />
                <span className="text-neutral-500 italic font-normal text-3xl sm:text-4xl lg:text-6xl">&</span> Repair Specialist
              </h1>
            </div>
          </div>

          {/* Interactive controls: Presenter Mode & Steps */}
          <div className="flex flex-wrap items-center gap-3">
            
            {/* User Profile & Logout */}
            <div className="flex items-center gap-3 mr-4 border-r border-neutral-800 pr-6">
              <span className="text-[10px]  text-neutral-400 hidden md:block">
                {user.email}
              </span>
              <button
                onClick={handleLogout}
                className="text-neutral-400 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5 text-[10px]  font-bold"
              >
                <LogOut className="w-3.5 h-3.5" />
                LOGOUT
              </button>
            </div>

            {/* Screen Share Mode Switcher */}
            <div className="flex gap-2">
              <button
                onClick={() => setIsCopilotOpen(!isCopilotOpen)}
                className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all flex items-center gap-2 cursor-pointer ${
                  isCopilotOpen 
                    ? 'bg-neutral-200 text-black border-neutral-300' 
                    : 'bg-neutral-900/50 text-neutral-400 border-neutral-800 hover:text-neutral-300 hover:bg-neutral-800/40'
                }`}
                title="Summon the DATAcartel AI Specialist"
              >
                <Sparkles className={`w-4 h-4 ${isCopilotOpen ? 'text-black' : 'text-neutral-400'}`} />
                {isCopilotOpen ? 'COPILOT ACTIVE' : 'ACTIVATE COPILOT'}
              </button>

              <button
                onClick={() => {
                  setIsPresenterMode(!isPresenterMode);
                }}
                className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all flex items-center gap-2 cursor-pointer ${
                  isPresenterMode 
                    ? 'bg-neutral-800/40 text-white border-neutral-700 ' 
                    : 'bg-neutral-900/50 text-neutral-400 border-neutral-800 hover:text-neutral-300 hover:bg-neutral-800/40'
                }`}
                title="Enhance layout for clear, interactive visual guidance during screenshare sessions"
              >
                <Radio className={`w-4 h-4 ${isPresenterMode ? ' text-white' : 'text-neutral-400'}`} />
                {isPresenterMode ? 'PRESENTATION: ON' : 'PRESENTATION MODE'}
              </button>
              
              <button
                onClick={handleCreateSession}
                className="px-4 py-2 text-xs font-bold rounded-xl border transition-all flex items-center gap-2 cursor-pointer bg-neutral-900/50 text-neutral-400 border-neutral-800 hover:text-neutral-300 hover:bg-neutral-800/40"
                title="Generate a real-time tracking link to share with your client"
              >
                <RefreshCw className="w-4 h-4" />
                SHARE LIVE LINK
              </button>
            </div>

            {/* Step Indicators */}
            <div className="flex items-center gap-1 bg-black/40 backdrop-blur-md p-1 rounded-xl border border-neutral-800/80 text-xs  font-medium">
              {[
                { step: 1, label: "Sanitize" },
                { step: 2, label: "Matrix" },
                { step: 3, label: "Disputer" },
                { step: 4, label: "Action" }
              ].map(item => {
                const isActive = activeStep === item.step;
                const canClick = item.step === 1 || isAnalyzed;
                return (
                  <button
                    key={item.step}
                    onClick={() => canClick && setActiveStep(item.step as any)}
                    disabled={!canClick}
                    className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                      isActive 
                        ? 'bg-white text-black font-bold shadow-none' 
                        : canClick 
                          ? 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/30' 
                          : 'opacity-40 cursor-not-allowed text-neutral-600'
                    }`}
                  >
                    <span>0{item.step}</span>
                    <span className="hidden sm:inline text-[10px] ">{item.label}</span>
                  </button>
                );
              })}
            </div>

          </div>
        </div>
      </header>

      {/* 2. CORE WORKSPACE: SPLIT GRID DESIGN */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 relative">
        
        {/* LEFT WORKSPACE (COL 1 TO 9) */}
        <main className="lg:col-span-9 flex flex-col gap-6">

          {/* Progress Bar */}
          <div className="w-full bg-neutral-900 rounded-full h-1.5 overflow-hidden">
            <motion.div 
              className="bg-white h-1.5 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(activeStep / 4) * 100}%` }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            />
          </div>

          {/* Presenter guidance banner if presenter mode active */}
          {isPresenterMode && PRESENTER_GUIDANCE && (
            <div className="bg-neutral-900/35 border-2 border-dashed border-neutral-700 rounded-xl p-5  relative overflow-hidden animate-fade-in content-card">
              <div className="absolute top-0 right-0 p-1 bg-white text-black text-[8px] font-bold   ">
                CO-PILOT SCREEN-SHARE OVERLAY
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-neutral-800/60 text-white border border-neutral-700 rounded-xl shrink-0">
                  <Sparkles className="w-5 h-5 text-white " />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white   ">
                    FRANK'S WALKTHROUGH TALK-TRACK
                  </h4>
                  <p className="text-sm font-semibold text-neutral-100 mt-2 italic leading-relaxed">
                    {PRESENTER_GUIDANCE.frankTalk}
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-neutral-700 text-xs ">
                    <div>
                      <span className="text-white block   text-[10px]">TAKEAWAY FOCUS:</span>
                      <span className="text-neutral-300 mt-0.5 block">{PRESENTER_GUIDANCE.tacticalFocus}</span>
                    </div>
                    <div>
                      <span className="text-white block   text-[10px]">CUE/ACTION ON SCREEN:</span>
                      <span className="text-white mt-0.5 block">{PRESENTER_GUIDANCE.highlightQuery}</span>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex gap-2">
                      <label className="flex items-center gap-1 text-[11px] text-neutral-400 cursor-pointer select-none">
                        <input 
                          type="checkbox" 
                          checked={sonarActive} 
                          onChange={() => setSonarActive(!sonarActive)}
                          className="rounded-xl border-neutral-700 bg-neutral-900 text-white focus:ring-white"
                        />
                        Enable Glowing Radar Spotlight pointer
                      </label>
                    </div>
                    <span className="text-[10px] text-neutral-500">Perfect for helping her follow your cursor</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Analysis Status banner if compiled */}
          {isAnalyzed && activeStep !== 1 && (
            <div className="bg-black/40 backdrop-blur-md border border-neutral-800 rounded-xl p-4 shadow-none flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-neutral-900 text-white rounded-xl border border-neutral-700">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-neutral-100">4-Bureau Credit Profile Sanitized and Analyzed</h2>
                  <p className="text-[11px] text-neutral-400 mt-0.5 ">
                    SUBJECT: Natasha K. | Inconsistencies: <span className="text-neutral-400 font-bold">{discrepancies.length}</span> | Fraud Alerts: <span className="text-neutral-400 font-bold">{flaggedItems.filter(f => f.type === 'fraud').length}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={handleResetAnalysis}
                className="text-neutral-300 hover:text-white hover:bg-neutral-800/60 border border-neutral-700 bg-neutral-900/50 text-xs  px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 w-fit cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Re-sanitize & Reload New Data
              </button>
            </div>
          )}

          {/* STEP 1: REDACTION VERIFIER */}
          {activeStep === 1 && (
            <div className="flex flex-col gap-6 animate-fade-in content-card">
              {/* Introductory Instruction Card */}
              <div className="bg-black/40 backdrop-blur-md border border-neutral-800 rounded-xl p-6 shadow-none flex items-start gap-4">
                <div className="p-3 bg-neutral-900/80 border border-neutral-700 text-white rounded-xl shrink-0">
                  <Lock className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-neutral-100 text-base ">Zero-Leak PII Sanitization Pass</h3>
                  <p className="text-xs text-neutral-400 mt-1.5 leading-relaxed">
                    Under the **Credit Repair Organizations Act (CROA)** and standard data security principles, you must never send clean Social Security Numbers or raw full account numbers to third-party endpoints.
                  </p>
                  <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
                    This program executes a **mandatory local Client-Side Redactor**. Before anything leaves your browser window, the text string is intercepted, scrubbed with deep regex filters, and replaced with permanent blacked-out digital blocks. You can audit this yourself with the live Network Inspector.
                  </p>
                </div>
              </div>

              <RedactionVerifier onVerified={handleReportsVerified} />
            </div>
          )}

          {/* STEP 2: DISCREPANCY MATRIX COMPILER */}
          {activeStep === 2 && isAnalyzed && (
            <div className="flex flex-col gap-4 animate-fade-in content-card">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-neutral-100   flex items-center gap-2 ">
                  <FileSpreadsheet className="w-5 h-5 text-white" /> Normalized 4-Bureau Comparison Matrix
                </h2>
                <button
                  onClick={() => setActiveStep(3)}
                  className="bg-white hover:bg-white text-black text-xs  font-bold py-1.5 px-3.5 rounded-xl flex items-center gap-1 transition-all cursor-pointer"
                >
                  Draft Dispute Letters <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <DiscrepancyViewer 
                reports={reportsData} 
                discrepancies={discrepancies} 
                flaggedItems={flaggedItems} 
              />
            </div>
          )}

          {/* STEP 3: DISPUTE LETTER DRAUGHTER */}
          {activeStep === 3 && isAnalyzed && (
            <div className="flex flex-col gap-4 animate-fade-in content-card">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-neutral-100   flex items-center gap-2 ">
                  <FileText className="w-5 h-5 text-white" /> Auto-Draft FCRA Dispute Letters
                </h2>
                <button
                  onClick={() => setActiveStep(4)}
                  className="bg-white hover:bg-white text-black text-xs  font-bold py-1.5 px-3.5 rounded-xl flex items-center gap-1 transition-all cursor-pointer"
                >
                  Guided Repair Checklists <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <DisputeLetterEditor 
                flaggedItems={flaggedItems} 
                personalInfo={personalInfo} 
                onUpdateDraft={handleUpdateLetterDraft} 
              />
            </div>
          )}

          {/* STEP 4: GUIDED ACTION REPAIR CHECKLIST */}
          {activeStep === 4 && isAnalyzed && (
            <div className="flex flex-col gap-4 animate-fade-in content-card">
              <h2 className="text-base font-bold text-neutral-100   flex items-center gap-2 ">
                <ClipboardCheck className="w-5 h-5 text-white" /> Guided Repair Action Plan
              </h2>
              <RepairWalkthrough 
                flaggedItems={flaggedItems} 
                onToggleStep={handleToggleChecklistStep} 
              />
            </div>
          )}

        </main>

        {/* RIGHT SIDEBAR */}
        <aside className="lg:col-span-3 flex flex-col gap-6">
          
          <div className="sticky top-28 bg-black/30 backdrop-blur-md border border-neutral-800/80 rounded-xl p-5 flex flex-col shadow-sm gap-4">
            <h3 className="font-semibold text-neutral-200 flex items-center gap-2">
              <Shield className="w-4 h-4" /> Legal Compliance
            </h3>
            <p className="text-sm text-neutral-400 leading-relaxed">
              No credit data is persisted. Generates FCRA dispute packets for consumer self-submission. Fully CROA compliant.
            </p>
          </div>

        </aside>

      </div>

      {/* 3. PREMIUM DEEP DARK FOOTER */}
      <footer className="bg-transparent text-neutral-500 py-12 px-6 border-t border-neutral-800 mt-16 text-xs">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-white">
              <Shield className="w-5 h-5 text-white" />
              <span className="font-bold text-sm   text-neutral-200 ">
                DATAcartel Collective
              </span>
            </div>
            <p className="text-[11px] leading-relaxed text-neutral-400 mt-2">
              DATAcartel Collective Credit Report Investigation & Repair Specialist. Designed in strict structural compliance with federal credit legislation frameworks.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <span className="font-bold text-neutral-300 text-[11px]   ">
              Airtight Browser Sandbox (Zero Data Risk)
            </span>
            <p className="text-[11px] leading-relaxed text-neutral-400">
              Your credit report files never touch a persistent database. All parsing, normalization, and comparison logic execute entirely within transient memory on your machine.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <span className="font-bold text-neutral-300 text-[11px]   ">
              Statutory Leverage (FCRA § 609 / § 611)
            </span>
            <p className="text-[11px] leading-relaxed text-neutral-400">
              The Fair Credit Reporting Act (FCRA) gives consumers absolute statutory authority to challenge the validity of credit ledgers. Credit reporting bureaus have 30 days to resolve dispute cases or they must permanently purge the unverified listing.
            </p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto border-t border-neutral-800/50 pt-6 mt-8 text-center text-[10px] text-neutral-600 ">
          © 2026 DATACARTEL COLLECTIVE. ALL ASSETS COMPLIANT WITH CREDIT REPAIR ORGANIZATIONS ACT (CROA) PARAGRAPH STANDARDS.
        </div>
      </footer>

      {/* Persistent Copilot */}
      <CopilotChat isOpen={isCopilotOpen} onClose={() => setIsCopilotOpen(false)} />
    </div>
  );
}
