import React from 'react';
export default function Test() {
  return (
    <div className="flex flex-col w-fit">
      <div className="flex justify-between w-full text-[10px] font-mono font-bold text-red-600 uppercase">
        {'FRANK HEINE PRESENTS...'.split('').map((char, i) => (
          <span key={i}>{char === ' ' ? '\u00A0' : char}</span>
        ))}
      </div>
      <h1 className="text-[64px] font-black text-white tracking-tighter leading-none font-display uppercase">
        DATACARTEL
      </h1>
    </div>
  )
}
