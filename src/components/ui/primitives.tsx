"use client";
import React from "react";

type CSS = React.CSSProperties;

/* ── Badge ── */
type BadgeVariant = "neutral" | "positive" | "negative" | "warning" | "brand" | "ink";
export function Badge({
  variant = "neutral",
  children,
  style = {},
  ...rest
}: { variant?: BadgeVariant; children: React.ReactNode; style?: CSS } & React.HTMLAttributes<HTMLSpanElement>) {
  const variants: Record<BadgeVariant, CSS> = {
    neutral: { background: "var(--color-canvas-soft)", color: "var(--color-ink)" },
    positive: { background: "var(--color-primary-pale)", color: "var(--color-positive-deep)" },
    negative: { background: "var(--color-negative-bg)", color: "#ffffff" },
    warning: { background: "#fff3c4", color: "var(--color-warning-content)" },
    brand: { background: "var(--color-primary)", color: "var(--color-on-primary)" },
    ink: { background: "var(--color-ink)", color: "var(--color-primary)" },
  };
  return (
    <span
      style={{
        display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "var(--font-body)",
        fontWeight: 600, fontSize: 14, lineHeight: "20px", padding: "4px 12px",
        borderRadius: "var(--radius-pill)", whiteSpace: "nowrap", ...variants[variant], ...style,
      }}
      {...rest}
    >
      {children}
    </span>
  );
}

/* ── Button ── */
type ButtonVariant = "primary" | "secondary" | "tertiary" | "ghost" | "dark";
type ButtonSize = "sm" | "md" | "lg";
export function Button({
  variant = "primary", size = "md", fullWidth = false, iconLeft = null, iconRight = null,
  disabled = false, type = "button", onClick, children, style = {}, className, ...rest
}: {
  variant?: ButtonVariant; size?: ButtonSize; fullWidth?: boolean;
  iconLeft?: React.ReactNode; iconRight?: React.ReactNode; disabled?: boolean;
  type?: "button" | "submit" | "reset"; onClick?: React.MouseEventHandler;
  children: React.ReactNode; style?: CSS; className?: string;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "type" | "onClick" | "style">) {
  const sizes: Record<ButtonSize, CSS> = {
    sm: { padding: "8px 16px", fontSize: 14, lineHeight: "20px", minHeight: 36 },
    md: { padding: "12px 24px", fontSize: 16, lineHeight: "24px", minHeight: 48 },
    lg: { padding: "16px 28px", fontSize: 16, lineHeight: "24px", minHeight: 56 },
  };
  const variants: Record<ButtonVariant, CSS> = {
    primary: { background: "var(--color-primary)", color: "var(--color-on-primary)", border: "1px solid transparent" },
    secondary: { background: "var(--color-canvas-soft)", color: "var(--color-ink)", border: "1px solid transparent" },
    tertiary: { background: "var(--color-canvas)", color: "var(--color-ink)", border: "1px solid var(--color-ink)" },
    ghost: { background: "transparent", color: "var(--color-ink)", border: "1px solid transparent" },
    dark: { background: "var(--color-ink)", color: "var(--color-primary)", border: "1px solid transparent" },
  };
  return (
    <button
      type={type} disabled={disabled} onClick={onClick} className={className}
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
        fontFamily: "var(--font-body)", fontWeight: 600, borderRadius: "var(--radius-xl)",
        cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.4 : 1,
        width: fullWidth ? "100%" : "auto",
        transition: "transform 120ms ease, filter 120ms ease, background 120ms ease",
        whiteSpace: "nowrap", ...sizes[size], ...variants[variant], ...style,
      }}
      onMouseDown={(e) => { if (!disabled) e.currentTarget.style.transform = "scale(0.97)"; }}
      onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.filter = "brightness(0.96)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.filter = "none"; e.currentTarget.style.transform = "scale(1)"; }}
      {...rest}
    >
      {iconLeft}{children}{iconRight}
    </button>
  );
}

/* ── Card ── */
type CardTone = "white" | "sage" | "green" | "dark" | "pale";
export function Card({
  tone = "white", padding, interactive = false, children, style = {}, className, onClick, ...rest
}: {
  tone?: CardTone; padding?: number | string; interactive?: boolean;
  children: React.ReactNode; style?: CSS; className?: string; onClick?: React.MouseEventHandler;
} & Omit<React.HTMLAttributes<HTMLDivElement>, "style" | "onClick">) {
  const tones: Record<CardTone, CSS> = {
    white: { background: "var(--color-canvas)", color: "var(--color-ink)" },
    sage: { background: "var(--color-canvas-soft)", color: "var(--color-ink)" },
    green: { background: "var(--color-primary-pale)", color: "var(--color-ink)" },
    pale: { background: "var(--color-primary-pale)", color: "var(--color-ink)" },
    dark: { background: "var(--color-ink)", color: "var(--color-primary)" },
  };
  const baseShadow = tone === "white" ? "var(--shadow-card)" : "none";
  return (
    <div
      onClick={onClick} className={className}
      style={{
        borderRadius: "var(--radius-xl)", padding: padding != null ? padding : "var(--space-xl)",
        boxShadow: baseShadow, transition: "transform 160ms ease, box-shadow 160ms ease",
        cursor: interactive ? "pointer" : "default", ...tones[tone], ...style,
      }}
      onMouseEnter={interactive ? (e) => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "var(--shadow-pop)"; } : undefined}
      onMouseLeave={interactive ? (e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = baseShadow; } : undefined}
      {...rest}
    >
      {children}
    </div>
  );
}

/* ── Chip ── */
export function Chip({
  selected = false, iconLeft = null, onClick, children, style = {}, ...rest
}: {
  selected?: boolean; iconLeft?: React.ReactNode; onClick?: React.MouseEventHandler;
  children: React.ReactNode; style?: CSS;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "style" | "onClick">) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "var(--font-body)",
        fontWeight: 600, fontSize: 14, lineHeight: "20px", padding: "8px 14px",
        borderRadius: "var(--radius-pill)", cursor: "pointer", userSelect: "none",
        transition: "background 120ms ease, color 120ms ease, border-color 120ms ease",
        background: selected ? "var(--color-ink)" : "var(--color-canvas)",
        color: selected ? "var(--color-canvas)" : "var(--color-ink)",
        border: selected ? "1px solid var(--color-ink)" : "1px solid var(--border-subtle)",
        whiteSpace: "nowrap", flexShrink: 0, ...style,
      }}
      {...rest}
    >
      {iconLeft}{children}
    </button>
  );
}

/* ── Input ── */
export function Input({
  label, hint, error, prefix = null, suffix = null, id, style = {}, containerStyle = {}, ...rest
}: {
  label?: string; hint?: string; error?: string; prefix?: React.ReactNode; suffix?: React.ReactNode;
  id?: string; style?: CSS; containerStyle?: CSS;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "style" | "prefix">) {
  const fieldId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);
  const borderColor = error ? "var(--color-negative)" : "var(--color-ink)";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, ...containerStyle }}>
      {label && (
        <label htmlFor={fieldId} style={{ fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 600, color: "var(--color-ink)" }}>
          {label}
        </label>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--color-canvas)", border: `1px solid ${borderColor}`, borderRadius: "var(--radius-md)", padding: "12px 16px" }}>
        {prefix}
        <input id={fieldId} style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontFamily: "var(--font-body)", fontSize: 16, lineHeight: "24px", color: "var(--color-ink)", minWidth: 0, ...style }} {...rest} />
        {suffix}
      </div>
      {(hint || error) && (
        <span style={{ fontFamily: "var(--font-body)", fontSize: 12, lineHeight: "16px", color: error ? "var(--color-negative-darkest)" : "var(--color-mute)" }}>
          {error || hint}
        </span>
      )}
    </div>
  );
}

/* ── IconButton ── */
type IBVariant = "default" | "primary" | "soft" | "dark";
export function IconButton({
  variant = "default", size = "md", disabled = false, ariaLabel, onClick, children, style = {}, ...rest
}: {
  variant?: IBVariant; size?: "sm" | "md" | "lg"; disabled?: boolean; ariaLabel?: string;
  onClick?: React.MouseEventHandler; children: React.ReactNode; style?: CSS;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "style" | "onClick">) {
  const dims = { sm: 32, md: 40, lg: 48 };
  const d = dims[size] || dims.md;
  const variants: Record<IBVariant, CSS> = {
    default: { background: "var(--color-canvas)", color: "var(--color-ink)", border: "1px solid var(--border-subtle)" },
    primary: { background: "var(--color-primary)", color: "var(--color-on-primary)", border: "1px solid transparent" },
    soft: { background: "var(--color-canvas-soft)", color: "var(--color-ink)", border: "1px solid transparent" },
    dark: { background: "var(--color-ink)", color: "var(--color-primary)", border: "1px solid transparent" },
  };
  return (
    <button
      aria-label={ariaLabel} disabled={disabled} onClick={onClick}
      style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: d, height: d, borderRadius: "var(--radius-full)", cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.4 : 1, padding: 0, transition: "transform 120ms ease, filter 120ms ease", ...variants[variant], ...style }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.filter = "brightness(0.96)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.filter = "none"; e.currentTarget.style.transform = "scale(1)"; }}
      onMouseDown={(e) => { if (!disabled) e.currentTarget.style.transform = "scale(0.92)"; }}
      onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
      {...rest}
    >
      {children}
    </button>
  );
}
