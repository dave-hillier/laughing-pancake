import type { ReactNode } from 'react';
import './editor.css';

interface EditorSectionProps {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}

export function EditorSection({ title, children, action }: EditorSectionProps) {
  return (
    <div className="editor-section">
      {action ? (
        <div className="section-header">
          <h3>{title}</h3>
          {action}
        </div>
      ) : (
        <h3>{title}</h3>
      )}
      {children}
    </div>
  );
}
