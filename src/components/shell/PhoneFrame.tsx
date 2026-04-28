import { ReactNode } from "react";

/**
 * Desktop-Preview-Wrapper. Auf großen Screens rendert die App in einem
 * iPhone-ähnlichen Frame mit Hintergrund — auf Mobile bleibt's edge-to-edge.
 */
export function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh w-full md:flex md:items-center md:justify-center md:py-10 md:bg-[radial-gradient(ellipse_at_top,_#ede9da,_#d6cfbf_60%)]">
      <div className="relative w-full md:w-[390px] md:h-[844px] md:rounded-[44px] md:overflow-hidden md:shadow-[0_30px_80px_-20px_rgba(43,39,34,0.4)] md:hairline bg-canvas paper-grain">
        <div className="relative z-10 flex flex-col h-dvh md:h-full overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}
