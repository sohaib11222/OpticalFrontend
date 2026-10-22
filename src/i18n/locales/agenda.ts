import type { LocaleModule } from "../types";

const en: Record<string, string> = {
  "status.scheduled": "Scheduled",
  "status.no_show": "No show",

  "agenda.view.month": "Month",
  "agenda.view.week": "Week",
  "agenda.view.day": "Day",

  "agenda.calendar.previousPeriod": "Previous calendar period",
  "agenda.calendar.nextPeriod": "Next calendar period",
  "agenda.calendar.today": "Today",
  "agenda.calendar.zoneHint": "{zone} · shared shop calendar",
  "agenda.calendar.new": "New appointment",
  "agenda.calendar.refresh": "Refresh calendar",
  "agenda.calendar.loading": "Loading appointments…",

  "agenda.filter.statusAria": "Filter appointments",
  "agenda.filter.allOutcomes": "All outcomes",

  "agenda.appointment.unavailable": "Appointment unavailable.",

  "agenda.dialog.newTitle": "New appointment",
  "agenda.dialog.editTitle": "Appointment #{id}",
  "agenda.dialog.description": "Shared shop calendar · {zone}",
  "agenda.dialog.create": "Create appointment",
  "agenda.dialog.saveChanges": "Save appointment changes",
  "agenda.dialog.saveFailed": "Unable to save appointment.",
  "agenda.dialog.statusFailed": "Status change failed.",

  "agenda.field.title": "Title",
  "agenda.field.start": "Start",
  "agenda.field.end": "End",
  "agenda.field.notes": "Notes",
  "agenda.field.reasonForChange": "Reason for change",

  "agenda.dst.invalid":
    "This local time does not exist or is incomplete.",
  "agenda.dst.missingTimes":
    "Choose valid local times and select an offset for repeated daylight-saving hours.",
  "agenda.dst.offsetAria": "{label} UTC offset",
  "agenda.dst.chooseOffset": "Choose repeated-hour offset",

  "agenda.overlap.acknowledge":
    "I reviewed the calendar and allow an overlapping appointment.",

  "agenda.status.aria": "New appointment status",
  "agenda.status.chooseOutcome": "Choose outcome",
  "agenda.status.recordOutcome": "Record outcome",

  "agenda.history.title": "Appointment history",
  "agenda.history.loading": "Loading history…",
  "agenda.history.empty": "No history entries yet.",
  "agenda.history.previous": "Previous history",
  "agenda.history.next": "Next history",
  "agenda.history.overlapConfirmed": "Overlap confirmed",
  "agenda.history.action.created": "Created",
  "agenda.history.action.rescheduled": "Rescheduled",
};

const it: Record<string, string> = {
  "status.scheduled": "Programmato",
  "status.no_show": "Non presentato",

  "agenda.view.month": "Mese",
  "agenda.view.week": "Settimana",
  "agenda.view.day": "Giorno",

  "agenda.calendar.previousPeriod": "Periodo di calendario precedente",
  "agenda.calendar.nextPeriod": "Periodo di calendario successivo",
  "agenda.calendar.today": "Oggi",
  "agenda.calendar.zoneHint": "{zone} · calendario del negozio condiviso",
  "agenda.calendar.new": "Nuovo appuntamento",
  "agenda.calendar.refresh": "Aggiorna il calendario",
  "agenda.calendar.loading": "Caricamento appuntamenti…",

  "agenda.filter.statusAria": "Filtra gli appuntamenti",
  "agenda.filter.allOutcomes": "Tutti gli esiti",

  "agenda.appointment.unavailable": "Appuntamento non disponibile.",

  "agenda.dialog.newTitle": "Nuovo appuntamento",
  "agenda.dialog.editTitle": "Appuntamento n. {id}",
  "agenda.dialog.description": "Calendario del negozio condiviso · {zone}",
  "agenda.dialog.create": "Crea appuntamento",
  "agenda.dialog.saveChanges": "Salva le modifiche all'appuntamento",
  "agenda.dialog.saveFailed": "Impossibile salvare l'appuntamento.",
  "agenda.dialog.statusFailed": "Modifica dello stato non riuscita.",

  "agenda.field.title": "Titolo",
  "agenda.field.start": "Inizio",
  "agenda.field.end": "Fine",
  "agenda.field.notes": "Note",
  "agenda.field.reasonForChange": "Motivo della modifica",

  "agenda.dst.invalid":
    "Questo orario locale non esiste o è incompleto.",
  "agenda.dst.missingTimes":
    "Scegli orari locali validi e seleziona uno scostamento per le ore ripetute dovute all'ora legale.",
  "agenda.dst.offsetAria": "Scostamento UTC per {label}",
  "agenda.dst.chooseOffset": "Scegli lo scostamento dell'ora ripetuta",

  "agenda.overlap.acknowledge":
    "Ho controllato il calendario e consento un appuntamento sovrapposto.",

  "agenda.status.aria": "Nuovo stato dell'appuntamento",
  "agenda.status.chooseOutcome": "Scegli l'esito",
  "agenda.status.recordOutcome": "Registra l'esito",

  "agenda.history.title": "Storico appuntamenti",
  "agenda.history.loading": "Caricamento dello storico…",
  "agenda.history.empty": "Nessuna voce di storico.",
  "agenda.history.previous": "Storico precedente",
  "agenda.history.next": "Storico successivo",
  "agenda.history.overlapConfirmed": "Sovrapposizione confermata",
  "agenda.history.action.created": "Creato",
  "agenda.history.action.rescheduled": "Spostato",
};

export default { en, it } satisfies LocaleModule;
