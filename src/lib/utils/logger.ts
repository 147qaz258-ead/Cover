// Simple logging utility with different levels

type LogLevel = "error" | "warn" | "info" | "debug";

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, any>;
  requestId?: string;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === "development";

  private formatLog(entry: LogEntry): string {
    const parts = [
      entry.timestamp,
      `[${entry.level.toUpperCase()}]`,
      entry.requestId ? `[${entry.requestId}]` : "",
      entry.message,
    ];

    const logLine = parts.filter(Boolean).join(" ");

    if (entry.context && Object.keys(entry.context).length > 0) {
      return `${logLine}\nContext: ${JSON.stringify(entry.context, null, 2)}`;
    }

    return logLine;
  }

  private log(entry: LogEntry) {
    const formattedLog = this.formatLog(entry);

    switch (entry.level) {
      case "error":
        console.error(formattedLog);
        break;
      case "warn":
        console.warn(formattedLog);
        break;
      case "info":
        console.info(formattedLog);
        break;
      case "debug":
        if (this.isDevelopment) {
          console.debug(formattedLog);
        }
        break;
    }
  }

  error(message: string, context?: Record<string, any>, requestId?: string) {
    this.log({
      level: "error",
      message,
      timestamp: new Date().toISOString(),
      context,
      requestId,
    });
  }

  warn(message: string, context?: Record<string, any>, requestId?: string) {
    this.log({
      level: "warn",
      message,
      timestamp: new Date().toISOString(),
      context,
      requestId,
    });
  }

  info(message: string, context?: Record<string, any>, requestId?: string) {
    this.log({
      level: "info",
      message,
      timestamp: new Date().toISOString(),
      context,
      requestId,
    });
  }

  debug(message: string, context?: Record<string, any>, requestId?: string) {
    this.log({
      level: "debug",
      message,
      timestamp: new Date().toISOString(),
      context,
      requestId,
    });
  }

  // Create child logger with context
  child(context: Record<string, any>): {
    error: (message: string, additionalContext?: Record<string, any>) => void;
    warn: (message: string, additionalContext?: Record<string, any>) => void;
    info: (message: string, additionalContext?: Record<string, any>) => void;
    debug: (message: string, additionalContext?: Record<string, any>) => void;
  } {
    return {
      error: (message: string, additionalContext?: Record<string, any>) => {
        this.error(message, { ...context, ...additionalContext });
      },
      warn: (message: string, additionalContext?: Record<string, any>) => {
        this.warn(message, { ...context, ...additionalContext });
      },
      info: (message: string, additionalContext?: Record<string, any>) => {
        this.info(message, { ...context, ...additionalContext });
      },
      debug: (message: string, additionalContext?: Record<string, any>) => {
        this.debug(message, { ...context, ...additionalContext });
      },
    };
  }
}

// Export singleton instance
export const logger = new Logger();

// Request-scoped logger factory
export function createRequestLogger(requestId: string) {
  return {
    error: (message: string, context?: Record<string, any>) =>
      logger.error(message, context, requestId),
    warn: (message: string, context?: Record<string, any>) =>
      logger.warn(message, context, requestId),
    info: (message: string, context?: Record<string, any>) =>
      logger.info(message, context, requestId),
    debug: (message: string, context?: Record<string, any>) =>
      logger.debug(message, context, requestId),
  };
}