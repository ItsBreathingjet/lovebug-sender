
import { useMemo } from "react";
import { Heart } from "lucide-react";

const generateHeartProps = () => {
  return [...Array(12)].map(() => ({
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    duration: 5 + Math.random() * 5,
    delay: Math.random() * 5,
    scale: 0.5 + Math.random() * 1,
  }));
};

export const FloatingHearts = () => {
  const heartProps = useMemo(() => generateHeartProps(), []);
  
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {heartProps.map((props, i) => (
        <Heart
          key={i}
          className={`absolute animate-float text-pink-${300 + (i % 3) * 100} opacity-50`}
          style={{
            left: props.left,
            top: props.top,
            animation: `float ${props.duration}s infinite`,
            animationDelay: `${props.delay}s`,
            transform: `scale(${props.scale})`,
          }}
        />
      ))}
    </div>
  );
};
