import { useEffect, useState } from 'react';

const BOOT_LINES = [
  "> initializing geospatial engine...",
  "> loading H3 grid [austin, tx]...",
  "> compiling spatial indexes...",
  "> connecting to routing service...",
  "> READY."
];

export default function TerminalBoot({ onComplete }: { onComplete: () => void }) {
  
  const [displayedLines, setDisplayedLines] = useState<string[]>([]);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (currentLineIndex >= BOOT_LINES.length) {
      setTimeout(() => onComplete(), 400);
      return;
    }

    const targetLine = BOOT_LINES[currentLineIndex];
    if (currentCharIndex < targetLine.length) {
      const timer = setTimeout(() => {
        setCurrentCharIndex(c => c + 1);
        if (currentCharIndex === 0) {
           setDisplayedLines(prev => [...prev, targetLine.charAt(0)]);
        } else {
           setDisplayedLines(prev => {
             const newLines = [...prev];
             newLines[newLines.length - 1] += targetLine.charAt(currentCharIndex);
             return newLines;
           });
        }
      }, 15);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => {
        setCurrentLineIndex(i => i + 1);
        setCurrentCharIndex(0);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [currentLineIndex, currentCharIndex, onComplete]);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(p => Math.min(p + 5, 100));
    }, 50);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fixed inset-0 bg-base z-50 flex flex-col p-6">
      <div className="flex-1 space-y-2">
        {displayedLines.map((line, i) => (
          <div key={i} className="font-mono text-neonGreen text-xs">{line}</div>
        ))}
      </div>
      <div className="w-full h-1 bg-panelEdge mt-4">
        <div className="h-full bg-neonGreen transition-all duration-75" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}
