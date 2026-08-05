/**
 * Mirrors backend: app/models/theme.py, app/schemas/theme.py
 */

export interface Theme {
  id: string;
  name: string;
}

export interface ThemeCreatePayload {
  name: string;
}

export interface AssignThemesPayload {
  theme_ids: string[];
}
