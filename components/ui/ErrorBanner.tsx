type ErrorBannerProps = {
  message: string | null;
};

export function ErrorBanner({ message }: ErrorBannerProps) {
  if (!message) {
    return null;
  }

  return (
    <p
      role="alert"
      className="rounded-xl border border-red-400/30 bg-red-950/40 px-4 py-3 text-sm text-red-200"
    >
      {message}
    </p>
  );
}
