import type { CSSProperties } from 'react';

export const colors = {
    pageBg: 'oklch(98% 0.004 95)',
    text: 'oklch(22% 0.01 95)',
    sidebarBg: 'oklch(96.5% 0.005 95)',
    border: 'oklch(89% 0.004 95)',
    borderStrong: 'oklch(87% 0.004 95)',
    accent: 'oklch(56% 0.16 255)',
    accentSoftBg: 'oklch(92% 0.02 255)',
    accentText: 'oklch(48% 0.16 255)',
    muted: 'oklch(55% 0.01 95)',
    mutedLight: 'oklch(60% 0.01 95)',
    label: 'oklch(50% 0.01 95)',
    dangerBorder: 'oklch(90% 0.03 25)',
    dangerText: 'oklch(50% 0.15 25)',
    warnText: 'oklch(52% 0.14 70)',
    chipBg: 'oklch(95% 0.004 95)',
    fieldText: 'oklch(25% 0.01 95)',
    controlBg: 'oklch(94% 0.004 95)',
    nowLine: 'oklch(58% 0.19 25)',
    tooltipBg: 'oklch(20% 0.01 95)',
} as const;

export const inputStyle: CSSProperties = {
    width: '100%',
    padding: '9px 10px',
    border: `1px solid ${colors.borderStrong}`,
    borderRadius: 8,
    fontSize: 13,
    fontFamily: 'inherit',
    color: colors.fieldText,
};

export const labelStyle: CSSProperties = {
    fontSize: 11.5,
    fontWeight: 600,
    color: colors.label,
    marginBottom: 5,
};

export const primaryButtonStyle: CSSProperties = {
    height: 34,
    padding: '0 16px',
    borderRadius: 7,
    border: 'none',
    background: colors.accent,
    color: '#fff',
    cursor: 'pointer',
    fontSize: 12.5,
    fontWeight: 700,
};

export const secondaryButtonStyle: CSSProperties = {
    height: 34,
    padding: '0 14px',
    borderRadius: 7,
    border: `1px solid ${colors.border}`,
    background: '#fff',
    cursor: 'pointer',
    fontSize: 12.5,
    fontWeight: 600,
    color: 'oklch(40% 0.01 95)',
};

export const dangerButtonStyle: CSSProperties = {
    height: 34,
    padding: '0 14px',
    borderRadius: 7,
    border: `1px solid ${colors.dangerBorder}`,
    background: '#fff',
    cursor: 'pointer',
    fontSize: 12.5,
    fontWeight: 600,
    color: colors.dangerText,
};

export const smallSecondaryButtonStyle: CSSProperties = {
    height: 28,
    padding: '0 12px',
    borderRadius: 7,
    border: `1px solid ${colors.border}`,
    background: '#fff',
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 600,
    color: 'oklch(40% 0.01 95)',
};

export const smallDangerButtonStyle: CSSProperties = {
    ...dangerButtonStyle,
    height: 30,
    padding: '0 12px',
    fontSize: 12,
};

export const modalOverlayStyle: CSSProperties = {
    position: 'fixed',
    inset: 0,
    background: 'oklch(20% 0.01 95 / 0.35)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
};

export const modalCardStyle: CSSProperties = {
    width: 380,
    background: '#fff',
    borderRadius: 12,
    padding: 20,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    boxShadow: '0 12px 32px oklch(0% 0 0 / 0.18)',
};

export const modalTitleStyle: CSSProperties = {
    fontSize: 15,
    fontWeight: 700,
};

export const modalHeaderStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
};

export const closeButtonStyle: CSSProperties = {
    width: 26,
    height: 26,
    flex: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 7,
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    fontSize: 18,
    lineHeight: 1,
    color: colors.muted,
};

export const checkboxLabelStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 7,
    fontSize: 12,
    fontWeight: 600,
    color: 'oklch(40% 0.01 95)',
    cursor: 'pointer',
};
