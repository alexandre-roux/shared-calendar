import {useMemo, useRef, useState} from "react";
import FullCalendar from "@fullcalendar/react";
import {CalendarHeader} from "./components/CalendarHeader";
import {CalendarView} from "./components/CalendarView";
import {EventEditor} from "./components/EventEditor";
import {
    addDays,
    buildDateTimeIso,
    buildDefaultEndDateTime,
    getCenteredEditorPosition,
    getInclusiveAllDayEndDate,
    isEventStartInPast,
    toDateInputValue,
    toTimeInputValue,
} from "./lib/dateUtils";
import {useCalendarEvents} from "./hooks/useCalendarEvents";
import {useIsMobile} from "./hooks/useIsMobile";
import {toExternalUrl} from "./lib/urlUtils";
import type {CalendarEvent, EditorPosition, EventForm, EventPayload,} from "./types/calendar";
import "./App.css";

const emptyForm: EventForm = {
    title: "",
    location: "",
    url: "",
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    allDay: false,
    notes: "",
};

export default function App() {
    const calendarRef = useRef<FullCalendar | null>(null);
    const isMobile = useIsMobile();

    const token = useMemo(() => {
        const params = new URLSearchParams(window.location.search);
        return params.get("token") ?? "demo";
    }, []);

    const {events, saveNewEvent, saveExistingEvent, removeEvent, moveEvent} =
        useCalendarEvents(token);

    const [form, setForm] = useState<EventForm>(emptyForm);
    const [editingEventId, setEditingEventId] = useState<string | null>(null);
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [editorPosition, setEditorPosition] = useState<EditorPosition>(
        getCenteredEditorPosition()
    );
    const [currentTitle, setCurrentTitle] = useState("");
    const today = toDateInputValue(new Date());

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
            allDay: false,
        });
        setEditorPosition(position);
        setIsEditorOpen(true);
    }

    function openEditEditor(calendarEvent: CalendarEvent, position: EditorPosition) {
        const startDate = new Date(calendarEvent.start_at);
        const endDate = calendarEvent.end_at ? new Date(calendarEvent.end_at) : null;
        const startDateValue = toDateInputValue(startDate);

        setEditingEventId(calendarEvent.id);
        setForm({
            title: calendarEvent.title,
            location: calendarEvent.location ?? "",
            url: calendarEvent.url ?? "",
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
        if (!form.allDay && !form.startTime) {
            window.alert("Veuillez saisir une heure de début ou cocher Toute la journée.");
            return;
        }

        if (!editingEventId && isEventStartInPast(form.startDate, form.startTime, form.allDay)) {
            window.alert("Impossible d'ajouter un événement dans le passé.");
            return;
        }

        const startAt = form.allDay
            ? `${form.startDate}T00:00:00`
            : buildDateTimeIso(form.startDate, form.startTime);

        const endAt = form.allDay
            ? `${addDays(form.endDate || form.startDate, 1)}T00:00:00`
            : form.endTime
                ? buildDateTimeIso(form.endDate || form.startDate, form.endTime)
                : buildDefaultEndDateTime(form.startDate, form.startTime);

        const url = toExternalUrl(form.url);
        const payload: EventPayload = {
            calendar_token: token,
            title: form.title.trim(),
            location: form.location.trim() || null,
            ...(url ? {url} : {}),
            start_at: startAt,
            end_at: endAt,
            all_day: form.allDay,
            notes: form.notes.trim() || null,
        };

        try {
            if (editingEventId) {
                await saveExistingEvent(editingEventId, payload);
            } else {
                await saveNewEvent(payload);
            }
        } catch (error) {
            window.alert(error instanceof Error ? error.message : "Impossible d'enregistrer l'événement.");
            return;
        }

        closeEditor();
    }

    async function deleteEvent() {
        if (!editingEventId) return;

        const confirmed = window.confirm("Supprimer cet événement ?");
        if (!confirmed) return;

        await removeEvent(editingEventId);
        closeEditor();
    }

    return (
        <div className="google-calendar-app">
            <CalendarHeader calendarRef={calendarRef} currentTitle={currentTitle}/>

            <div className="calendar-layout">
                <CalendarView
                    calendarRef={calendarRef}
                    events={events}
                    isMobile={isMobile}
                    onDatesSet={setCurrentTitle}
                    onCreateEvent={openCreateEditor}
                    onEditEvent={openEditEditor}
                    onMoveEvent={moveEvent}
                />
            </div>

            {isEditorOpen && (
                <EventEditor
                    form={form}
                    isMobile={isMobile}
                    isEditing={Boolean(editingEventId)}
                    editorPosition={editorPosition}
                    minStartDate={editingEventId ? undefined : today}
                    onChangeForm={setForm}
                    onClose={closeEditor}
                    onSave={saveEvent}
                    onDelete={deleteEvent}
                />
            )}
        </div>
    );
}
