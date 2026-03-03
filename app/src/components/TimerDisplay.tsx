import type { Speaker } from "@/domain/Speaker";

export interface TimerDisplayProps {
  time: string;
  progress: number; // 0 to 1
  speaker?: Speaker | null;
  isPaused?: boolean;
}

export const TimerDisplay: React.FC<TimerDisplayProps> = ({
  time,
  progress,
  speaker = null,
  isPaused = false,
}) => {
  const size = 280;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  const getStrokeColor = () => {
    if (speaker === "A") return "#ef4444"; // Red-500
    if (speaker === "B") return "#0ea5e9"; // Sky-500
    return "#64748b"; // Slate-500
  };

  return (
    <div className="relative flex items-center justify-center">
      {/* Outer glow effect */}
      <div
        className={`absolute rounded-full transition-all duration-1000 ${
          isPaused ? "animate-pulse" : ""
        }`}
        style={{
          width: size + 20,
          height: size + 20,
          background: `radial-gradient(circle, ${getStrokeColor()}15 0%, transparent 70%)`,
          opacity: isPaused ? 0.6 : 1,
        }}
      />

      {/* SVG Progress Ring */}
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
        aria-label="Timer Fortschritt"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={strokeWidth}
        />

        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getStrokeColor()}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{
            filter: "drop-shadow(0 0 4px rgba(0,0,0,0.1))",
            transition: "stroke-dashoffset 0.5s ease-out",
          }}
        />
      </svg>

      {/* Time display */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={`text-6xl md:text-7xl font-light tracking-tight tabular-nums transition-opacity duration-1000 ${
            isPaused ? "opacity-60" : "opacity-100"
          }`}
          style={{
            fontFamily: "'Inter', system-ui, monospace",
            color: isPaused ? "#94a3b8" : "#1e293b",
          }}
        >
          {time}
        </span>

        {isPaused && (
          <span className="mt-2 text-sm text-slate-400 uppercase tracking-widest animate-pulse">
            Pausiert
          </span>
        )}
      </div>
    </div>
  );
};

export default TimerDisplay;
