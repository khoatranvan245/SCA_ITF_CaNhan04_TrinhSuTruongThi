import { useEffect } from "react";

export type ToastVariant = "error" | "success" | "info" | "warning";

export type ToastNotification = {
  id: string;
  message: string;
  variant: ToastVariant;
};

type ToastNotificationsProps = {
  notifications: ToastNotification[];
  onDismiss: (id: string) => void;
  autoHideMs?: number;
  className?: string;
};

const variantClasses: Record<ToastVariant, string> = {
  error: "border-red-200 bg-red-50 text-red-700",
  success: "border-green-200 bg-green-50 text-green-700",
  info: "border-blue-200 bg-blue-50 text-blue-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
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
      className={`fixed top-6 right-6 z-50 flex w-fit max-w-[calc(100vw-3rem)] flex-col items-end gap-3 ${className}`.trim()}
    >
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`w-fit max-w-full rounded-2xl border px-4 py-3 backdrop-blur-sm ${variantClasses[notification.variant]}`}
        >
          <p className="text-sm font-semibold">{notification.message}</p>
        </div>
      ))}
    </div>
  );
};

export default ToastNotifications;
