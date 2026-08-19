import './PrismMark.css';

interface PrismMarkProps {
  className?: string;
}

export function PrismMark({ className = '' }: PrismMarkProps) {
  return (
    <div className={`prism-mark ${className}`}>
      <div className="prism-base"></div>
      <div className="prism-beam-red"></div>
      <div className="prism-beam-green"></div>
      <div className="prism-beam-blue"></div>
      <div className="prism-sweep-layer animate-prism-sweep"></div>
    </div>
  );
}
