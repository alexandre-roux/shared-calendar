import type {EditorPosition} from "../types/calendar";

function pad(value: number) {
    return String(value).padStart(2, "0");
}

export function toDateInputValue(date: Date) {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function toTimeInputValue(date: Date) {
    return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function buildDateTime(date: string, time: string) {
    return time ? `${date}T${time}:00` : `${date}T00:00:00`;
}

export function addDays(date: string, days: number) {
    const value = new Date(`${date}T00:00:00`);
    value.setDate(value.getDate() + days);
    return toDateInputValue(value);
}

export function buildDefaultEndDateTime(startDate: string, startTime: string) {
    if (!startTime) return null;

    const value = new Date(buildDateTime(startDate, startTime));
    value.setHours(value.getHours() + 1);

    return `${toDateInputValue(value)}T${toTimeInputValue(value)}:00`;
}

export function getInclusiveAllDayEndDate(endAt: string | null, startDate: string) {
    if (!endAt) return startDate;

    const endDate = new Date(endAt);
    endDate.setDate(endDate.getDate() - 1);

    return toDateInputValue(endDate);
}

export function getEditorPosition(clientX: number, clientY: number): EditorPosition {
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

export function getCenteredEditorPosition(): EditorPosition {
    return {
        left: Math.max((window.innerWidth - 448) / 2, 16),
        top: 96,
    };
}