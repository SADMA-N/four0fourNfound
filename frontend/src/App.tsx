import { Calendar, Image as ImageIcon, Loader2, LogOut } from "lucide-react";
import {
  Navigate,
  Route,
  Routes,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { AnnotatePage } from "./pages/AnnotatePage";
import { LoginPage } from "./pages/LoginPage";
import { SignupPage } from "./pages/SignupPage";
import { TasksPage } from "./pages/TasksPage";

/* ── Navigation registry ────────────────────────────────────────── */
const NAV_ITEMS = [
  { label: "Tasks", path: "/tasks", Icon: Calendar },
  { label: "Annotate", path: "/annotate", Icon: ImageIcon },
] as const;

/* ── Sidebar ────────────────────────────────────────────────────── */
function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <aside
      className="
        bg-surface
        border-b border-line
        md:border-b-0 md:border-r
        md:sticky md:top-0 md:h-screen md:overflow-y-auto
        flex flex-row md:flex-col
        shrink-0
      "
      aria-label="Main navigation"
    >
      {/* ── Brand / Title Block ─────────────────────────────────── */}
      {/*   Appears as a technical drawing number above the product  */}
      {/*   name. The 404 motif lives here only — not repeated.      */}
      <div
        className="
          px-5 py-3
          md:px-6 md:pt-6 md:pb-[18px]
          md:border-b md:border-line
          shrink-0
        "
      >
        <span
          className="mono block text-[0.67rem] leading-none tracking-[0.14em] text-muted mb-[5px] select-none"
          aria-hidden="true"
        >
          WORKSPACE&nbsp;404
        </span>
        <strong className="block text-[0.95rem] font-semibold text-ink leading-snug whitespace-nowrap">
          Project Not Found
        </strong>
      </div>

      {/* ── Navigation ──────────────────────────────────────────── */}
      <nav
        className="
          flex flex-row md:flex-col
          items-center md:items-stretch
          flex-1 md:flex-none
          px-2 md:px-0
          gap-1 md:gap-0
          md:mt-2 md:pb-2
        "
        aria-label="Workspace"
      >
        {NAV_ITEMS.map(({ label, path, Icon }) => {
          const active = pathname === path;
          return (
            <button
              key={path}
              type="button"
              className={`
                relative flex items-center gap-[9px]
                px-3 md:px-5
                min-h-[44px] rounded-[6px] md:rounded-none
                text-[0.875rem] font-semibold
                transition-colors duration-[130ms]
                w-auto md:w-full text-left
                ${
                  active
                    ? "text-teal bg-teal/[0.07]"
                    : "text-muted hover:text-ink hover:bg-surface-2"
                }
              `}
              onClick={() => navigate(path)}
              aria-current={active ? "page" : undefined}
            >
              {/* Active indicator strip — desktop only */}
              {active && (
                <span
                  className="hidden md:block absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-[26px] rounded-r-sm bg-teal"
                  aria-hidden="true"
                />
              )}
              <Icon size={16} aria-hidden="true" className="flex-none shrink-0" />
              <span>{label}</span>
            </button>
          );
        })}
      </nav>

      {/* ── Footer — desktop ────────────────────────────────────── */}
      <div className="hidden md:block mt-auto border-t border-line">
        {/* Signed-in user */}
        <div className="px-6 pt-4 pb-[10px]">
          <span
            className="mono block text-[0.72rem] text-muted truncate"
            title={user?.email}
          >
            {user?.email}
          </span>
        </div>

        {/* Logout */}
        <button
          type="button"
          className="
            flex items-center gap-[9px] w-full
            px-5 min-h-[44px]
            text-[0.875rem] font-semibold text-muted
            hover:text-ink hover:bg-surface-2
            transition-colors duration-[130ms]
          "
          onClick={logout}
        >
          <LogOut size={16} aria-hidden="true" className="flex-none shrink-0" />
          <span>Log out</span>
        </button>

        {/* Revision stamp — quiet technical identity motif */}
        <div className="px-5 pb-5 pt-[6px]">
          <span
            className="mono text-[0.65rem] tracking-[0.1em] select-none"
            style={{ color: "oklch(55% 0.022 258 / 0.45)" }}
            aria-hidden="true"
          >
            REV&nbsp;1.0.0
          </span>
        </div>
      </div>

      {/* ── Mobile logout ───────────────────────────────────────── */}
      <div className="flex md:hidden items-center ml-auto px-3 shrink-0">
        <button
          type="button"
          className="btn-icon"
          onClick={logout}
          aria-label="Log out"
          title="Log out"
        >
          <LogOut size={16} aria-hidden="true" />
        </button>
      </div>
    </aside>
  );
}

/* ── App shell — authenticated layout ──────────────────────────── */
function AppShell() {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div
      className="flex flex-col min-h-screen md:grid"
      style={{ gridTemplateColumns: "240px minmax(0,1fr)" }}
    >
      <Sidebar />
      <main className="min-w-0 p-[clamp(18px,4vw,36px)]">
        <Routes>
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/annotate" element={<AnnotatePage />} />
          <Route path="*" element={<Navigate to="/tasks" replace />} />
        </Routes>
      </main>
    </div>
  );
}

/* ── Root app ───────────────────────────────────────────────────── */
export function App() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <main className="flex items-center justify-center min-h-screen">
        <Loader2 className="spin text-muted" aria-hidden="true" />
      </main>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/*" element={<AppShell />} />
    </Routes>
  );
}
