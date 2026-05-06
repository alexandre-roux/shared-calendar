import type {CalendarEvent, EditorPosition} from "../types/calendar";
import {getInclusiveAllDayEndDate, toDateInputValue, toTimeInputValue,} from "../lib/dateUtils";
import {toExternalUrl} from "../lib/urlUtils";

type EventDetailsProps = {
    event: CalendarEvent;
    isMobile: boolean;
    editorPosition: EditorPosition;
    onClose: () => void;
    onEdit: () => void;
    onDelete: () => void;
};

function getReadonlyForm(event: CalendarEvent) {
    const start = new Date(event.start_at);
    const end = event.end_at ? new Date(event.end_at) : null;
    const startDate = toDateInputValue(start);

    return {
        title: event.title,
        location: event.location ?? "",
        url: event.url ?? "",
        notes: event.notes ?? "",
        startDate,
        startTime: event.all_day ? "" : toTimeInputValue(start),
        endDate: event.all_day
            ? getInclusiveAllDayEndDate(event.end_at, startDate)
            : end
                ? toDateInputValue(end)
                : startDate,
        endTime: !event.all_day && end ? toTimeInputValue(end) : "",
        allDay: event.all_day,
    };
}

export function EventDetails({
                                 event,
                                 isMobile,
                                 editorPosition,
                                 onClose,
                                 onEdit,
                                 onDelete,
                             }: EventDetailsProps) {
    const form = getReadonlyForm(event);
    const url = form.url ? toExternalUrl(form.url) : "";

    return (
        <div className="editor-layer" onClick={onClose}>
            <section
                className="quick-editor event-details"
                style={
                    isMobile
                        ? undefined
                        : {
                            left: `${editorPosition.left}px`,
                            top: `${editorPosition.top}px`,
                        }
                }
                onClick={(clickEvent) => clickEvent.stopPropagation()}
            >
                <div className="quick-editor-header">
                    <button className="header-close-button" aria-label="Fermer" onClick={onClose}>
                        ×
                    </button>
                    <div className="quick-editor-header-spacer"/>
                </div>

                <div className="quick-editor-body event-details-body">
                    <input className="title-field" readOnly tabIndex={-1} value={form.title}/>

                    <div className="editor-row">
                        <div className="date-row-icons" aria-hidden="true">
                            {form.allDay && <span className="row-icon-spacer"/>}
                            <span className="row-icon">📅</span>
                            {event.end_at && <span className="row-icon">📅</span>}
                        </div>

                        <div className="date-time-section">
                            {form.allDay && (
                                <label className="all-day-row">
                                    <span>Toute la journée</span>
                                    <input type="checkbox" checked readOnly tabIndex={-1}/>
                                </label>
                            )}

                            <div className="date-time-row">
                                <input type="date" readOnly tabIndex={-1} value={form.startDate}/>

                                {!form.allDay && (
                                    <>
                                        <span className="time-field-icon" aria-hidden="true">🕒</span>
                                        <input type="time" readOnly tabIndex={-1} value={form.startTime}/>
                                    </>
                                )}
                            </div>

                            {event.end_at && (
                                <div className="date-time-row">
                                    <input type="date" readOnly tabIndex={-1} value={form.endDate}/>

                                    {!form.allDay && (
                                        <>
                                            <span className="time-field-icon" aria-hidden="true">🕒</span>
                                            <input type="time" readOnly tabIndex={-1} value={form.endTime}/>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {form.location && (
                        <div className="editor-row">
                            <span className="row-icon">📍</span>
                            <input readOnly tabIndex={-1} value={form.location}/>
                        </div>
                    )}

                    {url && (
                        <div className="editor-row">
                            <span className="row-icon">🔗</span>
                            <a className="readonly-link-field" href={url} target="_blank" rel="noreferrer">
                                {form.url}
                            </a>
                        </div>
                    )}

                    {form.notes && (
                        <div className="editor-row">
                            <span className="row-icon">☰</span>
                            <textarea readOnly tabIndex={-1} value={form.notes}/>
                        </div>
                    )}
                </div>

                <footer className="event-details-actions">
                    <button className="edit-button" onClick={onEdit}>
                        Éditer
                    </button>
                    <button className="delete-button" onClick={onDelete}>
                        Supprimer
                    </button>
                </footer>
            </section>
        </div>
    );
}
