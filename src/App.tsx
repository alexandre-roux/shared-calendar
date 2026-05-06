import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import {createClient} from "@supabase/supabase-js";
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
    all_day: boolean;
};

type EventForm = {
    title: string;
    location: string;
    startDate: string;
    startTime: string;
    endDate: string;
    endTime: string;
    allDay: boolean;
    notes: string;
};

type EditorPosition = {
    left: number;
    top: number;
};

const emptyForm: EventForm = {
    title: "",
    location: "",
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    allDay: false,
    notes: "",
};

function pad(value: number) {
    return String(value).padStart(2, "0");
}

function toDateInputValue(date: Date) {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function toTimeInputValue(date: Date) {
    return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function buildDateTime(date: string, time: string) {
    return time ? `${date}T${time}:00` : `${date}T00:00:00`;
}

function addDays(date: string, days: number) {
    const value = new Date(`${date}T00:00:00`);
    value.setDate(value.getDate() + days);
    return toDateInputValue(value);
}

function buildDefaultEndDateTime(startDate: string, startTime: string) {
    if (!startTime) return null;

    const value = new Date(buildDateTime(startDate, startTime));
    value.setHours(value.getHours() + 1);

    return `${toDateInputValue(value)}T${toTimeInputValue(value)}:00`;
}

function getInclusiveAllDayEndDate(endAt: string | null, startDate: string) {
    if (!endAt) return startDate;

    const endDate = new Date(endAt);
    endDate.setDate(endDate.getDate() - 1);

    return toDateInputValue(endDate);
}

function getEditorPosition(clientX: number, clientY: number): EditorPosition {
    const editorWidth = 448;
    const editorHeight = 560;
    const margin = 16;

    const left = Math.min(
        Math.max(clientX - 32, margin),
        window.innerWidth - editorWidth - margin
    );

    const top = Math.min(
        Math.max(clientY + 12, 72),
        window.innerHeight - editorHeight - margin
    );

    return {left, top};
}

function getCenteredEditorPosition(): EditorPosition {
    return {
        left: Math.max((window.innerWidth - 448) / 2, 16),
        top: 96,
    };
}

function useIsMobile() {
    const [isMobile, setIsMobile] = useState(window.innerWidth < 720);

    useEffect(() => {
        function handleResize() {
            setIsMobile(window.innerWidth < 720);
        }

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    return isMobile;
}

export default function App() {
    const calendarRef = useRef<FullCalendar | null>(null);
    const isMobile = useIsMobile();

    const token = useMemo(() => {
        const params = new URLSearchParams(window.location.search);
        return params.get("token") ?? "demo";
    }, []);

    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [form, setForm] = useState<EventForm>(emptyForm);
    const [editingEventId, setEditingEventId] = useState<string | null>(null);
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [editorPosition, setEditorPosition] = useState<EditorPosition>(
        getCenteredEditorPosition()
    );
    const [currentTitle, setCurrentTitle] = useState("");

    const loadEvents = useCallback(async () => {
        const { data, error } = await supabase
            .from("events")
            .select("*")
            .eq("calendar_token", token)
            .order("start_at", {ascending: true});

        if (error) {
            console.error("Failed to load events:", error);
            return;
        }

        setEvents(data ?? []);
    }, [token]);

    function getCalendarApi() {
        return calendarRef.current?.getApi();
    }

    function openCreateEditor(
        date: Date,
        endDate: Date | null,
        position: EditorPosition
    ) {
        const hasTime = date.getHours() !== 0 || date.getMinutes() !== 0;
        const startDate = toDateInputValue(date);
        const finalEndDate = endDate ? toDateInputValue(endDate) : startDate;

        setEditingEventId(null);
        setForm({
            ...emptyForm,
            startDate,
            endDate: finalEndDate,
            startTime: hasTime ? toTimeInputValue(date) : "",
            endTime: endDate && hasTime ? toTimeInputValue(endDate) : "",
            allDay: !hasTime,
        });
        setEditorPosition(position);
        setIsEditorOpen(true);
    }

    function openEditEditor(
        calendarEvent: CalendarEvent,
        position: EditorPosition
    ) {
        const startDate = new Date(calendarEvent.start_at);
        const endDate = calendarEvent.end_at ? new Date(calendarEvent.end_at) : null;
        const startDateValue = toDateInputValue(startDate);

        setEditingEventId(calendarEvent.id);
        setForm({
            title: calendarEvent.title,
            location: calendarEvent.location ?? "",
            startDate: startDateValue,
            startTime: calendarEvent.all_day ? "" : toTimeInputValue(startDate),
            endDate: calendarEvent.all_day
                ? getInclusiveAllDayEndDate(calendarEvent.end_at, startDateValue)
                : endDate
                    ? toDateInputValue(endDate)
                    : startDateValue,
            endTime: !calendarEvent.all_day && endDate ? toTimeInputValue(endDate) : "",
            allDay: calendarEvent.all_day,
            notes: calendarEvent.notes ?? "",
        });
        setEditorPosition(position);
        setIsEditorOpen(true);
    }

    function closeEditor() {
        setIsEditorOpen(false);
        setEditingEventId(null);
        setForm(emptyForm);
    }

    async function saveEvent() {
        if (!form.title.trim() || !form.startDate) return;

        const startAt = form.allDay
            ? `${form.startDate}T00:00:00`
            : buildDateTime(form.startDate, form.startTime);

        const endAt = form.allDay
            ? `${addDays(form.endDate || form.startDate, 1)}T00:00:00`
            : form.endTime
                ? buildDateTime(form.endDate || form.startDate, form.endTime)
                : buildDefaultEndDateTime(form.startDate, form.startTime);

        const eventData = {
            calendar_token: token,
            title: form.title.trim(),
            location: form.location.trim() || null,
            start_at: startAt,
            end_at: endAt,
            all_day: form.allDay,
            notes: form.notes.trim() || null,
        };

        const {error} = editingEventId
            ? await supabase.from("events").update(eventData).eq("id", editingEventId)
            : await supabase.from("events").insert(eventData);

        if (error) {
            console.error("Failed to save event:", error);
            return;
        }

        closeEditor();
        await loadEvents();
    }

    async function deleteEvent() {
        if (!editingEventId) return;

        const confirmed = window.confirm("Supprimer cet événement ?");
        if (!confirmed) return;

        const {error} = await supabase
            .from("events")
            .delete()
            .eq("id", editingEventId);

        if (error) {
            console.error("Failed to delete event:", error);
            return;
        }

        closeEditor();
        await loadEvents();
    }

    async function updateEventDate(
        eventId: string,
        start: Date | null,
        end: Date | null,
        allDay: boolean
    ) {
        if (!start) return;

        const {error} = await supabase
            .from("events")
            .update({
                start_at: start.toISOString(),
                end_at: end?.toISOString() ?? null,
                all_day: allDay,
            })
            .eq("id", eventId);

        if (error) {
            console.error("Failed to update event date:", error);
            await loadEvents();
            return;
        }

        await loadEvents();
    }

    useEffect(() => {
        // Loading events updates local state after the async Supabase request.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadEvents();
    }, [loadEvents]);

    return (
        <div className="google-calendar-app">
            <header className="top-bar">
                <div className="brand-area">
                    <div className="calendar-logo">31</div>
                    <span className="brand-title">Calendrier de il se passe quoi</span>
                </div>

                <div className="navigation-area">
                    <button className="today-button" onClick={() => getCalendarApi()?.today()}>
                        Aujourd'hui
                    </button>

                    <div className="nav-buttons">
                        <button aria-label="Période précédente" onClick={() => getCalendarApi()?.prev()}>
                            ‹
                        </button>
                        <button aria-label="Période suivante" onClick={() => getCalendarApi()?.next()}>
                            ›
                        </button>
                    </div>

                    <h1 className="current-title">{currentTitle}</h1>
                </div>
            </header>

            <div className="calendar-layout">
                <main className="calendar-main">
                    <FullCalendar
                        ref={calendarRef}
                        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                        initialView="dayGridMonth"
                        locale="fr"
                        height="100%"
                        firstDay={1}
                        nowIndicator
                        selectable
                        selectMirror
                        editable
                        eventResizableFromStart
                        dayMaxEvents
                        expandRows
                        allDaySlot={false}
                        slotMinTime="06:00:00"
                        slotMaxTime="24:00:00"
                        slotDuration="00:30:00"
                        slotLabelFormat={{
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: false,
                        }}
                        headerToolbar={false}
                        datesSet={(info) => {
                            setCurrentTitle(info.view.title);
                        }}
                        events={events.map((event) => ({
                            id: event.id,
                            title: event.title,
                            start: event.start_at,
                            end: event.end_at ?? undefined,
                            allDay: event.all_day,
                            extendedProps: {
                                location: event.location,
                                notes: event.notes,
                            },
                        }))}
                        eventContent={(eventInfo) => (
                            <div className="event-content">
                                {eventInfo.timeText && (
                                    <span className="event-time">{eventInfo.timeText}</span>
                                )}
                                <span className="event-title">{eventInfo.event.title}</span>
                                {eventInfo.event.extendedProps.location && (
                                    <span className="event-location">
                    {eventInfo.event.extendedProps.location}
                  </span>
                                )}
                            </div>
                        )}
                        dateClick={(info) => {
                            openCreateEditor(
                                info.date,
                                null,
                                isMobile
                                    ? getCenteredEditorPosition()
                                    : getEditorPosition(info.jsEvent.clientX, info.jsEvent.clientY)
                            );
                        }}
                        select={(info) => {
                            openCreateEditor(
                                info.start,
                                info.end,
                                isMobile
                                    ? getCenteredEditorPosition()
                                    : getCenteredEditorPosition()
                            );
                        }}
                        eventClick={(info) => {
                            const calendarEvent = events.find((event) => event.id === info.event.id);
                            if (!calendarEvent) return;

                            openEditEditor(
                                calendarEvent,
                                isMobile
                                    ? getCenteredEditorPosition()
                                    : getEditorPosition(info.jsEvent.clientX, info.jsEvent.clientY)
                            );
                        }}
                        eventDrop={(info) => {
                            updateEventDate(
                                info.event.id,
                                info.event.start,
                                info.event.end,
                                info.event.allDay
                            );
                        }}
                        eventResize={(info) => {
                            updateEventDate(
                                info.event.id,
                                info.event.start,
                                info.event.end,
                                info.event.allDay
                            );
                        }}
                    />
                </main>
            </div>

            {isEditorOpen && (
                <div className="editor-layer" onClick={closeEditor}>
                    <section
                        className="quick-editor"
                        style={
                            isMobile
                                ? undefined
                                : {
                                    left: `${editorPosition.left}px`,
                                    top: `${editorPosition.top}px`,
                                }
                        }
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="quick-editor-header">
                            <button
                                className="header-close-button"
                                aria-label="Fermer"
                                onClick={closeEditor}
                            >
                                ×
                            </button>

                            <div className="quick-editor-header-spacer"/>

                            <button className="header-save-button" onClick={saveEvent}>
                                Enregistrer
                            </button>
                        </div>

                        <div className="quick-editor-body">
                            <input
                                className="title-field"
                                autoFocus
                                placeholder="Ajouter un titre"
                                value={form.title}
                                onChange={(event) =>
                                    setForm({...form, title: event.target.value})
                                }
                            />

                            <div className="editor-row">
                                <span className="row-icon">🕒</span>

                                <div className="date-time-section">
                                    <label className="all-day-row">
                                        <span>Toute la journée</span>
                                        <input
                                            type="checkbox"
                                            checked={form.allDay}
                                            onChange={(event) =>
                                                setForm({
                                                    ...form,
                                                    allDay: event.target.checked,
                                                    startTime: event.target.checked ? "" : form.startTime,
                                                    endTime: event.target.checked ? "" : form.endTime,
                                                })
                                            }
                                        />
                                    </label>

                                    <div className="date-time-row">
                                        <input
                                            type="date"
                                            value={form.startDate}
                                            onChange={(event) =>
                                                setForm({
                                                    ...form,
                                                    startDate: event.target.value,
                                                    endDate: form.endDate || event.target.value,
                                                })
                                            }
                                        />

                                        {!form.allDay && (
                                            <input
                                                type="time"
                                                value={form.startTime}
                                                onChange={(event) =>
                                                    setForm({...form, startTime: event.target.value})
                                                }
                                            />
                                        )}
                                    </div>

                                    <div className="date-time-row">
                                        <input
                                            type="date"
                                            value={form.endDate}
                                            onChange={(event) =>
                                                setForm({...form, endDate: event.target.value})
                                            }
                                        />

                                        {!form.allDay && (
                                            <input
                                                type="time"
                                                value={form.endTime}
                                                onChange={(event) =>
                                                    setForm({...form, endTime: event.target.value})
                                                }
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="editor-row">
                                <span className="row-icon">📍</span>
                                <input
                                    placeholder="Lieu"
                                    value={form.location}
                                    onChange={(event) =>
                                        setForm({...form, location: event.target.value})
                                    }
                                />
                            </div>

                            <div className="editor-row">
                                <span className="row-icon">☰</span>
                                <textarea
                                    placeholder="Notes"
                                    value={form.notes}
                                    onChange={(event) =>
                                        setForm({...form, notes: event.target.value})
                                    }
                                />
                            </div>

                            {editingEventId && (
                                <button className="mobile-delete-button" onClick={deleteEvent}>
                                    Supprimer l'événement
                                </button>
                            )}
                        </div>

                        <footer className="quick-editor-actions">
                            {editingEventId && (
                                <button className="delete-button" onClick={deleteEvent}>
                                    Supprimer
                                </button>
                            )}

                            <button className="cancel-button" onClick={closeEditor}>
                                Annuler
                            </button>
                            <button className="save-button" onClick={saveEvent}>
                                Enregistrer
                            </button>
                        </footer>
                    </section>
                </div>
            )}
        </div>
    );
}