type LoadingSpinnerProps = {
  message?: string;
};

export default function LoadingSpinner({
  message = "Loading...",
}: LoadingSpinnerProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-56 flex-col items-center justify-center gap-4 px-5 py-10"
    >
      <span
        aria-hidden="true"
        className="size-12 animate-spin rounded-full border-4 border-orange-100 border-t-red-700 motion-reduce:animate-none"
      />

      <p className="text-sm font-medium text-stone-600">
        {message}
      </p>
    </div>
  );
}