import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { OPEN_STATUSES } from '../data/mock.js';
import { initials } from '../lib/format.js';
import { navigate, useRoute } from '../lib/router.js';
import { api } from '../lib/api.js';

const UI_KEY = 'taskly.ui.v1';
const DEFAULT_TWEAKS = { accent: '#e04e2a', density: 'обычная', radius: 'обычный' };
const EMPTY_ENTITIES = { projects: [], proposals: [], messages: {}, files: {}, changeRequests: [], reviews: [], notifications: [] };
const POLL_MS = 8000;

function loadUi() {
  try {
    const raw = JSON.parse(localStorage.getItem(UI_KEY));
    if (raw && raw.tweaks) return { emptyMode: !!raw.emptyMode, tweaks: { ...DEFAULT_TWEAKS, ...raw.tweaks } };
  } catch (e) {}
  return { emptyMode: false, tweaks: DEFAULT_TWEAKS };
}

let seq = 0;
const uid = (p) => p + '-' + (++seq).toString(36);

let specIndex = new Map();
export const specialistById = (id) => specIndex.get(id) || null;
export const projectById = (e, id) => e.projects.find((p) => p.id === id) || null;
export const proposalsOf = (e, projectId) => e.proposals.filter((x) => x.projectId === projectId);
export const proposalsCount = (e, p) => proposalsOf(e, p.id).length + (p.otherProposals || 0);
export const priceOf = (p) => p.agreedPrice ?? p.price;
export const daysOf = (p) => p.agreedDays ?? p.days;
export const changesOf = (e, projectId) => e.changeRequests.filter((c) => c.projectId === projectId);
export const matchSkills = (spec, p) => (spec ? spec.skills.filter((s) => p.skills.includes(s)) : []);
export const isOpen = (p) => OPEN_STATUSES.includes(p.status);

const blankSpecialist = (user) => ({
  id: user?.id || 'guest', name: user?.name || 'Гость', initials: initials(user?.name || 'Гость'), avatar: 'avatar--a', handle: '', email: user?.email,
  headline: '', level: 'new', levelName: 'Новый специалист', about: '', directions: [], skills: [], city: '', availability: '', responseTime: '',
  completed: 0, onTime: null, successRate: null, reviews: 0, rating: null, verifiedVia: [], portfolio: [], reviewList: [], archive: [],
});

const AppCtx = createContext(null);
export const useApp = () => useContext(AppCtx);

export function AppProvider({ children }) {
  const [data, setData] = useState(null);
  const [draft, setDraft] = useState(null);
  const [ui, setUi] = useState(loadUi);
  const [pending, setPending] = useState(false);
  const [toasts, setToasts] = useState([]);
  const route = useRoute();

  useEffect(() => { try { localStorage.setItem(UI_KEY, JSON.stringify(ui)); } catch (e) {} }, [ui]);

  const toast = useCallback((msg, kind) => {
    const id = uid('t');
    setToasts((t) => [...t, { id, msg, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3600);
  }, []);

  const sent = useRef(0);
  const applied = useRef(0);
  const dataRef = useRef(data);
  dataRef.current = data;

  const request = useCallback(async (method, path, body, { withDraft = false } = {}) => {
    const n = ++sent.current;
    const res = await api(method, path, body);
    if (res && res.entities && n >= applied.current) {
      applied.current = n;
      setData(res);
      if (withDraft) setDraft(res.draft ?? null);
    }
    return res;
  }, []);

  const refresh = useCallback((opts) => request('GET', '/state', undefined, opts).catch(() => null), [request]);

  const call = useCallback(async (method, path, body, opts) => {
    try { return await request(method, path, body, opts); }
    catch (e) {
      toast(e.message, 'err');
      if (e.status === 401 || e.status === 409) refresh();
      return null;
    }
  }, [request, refresh, toast]);

  useEffect(() => {
    request('GET', '/state', undefined, { withDraft: true }).catch((e) => {
      setData({ user: null, specialists: [], savedProjects: [], entities: EMPTY_ENTITIES, offline: e.message });
    });
  }, [request]);

  const loggedIn = !!data?.user;
  useEffect(() => {
    if (!loggedIn) return undefined;
    const tick = () => { if (document.visibilityState === 'visible') refresh(); };
    const t = setInterval(tick, POLL_MS);
    window.addEventListener('focus', tick);
    return () => { clearInterval(t); window.removeEventListener('focus', tick); };
  }, [loggedIn, refresh]);

  const draftTimer = useRef(null);
  const draftRef = useRef(draft);
  draftRef.current = draft;

  const actions = useMemo(() => {
    const auth = async (fn) => {
      setPending(true);
      try { return await fn(); } finally { setPending(false); }
    };
    const user = () => dataRef.current?.user;
    const projectOfProposal = (id) => dataRef.current?.entities.proposals.find((x) => x.id === id)?.projectId;

    return {
      setRole: (role) => auth(async () => {
        const u = user();
        if (role === 'guest') { if (u) await call('POST', '/auth/logout', undefined, { withDraft: true }); return; }
        if (!u) { await call('POST', '/auth/demo', { role }, { withDraft: true }); return; }
        if (u.role !== role) await call('PATCH', '/auth/me', { role }, { withDraft: true });
      }),
      login: (body) => auth(() => request('POST', '/auth/login', body, { withDraft: true })),
      register: (body) => auth(() => request('POST', '/auth/register', body, { withDraft: true })),

      setEmptyMode: (emptyMode) => setUi((s) => ({ ...s, emptyMode })),
      setTweaks: (patch) => setUi((s) => ({ ...s, tweaks: { ...s.tweaks, ...patch } })),

      setBizName: (company) => call('PATCH', '/me/business', { company }),
      updateBusiness: (patch) => call('PATCH', '/me/business', patch),
      updateSpecProfile: (patch) => call('PATCH', '/me/specialist', patch),
      toggleSaved: (id) => {
        const on = dataRef.current?.savedProjects.includes(id);
        setData((d) => ({ ...d, savedProjects: on ? d.savedProjects.filter((x) => x !== id) : [...d.savedProjects, id] }));
        return call(on ? 'DELETE' : 'PUT', '/me/saved/' + id);
      },
      resetDemo: () => call('POST', '/demo/reset'),

      saveDraft: (d) => {
        setDraft(d);
        clearTimeout(draftTimer.current);
        if (user()) draftTimer.current = setTimeout(() => api('PUT', '/me/draft', d || {}).catch(() => {}), 1000);
      },
      publishProject: async () => {
        clearTimeout(draftTimer.current);
        const res = await call('POST', '/projects', draftRef.current);
        if (res) setDraft(null);
        return res?.id || null;
      },

      markProposalsRead: (projectId) => request('POST', '/projects/' + projectId + '/proposals/read').catch(() => null),
      applyToProject: (projectId, body) => call('POST', '/projects/' + projectId + '/proposals', body),
      withdrawProposal: (id) => call('POST', '/proposals/' + id + '/withdraw'),
      declineInvite: (id) => call('POST', '/proposals/' + id + '/withdraw'),
      confirmInvite: (id) => call('POST', '/proposals/' + id + '/confirm'),
      inviteSpecialist: (projectId, specialistId, message) => call('POST', '/projects/' + projectId + '/invite', { specialistId, message }),

      selectProposal: (proposalId) => call('POST', '/projects/' + projectOfProposal(proposalId) + '/select', { proposalId }),
      reservePayment: (projectId) => call('POST', '/projects/' + projectId + '/payment'),
      completeStage: (projectId) => call('POST', '/projects/' + projectId + '/stages/complete'),
      deliver: (projectId, { comment, files = [] }) => call('POST', '/projects/' + projectId + '/deliver', { comment, files }),
      requestFix: (projectId, text) => call('POST', '/projects/' + projectId + '/request-fix', { text }),
      acceptWork: (projectId) => call('POST', '/projects/' + projectId + '/accept'),
      leaveReview: (projectId, from, { stars, tags, text }) => call('POST', '/projects/' + projectId + '/reviews', { stars, tags, text }),
      sendMessage: (projectId, from, text, file) => call('POST', '/projects/' + projectId + '/messages', { text, file }),

      proposeChange: (projectId, from, { title, what, note, priceTo, daysTo }) =>
        call('POST', '/projects/' + projectId + '/changes', { title, what, note, priceTo, daysTo }),
      decideChange: (crId, approve) => call('POST', '/changes/' + crId + '/' + (approve ? 'approve' : 'reject')),

      readNotification: (id) => call('POST', '/notifications/' + id + '/read'),
      readAllNotifications: (role) => call('POST', '/notifications/read-all', { role }),
    };
  }, [call, request]);

  const user = data?.user || null;
  specIndex = new Map((data?.specialists || []).map((s) => [s.id, s]));
  const me = (user && specIndex.get(user.id)) || blankSpecialist(user);

  const value = useMemo(() => ({
    ...actions,
    ready: !!data, offline: data?.offline || null, pending, user,
    role: user ? user.role : 'guest',
    bizName: user?.business?.company || user?.name || '',
    business: user?.business || null,
    specId: user?.id || null,
    me, specialists: data?.specialists || [],
    savedProjects: data?.savedProjects || [],
    entities: data?.entities || EMPTY_ENTITIES,
    draft, emptyMode: ui.emptyMode, tweaks: ui.tweaks,
    route, navigate, toast, toasts,
  }), [actions, data, pending, user, me, draft, ui, route, toast, toasts]);

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}
