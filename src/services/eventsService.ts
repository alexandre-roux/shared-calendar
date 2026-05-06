import {supabase} from "../lib/supabase";
import type {CalendarEvent, EventPayload} from "../types/calendar";

export async function fetchEvents(token: string) {
    const {data, error} = await supabase
        .from("events")
        .select("*")
        .eq("calendar_token", token)
        .order("start_at", {ascending: true});

    if (error) throw error;

    return (data ?? []) as CalendarEvent[];
}

export async function createEvent(payload: EventPayload) {
    const {error} = await supabase.from("events").insert(payload);

    if (error) throw error;
}

export async function updateEvent(id: string, payload: EventPayload) {
    const {error} = await supabase.from("events").update(payload).eq("id", id);

    if (error) throw error;
}

export async function deleteEventById(id: string) {
    const {error} = await supabase.from("events").delete().eq("id", id);

    if (error) throw error;
}

export async function updateEventDate(
    id: string,
    start: Date,
    end: Date | null,
    allDay: boolean
) {
    const {error} = await supabase
        .from("events")
        .update({
            start_at: start.toISOString(),
            end_at: end?.toISOString() ?? null,
            all_day: allDay,
        })
        .eq("id", id);

    if (error) throw error;
}