import { createContext, useContext, useMemo, useState } from "react";

interface DateContextValue {
  selectedDate: string;
  setSelectedDate: (date: string) => void;
}

const DateContext = createContext<DateContextValue | null>(null);

export function toLocalIsoDate(date: Date): string {
  const copy = new Date(date);
  copy.setMinutes(copy.getMinutes() - copy.getTimezoneOffset());
  return copy.toISOString().slice(0, 10);
}

export function DateProvider({ children }: { children: React.ReactNode }) {
  const [selectedDate, setSelectedDate] = useState(() =>
    toLocalIsoDate(new Date()),
  );
  const value = useMemo(
    () => ({ selectedDate, setSelectedDate }),
    [selectedDate],
  );
  return <DateContext.Provider value={value}>{children}</DateContext.Provider>;
}

export function useSelectedDate() {
  const context = useContext(DateContext);
  if (!context) {
    throw new Error("useSelectedDate must be used inside DateProvider");
  }
  return context;
}
