"use client";
import { useEffect, useRef } from "react";

declare global { interface Window { turnstile?: { render: (element: HTMLElement, options: { sitekey: string; callback: (token: string) => void; "expired-callback": () => void; theme: string }) => string; remove: (id: string) => void } } }

export function TurnstileWidget({ siteKey, onToken }: { siteKey: string; onToken: (token: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!siteKey || !ref.current) return;
    let widgetId: string | null = null;
    const render = () => { if (ref.current && window.turnstile && !widgetId) widgetId = window.turnstile.render(ref.current, { sitekey: siteKey, callback: onToken, "expired-callback": () => onToken(""), theme: "light" }); };
    const existing = document.querySelector<HTMLScriptElement>('script[data-dan-turnstile]');
    if (existing) render(); else { const script = document.createElement("script"); script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"; script.async = true; script.defer = true; script.dataset.danTurnstile = "true"; script.onload = render; document.head.appendChild(script); }
    return () => { if (widgetId && window.turnstile) window.turnstile.remove(widgetId); };
  }, [onToken, siteKey]);
  return <div ref={ref} aria-label="Human verification" />;
}
