export type Viewport = 'mobile' | 'tablet' | 'desktop' | 'wide';

export interface TextStyleToken {
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  height?: number;
  letterSpacing?: number;
}

export interface Theme {
  colors: Record<string, string>;
  typography: Record<string, TextStyleToken>;
  spacing: Record<string, number>;
  radius: Record<string, number>;
  shadow: Record<string, string>;
  breakpoints: { mobile: number; tablet: number; desktop: number; wide: number };
}

export type WidgetType =
  | 'Container' | 'Row' | 'Column' | 'Stack'
  | 'Text' | 'Image' | 'Icon' | 'Button' | 'Input'
  | 'ListView' | 'GridView' | 'ComponentInstance';

export interface WidgetNode {
  id: string;
  type: WidgetType;
  props: Record<string, unknown>;
  children?: WidgetNode[];
  visibility?: {
    conditional?: string;
    perViewport?: Partial<Record<Viewport, boolean>>;
  };
  responsiveOverrides?: Partial<Record<Viewport, Record<string, unknown>>>;
  bindings?: Record<string, string>;
  componentRef?: string;
  flutterHint?: { sourceFile?: string; sourceLine?: number };
}

export interface ScreenModel {
  screenName: string;
  themeMode: 'light' | 'dark';
  root: WidgetNode;
  sourceDartPath: string;
}

export interface ComponentDef {
  name: string;
  props: Record<string, { type: string; default: unknown }>;
  widgetTree: WidgetNode;
}

export interface Project {
  theme: Theme;
  screens: ScreenModel[];
  components: ComponentDef[];
}
