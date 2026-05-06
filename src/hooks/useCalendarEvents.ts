import {useCallback, useEffect, useState} from "react";
import {createEvent, deleteEventById, fetchEvents, updateEvent, updateEventDate,} from "../services/eventsService";
import type {CalendarEvent, EventPayload} from "../types/calendar";

export function useCalendarEvents(token: string) {
    const [events, setEvents] = useState<CalendarEvent[]>([]);

    const loadEvents = useCallback(async () => {
        try {
            const loadedEvents = await fetchEvents(token);
            setEvents(loadedEvents);
        } catch (error) {
            console.error("Failed to load events:", error);
        }
    }, [token]);

    async function saveNewEvent(payload: EventPayload) {
        try {
            await createEvent(payload);
            await loadEvents();
        } catch (error) {
            console.error("Failed to create event:", error);
        }
    }

    async function saveExistingEvent(id: string, payload: EventPayload) {
        try {
            await updateEvent(id, payload);
            await loadEvents();
        } catch (error) {
            console.error("Failed to update event:", error);
        }
    }

    async function removeEvent(id: string) {
        try {
            await deleteEventById(id);
            await loadEvents();
        } catch (error) {
            console.error("Failed to delete event:", error);
        }
    }

    async function moveEvent(
        id: string,
        start: Date | null,
        end: Date | null,
        allDay: boolean
    ) {
        if (!start) return;

        try {
            await updateEventDate(id, start, end, allDay);
            await loadEvents();
        } catch (error) {
            console.error("Failed to update event date:", error);
            await loadEvents();
        }
    }

    useEffect(() => {
        // Loading events updates local state after the async Supabase request.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadEvents();
    }, [loadEvents]);

    return {
        events,
        loadEvents,
        saveNewEvent,
        saveExistingEvent,
        removeEvent,
        moveEvent,
    };
}