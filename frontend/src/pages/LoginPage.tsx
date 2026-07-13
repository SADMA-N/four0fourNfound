import { Loader2 } from "lucide-react";
import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/* ── Workspace-overview schematic — Login illustration ─────────────
   Two labeled zones (Task Board + Annotate) connected by a planning
   line, with a title block and corner registration marks.
   Fully decorative — aria-hidden. No images or external assets.
   ────────────────────────────────────────────────────────────────── */
function WorkspaceSchematic() {
  /* Warm-paper base with very subtle grid */
  return (
    <div
      className="relative w-full h-full overflow-hidden rounded-[inherit]"
      style={{
        background: "oklch(95% 0.01 82)",
        backgroundImage: [
          "linear-gradient(oklch(70% 0.02 255 / 0.07) 1px, transparent 1px)",
          "linear-gradient(90deg, oklch(70% 0.02 255 / 0.07) 1px, transparent 1px)",
        ].join(","),
        backgroundSize: "28px 28px",
      }}
    >
      {/* ── Corner registration marks ───────────────────────────── */}
      {[
        { top: 18, left: 18 },
        { top: 18, right: 18 },
        { bottom: 18, left: 18 },
        { bottom: 18, right: 18 },
      ].map((pos, i) => (
        <span
          key={i}
          className="absolute block"
          style={{ ...pos, width: 16, height: 16 }}
        >
          {/* Vertical tick */}
          <span
            className="absolute block bg-blue/40"
            style={{
              width: 1,
              height: 10,
              top: "50%",
              left: "50%",
              transform: "translate(-50%,-50%)",
            }}
          />
          {/* Horizontal tick */}
          <span
            className="absolute block bg-blue/40"
            style={{
              width: 10,
              height: 1,
              top: "50%",
              left: "50%",
              transform: "translate(-50%,-50%)",
            }}
          />
          {/* Centre dot */}
          <span
            className="absolute block rounded-full bg-blue/50"
            style={{
              width: 3,
              height: 3,
              top: "50%",
              left: "50%",
              transform: "translate(-50%,-50%)",
            }}
          />
        </span>
      ))}

      {/* ── Drawing title — top-left ──────────────────────────────── */}
      <div className="absolute top-[28px] left-[38px]">
        <span
          className="mono block text-[0.6rem] tracking-[0.14em] leading-none"
          style={{ color: "oklch(50% 0.04 255 / 0.7)" }}
        >
          WORKSPACE OVERVIEW
        </span>
      </div>

      {/* ── Zone A: Task Board ───────────────────────────────────── */}
      <div
        className="absolute rounded-[5px]"
        style={{
          top: "13%",
          left: "6%",
          width: "53%",
          height: "54%",
          border: "1.5px solid oklch(54% 0.175 255 / 0.35)",
          background: "oklch(98% 0.005 82)",
        }}
      >
        {/* Zone label */}
        <span
          className="mono absolute text-[0.55rem] tracking-[0.12em] font-bold"
          style={{
            top: 8,
            left: 10,
            color: "oklch(54% 0.175 255 / 0.7)",
          }}
        >
          TASK BOARD
        </span>

        {/* Three Kanban columns */}
        <div
          className="absolute grid gap-[6px]"
          style={{
            top: 28,
            left: 10,
            right: 10,
            bottom: 10,
            gridTemplateColumns: "repeat(3, minmax(0,1fr))",
          }}
        >
          {[
            { label: "To Do", cards: 2, accent: "oklch(66% 0.155 215 / 0.8)" },
            { label: "In Progress", cards: 1, accent: "oklch(74% 0.17 75 / 0.8)" },
            { label: "Done", cards: 2, accent: "oklch(55% 0.155 158 / 0.8)" },
          ].map((col) => (
            <div
              key={col.label}
              className="rounded-[3px] p-[6px]"
              style={{
                background: "oklch(93% 0.008 82)",
                border: "1px solid oklch(84% 0.012 255 / 0.5)",
              }}
            >
              {/* Column header */}
              <span
                className="block rounded-[2px] mb-[6px]"
                style={{
                  height: 5,
                  width: "55%",
                  background: col.accent,
                }}
              />
              {/* Cards */}
              {Array.from({ length: col.cards }).map((_, j) => (
                <span
                  key={j}
                  className="block rounded-[2px] mb-[5px]"
                  style={{
                    height: 14,
                    background: "oklch(99% 0.004 82)",
                    border: "1px solid oklch(86% 0.01 255 / 0.45)",
                    borderLeft: `3px solid ${col.accent}`,
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ── Zone B: Annotation Workspace ─────────────────────────── */}
      <div
        className="absolute rounded-[5px]"
        style={{
          top: "13%",
          right: "6%",
          width: "33%",
          height: "54%",
          border: "1.5px solid oklch(66% 0.155 215 / 0.35)",
          background: "oklch(98% 0.005 82)",
        }}
      >
        {/* Zone label */}
        <span
          className="mono absolute text-[0.55rem] tracking-[0.12em] font-bold"
          style={{
            top: 8,
            left: 10,
            color: "oklch(66% 0.155 215 / 0.7)",
          }}
        >
          ANNOTATE
        </span>

        {/* Annotation canvas area */}
        <div
          className="absolute rounded-[3px]"
          style={{
            top: 26,
            left: 8,
            right: 8,
            height: "45%",
            background: "oklch(22% 0.04 258 / 0.07)",
            border: "1px dashed oklch(66% 0.155 215 / 0.4)",
          }}
        >
          {/* Polygon outline — dashed triangle */}
          <svg
            className="absolute inset-0 w-full h-full overflow-visible"
            viewBox="0 0 80 60"
            preserveAspectRatio="none"
            fill="none"
          >
            <polygon
              points="15,45 40,10 65,45"
              stroke="oklch(66% 0.155 215 / 0.7)"
              strokeWidth="1.2"
              strokeDasharray="4 3"
              fill="oklch(66% 0.155 215 / 0.08)"
            />
            {/* Vertex dots */}
            {[
              [15, 45],
              [40, 10],
              [65, 45],
            ].map(([cx, cy], k) => (
              <circle
                key={k}
                cx={cx}
                cy={cy}
                r="2.5"
                fill="white"
                stroke="oklch(66% 0.155 215 / 0.8)"
                strokeWidth="1"
              />
            ))}
          </svg>
        </div>

        {/* Polygon list items */}
        <div
          className="absolute"
          style={{ top: "54%", left: 8, right: 8, bottom: 8 }}
        >
          {[1, 2].map((n) => (
            <span
              key={n}
              className="flex items-center gap-[4px] mb-[5px]"
            >
              <span
                className="block rounded-full shrink-0"
                style={{
                  width: 6,
                  height: 6,
                  background:
                    n === 1
                      ? "oklch(66% 0.155 215 / 0.8)"
                      : "oklch(62% 0.20 20 / 0.6)",
                }}
              />
              <span
                className="block rounded-[2px]"
                style={{
                  height: 5,
                  flex: 1,
                  background: "oklch(70% 0.02 258 / 0.3)",
                }}
              />
            </span>
          ))}
        </div>
      </div>

      {/* ── Connector line between zones ─────────────────────────── */}
      <div
        className="absolute"
        style={{
          top: "38%",
          left: "calc(6% + 53%)",
          width: "calc(33% - 0%)",
          height: 0,
          borderTop: "1px dashed oklch(54% 0.175 255 / 0.3)",
        }}
      />
      {/* Arrow tip */}
      <div
        className="absolute"
        style={{
          top: "calc(38% - 3px)",
          right: "calc(6% + 33% - 2px)",
          width: 7,
          height: 7,
          borderTop: "1.5px solid oklch(54% 0.175 255 / 0.4)",
          borderRight: "1.5px solid oklch(54% 0.175 255 / 0.4)",
          transform: "rotate(45deg)",
        }}
      />

      {/* ── Date-filed line ──────────────────────────────────────── */}
      <div
        className="absolute flex items-center gap-3"
        style={{ bottom: 28, left: 38, right: 38 }}
      >
        <span
          className="block flex-1"
          style={{
            height: 1,
            background: "oklch(70% 0.015 255 / 0.28)",
          }}
        />
        <span
          className="mono text-[0.55rem] tracking-[0.1em] shrink-0"
          style={{ color: "oklch(50% 0.04 255 / 0.45)" }}
        >
          PROJ NO: 404
        </span>
        <span
          className="block flex-1"
          style={{
            height: 1,
            background: "oklch(70% 0.015 255 / 0.28)",
          }}
        />
      </div>

      {/* ── Title block — bottom right ────────────────────────────── */}
      <div
        className="absolute"
        style={{
          bottom: 16,
          right: 20,
          border: "1px solid oklch(70% 0.015 255 / 0.3)",
          padding: "5px 10px",
          minWidth: 90,
        }}
      >
        <span
          className="mono block text-[0.5rem] tracking-[0.12em]"
          style={{ color: "oklch(50% 0.04 255 / 0.55)" }}
        >
          WORKSPACE OVERVIEW
        </span>
        <span
          className="mono block text-[0.5rem] tracking-[0.1em]"
          style={{ color: "oklch(50% 0.04 255 / 0.4)" }}
        >
          REV A
        </span>
      </div>
    </div>
  );
}

/* ── LoginPage ──────────────────────────────────────────────────── */
export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("demo@pronfou.test");
  const [password, setPassword] = useState("demo12345");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await login(email, password);
      navigate("/tasks", { replace: true });
    } catch (nextError) {
      setError(
        nextError instanceof Error ? nextError.message : "Login failed.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main
      className="min-h-screen p-5 md:p-7 flex flex-col-reverse md:grid gap-5 md:gap-7"
      style={{ gridTemplateColumns: "minmax(320px,1.1fr) minmax(300px,0.9fr)" }}
    >
      {/* ── Schematic illustration — left column ─────────────────── */}
      {/* Hidden on screens narrower than md to keep form accessible */}
      <section
        className="hidden md:block rounded-xl overflow-hidden min-h-[580px]"
        aria-hidden="true"
        style={{ border: "1px solid oklch(84% 0.012 255 / 0.5)" }}
      >
        <WorkspaceSchematic />
      </section>

      {/* ── Login form — right column ─────────────────────────────── */}
      <section
        className="bg-surface border border-line rounded-xl p-[clamp(28px,6vw,56px)] grid"
        style={{ alignContent: "center" }}
      >
        {/* Logotype block */}
        <div className="mb-[32px]">
          <span
            className="mono block text-[0.67rem] leading-none tracking-[0.14em] text-muted mb-[8px] select-none"
            aria-hidden="true"
          >
            WORKSPACE&nbsp;404
          </span>
          <h1 className="text-[1.7rem] font-semibold text-ink m-0 leading-tight tracking-tight">
            Sign in
          </h1>
          <p className="text-muted text-[0.87rem] mt-[6px] mb-0">
            Tasks and image annotations in one focused workspace.
          </p>
        </div>

        <form className="grid gap-4" onSubmit={submit} noValidate>
          <label htmlFor="login-email">
            <span>Email</span>
            <input
              id="login-email"
              type="email"
              name="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="email"
            />
          </label>

          <label htmlFor="login-password">
            <span>Password</span>
            <input
              id="login-password"
              type="password"
              name="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              autoComplete="current-password"
            />
          </label>

          {error ? (
            <div className="form-error" role="alert" aria-live="assertive">
              {error}
            </div>
          ) : null}

          <button
            className="btn-primary w-full mt-2"
            type="submit"
            disabled={submitting}
            aria-label={submitting ? "Signing in, please wait" : "Sign in"}
          >
            {submitting ? (
              <Loader2 className="spin" size={17} aria-hidden="true" />
            ) : null}
            <span>{submitting ? "Signing in…" : "Sign in"}</span>
          </button>

          <p className="text-center text-muted text-[0.875rem] mt-1 mb-0">
            Don&apos;t have an account?{" "}
            <Link
              to="/signup"
              className="text-teal font-bold no-underline hover:underline"
            >
              Sign up
            </Link>
          </p>
        </form>
      </section>
    </main>
  );
}
