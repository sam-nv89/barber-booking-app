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
    return null;
};
