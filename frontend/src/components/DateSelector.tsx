import { ChevronLeft, ChevronRight } from "lucide-react";
import { toLocalIsoDate, useSelectedDate } from "../context/DateContext";

function shiftDate(value: string, days: number): string {
  const next = new Date(`${value}T12:00:00`);
  next.setDate(next.getDate() + days);
  return toLocalIsoDate(next);
}

export function DateSelector({ disabled = false }: { disabled?: boolean }) {
  const { selectedDate, setSelectedDate } = useSelectedDate();

  return (
    <div className="inline-flex items-center gap-1">
      {/* ── Previous day ────────────────────────────────────────── */}
      <button
        className="btn-icon"
        type="button"
        onClick={() => setSelectedDate(shiftDate(selectedDate, -1))}
        aria-label="Previous day"
        title="Previous day"
        disabled={disabled}
      >
        <ChevronLeft size={16} aria-hidden="true" />
      </button>

      {/* ── Date control ─────────────────────────────────────────── */}
      {/* The native <input type="date"> is kept visible and interactive  */}
      {/* so keyboard, touch, and screen-reader users retain full access. */}
      {/* Monospace font gives it the workspace-control character.        */}
      <label
        className="inline-flex items-center bg-surface border border-line rounded-[6px] px-3 cursor-pointer"
        style={{ minHeight: "40px", gap: "8px" }}
        aria-label={`Selected date, ${selectedDate}`}
      >
        <input
          type="date"
          value={selectedDate}
          onChange={(event) => setSelectedDate(event.target.value)}
          disabled={disabled}
          aria-label="Select date"
          className="mono border-0 min-h-0 p-0 text-[0.82rem] text-ink bg-transparent"
          style={{ boxShadow: "none", minWidth: "112px" }}
        />
      </label>

      {/* ── Next day ────────────────────────────────────────────── */}
      <button
        className="btn-icon"
        type="button"
        onClick={() => setSelectedDate(shiftDate(selectedDate, 1))}
        aria-label="Next day"
        title="Next day"
        disabled={disabled}
      >
        <ChevronRight size={16} aria-hidden="true" />
      </button>
    </div>
  );
}
