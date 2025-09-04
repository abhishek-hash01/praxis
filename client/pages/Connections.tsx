import LoggedInLayout from "@/components/layout/LoggedInLayout";
import { connections, mockUser } from "@shared/mocks";
import { Link } from "react-router-dom";

export default function Connections() {
  return (
    <LoggedInLayout>
      <div className="container py-8">
        <h1 className="font-heading text-2xl">Connections</h1>
        <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {connections.map((c) => {
            const other = c.users.find((u) => u.id !== mockUser.id)!;
            return (
              <div key={c.id} className="glass-card p-5">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-praxis-purple to-praxis-blue" />
                  <div>
                    <div className="font-heading">{other.name}</div>
                    <div className="text-xs text-white/60">Matched on {new Date(c.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>
                {c.lastMessagePreview && (
                  <div className="mt-3 text-sm text-white/80">“{c.lastMessagePreview}”</div>
                )}
                <Link to="/chat" state={{ withUserId: other.id }} className="btn-primary mt-4 inline-flex">Open chat</Link>
              </div>
            );
          })}
        </div>
      </div>
    </LoggedInLayout>
  );
}
