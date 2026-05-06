export type CalendarEvent = {
    id: string;
    title: string;
    location: string | null;
    start_at: string;
    end_at: string | null;
    notes: string | null;
    all_day: boolean;
};

export type EventForm = {
    title: string;
    location: string;
    startDate: string;
    startTime: string;
    endDate: string;
    endTime: string;
    allDay: boolean;
    notes: string;
};

export type EditorPosition = {
    left: number;
    top: number;
};

export type EventPayload = {
    calendar_token: string;
    title: string;
    location: string | null;
    start_at: string;
    end_at: string | null;
    all_day: boolean;
    notes: string | null;
};