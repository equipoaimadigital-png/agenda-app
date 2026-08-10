import type { Industry } from "@prisma/client";

/**
 * Dato extra que se pide al cliente al reservar, específico del rubro.
 * Se guarda tal cual (la etiqueta elegida) en Booking.intakeNote.
 */
export type IntakeFieldDef = {
  label: string;
  options: string[];
};

/** Pregunta sugerida lista para agregar con un clic a un servicio del rubro. */
export type FieldTemplate = {
  label: string;
  type: "TEXT" | "SELECT";
  options: string[];
  required: boolean;
};

export type IndustryPreset = {
  value: Industry;
  /** Nombre corto para mostrar en el selector de Configuración */
  label: string;
  /** Descripción de a quién le sirve, para el selector de Configuración */
  description: string;
  /** Título del hero en el portal público de reserva */
  heroVerb: string;
  /** Color de acento por defecto (el profesional lo puede personalizar igual) */
  defaultColor: string;
  navIcons: {
    agenda: string;
    servicios: string;
    disponibilidad: string;
    estadisticas: string;
    configuracion: string;
  };
  /** null si el rubro no necesita un dato extra al reservar */
  intakeField: IntakeFieldDef | null;
  /** Nombre del panel de historial del cliente en el dashboard */
  historyLabel: string;
  /** Preguntas comunes del rubro, sugeridas al configurar un servicio */
  fieldTemplates: FieldTemplate[];
};

export const INDUSTRY_PRESETS: Record<Industry, IndustryPreset> = {
  MEDICINA: {
    value: "MEDICINA",
    label: "Medicina",
    description: "Médicos, dentistas, pediatras, ginecólogos y otros profesionales de la salud.",
    heroVerb: "Agenda tu consulta",
    defaultColor: "#1d5a63",
    navIcons: {
      agenda: "📅",
      servicios: "🩺",
      disponibilidad: "🕘",
      estadisticas: "📊",
      configuracion: "⚙️",
    },
    intakeField: {
      label: "Modalidad de la consulta",
      options: ["Presencial", "Telemedicina"],
    },
    historyLabel: "Historial de consultas",
    fieldTemplates: [
      { label: "Motivo de la consulta", type: "TEXT", options: [], required: true },
      { label: "¿Tienes alguna alergia conocida?", type: "TEXT", options: [], required: false },
      {
        label: "¿Es tu primera vez con este profesional?",
        type: "SELECT",
        options: ["Sí", "No"],
        required: true,
      },
    ],
  },
  FITNESS: {
    value: "FITNESS",
    label: "Trainer",
    description: "Entrenadores personales, profesores de gimnasio, deporte y disciplinas físicas.",
    heroVerb: "Reserva tu sesión",
    defaultColor: "#b5541a",
    navIcons: {
      agenda: "📅",
      servicios: "🏋️",
      disponibilidad: "🕘",
      estadisticas: "📊",
      configuracion: "⚙️",
    },
    intakeField: {
      label: "Tipo de sesión",
      options: ["Individual", "Grupal"],
    },
    historyLabel: "Historial de sesiones",
    fieldTemplates: [
      { label: "¿Tienes alguna lesión o condición física?", type: "TEXT", options: [], required: false },
      {
        label: "Objetivo de la sesión",
        type: "SELECT",
        options: ["Pérdida de peso", "Ganancia muscular", "Rendimiento deportivo", "Rehabilitación"],
        required: false,
      },
      {
        label: "Nivel de experiencia",
        type: "SELECT",
        options: ["Principiante", "Intermedio", "Avanzado"],
        required: true,
      },
    ],
  },
  LOOK: {
    value: "LOOK",
    label: "Look",
    description: "Peluquerías, salones de uñas y negocios de cuidado y belleza.",
    heroVerb: "Reserva tu hora",
    defaultColor: "#2f4a3e",
    navIcons: {
      agenda: "📅",
      servicios: "📋",
      disponibilidad: "🕘",
      estadisticas: "📊",
      configuracion: "⚙️",
    },
    intakeField: null,
    historyLabel: "Visitas anteriores",
    fieldTemplates: [
      { label: "¿Tienes alguna alergia a productos de tinte?", type: "SELECT", options: ["Sí", "No"], required: false },
      { label: "Estilo o referencia deseada", type: "TEXT", options: [], required: false },
    ],
  },
  LEY: {
    value: "LEY",
    label: "Ley",
    description: "Abogados, notarías y profesionales de la justicia.",
    heroVerb: "Agenda tu asesoría",
    defaultColor: "#3a3a5c",
    navIcons: {
      agenda: "📅",
      servicios: "⚖️",
      disponibilidad: "🕘",
      estadisticas: "📊",
      configuracion: "⚙️",
    },
    intakeField: {
      label: "Tipo de consulta",
      options: ["Primera consulta", "Seguimiento"],
    },
    historyLabel: "Historial de causas",
    fieldTemplates: [
      { label: "Breve resumen del caso", type: "TEXT", options: [], required: true },
      { label: "¿Tienes documentos que aportar?", type: "SELECT", options: ["Sí", "No"], required: false },
      {
        label: "¿Ha tenido representación legal previa en este caso?",
        type: "SELECT",
        options: ["Sí", "No"],
        required: false,
      },
    ],
  },
};

export function industryPreset(industry: Industry): IndustryPreset {
  return INDUSTRY_PRESETS[industry];
}
