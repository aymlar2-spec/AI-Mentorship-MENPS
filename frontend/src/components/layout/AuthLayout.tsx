import type { ReactNode } from "react";
import { Sparkles, Users2, MessageCircle, Target } from "lucide-react";

const VALUE_PROPS = [
  {
    icon: Users2,
    text: "Get matched with the right mentor, backed by a transparent, explainable score.",
  },
  {
    icon: MessageCircle,
    text: "Talk through goals and challenges with an AI coach that knows your profile.",
  },
  { icon: Target, text: "Turn every conversation into SMART goals and a concrete action plan." },
];

/**
 * AuthLayout — shared shell for unauthenticated pages (Login/Register).
 * Split-screen on desktop (brand panel + form), single column on mobile.
 */
export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden w-[45%] flex-col justify-between bg-primary px-10 py-10 text-white lg:flex xl:w-[40%]">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-control)] bg-white/15">
            <Sparkles className="h-4.5 w-4.5" aria-hidden="true" />
          </span>
          <span className="text-sm font-semibold tracking-wide">MENPS</span>
        </div>

        <div className="max-w-sm">
          <h2 className="text-2xl font-bold leading-snug">
            Mentorship that grows with you, powered by people and AI.
          </h2>
          <ul className="mt-8 flex flex-col gap-5">
            {VALUE_PROPS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="text-sm text-white/90">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-white/60">AI Mentorship Platform for Women</p>
      </div>

      <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
