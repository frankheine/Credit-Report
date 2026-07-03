/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Searches for SSNs and account numbers in text and replaces them with redacted versions.
 * Redacts SSNs completely to "[REDACTED SSN]".
 * Redacts account numbers to only show the last 4 digits (e.g., "XXXX-XXXX-1234").
 */
export function redactText(text: string): {
  redactedText: string;
  ssnMatchesCount: number;
  accountMatchesCount: number;
} {
  let ssnMatchesCount = 0;
  let accountMatchesCount = 0;
  let processedText = text;

  // 1. Match Standard SSN Formats: XXX-XX-XXXX or XXX XX XXXX
  // RegEx explained: matches 3 digits, followed by a hyphen or space, 2 digits, hyphen or space, 4 digits.
  const standardSsnRegex = /\b\d{3}[-\s]\d{2}[-\s]\d{4}\b/g;
  processedText = processedText.replace(standardSsnRegex, (match) => {
    ssnMatchesCount++;
    return '[REDACTED SSN]';
  });

  // 2. Match Context-Aware Raw 9-Digit SSNs (without separators)
  // Look for any 9 consecutive digits \b\d{9}\b, and verify if keywords like "SSN", "Social", "Security", "Soc Sec"
  // appear in its proximity (say 60 characters before or after).
  const rawNineDigitRegex = /\b\d{9}\b/g;
  let match;
  const positionsToReplace: { start: number; end: number }[] = [];

  // We loop to find positions of consecutive 9 digits
  while ((match = rawNineDigitRegex.exec(processedText)) !== null) {
    const start = match.index;
    const end = start + match[0].length;
    
    // Extract context around the match
    const contextStart = Math.max(0, start - 60);
    const contextEnd = Math.min(processedText.length, end + 60);
    const surroundingContext = processedText.slice(contextStart, contextEnd).toLowerCase();
    
    const keywords = ['ssn', 'social', 'security', 'soc sec', 'taxpayer', 'tin', 's.s.n'];
    const hasKeywordProximity = keywords.some(keyword => surroundingContext.includes(keyword));
    
    if (hasKeywordProximity) {
      positionsToReplace.push({ start, end });
    }
  }

  // Replace raw 9-digit SSNs from right to left to maintain indices
  for (let i = positionsToReplace.length - 1; i >= 0; i--) {
    const { start, end } = positionsToReplace[i];
    processedText = processedText.slice(0, start) + '[REDACTED SSN]' + processedText.slice(end);
    ssnMatchesCount++;
  }

  // 3. Redact Account Numbers
  // Credit report account numbers are usually labeled with "Account #:", "Account No:", "Acct #:", "Account Number"
  // followed by a digit sequence, often masked by bureaus but sometimes fully exposed.
  // We'll search for account labels and redact numbers to the last 4 digits.
  const accountNoRegex = /(account\s*#?|acct\s*#?|account\s*no|number)\s*[:\-\s]*([0-9]{5,20})/gi;
  processedText = processedText.replace(accountNoRegex, (fullMatch, label, digits) => {
    accountMatchesCount++;
    const last4 = digits.slice(-4);
    return `${label}: XXXX-XXXX-${last4}`;
  });

  // 4. Standalone long digit sequences (10-18 digits) that are likely credit account numbers
  const longDigitsRegex = /\b\d{10,20}\b/g;
  processedText = processedText.replace(longDigitsRegex, (match) => {
    // Only redact if it doesn't look like a phone number or date
    if (match.length >= 10 && !match.startsWith('202') && !match.startsWith('19')) {
      accountMatchesCount++;
      const last4 = match.slice(-4);
      return `XXXX-XXXX-${last4}`;
    }
    return match;
  });

  return {
    redactedText: processedText,
    ssnMatchesCount,
    accountMatchesCount
  };
}

/**
 * Check if text contains any potential unredacted SSN
 */
export function hasPotentialSSN(text: string): boolean {
  const standardSsnRegex = /\b\d{3}[-\s]\d{2}[-\s]\d{4}\b/;
  if (standardSsnRegex.test(text)) return true;

  const rawNineDigitRegex = /\b\d{9}\b/g;
  let match;
  while ((match = rawNineDigitRegex.exec(text)) !== null) {
    const start = match.index;
    const end = start + match[0].length;
    const contextStart = Math.max(0, start - 60);
    const contextEnd = Math.min(text.length, end + 60);
    const surroundingContext = text.slice(contextStart, contextEnd).toLowerCase();
    
    const keywords = ['ssn', 'social', 'security', 'soc sec', 'taxpayer', 'tin', 's.s.n'];
    if (keywords.some(keyword => surroundingContext.includes(keyword))) {
      return true;
    }
  }
  return false;
}
