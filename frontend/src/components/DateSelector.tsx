import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { toLocalIsoDate, useSelectedDate } from "../context/DateContext";

function shiftDate(value: string, days: number): string {
  const next = new Date(`${value}T12:00:00`);
  next.setDate(next.getDate() + days);
  return toLocalIsoDate(next);
}

export function DateSelector() {
  const { selectedDate, setSelectedDate } = useSelectedDate();

  return (
    <div className="inline-flex items-center gap-2">
      <button
        className="btn-icon"
        type="button"
        onClick={() => setSelectedDate(shiftDate(selectedDate, -1))}
        title="Previous day"
      >
        <ChevronLeft size={18} aria-hidden="true" />
      </button>

      <label className="inline-flex items-center gap-2 bg-white border border-line rounded-lg text-muted min-h-[40px] px-[10px] cursor-pointer">
        <Calendar size={18} aria-hidden="true" />
        <input
          type="date"
          value={selectedDate}
          onChange={(event) => setSelectedDate(event.target.value)}
          className="border-0 min-h-[38px] p-0 min-w-0 outline-none shadow-none"
          style={{ boxShadow: "none" }}
        />
      </label>

      <button
        className="btn-icon"
        type="button"
        onClick={() => setSelectedDate(shiftDate(selectedDate, 1))}
        title="Next day"
      >
        <ChevronRight size={18} aria-hidden="true" />
      </button>
    </div>
  );
}
