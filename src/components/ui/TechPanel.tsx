import './TechPanel.css';

interface TechPanelProps {
  sourceData: {
    resolution: string;
    fps: string;
    codec: string;
    bitrate: string;
  };
  outputData: {
    resolution: string;
    fps: string;
    codec: string;
    bitrate: string;
  };
  className?: string;
}

export function TechPanel({ sourceData, outputData, className = '' }: TechPanelProps) {
  return (
    <div className={`tech-panel ${className}`}>
      <div className="tech-panel-header">
        <div className="tech-panel-col-title">SOURCE</div>
        <div className="tech-panel-col-title highlight">PRISM OUTPUT</div>
      </div>
      
      <div className="tech-panel-row">
        <div className="tech-panel-cell mono">{sourceData.resolution}</div>
        <div className="tech-panel-cell mono highlight">{outputData.resolution}</div>
      </div>
      
      <div className="tech-panel-row">
        <div className="tech-panel-cell mono">{sourceData.fps}</div>
        <div className="tech-panel-cell mono highlight">{outputData.fps}</div>
      </div>
      
      <div className="tech-panel-row">
        <div className="tech-panel-cell mono">{sourceData.codec}</div>
        <div className="tech-panel-cell mono highlight">{outputData.codec}</div>
      </div>
      
      <div className="tech-panel-row">
        <div className="tech-panel-cell mono">{sourceData.bitrate}</div>
        <div className="tech-panel-cell mono highlight">{outputData.bitrate}</div>
      </div>
    </div>
  );
}
