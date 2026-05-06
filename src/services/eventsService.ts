import {supabase} from "../lib/supabase";
import type {CalendarEvent, EventPayload} from "../types/calendar";

function isMissingUrlColumnError(error: { code?: string; message?: string }) {
    return (
        error.code === "PGRST204" &&
        error.message?.includes("Could not find the 'url' column")
    );
}

function getServiceError(error: { code?: string; message?: string }) {
    if (isMissingUrlColumnError(error)) {
        return new Error(
            "La colonne url est absente de la table events. Exécute la migration Supabase avant d'enregistrer une URL."
        );
    }

    return error;
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

    if (error) throw getServiceError(error);
}

export async function updateEvent(id: string, payload: EventPayload) {
    const {error} = await supabase.from("events").update(payload).eq("id", id);

    if (error) throw getServiceError(error);
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
