import { motion } from "framer-motion";

interface LoadingProps {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "spinner" | "dots" | "pulse";
  text?: string;
  className?: string;
}

export function Loading({ 
  size = "md", 
  variant = "spinner", 
  text,
  className = ""
}: LoadingProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8", 
    lg: "w-12 h-12",
    xl: "w-16 h-16"
  };

  const dotSizes = {
    sm: "w-1.5 h-1.5",
    md: "w-2 h-2",
    lg: "w-3 h-3", 
    xl: "w-4 h-4"
  };

  if (variant === "spinner") {
    return (
      <div className={`flex flex-col items-center gap-4 ${className}`}>
        <motion.div
          className={`${sizeClasses[size]} relative`}
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <div className="absolute inset-0 rounded-full border-2 border-primary/20"></div>
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary"></div>
        </motion.div>
        {text && (
          <motion.p 
            className="text-sm text-muted-foreground"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {text}
          </motion.p>
        )}
      </div>
    );
  }

  if (variant === "dots") {
    return (
      <div className={`flex flex-col items-center gap-4 ${className}`}>
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className={`${dotSizes[size]} rounded-full bg-gradient-to-r from-primary to-accent`}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.7, 1, 0.7]
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                delay: i * 0.2
              }}
            />
          ))}
        </div>
        {text && (
          <motion.p 
            className="text-sm text-muted-foreground"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {text}
          </motion.p>
        )}
      </div>
    );
  }

  if (variant === "pulse") {
    return (
      <div className={`flex flex-col items-center gap-4 ${className}`}>
        <motion.div
          className={`${sizeClasses[size]} rounded-full bg-gradient-to-r from-primary to-accent`}
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.7, 1, 0.7]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        {text && (
          <motion.p 
            className="text-sm text-muted-foreground"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {text}
          </motion.p>
        )}
      </div>
    );
  }

  return null;
}

// Simplified fullscreen loading overlay
export function LoadingOverlay({ 
  variant = "spinner",
  text = "Loading..."
}: { 
  variant?: LoadingProps["variant"];
  text?: string;
}) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center glass-premium"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="text-center">
        <Loading size="lg" variant={variant} text={text} />
      </div>
    </motion.div>
  );
}

// Simple loading skeleton
export function LoadingSkeleton({
  className = "",
  count = 1
}: {
  className?: string;
  count?: number;
}) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          className="rounded-lg bg-muted/30 h-4"
          style={{
            width: `${Math.random() * 40 + 60}%`
          }}
          animate={{
            opacity: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: i * 0.1
          }}
        />
      ))}
    </div>
  );
}

// Simple toast notification component
export function Toast({
  message,
  type = "info",
  onClose
}: {
  message: string;
  type?: "success" | "error" | "warning" | "info";
  onClose: () => void;
}) {
  const typeStyles = {
    success: "border-green-500/20 bg-green-500/10 text-green-400",
    error: "border-red-500/20 bg-red-500/10 text-red-400",
    warning: "border-yellow-500/20 bg-yellow-500/10 text-yellow-400",
    info: "border-blue-500/20 bg-blue-500/10 text-blue-400"
  };

  const typeIcons = {
    success: "ri-check-line",
    error: "ri-error-warning-line",
    warning: "ri-alert-line",
    info: "ri-information-line"
  };

  return (
    <motion.div
      className={`fixed top-4 right-4 z-50 glass-premium border rounded-xl p-4 min-w-80 ${typeStyles[type]}`}
      initial={{ opacity: 0, x: 100, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.8 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <div className="flex items-start gap-3">
        <i className={`${typeIcons[type]} text-lg mt-0.5`} />
        <div className="flex-1">
          <p className="text-sm font-medium">{message}</p>
        </div>
        <button 
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <i className="ri-close-line text-lg" />
        </button>
      </div>
    </motion.div>
  );
} 