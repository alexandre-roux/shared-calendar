import {supabase} from "../lib/supabase";
import type {CalendarEvent, EventPayload} from "../types/calendar";

function isMissingUrlColumnError(error: { code?: string; message?: string }) {
    return (
        error.code === "PGRST204" &&
        error.message?.includes("Could not find the 'url' column")
    );
}

function withoutUrl(payload: EventPayload) {
    const payloadWithoutUrl = {...payload};
    delete payloadWithoutUrl.url;
    return payloadWithoutUrl;
}

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

    if (error && payload.url && isMissingUrlColumnError(error)) {
        console.warn("The events.url column is missing. Retrying without the URL field.");
        const {error: retryError} = await supabase.from("events").insert(withoutUrl(payload));
        if (retryError) throw retryError;
        return;
    }

    if (error) throw error;
}

export async function updateEvent(id: string, payload: EventPayload) {
    const {error} = await supabase.from("events").update(payload).eq("id", id);

    if (error && payload.url && isMissingUrlColumnError(error)) {
        console.warn("The events.url column is missing. Retrying without the URL field.");
        const {error: retryError} = await supabase
            .from("events")
            .update(withoutUrl(payload))
            .eq("id", id);
        if (retryError) throw retryError;
        return;
    }

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
