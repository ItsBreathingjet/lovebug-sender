
import { FloatingHearts } from "./FloatingHearts";
import { DecorationSparkles } from "./DecorationSparkles";

export const PageWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="relative w-full min-h-screen flex items-center justify-center p-4 overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-b from-pink-100 via-white to-pink-50" />
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(255,182,255,0.1),rgba(255,182,255,0))]" />
    <FloatingHearts />
    <DecorationSparkles />
    <div className="relative z-10">
      {children}
    </div>
  </div>
);
