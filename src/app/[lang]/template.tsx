// A template re-mounts on every navigation, which replays this gentle fade between pages.
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-in">{children}</div>;
}
