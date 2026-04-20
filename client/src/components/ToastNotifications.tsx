import { useEffect } from "react";

export type ToastVariant = "error" | "success" | "info" | "warning";

export type ToastNotification = {
  id: string;
  message: string;
  variant: ToastVariant;
};

type ToastStyle = {
  container: string;
  icon: string;
  title: string;
};

type ToastNotificationsProps = {
  notifications: ToastNotification[];
  onDismiss: (id: string) => void;
  autoHideMs?: number;
  className?: string;
};

const variantStyles: Record<ToastVariant, ToastStyle> = {
  error: {
    container: "border-red-200/70 bg-red-100/85",
    icon: "error",
    title: "Error",
  },
  success: {
    container: "border-emerald-200/70 bg-emerald-200/90",
    icon: "check_circle",
    title: "Success",
  },
  info: {
    container: "border-sky-200/70 bg-sky-100/90",
    icon: "info",
    title: "Info",
  },
  warning: {
    container: "border-amber-200/70 bg-amber-100/90",
    icon: "warning",
    title: "Warning",
  },
};

const ToastNotifications = ({
  notifications,
  onDismiss,
  autoHideMs = 5000,
  className = "",
}: ToastNotificationsProps) => {
  useEffect(() => {
    if (notifications.length === 0) {
      return;
    }

    const timeoutIds = notifications.map((notification) =>
      window.setTimeout(() => {
        onDismiss(notification.id);
      }, autoHideMs),
    );

    return () => {
      timeoutIds.forEach((timeoutId) => window.clearTimeout(timeoutId));
    };
  }, [autoHideMs, notifications, onDismiss]);

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div
      className={`fixed top-5 right-5 z-50 flex w-full max-w-[calc(100vw-1.25rem)] flex-col items-end gap-2.5 sm:max-w-90 ${className}`.trim()}
    >
      {notifications.map((notification) => {
        const style = variantStyles[notification.variant];

        return (
          <div
            key={notification.id}
            className={`w-full rounded-xl border px-3 py-2.5 shadow-[0_10px_20px_-16px_rgba(0,0,0,0.45)] backdrop-blur-sm ${style.container}`}
          >
            <div className="flex items-start gap-2.5">
              <span
                aria-hidden="true"
                className="material-symbols-outlined mt-0.5 text-[18px] leading-none text-black"
              >
                {style.icon}
              </span>

              <div className="min-w-0 flex-1 text-black">
                <p className="text-base leading-tight">{style.title}</p>
                <p className="mt-0.5 text-[13px] leading-[1.35rem]">
                  {notification.message}
                </p>
              </div>

              <button
                type="button"
                onClick={() => onDismiss(notification.id)}
                aria-label="Dismiss notification"
                className="shrink-0 rounded-md p-0.5 text-black/85 hover:bg-black/10 hover:text-black transition-colors"
              >
                <span
                  aria-hidden="true"
                  className="material-symbols-outlined text-[18px] leading-none"
                >
                  close
                </span>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ToastNotifications;
