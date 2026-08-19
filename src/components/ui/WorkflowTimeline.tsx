import './WorkflowTimeline.css';

interface WorkflowStep {
  number: string;
  title: string;
  description: string;
}

const STEPS: WorkflowStep[] = [
  {
    number: '01',
    title: 'Analyze',
    description: 'Prism reads codec, container, frame rate, resolution, and timing data from your source file without uploading it.',
  },
  {
    number: '02',
    title: 'Optimize',
    description: 'Only what needs to change is changed. If the file is already compatible, Prism leaves it untouched.',
  },
  {
    number: '03',
    title: 'Validate',
    description: 'Before output, Prism checks playback reliability, audio sync, and decoder compatibility.',
  },
  {
    number: '04',
    title: 'Upload',
    description: 'Download the prepared file, or use Prism Companion to route it directly into TikTok Studio.',
  },
];

interface WorkflowTimelineProps {
  className?: string;
}

export function WorkflowTimeline({ className = '' }: WorkflowTimelineProps) {
  return (
    <div className={`workflow-timeline ${className}`}>
      {STEPS.map((step, index) => (
        <div className="workflow-step" key={step.number}>
          <div className="workflow-step-number label-caps">{step.number}</div>
          <div className="workflow-step-connector">
            <div className="workflow-step-dot" />
            {index < STEPS.length - 1 && <div className="workflow-step-line" />}
          </div>
          <div className="workflow-step-content">
            <h3 className="workflow-step-title">{step.title}</h3>
            <p className="workflow-step-desc">{step.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
