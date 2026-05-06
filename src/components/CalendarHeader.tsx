import type {RefObject} from "react";
import type FullCalendar from "@fullcalendar/react";

type CalendarHeaderProps = {
    calendarRef: RefObject<FullCalendar | null>;
    currentTitle: string;
};

export function CalendarHeader({calendarRef, currentTitle}: CalendarHeaderProps) {
    function getCalendarApi() {
        return calendarRef.current?.getApi();
    }

    return (
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
    );
}