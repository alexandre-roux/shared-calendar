import { useEffect, useMemo, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { DateClickArg } from "@fullcalendar/interaction";
import { createClient } from "@supabase/supabase-js";
import "./App.css";

const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
);

type CalendarEvent = {
    id: string;
    title: string;
    location: string | null;
    start_at: string;
    end_at: string | null;
    notes: string | null;
};

export default function App() {
    const token = useMemo(() => {
        const params = new URLSearchParams(window.location.search);
        return params.get("token") ?? "demo";
    }, []);

    const [events, setEvents] = useState<CalendarEvent[]>([]);

    async function loadEvents() {
        const { data, error } = await supabase
            .from("events")
            .select("*")
            .eq("calendar_token", token);

        if (!error && data) {
            setEvents(data);
        }
    }

    async function addEvent(info: DateClickArg) {
        const title = window.prompt("Nom de l'événement ?");
        if (!title) return;

        await supabase.from("events").insert({
            calendar_token: token,
            title,
            start_at: info.dateStr,
        });

        await loadEvents();
    }

    async function deleteEvent(id: string) {
        const confirmed = window.confirm("Supprimer cet événement ?");
        if (!confirmed) return;

        await supabase.from("events").delete().eq("id", id);
        await loadEvents();
    }

    useEffect(() => {
        loadEvents();
    }, []);

    return (
        <main>
            <h1>Calendrier de Il se passe quoi</h1>
            <p>Lien secret : <code>?token={token}</code></p>

            <FullCalendar
                plugins={[dayGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                firstDay={1}
                editable
                events={events.map((event) => ({
                    id: event.id,
                    title: event.title,
                    start: event.start_at,
                    end: event.end_at ?? undefined,
                }))}
                dateClick={addEvent}
                eventClick={(info) => deleteEvent(info.event.id)}
            />
        </main>
    );
}