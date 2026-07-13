import { Loader2 } from "lucide-react";
import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/* ── Annotation-construction schematic — Signup illustration ────────
   Focused on the annotation workspace: a large canvas frame with a
   polygon being drawn, a toolbar strip at top, and a polygon list
   sidebar. Entirely decorative — aria-hidden.
   ────────────────────────────────────────────────────────────────── */
function AnnotationSchematic() {
  const palette = [
    "oklch(66% 0.155 215 / 0.85)", // teal
    "oklch(62% 0.20 20 / 0.8)",    // coral
    "oklch(54% 0.175 255 / 0.8)",  // blue
    "oklch(74% 0.17 75 / 0.8)",    // amber
    "oklch(55% 0.155 158 / 0.8)",  // green
  ];

  /* Draft polygon vertices (in % coordinates of the canvas area) */
  const vertices: [number, number][] = [
    [22, 72],
    [38, 28],
    [60, 20],
    [74, 55],
    [55, 80],
  ];

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
          <span
            className="absolute block bg-teal/30"
            style={{
              width: 1,
              height: 10,
              top: "50%",
              left: "50%",
              transform: "translate(-50%,-50%)",
            }}
          />
          <span
            className="absolute block bg-teal/30"
            style={{
              width: 10,
              height: 1,
              top: "50%",
              left: "50%",
              transform: "translate(-50%,-50%)",
            }}
          />
          <span
            className="absolute block rounded-full bg-teal/40"
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
          NEW WORKSPACE
        </span>
      </div>

      {/* ── Toolbar strip ────────────────────────────────────────── */}
      <div
        className="absolute rounded-t-[4px]"
        style={{
          top: "12%",
          left: "6%",
          right: "6%",
          height: 34,
          border: "1px solid oklch(84% 0.012 255 / 0.5)",
          borderBottom: "none",
          background: "oklch(98% 0.005 82)",
          display: "flex",
          alignItems: "center",
          padding: "0 10px",
          gap: 8,
        }}
      >
        {/* Label input silhouette */}
        <span
          className="block rounded-[3px]"
          style={{
            height: 14,
            width: 70,
            background: "oklch(91% 0.01 83)",
            border: "1px solid oklch(84% 0.012 255 / 0.5)",
          }}
        />
        {/* Color swatches */}
        <span
          className="flex items-center gap-[5px] ml-1"
        >
          {palette.map((c, i) => (
            <span
              key={i}
              className="block rounded-full"
              style={{
                width: i === 0 ? 11 : 9,
                height: i === 0 ? 11 : 9,
                background: c,
                boxShadow: i === 0 ? `0 0 0 2px white, 0 0 0 3.5px ${c}` : "none",
              }}
            />
          ))}
        </span>
        {/* Undo / Clear / Save silhouettes */}
        {["Undo", "Save"].map((lbl) => (
          <span
            key={lbl}
            className="block rounded-[3px] ml-auto"
            style={{
              height: 14,
              width: lbl === "Save" ? 44 : 32,
              background:
                lbl === "Save"
                  ? "oklch(66% 0.155 215 / 0.7)"
                  : "oklch(91% 0.01 83)",
              border:
                lbl === "Save"
                  ? "none"
                  : "1px solid oklch(84% 0.012 255 / 0.5)",
            }}
          />
        ))}
      </div>

      {/* ── Main layout: canvas + polygon sidebar ────────────────── */}
      <div
        className="absolute grid"
        style={{
          top: "calc(12% + 34px)",
          left: "6%",
          right: "6%",
          bottom: "12%",
          gridTemplateColumns: "minmax(0,1fr) 100px",
          gap: 0,
        }}
      >
        {/* Canvas area */}
        <div
          className="relative"
          style={{
            background: "#f8fafb",
            backgroundImage: [
              "linear-gradient(45deg,#e8eef2 25%,transparent 25%)",
              "linear-gradient(-45deg,#e8eef2 25%,transparent 25%)",
              "linear-gradient(45deg,transparent 75%,#e8eef2 75%)",
              "linear-gradient(-45deg,transparent 75%,#e8eef2 75%)",
            ].join(","),
            backgroundSize: "14px 14px",
            backgroundPosition: "0 0,0 7px,7px -7px,-7px 0",
            border: "1px solid oklch(84% 0.012 255 / 0.5)",
            borderRight: "none",
            borderBottom: "none",
          }}
        >
          {/* Thumbnail image silhouette */}
          <div
            className="absolute rounded-[2px]"
            style={{
              inset: "10%",
              background: "oklch(22% 0.04 258 / 0.08)",
              border: "1px solid oklch(66% 0.155 215 / 0.15)",
            }}
          >
            {/* Polygon overlay — SVG */}
            <svg
              className="absolute inset-0 w-full h-full overflow-visible"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              fill="none"
            >
              <polygon
                points={vertices.map(([x, y]) => `${x},${y}`).join(" ")}
                stroke="oklch(66% 0.155 215 / 0.85)"
                strokeWidth="1.4"
                strokeDasharray="5 3"
                fill="oklch(66% 0.155 215 / 0.1)"
              />
              {/* Vertices */}
              {vertices.map(([cx, cy], k) => (
                <circle
                  key={k}
                  cx={cx}
                  cy={cy}
                  r="2.8"
                  fill="white"
                  stroke="oklch(66% 0.155 215 / 0.85)"
                  strokeWidth="1"
                />
              ))}
              {/* Active draft line to cursor */}
              <line
                x1={vertices[vertices.length - 1][0]}
                y1={vertices[vertices.length - 1][1]}
                x2="78"
                y2="30"
                stroke="oklch(66% 0.155 215 / 0.5)"
                strokeWidth="1"
                strokeDasharray="4 3"
              />
              <circle cx="78" cy="30" r="2" fill="oklch(66% 0.155 215 / 0.5)" />
            </svg>
          </div>

          {/* "draft" label near first vertex */}
          <span
            className="mono absolute text-[0.45rem] tracking-wide"
            style={{
              top: "calc(10% + 10%)",
              left: "calc(10% + 14%)",
              color: "oklch(66% 0.155 215 / 0.65)",
            }}
          >
            draft
          </span>
        </div>

        {/* Polygon sidebar */}
        <div
          className="relative"
          style={{
            border: "1px solid oklch(84% 0.012 255 / 0.5)",
            borderLeft: "1px solid oklch(84% 0.012 255 / 0.5)",
            borderBottom: "none",
            background: "oklch(98% 0.005 82)",
            padding: "8px",
          }}
        >
          {/* "Polygons" header row */}
          <div className="flex items-center justify-between mb-[8px]">
            <span
              className="mono block rounded-[2px]"
              style={{
                height: 5,
                width: 44,
                background: "oklch(70% 0.02 258 / 0.4)",
              }}
            />
            <span
              className="mono block rounded-[2px]"
              style={{
                height: 14,
                width: 14,
                background: "oklch(91% 0.01 83)",
                border: "1px solid oklch(84% 0.012 255 / 0.5)",
              }}
            />
          </div>

          {/* Polygon items — existing ones */}
          {[
            "oklch(66% 0.155 215 / 0.85)",
            "oklch(62% 0.20 20 / 0.7)",
          ].map((dotColor, n) => (
            <div
              key={n}
              className="flex items-center gap-[4px] mb-[6px] rounded-[3px] p-[4px]"
              style={{
                background: "oklch(93.5% 0.009 83)",
                border: "1px solid oklch(84% 0.012 255 / 0.5)",
              }}
            >
              <span
                className="block rounded-full shrink-0"
                style={{ width: 6, height: 6, background: dotColor }}
              />
              <div className="grid flex-1 gap-[2px] min-w-0">
                <span
                  className="block rounded-[2px]"
                  style={{
                    height: 4,
                    background: "oklch(70% 0.02 258 / 0.35)",
                  }}
                />
                <span
                  className="block rounded-[2px]"
                  style={{
                    height: 3,
                    width: "60%",
                    background: "oklch(70% 0.02 258 / 0.2)",
                  }}
                />
              </div>
            </div>
          ))}

          {/* Current "draft" item being added */}
          <div
            className="flex items-center gap-[4px] rounded-[3px] p-[4px]"
            style={{
              border: "1px dashed oklch(66% 0.155 215 / 0.45)",
              background: "oklch(66% 0.155 215 / 0.04)",
            }}
          >
            <span
              className="block rounded-full shrink-0"
              style={{
                width: 6,
                height: 6,
                background: "oklch(66% 0.155 215 / 0.5)",
              }}
            />
            <span
              className="mono block rounded-[2px]"
              style={{
                height: 4,
                flex: 1,
                background: "oklch(66% 0.155 215 / 0.25)",
              }}
            />
          </div>
        </div>
      </div>

      {/* ── Title block — bottom right ─────────────────────────────── */}
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
          NEW WORKSPACE
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

/* ── SignupPage ─────────────────────────────────────────────────── */
export function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await signup(email, password);
      navigate("/tasks", { replace: true });
    } catch (nextError) {
      setError(
        nextError instanceof Error ? nextError.message : "Sign up failed.",
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
      <section
        className="hidden md:block rounded-xl overflow-hidden min-h-[580px]"
        aria-hidden="true"
        style={{ border: "1px solid oklch(84% 0.012 255 / 0.5)" }}
      >
        <AnnotationSchematic />
      </section>

      {/* ── Signup form — right column ────────────────────────────── */}
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
            Create account
          </h1>
          <p className="text-muted text-[0.87rem] mt-[6px] mb-0">
            Tasks and image annotations in one focused workspace.
          </p>
        </div>

        <form className="grid gap-4" onSubmit={submit} noValidate>
          <label htmlFor="signup-email">
            <span>Email</span>
            <input
              id="signup-email"
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </label>

          <label htmlFor="signup-password">
            <span>Password</span>
            <input
              id="signup-password"
              type="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </label>

          <label htmlFor="signup-confirm">
            <span>Confirm password</span>
            <input
              id="signup-confirm"
              type="password"
              name="confirm-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              autoComplete="new-password"
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
            aria-label={
              submitting ? "Creating account, please wait" : "Create account"
            }
          >
            {submitting ? (
              <Loader2 className="spin" size={17} aria-hidden="true" />
            ) : null}
            <span>{submitting ? "Creating account…" : "Create account"}</span>
          </button>

          <p className="text-center text-muted text-[0.875rem] mt-1 mb-0">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-teal font-bold no-underline hover:underline"
            >
              Sign in
            </Link>
          </p>
        </form>
      </section>
    </main>
  );
}
