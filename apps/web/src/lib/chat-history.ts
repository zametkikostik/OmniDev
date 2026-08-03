export type ChatMsg = { role: 'user' | 'assistant'; content: string; at: number };

export type FileVersion = {
  id: string;
  at: number;
  label: string;
  files: Record<string, string>;
};

const CHAT_KEY = 'omnidev_chat_v1';
const VER_KEY = 'omnidev_versions_v1';
const MAX_CHAT = 80;
const MAX_VER = 12;

export function loadChat(): ChatMsg[] {
  try {
    const raw = localStorage.getItem(CHAT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveChat(msgs: ChatMsg[]) {
  try {
    localStorage.setItem(CHAT_KEY, JSON.stringify(msgs.slice(-MAX_CHAT)));
  } catch {}
}

export function appendChat(msg: ChatMsg) {
  const list = loadChat();
  list.push(msg);
  saveChat(list);
  return list;
}

export function clearChat() {
  try {
    localStorage.removeItem(CHAT_KEY);
  } catch {}
}

export function loadVersions(): FileVersion[] {
  try {
    const raw = localStorage.getItem(VER_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function pushVersion(label: string, files: Record<string, string>): FileVersion {
  const v: FileVersion = {
    id: `v_${Date.now()}`,
    at: Date.now(),
    label,
    files: { ...files },
  };
  const list = loadVersions();
  list.unshift(v);
  try {
    localStorage.setItem(VER_KEY, JSON.stringify(list.slice(0, MAX_VER)));
  } catch {}
  return v;
}

export function getVersion(id: string): FileVersion | null {
  return loadVersions().find((v) => v.id === id) || null;
}
