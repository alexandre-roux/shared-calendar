import type {RefObject} from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import type {CalendarEvent, EditorPosition,} from "../types/calendar";
import {
    getCenteredEditorPosition,
    getEditorPosition,
    isDateBeforeToday,
    isEventStartInPast,
    toDateInputValue,
    toTimeInputValue,
} from "../lib/dateUtils";
import {toExternalUrl} from "../lib/urlUtils";

type CalendarViewProps = {
    calendarRef: RefObject<FullCalendar | null>;
    events: CalendarEvent[];
    isMobile: boolean;
    onDatesSet: (title: string) => void;
    onCreateEvent: (date: Date, endDate: Date | null, position: EditorPosition) => void;
    onEditEvent: (event: CalendarEvent, position: EditorPosition) => void;
    onMoveEvent: (
        id: string,
        start: Date | null,
        end: Date | null,
        allDay: boolean
    ) => void;
};

export function CalendarView({
                                 calendarRef,
                                 events,
                                 isMobile,
                                 onDatesSet,
                                 onCreateEvent,
                                 onEditEvent,
                                 onMoveEvent,
                             }: CalendarViewProps) {
    return (
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
                    onDatesSet(info.view.title);
                }}
                events={events.map((event) => ({
                    id: event.id,
                    title: event.title,
                    start: event.start_at,
                    end: event.end_at ?? undefined,
                    allDay: event.all_day,
                    extendedProps: {
                        location: event.location,
                        url: event.url,
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
                        {eventInfo.event.extendedProps.url && (
                            <a
                                className="event-url"
                                href={toExternalUrl(eventInfo.event.extendedProps.url)}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(event) => event.stopPropagation()}
                            >
                                {eventInfo.event.extendedProps.url}
                            </a>
                        )}
                    </div>
                )}
                dateClick={(info) => {
                    if (
                        isDateBeforeToday(info.date) ||
                        isEventStartInPast(
                            toDateInputValue(info.date),
                            info.allDay ? "" : toTimeInputValue(info.date),
                            info.allDay
                        )
                    ) {
                        return;
                    }

                    onCreateEvent(
                        info.date,
                        null,
                        isMobile
                            ? getCenteredEditorPosition()
                            : getEditorPosition(info.jsEvent.clientX, info.jsEvent.clientY)
                    );
                }}
                select={(info) => {
                    if (
                        isDateBeforeToday(info.start) ||
                        isEventStartInPast(
                            toDateInputValue(info.start),
                            info.allDay ? "" : toTimeInputValue(info.start),
                            info.allDay
                        )
                    ) {
                        return;
                    }

                    onCreateEvent(info.start, info.end, getCenteredEditorPosition());
                }}
                eventClick={(info) => {
                    const calendarEvent = events.find((event) => event.id === info.event.id);
                    if (!calendarEvent) return;

                    onEditEvent(
                        calendarEvent,
                        isMobile
                            ? getCenteredEditorPosition()
                            : getEditorPosition(info.jsEvent.clientX, info.jsEvent.clientY)
                    );
                }}
                eventDrop={(info) => {
                    onMoveEvent(
                        info.event.id,
                        info.event.start,
                        info.event.end,
                        info.event.allDay
                    );
                }}
                eventResize={(info) => {
                    onMoveEvent(
                        info.event.id,
                        info.event.start,
                        info.event.end,
                        info.event.allDay
                    );
                }}
            />
        </main>
    );
}
