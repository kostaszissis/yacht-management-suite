import React from 'react';

// Premium παλέτα χρωμάτων
const premiumColors = {
  navy: "#0B1D51",
  gold: "#C6A664",
  lightGrey: "#F2F4F7",
  white: "#FFFFFF",
  successBorder: "#22c55e",
  successBg: "#d1fae5",
};

// Τύποι για TypeScript
type PremiumSectionBoxProps = {
  title: string;
  children: React.ReactNode;
  isComplete: boolean;
  customRef?: React.RefObject<HTMLDivElement>;
};

export default function PremiumSectionBox({ title, children, isComplete, customRef }: PremiumSectionBoxProps) {
  // Ορίζουμε τα χρώματα με βάση το αν η ενότητα είναι συμπληρωμένη
  const headerBgColor = isComplete ? premiumColors.successBorder : premiumColors.navy;
  const contentBgColor = isComplete ? premiumColors.successBg : premiumColors.white;
  const headerTextColor = premiumColors.white;

  return (
    <div
      ref={customRef}
      className="rounded-lg overflow-hidden shadow-md transition-all duration-300"
      style={{ 
        border: `2px solid ${premiumColors.gold}`  // ✅ ΠΑΝΤΑ ΧΡΥΣΟ
      }}
    >
      {/* Header της κάρτας */}
      <div
        className="p-3 text-lg font-semibold"
        style={{
          backgroundColor: headerBgColor,
          color: headerTextColor,
        }}
      >
        {title}
      </div>

      {/* Περιεχόμενο της κάρτας */}
      <div
        className="p-4"
        style={{
          backgroundColor: contentBgColor,
        }}
      >
        {children}
      </div>
    </div>
  );
}