import { useState } from "react";
import { C, font, eyebrow } from "./stats.tokens";

/* ─── Stat card shell ────────────────────────────── */
export function StatCard({
  eyebrowText,
  title,
  children,
  footer,
}: {
  eyebrowText: string;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: C.white,
        border: `1px solid ${C.border}`,
        borderRadius: "16px",
        padding: "2.25rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
      }}
    >
      <p style={{ ...eyebrow, marginBottom: 0 }}>{eyebrowText}</p>
      <p
        style={{
          fontFamily: font.sans,
          fontSize: "0.82rem",
          fontWeight: 600,
          color: C.inkMid,
          margin: 0,
          textTransform: "uppercase",
          letterSpacing: "0.04em",
        }}
      >
        {title}
      </p>
      <div style={{ flex: 1 }}>{children}</div>
      {footer && (
        <div
          style={{
            borderTop: `1px solid ${C.border}`,
            paddingTop: "0.75rem",
            marginTop: "0.25rem",
          }}
        >
          {footer}
        </div>
      )}
    </div>
  );
}

/* ─── Big number display ─────────────────────────── */
export function BigStat({
  value,
  suffix,
  sub,
}: {
  value: string | number;
  suffix?: string;
  sub?: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: "0.3rem" }}>
      <span
        style={{
          fontFamily: font.serif,
          fontSize: "3.2rem",
          fontWeight: 400,
          color: C.ink,
          lineHeight: 1,
        }}
      >
        {value}
      </span>
      {suffix && (
        <span
          style={{
            fontFamily: font.serif,
            fontSize: "1.5rem",
            color: C.inkMid,
            lineHeight: 1,
          }}
        >
          {suffix}
        </span>
      )}
      {sub && (
        <span
          style={{
            fontFamily: font.sans,
            fontSize: "0.8rem",
            color: C.inkFaint,
            marginLeft: "0.5rem",
          }}
        >
          {sub}
        </span>
      )}
    </div>
  );
}

/* ─── Skeleton shimmer ───────────────────────────── */
export function Skeleton() {
  return (
    <div
      style={{
        height: "3.2rem",
        width: "8rem",
        borderRadius: "8px",
        background: `linear-gradient(90deg, ${C.rustLight} 0%, #f2ede6 50%, ${C.rustLight} 100%)`,
        backgroundSize: "200% 100%",
        animation: "shimmer 1.4s infinite",
      }}
    />
  );
}

/* ─── Insufficient data notice ───────────────────── */
export function ThinDataNote({ count, context }: { count: number; context: string }) {
  return (
    <p
      style={{
        fontFamily: font.sans,
        fontSize: "0.78rem",
        color: C.inkFaint,
        margin: 0,
        lineHeight: 1.6,
      }}
    >
      Based on {count} submission{count !== 1 ? "s" : ""} {context}. Will
      sharpen as more people upload.
    </p>
  );
}

/* ─── Rank alert footer ──────────────────────────── */
export function RankAlert() {
  return (
    <p
      style={{
        fontFamily: font.sans,
        fontSize: "0.78rem",
        color: C.inkMid,
        margin: 0,
        lineHeight: 1.6,
        display: "flex",
        gap: "0.4rem",
        alignItems: "flex-start",
      }}
    >
      <span style={{ color: C.rust, fontWeight: 700, flexShrink: 0 }}>↗</span>
      Once enough data accumulates, this will show your estimated BITS rank
      directly.
    </p>
  );
}

/* ─── Tooltip base ───────────────────────────────── */
function TooltipBase({ width, children }: { width: string; children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  return (
    <span
      style={{ position: "relative", display: "inline-flex", alignItems: "center" }}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      <span style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        width: "15px", height: "15px", borderRadius: "50%",
        border: `1px solid ${C.borderMid}`, cursor: "default",
        fontFamily: font.sans, fontSize: "0.65rem", fontWeight: 700,
        color: C.inkFaint, lineHeight: 1, flexShrink: 0,
      }}>?</span>
      {visible && (
        <div style={{
          position: "absolute", bottom: "calc(100% + 8px)", left: "50%",
          transform: "translateX(-50%)",
          background: C.ink, color: C.white,
          fontFamily: font.sans, fontSize: "0.75rem", lineHeight: 1.6,
          padding: "0.75rem 1rem", borderRadius: "10px",
          width, zIndex: 10, pointerEvents: "none",
          boxShadow: "0 4px 20px rgba(0,0,0,0.18)",
        }}>
          {children}
          <div style={{
            position: "absolute", top: "100%", left: "50%", transform: "translateX(-50%)",
            width: 0, height: 0,
            borderLeft: "6px solid transparent", borderRight: "6px solid transparent",
            borderTop: `6px solid ${C.ink}`,
          }} />
        </div>
      )}
    </span>
  );
}

/* ─── Rank tooltip ───────────────────────────────── */
export function RankTooltip() {
  return (
    <TooltipBase width="260px">
      <p style={{ margin: "0 0 0.5rem", fontWeight: 600, color: C.white }}>How this is calculated</p>
      <p style={{ margin: "0 0 0.5rem", color: "rgba(255,255,255,0.8)" }}>
        In 2022, BITS released official rank vs. marks data — the only year this was made public. We fit a skew-normal curve to that distribution.
      </p>
      <p style={{ margin: 0, color: "rgba(255,255,255,0.8)" }}>
        Since 2025 scores use a different scale, we mapped them using a linear regression across 14 paired Pilani cutoffs (2022 and 2025), then looked up your score on the fitted curve.
      </p>
    </TooltipBase>
  );
}

/* ─── Percentile tooltip ─────────────────────────── */
export function PercentileTooltip() {
  return (
    <TooltipBase width="240px">
      <p style={{ margin: "0 0 0.5rem", fontWeight: 600, color: C.white }}>How this is calculated</p>
      <p style={{ margin: 0, color: "rgba(255,255,255,0.8)" }}>
        Derived from the same 2022 rank distribution as the estimated rank. Shows what fraction of all test-takers scored strictly below your mark.
      </p>
    </TooltipBase>
  );
}
