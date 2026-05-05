'use client';

import React from 'react';

/**
 * Cross-platform SVG icons for card categories.
 * Replaces emoji icons that render inconsistently across OS/browsers.
 * All icons are 24x24 viewBox, using currentColor for theming.
 */

interface IconProps {
  className?: string;
  size?: number;
}

// ⚙️ ENGINE — Gear/Cog
export const EngineIcon = ({ className, size = 24 }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
);

// 💨 TURBO — Wind/Fast
export const TurboIcon = ({ className, size = 24 }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.59 4.59A2 2 0 1 1 11 8H2"/>
    <path d="M12.59 19.41A2 2 0 1 0 14 16H2"/>
    <path d="M17.73 7.73A2.5 2.5 0 1 1 19.5 12H2"/>
  </svg>
);

// 🔥 EXHAUST — Flame
export const ExhaustIcon = ({ className, size = 24 }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} className={className} fill="currentColor" stroke="none">
    <path d="M12 23c-3.87 0-7-3.13-7-7 0-3.53 2.61-6.43 6-6.93V2l4.5 6.5c.83 1.2 1.5 2.54 1.5 4.5 0 3.87-2.13 7-5 10z" opacity="0.9"/>
    <path d="M12 23c-1.66 0-3-1.34-3-3 0-1.1.55-2.06 1.38-2.64L12 13l1.62 4.36A3.09 3.09 0 0 1 15 20c0 1.66-1.34 3-3 3z" fill="currentColor" opacity="0.5"/>
  </svg>
);

// ❄️ COOLING — Snowflake
export const CoolingIcon = ({ className, size = 24 }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="2" x2="12" y2="22"/>
    <line x1="2" y1="12" x2="22" y2="12"/>
    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
    <line x1="19.07" y1="4.93" x2="4.93" y2="19.07"/>
    <line x1="12" y1="2" x2="14" y2="5"/>
    <line x1="12" y1="2" x2="10" y2="5"/>
    <line x1="22" y1="12" x2="19" y2="10"/>
    <line x1="22" y1="12" x2="19" y2="14"/>
    <line x1="12" y1="22" x2="10" y2="19"/>
    <line x1="12" y1="22" x2="14" y2="19"/>
    <line x1="2" y1="12" x2="5" y2="10"/>
    <line x1="2" y1="12" x2="5" y2="14"/>
  </svg>
);

// 🌬️ FILTER — Air Filter / Fan
export const FilterIcon = ({ className, size = 24 }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2"/>
    <line x1="7" y1="8" x2="17" y2="8"/>
    <line x1="7" y1="12" x2="17" y2="12"/>
    <line x1="7" y1="16" x2="17" y2="16"/>
  </svg>
);

// ⛽ FUEL — Fuel Pump
export const FuelIcon = ({ className, size = 24 }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="6" width="12" height="16" rx="1"/>
    <path d="M3 10h12"/>
    <path d="M15 14h2a2 2 0 0 0 2-2V8l2-2"/>
    <path d="M19 4v2"/>
    <rect x="6" y="2" width="6" height="4"/>
  </svg>
);

// 🔩 SUSPENSION — Suspension Spring
export const SuspensionIcon = ({ className, size = 24 }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="1"/>
    <path d="M20.2 20.2c2.04-2.03.02-7.36-4.5-11.9-4.54-4.52-9.87-6.54-11.9-4.5-2.04 2.03-.02 7.36 4.5 11.9 4.54 4.52 9.87 6.54 11.9 4.5z"/>
    <path d="M15.7 15.7c4.52-4.54 6.54-9.87 4.5-11.9-2.03-2.04-7.36-.02-11.9 4.5-4.52 4.54-6.54 9.87-4.5 11.9 2.03 2.04 7.36.02 11.9-4.5z"/>
  </svg>
);

// 🛞 TIRE — Wheel/Circle
export const TireIcon = ({ className, size = 24 }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <circle cx="12" cy="12" r="6"/>
    <circle cx="12" cy="12" r="2"/>
    <line x1="12" y1="2" x2="12" y2="6"/>
    <line x1="12" y1="18" x2="12" y2="22"/>
    <line x1="2" y1="12" x2="6" y2="12"/>
    <line x1="18" y1="12" x2="22" y2="12"/>
  </svg>
);

// 💥 NITROUS — Zap/Bolt
export const NitrousIcon = ({ className, size = 24 }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
);

// 🔧 TOOL — Wrench
export const ToolIcon = ({ className, size = 24 }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
  </svg>
);

// 👥 CREW — Users
export const CrewIcon = ({ className, size = 24 }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

// 📋 ALL — Clipboard/List
export const AllIcon = ({ className, size = 24 }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
    <line x1="8" y1="10" x2="16" y2="10"/>
    <line x1="8" y1="14" x2="16" y2="14"/>
    <line x1="8" y1="18" x2="12" y2="18"/>
  </svg>
);

/**
 * Map from category type key to SVG icon component.
 * Usage: const Icon = CATEGORY_ICON_MAP['ENGINE']; return <Icon size={16} />;
 */
export const CATEGORY_ICON_MAP: Record<string, React.FC<IconProps>> = {
  ALL: AllIcon,
  ENGINE: EngineIcon,
  TURBO: TurboIcon,
  EXHAUST: ExhaustIcon,
  COOLING: CoolingIcon,
  FILTER: FilterIcon,
  FUEL: FuelIcon,
  SUSPENSION: SuspensionIcon,
  TIRE: TireIcon,
  NITROUS: NitrousIcon,
  TOOL: ToolIcon,
  CREW: CrewIcon,
};

/**
 * Renders a category icon by type key.
 * Falls back to a "?" text if the type is unknown.
 */
export function CategoryIcon({ type, size = 16, className }: { type: string; size?: number; className?: string }) {
  const Icon = CATEGORY_ICON_MAP[type];
  if (!Icon) return <span className={className} style={{ fontSize: size }}>?</span>;
  return <Icon size={size} className={className} />;
}
