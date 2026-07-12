import { useState } from "react";
import type { FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

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
      className="grid min-h-screen p-7 gap-7"
      style={{
        gridTemplateColumns: "minmax(320px,1.05fr) minmax(320px,0.95fr)",
      }}
    >
      {/* App Preview Panel */}
      <section
        className="bg-white border border-line rounded-lg shadow-app grid overflow-hidden p-[22px] min-h-[620px]"
        style={{ gridTemplateRows: "auto 1fr auto" }}
        aria-hidden="true"
      >
        <div className="flex items-center gap-[7px] border-b border-line -mx-[22px] -mt-[22px] mb-[22px] px-[22px] py-[18px]">
          <span className="block w-[10px] h-[10px] bg-line rounded-full" />
          <span className="block w-[10px] h-[10px] bg-line rounded-full" />
          <span className="block w-[10px] h-[10px] bg-line rounded-full" />
        </div>

        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: "repeat(3, minmax(0,1fr))" }}
        >
          {[
            { border: "#0f8b8d", cards: 2 },
            { border: "#ef476f", cards: 3 },
            { border: "#f59f00", cards: 2 },
          ].map((col, i) => (
            <div
              key={i}
              className="bg-surface-2 border border-line rounded-lg min-h-[240px] p-[14px]"
            >
              <b
                className="block rounded-[6px] bg-ink mb-4"
                style={{ height: 11, width: "62%" }}
              />
              {Array.from({ length: col.cards }).map((_, j) => (
                <i
                  key={j}
                  className="block not-italic rounded-[6px] bg-white mb-3"
                  style={{
                    borderLeft: `4px solid ${col.border}`,
                    height: 58,
                    boxShadow: "0 10px 25px rgba(23,32,42,0.08)",
                  }}
                />
              ))}
            </div>
          ))}
        </div>

        <div
          className="relative mt-[22px] rounded-lg bg-surface-2 border border-line"
          style={{ height: 210 }}
        >
          <span
            className="absolute border-[3px] border-blue block"
            style={{
              height: 86,
              left: "12%",
              top: "20%",
              transform: "rotate(-9deg)",
              width: "36%",
            }}
          />
          <span
            className="absolute border-[3px] border-coral block"
            style={{
              height: 96,
              right: "18%",
              top: "28%",
              transform: "rotate(8deg)",
              width: "26%",
            }}
          />
          <span
            className="absolute border-[3px] border-green block"
            style={{
              height: 48,
              left: "34%",
              bottom: "16%",
              transform: "rotate(18deg)",
              width: "22%",
            }}
          />
        </div>
      </section>

      {/* Login Panel */}
      <section
        className="bg-white border border-line rounded-lg shadow-app grid p-[clamp(26px,5vw,58px)]"
        style={{ alignContent: "center" }}
      >
        <div className="flex items-center gap-[18px] mb-[34px]">
          <span className="flex items-center justify-center bg-ink text-white font-extrabold rounded-lg h-[54px] w-16 shrink-0 text-sm">
            404
          </span>
          <div>
            <h1 className="text-[clamp(2rem,4vw,4rem)] leading-none tracking-tight m-0">
              Project Not Found
            </h1>
            <p className="text-muted mt-2 mb-0">
              Tasks and image annotations in one focused workspace.
            </p>
          </div>
        </div>

        <form className="grid gap-4" onSubmit={submit}>
          <label>
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label>
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
          {error ? <div className="form-error">{error}</div> : null}
          <button
            className="btn-primary w-full mt-2"
            type="submit"
            disabled={submitting}
          >
            {submitting ? (
              <Loader2 className="spin" size={17} aria-hidden="true" />
            ) : null}
            <span>{submitting ? "Signing in" : "Sign in"}</span>
          </button>
        </form>
      </section>
    </main>
  );
}
