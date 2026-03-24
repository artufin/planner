import { create } from "zustand";
import { Event } from './types';

interface EventStore {
    events: Event[];
    addEvent: (event: Event) => void;
}

export const useEventStore = create<EventStore>((set) => ({
    events: [],
    addEvent: (event) => set((state) => ({ events: [...state.events, event] })),
}));