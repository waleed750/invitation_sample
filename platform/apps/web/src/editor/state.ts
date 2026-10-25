import {
  addSection, applyThemePreset, duplicateSection, moveSection, removeSection, setVariant, toggleHidden,
  type InvitationDocument, type NewSection, type ThemePreset
} from '@platform/shared';

/** How many steps undo remembers. */
export const HISTORY_LIMIT = 50;

export type SaveStatus = 'saved' | 'saving' | 'unsaved' | 'offline' | 'conflict' | 'error';

export interface EditorState {
  doc: InvitationDocument;
  /** The last document the server confirmed. */
  saved: InvitationDocument;
  past: InvitationDocument[];
  future: InvitationDocument[];
  selectedId: string | null;
  /** `If-Match` for the next save: the server's updatedAt. */
  version: string;
  status: SaveStatus;
  /** Short machine reason for the last error (shown through i18n). */
  errorCode: string | null;
}

export type EditorAction =
  | {type: 'select'; id: string | null}
  | {type: 'edit'; doc: InvitationDocument; coalesceKey?: string}
  | {type: 'addSection'; section: NewSection; index?: number; id?: string}
  | {type: 'removeSection'; id: string}
  | {type: 'moveSection'; id: string; toIndex: number}
  | {type: 'duplicateSection'; id: string}
  | {type: 'toggleHidden'; id: string}
  | {type: 'setVariant'; id: string; variant: string | null}
  | {type: 'applyTheme'; preset: Pick<ThemePreset, 'id' | 'colors' | 'fonts'>}
  | {type: 'undo'}
  | {type: 'redo'}
  | {type: 'saveStarted'}
  | {type: 'saveSucceeded'; savedDoc: InvitationDocument; version: string}
  | {type: 'saveFailed'; status: 'offline' | 'conflict' | 'error'; errorCode?: string}
  | {type: 'online'};

export function initialState(doc: InvitationDocument, version: string): EditorState {
  return {doc, saved: doc, past: [], future: [], selectedId: null, version, status: 'saved', errorCode: null};
}

function same(a: InvitationDocument, b: InvitationDocument): boolean {
  return a === b || JSON.stringify(a) === JSON.stringify(b);
}

/** A conflict sticks until the page is reloaded; otherwise the status follows whether the server has this document. */
function nextStatus(state: EditorState, doc: InvitationDocument): SaveStatus {
  if (state.status === 'conflict') return 'conflict';
  return same(doc, state.saved) ? 'saved' : 'unsaved';
}

/** Pushes the current document on the undo stack and installs `next` (no-op when nothing changed). */
function commit(state: EditorState, next: InvitationDocument, selectedId: string | null = state.selectedId): EditorState {
  if (same(state.doc, next)) return {...state, selectedId};
  return {
    ...state,
    doc: next,
    past: [...state.past, state.doc].slice(-HISTORY_LIMIT),
    future: [],
    selectedId,
    status: nextStatus(state, next)
  };
}

function guard(state: EditorState, run: () => EditorState): EditorState {
  try {
    return run();
  } catch (error) {
    const code = error instanceof Error && 'code' in error && typeof (error as {code: unknown}).code === 'string' ? (error as {code: string}).code : 'invalid';
    return {...state, errorCode: code};
  }
}

let typingKey: string | null = null;
let typingAt = 0;

/** Text typing is merged into one undo step while the same field keeps changing within a second. */
function editStep(state: EditorState, doc: InvitationDocument, coalesceKey: string | undefined): EditorState {
  const now = Date.now();
  const merge = coalesceKey !== undefined && coalesceKey === typingKey && now - typingAt < 1000 && state.past.length > 0;
  typingKey = coalesceKey ?? null;
  typingAt = now;
  if (!merge) return commit(state, doc);
  if (same(state.doc, doc)) return state;
  return {...state, doc, future: [], status: nextStatus(state, doc)};
}

export function reducer(state: EditorState, action: EditorAction): EditorState {
  const clear = {...state, errorCode: null};
  switch (action.type) {
    case 'select':
      return {...state, selectedId: action.id};
    case 'edit':
      return editStep(clear, action.doc, action.coalesceKey);
    case 'addSection':
      return guard(clear, () => {
        const doc = addSection(state.doc, action.section, action.index ?? state.doc.sections.length);
        const created = doc.sections[action.index ?? state.doc.sections.length];
        return commit(clear, doc, created?.id ?? state.selectedId);
      });
    case 'removeSection':
      return guard(clear, () => commit(clear, removeSection(state.doc, action.id), state.selectedId === action.id ? null : state.selectedId));
    case 'moveSection':
      return guard(clear, () => commit(clear, moveSection(state.doc, action.id, action.toIndex)));
    case 'duplicateSection':
      return guard(clear, () => {
        const doc = duplicateSection(state.doc, action.id);
        const at = state.doc.sections.findIndex((item) => item.id === action.id);
        return commit(clear, doc, doc.sections[at + 1]?.id ?? state.selectedId);
      });
    case 'toggleHidden':
      return guard(clear, () => commit(clear, toggleHidden(state.doc, action.id)));
    case 'setVariant':
      return guard(clear, () => commit(clear, setVariant(state.doc, action.id, action.variant)));
    case 'applyTheme':
      return commit(clear, applyThemePreset(state.doc, action.preset));
    case 'undo': {
      const previous = state.past.at(-1);
      if (previous === undefined) return state;
      return {
        ...state, doc: previous, past: state.past.slice(0, -1), future: [state.doc, ...state.future].slice(0, HISTORY_LIMIT),
        selectedId: previous.sections.some((item) => item.id === state.selectedId) ? state.selectedId : null,
        status: same(previous, state.saved) ? 'saved' : 'unsaved'
      };
    }
    case 'redo': {
      const next = state.future[0];
      if (next === undefined) return state;
      return {
        ...state, doc: next, past: [...state.past, state.doc].slice(-HISTORY_LIMIT), future: state.future.slice(1),
        selectedId: next.sections.some((item) => item.id === state.selectedId) ? state.selectedId : null,
        status: same(next, state.saved) ? 'saved' : 'unsaved'
      };
    }
    case 'saveStarted':
      return state.status === 'conflict' ? state : {...state, status: 'saving'};
    case 'saveSucceeded':
      // Edits typed while the save was in flight stay unsaved.
      return {...state, saved: action.savedDoc, version: action.version, errorCode: null, status: same(state.doc, action.savedDoc) ? 'saved' : 'unsaved'};
    case 'saveFailed':
      return {...state, status: action.status, errorCode: action.errorCode ?? null};
    case 'online':
      return state.status === 'offline' ? {...state, status: 'unsaved'} : state;
    default:
      return state;
  }
}

export const canUndo = (state: EditorState): boolean => state.past.length > 0;
export const canRedo = (state: EditorState): boolean => state.future.length > 0;
