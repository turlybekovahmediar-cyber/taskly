import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/tokens.css';
import './styles/components.css';
import { AppProvider, useApp } from './store/store.jsx';
import { parseRoute } from './lib/router.js';
import { Btn, Empty, Toasts } from './components/ui.jsx';
import { Header, Footer, DemoPanel, applyTweaks } from './components/shell.jsx';
import { HomePage, BusinessPage, SpecialistsPage } from './pages/public.jsx';
import { SignIn, SignUp, OnboardingBusiness, OnboardingSpecialist } from './pages/auth.jsx';
import { BizDashboard, BizProjects, BizNewProject, BizTzPreview, BizProjectPublic } from './pages/business.jsx';
import { BizProposals, BizSpecialistProfile, BizSpecialists, BizSelectStep, BizHistory, BizProfile, BizMessages } from './pages/businessDeal.jsx';
import { Workspace } from './pages/workspace.jsx';
import { SpecDashboard, SpecProjects, SpecProjectDetail, SpecApply, SpecProposals, SpecMessages, SpecPayout, SpecReviews, SpecHistory, SpecProfile, SpecProfileEdit } from './pages/specialist.jsx';
import { HowPage, SecurityPage, PricingPage, FaqPage, SupportPage, NotificationsPage, SettingsPage, LegalPage, UiKitPage, MapPage } from './pages/meta.jsx';

class PageBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { console.error('Taskly page error:', error, info.componentStack); }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <main className="page" style={{ paddingTop: 'var(--s16)', paddingBottom: 'var(--s20)' }}>
        <div className="card" style={{ maxWidth: 640 }}>
          <Empty icon="alert" title="Что-то пошло не так" text="Страница не смогла загрузиться. Данные не потеряны — попробуйте обновить страницу или вернуться на главную."
            action={<Btn variant="primary" onClick={() => location.reload()}>Обновить страницу</Btn>}
            secondary={<Btn variant="ghost" onClick={() => { location.href = '/'; }}>На главную</Btn>} />
        </div>
      </main>
    );
  }
}

function NotFound() {
  const app = useApp();
  return (
    <main className="page" style={{ paddingTop: 'var(--s16)', paddingBottom: 'var(--s20)' }}>
      <div className="card" style={{ maxWidth: 640 }}>
        <Empty icon="search" title="Страница не найдена"
          text="Возможно, ссылка устарела или проект удалён. Вернитесь на главную или откройте карту продукта — там все страницы прототипа."
          action={<Btn variant="primary" onClick={() => app.navigate('/')}>На главную</Btn>}
          secondary={<Btn variant="ghost" onClick={() => app.navigate('/map')}>Карта продукта</Btn>} />
      </div>
    </main>
  );
}

const ROLE_NAME = { client: 'бизнеса', specialist: 'специалиста' };

function Gate({ need, children }) {
  const app = useApp();
  const ok = need === 'any' ? app.role !== 'guest' : app.role === need;
  if (ok) return children;
  if (app.pending) return <main className="page" style={{ paddingTop: 'var(--s16)', minHeight: '60vh' }}><span className="row g3 muted"><span className="spin" />Входим…</span></main>;
  const target = need === 'any' ? 'client' : need;
  return (
    <main className="page" style={{ paddingTop: 'var(--s16)', paddingBottom: 'var(--s20)' }}>
      <div className="card" style={{ maxWidth: 640 }}>
        <Empty icon="lock"
          title={app.role === 'guest' ? 'Войдите, чтобы открыть этот раздел' : 'Этот раздел — кабинет ' + ROLE_NAME[need]}
          text={app.role === 'guest'
            ? 'Раздел доступен после входа. Можно войти в свой аккаунт или в демо-аккаунт, чтобы посмотреть продукт.'
            : 'Сейчас открыт кабинет ' + ROLE_NAME[app.role] + '. Один аккаунт может быть и заказчиком, и специалистом — переключитесь, чтобы открыть этот раздел.'}
          action={app.role === 'guest'
            ? <Btn variant="primary" onClick={() => app.navigate('/signin')}>Войти</Btn>
            : <Btn variant="primary" icon="swap" onClick={() => app.setRole(target)}>Переключиться на {target === 'client' ? 'бизнес' : 'специалиста'}</Btn>}
          secondary={app.role === 'guest'
            ? <Btn variant="ghost" onClick={() => app.setRole(target)}>Демо-вход как {target === 'client' ? 'бизнес' : 'специалист'}</Btn>
            : <Btn variant="ghost" onClick={() => app.navigate('/')}>На главную</Btn>} />
      </div>
    </main>
  );
}

const PUBLIC = {
  '/': HomePage, '/index.html': HomePage, '/Taskly.html': HomePage, '/business': BusinessPage, '/specialists': SpecialistsPage, '/how': HowPage,
  '/security': SecurityPage, '/pricing': PricingPage, '/faq': FaqPage, '/support': SupportPage,
  '/terms': () => <LegalPage kind="terms" />, '/privacy': () => <LegalPage kind="privacy" />,
  '/signin': SignIn, '/signup': SignUp,
  '/onboarding/business': OnboardingBusiness, '/onboarding/specialist': OnboardingSpecialist,
  '/ui-kit': UiKitPage, '/map': MapPage,
  '/spec/projects': SpecProjects, '/biz/specialists': BizSpecialists,
};
const CLIENT = {
  '/biz': BizDashboard, '/biz/projects': BizProjects, '/biz/projects/new': BizNewProject,
  '/biz/projects/new/preview': BizTzPreview, '/biz/messages': BizMessages, '/biz/history': BizHistory, '/biz/profile': BizProfile,
};
const SPECIALIST = {
  '/spec': SpecDashboard, '/spec/proposals': SpecProposals, '/spec/messages': SpecMessages, '/spec/payout': SpecPayout,
  '/spec/reviews': SpecReviews, '/spec/history': SpecHistory, '/spec/profile': SpecProfile, '/spec/profile/edit': SpecProfileEdit,
};
const ACCOUNT = { '/notifications': NotificationsPage, '/settings': SettingsPage };

function Router() {
  const app = useApp();
  const { path, seg, params } = parseRoute(app.route);
  const at = (i) => seg[i];

  if (seg[0] === 'biz' && seg[1] === 'workspace' && at(2) && seg.length === 3) return <Gate need="client"><Workspace id={at(2)} section={params.get('s') || 'overview'} /></Gate>;
  if (seg[0] === 'spec' && seg[1] === 'workspace' && at(2) && seg.length === 3) return <Gate need="specialist"><Workspace id={at(2)} section={params.get('s') || 'overview'} /></Gate>;
  if (seg[0] === 'biz' && seg[1] === 'specialists' && at(2) && seg.length === 3) return <BizSpecialistProfile id={at(2)} />;
  if (seg[0] === 'biz' && seg[1] === 'projects' && at(2) && at(2) !== 'new') {
    if (seg.length === 3) return <Gate need="client"><BizProjectPublic id={at(2)} /></Gate>;
    if (seg.length === 4 && at(3) === 'proposals') return <Gate need="client"><BizProposals id={at(2)} /></Gate>;
    if (seg.length === 4 && at(3) === 'select') return <Gate need="client"><BizSelectStep id={at(2)} proposalId={params.get('proposal')} /></Gate>;
  }
  if (seg[0] === 'spec' && seg[1] === 'projects' && at(2)) {
    if (seg.length === 3) return <SpecProjectDetail id={at(2)} />;
    if (seg.length === 4 && at(3) === 'apply') return <Gate need="specialist"><SpecApply id={at(2)} /></Gate>;
  }

  if (PUBLIC[path]) { const P = PUBLIC[path]; return <P />; }
  if (CLIENT[path]) { const P = CLIENT[path]; return <Gate need="client"><P /></Gate>; }
  if (SPECIALIST[path]) { const P = SPECIALIST[path]; return <Gate need="specialist"><P /></Gate>; }
  if (ACCOUNT[path]) { const P = ACCOUNT[path]; return <Gate need="any"><P /></Gate>; }
  return <NotFound />;
}

function App() {
  const app = useApp();
  useEffect(() => { applyTweaks(app.tweaks); }, [app.tweaks]);
  if (!app.ready) {
    return (
      <main className="page" style={{ minHeight: '70vh', display: 'grid', placeItems: 'center' }}>
        <span className="row g3 muted"><span className="spin" />Загружаем Taskly…</span>
      </main>
    );
  }
  return (
    <>
      <a className="skip-link" href="#main">Перейти к содержимому</a>
      {app.offline && (
        <div className="note note--warn" role="alert" style={{ borderRadius: 0, justifyContent: 'center' }}>
          <span>Сервер недоступен: {app.offline} Данные не загружены — обновите страницу через минуту.</span>
        </div>
      )}
      <Header />
      <div id="main"><PageBoundary key={app.route.split('?')[0]}><Router /></PageBoundary></div>
      <Footer />
      <DemoPanel />
      <Toasts />
    </>
  );
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppProvider><App /></AppProvider>
  </React.StrictMode>,
);
