import { useState, useEffect } from 'react';
import { getAcademicCalendar, setAcademicDayOrder, clearAcademicDayOrder } from '../../services/api';

type DayOrderMap = { [dateIso: string]: number };

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function formatIso(d: Date) { return d.toISOString().slice(0, 10); }

export default function AcademicCalendar() {
  const [current, setCurrent] = useState(new Date());
  const [selected, setSelected] = useState<Date | null>(null);
  const [orders, setOrders] = useState<DayOrderMap>({});

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await getAcademicCalendar();
        if (mounted && res?.data) {
          const map: DayOrderMap = {};
          res.data.forEach((d: any) => { map[d.date] = d.dayOrder; });
          setOrders(map);
          return;
        }
      } catch (e) {
        try {
          const raw = localStorage.getItem('academicDayOrders');
          if (raw) setOrders(JSON.parse(raw));
        } catch {}
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    localStorage.setItem('academicDayOrders', JSON.stringify(orders));
  }, [orders]);

  const first = startOfMonth(current).getDay();
  const last = endOfMonth(current).getDate();

  const cells: Array<Date | null> = [];
  for (let i = 0; i < first; i++) cells.push(null);
  for (let d = 1; d <= last; d++) cells.push(new Date(current.getFullYear(), current.getMonth(), d));

  const prevMonth = () => setCurrent(new Date(current.getFullYear(), current.getMonth() - 1, 1));
  const nextMonth = () => setCurrent(new Date(current.getFullYear(), current.getMonth() + 1, 1));

  const setDayOrder = (date: Date, order: number) => {
    const iso = formatIso(date);
    setOrders((s) => ({ ...s, [iso]: order }));
    setSelected(date);
    try { setAcademicDayOrder({ date: iso, dayOrder: order }); } catch {}
  };

  const clearDayOrder = (date: Date) => {
    const iso = formatIso(date);
    setOrders((s) => { const copy = { ...s }; delete copy[iso]; return copy; });
    try { clearAcademicDayOrder(iso); } catch {}
  };

  const setTodayOrderOne = () => {
    const today = new Date();
    setDayOrder(today, 1);
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="font-semibold">Academic Calendar</div>
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="px-2 py-1 rounded-md bg-slate-100">◀</button>
          <div className="text-sm text-slate-600">{current.toLocaleString(undefined, { month: 'long', year: 'numeric' })}</div>
          <button onClick={nextMonth} className="px-2 py-1 rounded-md bg-slate-100">▶</button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 text-xs text-center mb-3 text-slate-500">
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d) => <div key={d}>{d}</div>)}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {cells.map((cell, idx) => {
          if (!cell) return <div key={idx} className="h-14 rounded-lg bg-transparent" />;
          const iso = formatIso(cell);
          const order = orders[iso];
          const isSelected = selected && formatIso(selected) === iso;
          return (
            <button key={iso} onClick={() => setSelected(cell)} className={`h-14 p-2 text-left rounded-lg transition ${isSelected ? 'ring-2 ring-indigo-300' : 'hover:bg-slate-50'}`}>
              <div className="flex items-start justify-between">
                <div className="text-sm font-medium text-slate-800">{cell.getDate()}</div>
                {order ? <div className="text-[11px] px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-semibold">Day {order}</div> : null}
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-3 border-t pt-3 text-sm">
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="text-xs text-slate-500">Selected</div>
            <div className="font-medium text-slate-800">{selected ? selected.toDateString() : '—'}</div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={setTodayOrderOne} className="px-3 py-1 rounded-lg bg-indigo-600 text-white text-sm">Start Today as Day 1</button>
          </div>
        </div>

        {selected && (
          <div className="flex items-center gap-2">
            {[1,2,3,4,5].map((n) => (
              <button key={n} onClick={() => setDayOrder(selected, n)} className="px-3 py-1 rounded-lg bg-slate-100 text-sm">Set Day {n}</button>
            ))}
            <button onClick={() => clearDayOrder(selected)} className="px-3 py-1 rounded-lg bg-red-50 text-red-700 text-sm">Clear</button>
          </div>
        )}
      </div>
    </div>
  );
}
