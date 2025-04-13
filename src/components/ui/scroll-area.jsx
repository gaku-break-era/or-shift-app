export function ScrollArea({ children, className = "" }) {
    return (
      <div className={`overflow-auto max-h-[400px] ${className}`}>
        {children}
      </div>
    );
  }
  