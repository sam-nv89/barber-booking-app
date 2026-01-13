import React, { useState, useEffect } from 'react';
import { create } from 'zustand';

export const useDebugStore = create((set) => ({
    logs: [],
    addLog: (type, message, data = null) => set((state) => ({
        logs: [{
            id: Date.now() + Math.random(),
            type,
            message,
            data: data ? JSON.stringify(data, null, 2) : null,
            time: new Date().toLocaleTimeString()
        }, ...state.logs].slice(0, 50)
    })),
    clearLogs: () => set({ logs: [] })
}));

export const DebugConsole = () => {
    const { logs, clearLogs } = useDebugStore();
    const [isOpen, setIsOpen] = useState(false);

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-20 left-4 z-[9999] bg-red-600 text-white font-bold text-xs px-4 py-2 rounded shadow-lg animate-pulse"
                style={{ border: '2px solid white' }}
            >
                DEBUG (CLICK ME)
            </button>
        );
    }

    return (
        <div className="fixed inset-x-0 bottom-0 h-1/2 bg-black/90 text-green-400 font-mono text-xs z-50 flex flex-col border-t border-green-900">
            <div className="flex justify-between items-center p-2 bg-black border-b border-green-900">
                <span className="font-bold">DEBUG CONSOLE</span>
                <div className="flex gap-2">
                    <button onClick={clearLogs} className="px-2 hover:bg-white/10 rounded">CLEAR</button>
                    <button onClick={() => setIsOpen(false)} className="px-2 hover:bg-white/10 rounded">CLOSE</button>
                </div>
            </div>
            <div className="flex-1 overflow-auto p-2 space-y-1">
                {logs.map(log => (
                    <div key={log.id} className="border-b border-white/10 pb-1">
                        <span className="text-gray-500">[{log.time}]</span>
                        <span className={log.type === 'error' ? 'text-red-500 font-bold' : log.type === 'warn' ? 'text-yellow-500' : 'text-blue-400'}>
                            [{log.type.toUpperCase()}]
                        </span>
                        <span className="ml-2 text-white">{log.message}</span>
                        {log.data && (
                            <pre className="mt-1 bg-white/5 p-1 rounded text-[10px] overflow-x-auto text-gray-300">
                                {log.data}
                            </pre>
                        )}
                    </div>
                ))}
                {logs.length === 0 && <div className="text-gray-600 italic">No logs yet...</div>}
            </div>
        </div>
    );
};
