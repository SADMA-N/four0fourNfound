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
import { TasksPage } from "./pages/TasksPage";

function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div
      className="grid min-h-screen"
      style={{ gridTemplateColumns: "280px minmax(0,1fr)" }}
    >
      <aside
        className="bg-white border-r border-line grid sticky top-0 min-h-screen p-[22px]"
        style={{ gridTemplateRows: "auto 1fr auto" }}
        aria-label="Main navigation"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center justify-center bg-ink text-white font-extrabold rounded-lg h-[54px] w-16 shrink-0 text-sm">
            404
          </div>
          <div className="min-w-0">
            <strong className="block overflow-hidden text-ellipsis whitespace-nowrap">
              Project Not Found
            </strong>
            <span className="block text-muted text-[0.82rem] mt-1 overflow-hidden text-ellipsis whitespace-nowrap">
              {user.email}
            </span>
          </div>
        </div>

        <nav className="grid gap-[10px] mt-9 content-start">
          <button
            className={`flex items-center gap-2 w-full px-3 rounded-lg min-h-[40px] font-extrabold transition-colors ${
              pathname === "/tasks"
                ? "bg-surface-2 text-ink"
                : "bg-transparent text-muted hover:bg-surface-2 hover:text-ink"
            }`}
            onClick={() => navigate("/tasks")}
          >
            <Calendar size={18} aria-hidden="true" />
            <span>Tasks</span>
          </button>
          <button
            className={`flex items-center gap-2 w-full px-3 rounded-lg min-h-[40px] font-extrabold transition-colors ${
              pathname === "/annotate"
                ? "bg-surface-2 text-ink"
                : "bg-transparent text-muted hover:bg-surface-2 hover:text-ink"
            }`}
            onClick={() => navigate("/annotate")}
          >
            <ImageIcon size={18} aria-hidden="true" />
            <span>Annotate</span>
          </button>
        </nav>

        <button
          className="flex items-center gap-2 w-full px-3 rounded-lg min-h-[40px] font-extrabold bg-transparent text-muted hover:bg-surface-2 hover:text-ink transition-colors"
          onClick={logout}
          title="Log out"
        >
          <LogOut size={18} aria-hidden="true" />
          <span>Logout</span>
        </button>
      </aside>

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

export function App() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <main className="flex items-center justify-center min-h-screen">
        <Loader2 className="spin" aria-hidden="true" />
      </main>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/*" element={<AppShell />} />
    </Routes>
  );
}
