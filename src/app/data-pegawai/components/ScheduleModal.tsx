'use client';

import React from 'react';
import { Clock, RefreshCw } from 'lucide-react';

interface ScheduleModalProps {
  show: boolean;
  selectedEmp: any;
  schedules: any[];
  setSchedules: (scheds: any[]) => void;
  savingSchedule: boolean;
  onClose: () => void;
  onSave: () => void;
}

export default function ScheduleModal({
  show,
  selectedEmp,
  schedules,
  setSchedules,
  savingSchedule,
  onClose,
  onSave,
}: ScheduleModalProps) {
  if (!show || !selectedEmp) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-lg w-full space-y-5 shadow-2xl animate-in fade-in zoom-in duration-150">
        <div className="flex items-center justify-between border-b pb-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Jadwal Jam Mengajar / Kerja</h2>
            <p className="text-xs text-slate-500">{selectedEmp.name} (PIN: {selectedEmp.pin})</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold">
            ✕
          </button>
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
          {schedules.map((s, idx) => (
            <div key={s.dayOfWeek} className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={s.isWorking}
                  onChange={(e) => {
                    const updated = [...schedules];
                    updated[idx].isWorking = e.target.checked;
                    setSchedules(updated);
                  }}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <span className={`text-sm font-semibold ${s.isWorking ? 'text-slate-800' : 'text-slate-400 line-through'}`}>
                  {s.dayName}
                </span>
              </div>

              {s.isWorking ? (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-white border border-slate-200 px-2 py-1 rounded-lg">
                    <Clock className="w-3 h-3 text-emerald-600" />
                    <span className="text-[10px] text-slate-400">Masuk:</span>
                    <input
                      type="text"
                      value={s.startTime}
                      onChange={(e) => {
                        const updated = [...schedules];
                        updated[idx].startTime = e.target.value;
                        setSchedules(updated);
                      }}
                      placeholder="07:15"
                      className="w-12 text-xs font-mono font-bold text-center border-b border-slate-300 focus:outline-none focus:border-indigo-600"
                    />
                  </div>

                  <div className="flex items-center gap-1 bg-white border border-slate-200 px-2 py-1 rounded-lg">
                    <Clock className="w-3 h-3 text-rose-600" />
                    <span className="text-[10px] text-slate-400">Pulang:</span>
                    <input
                      type="text"
                      value={s.endTime}
                      onChange={(e) => {
                        const updated = [...schedules];
                        updated[idx].endTime = e.target.value;
                        setSchedules(updated);
                      }}
                      placeholder="14:00"
                      className="w-12 text-xs font-mono font-bold text-center border-b border-slate-300 focus:outline-none focus:border-indigo-600"
                    />
                  </div>
                </div>
              ) : (
                <span className="text-xs text-rose-500 font-medium px-2 py-1 bg-rose-50 rounded-md">
                  Libur Mengajar
                </span>
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-medium hover:bg-slate-50 transition"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={savingSchedule}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-medium transition shadow-sm disabled:opacity-50"
          >
            {savingSchedule && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
            Simpan Jadwal
          </button>
        </div>
      </div>
    </div>
  );
}