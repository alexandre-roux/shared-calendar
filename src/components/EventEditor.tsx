import type {EditorPosition, EventForm} from "../types/calendar";

type EventEditorProps = {
    form: EventForm;
    isMobile: boolean;
    isEditing: boolean;
    editorPosition: EditorPosition;
    minStartDate?: string;
    onChangeForm: (form: EventForm) => void;
    onClose: () => void;
    onSave: () => void;
    onDelete: () => void;
};

export function EventEditor({
                                form,
                                isMobile,
                                isEditing,
                                editorPosition,
                                minStartDate,
                                onChangeForm,
                                onClose,
                                onSave,
                                onDelete,
                            }: EventEditorProps) {
    return (
        <div className="editor-layer" onClick={onClose}>
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
                    <button className="header-close-button" aria-label="Fermer" onClick={onClose}>
                        ×
                    </button>

                    <div className="quick-editor-header-spacer"/>

                    <button className="header-save-button" onClick={onSave}>
                        Enregistrer
                    </button>
                </div>

                <div className="quick-editor-body">
                    <input
                        className="title-field"
                        autoFocus
                        required
                        placeholder="Ajouter un titre"
                        value={form.title}
                        onChange={(event) =>
                            onChangeForm({...form, title: event.target.value})
                        }
                    />

                    <div className="editor-row">
                        <div className="date-row-icons" aria-hidden="true">
                            <span className="row-icon-spacer"/>
                            <span className="row-icon">📅</span>
                            <span className="row-icon">📅</span>
                        </div>

                        <div className="date-time-section">
                            <label className="all-day-row">
                                <span>Toute la journée</span>
                                <input
                                    type="checkbox"
                                    checked={form.allDay}
                                    onChange={(event) =>
                                        onChangeForm({
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
                                    min={minStartDate}
                                    required
                                    value={form.startDate}
                                    onChange={(event) =>
                                        onChangeForm({
                                            ...form,
                                            startDate: event.target.value,
                                            endDate: form.endDate || event.target.value,
                                        })
                                    }
                                />

                                {!form.allDay && (
                                    <>
                                        <span className="time-field-icon" aria-hidden="true">🕒</span>
                                        <input
                                            type="time"
                                            required={!form.allDay}
                                            value={form.startTime}
                                            onChange={(event) =>
                                                onChangeForm({...form, startTime: event.target.value})
                                            }
                                        />
                                    </>
                                )}
                            </div>

                            <div className="date-time-row">
                                <input
                                    type="date"
                                    min={form.startDate || minStartDate}
                                    value={form.endDate}
                                    onChange={(event) =>
                                        onChangeForm({...form, endDate: event.target.value})
                                    }
                                />

                                {!form.allDay && (
                                    <>
                                        <span className="time-field-icon" aria-hidden="true">🕒</span>
                                        <input
                                            type="time"
                                            value={form.endTime}
                                            onChange={(event) =>
                                                onChangeForm({...form, endTime: event.target.value})
                                            }
                                        />
                                    </>
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
                                onChangeForm({...form, location: event.target.value})
                            }
                        />
                    </div>

                    <div className="editor-row">
                        <span className="row-icon">🔗</span>
                        <input
                            type="url"
                            placeholder="URL"
                            value={form.url}
                            onChange={(event) =>
                                onChangeForm({...form, url: event.target.value})
                            }
                        />
                    </div>

                    <div className="editor-row">
                        <span className="row-icon">☰</span>
                        <textarea
                            placeholder="Notes"
                            value={form.notes}
                            onChange={(event) =>
                                onChangeForm({...form, notes: event.target.value})
                            }
                        />
                    </div>

                    {isEditing && (
                        <button className="mobile-delete-button" onClick={onDelete}>
                            Supprimer l'événement
                        </button>
                    )}
                </div>

                <footer className="quick-editor-actions">
                    {isEditing && (
                        <button className="delete-button" onClick={onDelete}>
                            Supprimer
                        </button>
                    )}

                    <button className="cancel-button" onClick={onClose}>
                        Annuler
                    </button>
                    <button className="save-button" onClick={onSave}>
                        Enregistrer
                    </button>
                </footer>
            </section>
        </div>
    );
}
