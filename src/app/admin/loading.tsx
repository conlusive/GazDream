// Shown at once while the next admin page loads from the database, so a click always feels answered.
export default function AdminLoading() {
  return (
    <div className="animate-pulse space-y-6" role="status" aria-label="Завантаження">
      <div className="h-8 w-56 rounded-lg bg-line" />
      <div className="h-4 w-80 max-w-full rounded bg-line/70" />
      <div className="card h-64 bg-white" />
    </div>
  );
}
