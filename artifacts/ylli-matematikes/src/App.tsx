import { useEffect, useRef, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ClerkProvider, useClerk } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import { Redirect, Route, Switch, useLocation, useParams, Router as WouterRouter } from 'wouter';
import { Skeleton } from '@/components/ui/skeleton';
import WelcomePage from '@/pages/welcome';
import OnboardingPage, { SetPinPage } from '@/pages/onboarding';
import { PinSignInPage, RegisterPage, LegacySignInPage } from '@/pages/auth';
import { isProfileComplete } from '@/lib/greet';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Shell, RouteErrorFallback, useAuthState } from '@/components/shell';
import Dashboard from '@/pages/dashboard';
import { GradesPage, GradePage } from '@/pages/grades';
import LessonPage from '@/pages/lesson';
import LeaderboardPage from '@/pages/leaderboard';
import ProfilePage from '@/pages/profile';
import { I18nProvider, useT } from '@/lib/i18n';
import { IdentityProvider, useIdentity } from '@/lib/session';
import { LegacyClerkBridge, pinOnly } from '@/lib/legacy-clerk';

const queryClient = new QueryClient();

const clerkPubKey = pinOnly ? '' : publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || '/'
    : path;
}

if (!pinOnly && !clerkPubKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in .env file');
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: 'clerk',
  options: {
    logoPlacement: 'inside' as const,
    logoLinkUrl: basePath || '/',
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: '#1f2a5c',
    colorForeground: '#1f2a5c',
    colorMutedForeground: '#56608a',
    colorDanger: '#d9453a',
    colorBackground: '#fffdf6',
    colorInput: '#ffffff',
    colorInputForeground: '#1f2a5c',
    colorNeutral: '#1f2a5c',
    fontFamily: "'Nunito', sans-serif",
    borderRadius: '1rem',
  },
  elements: {
    rootBox: 'w-full flex justify-center',
    cardBox: 'bg-[#fffdf6] rounded-[2rem] w-[440px] max-w-full overflow-hidden border-2 border-[#1f2a5c] shadow-[0_8px_0_0_#1f2a5c]',
    card: '!shadow-none !border-0 !bg-transparent !rounded-none',
    footer: '!shadow-none !border-0 !bg-transparent !rounded-none',
    headerTitle: "text-[#1f2a5c] font-semibold text-2xl [font-family:'Fredoka',sans-serif]",
    headerSubtitle: 'text-[#56608a]',
    socialButtonsBlockButtonText: 'text-[#1f2a5c] font-bold',
    formFieldLabel: 'text-[#1f2a5c] font-bold',
    footerActionLink: 'text-[#1f2a5c] font-extrabold underline',
    footerActionText: 'text-[#56608a]',
    dividerText: 'text-[#56608a]',
    identityPreviewEditButton: 'text-[#1f2a5c]',
    formFieldSuccessText: 'text-[#0b7a5f]',
    alertText: 'text-[#5c1610]',
    logoBox: 'h-14 justify-center',
    logoImage: 'h-14 w-14',
    socialButtonsBlockButton: 'border-2 border-[#e6dcc4] bg-white rounded-full',
    formButtonPrimary: 'bg-[#ffc533] text-[#1f2a5c] font-extrabold rounded-full hover:bg-[#ffd25c] shadow-none',
    formFieldInput: 'border-2 border-[#e6dcc4] rounded-xl bg-white text-[#1f2a5c]',
    footerAction: 'justify-center',
    dividerLine: 'bg-[#e6dcc4]',
    alert: 'bg-[#ffe4e0] border-[#ff7a6b]',
    otpCodeFieldInput: 'border-2 border-[#e6dcc4] text-[#1f2a5c]',
    formFieldRow: 'gap-2',
    main: 'gap-5',
  },
};

/** Legacy Clerk identity changes (email sign-in / sign-out) also wipe the cache. */
function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const { resetIdentity } = useIdentity();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);
  const resetRef = useRef(resetIdentity);
  resetRef.current = resetIdentity;

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
        void resetRef.current();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener]);

  return null;
}

function SignedInHome() {
  const { profile } = useAuthState();
  if (!isProfileComplete(profile)) return <Redirect to="/regjistrimi" replace />;
  if (profile && !profile.hasPin) return <Redirect to="/vendos-pin" replace />;
  return <Dashboard />;
}

function KeyedLesson() {
  const p = useParams<{ grade: string; lesson: string }>();
  return <LessonPage key={`${p.grade}-${p.lesson}`} />;
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location} FallbackComponent={RouteErrorFallback}>{children}</ErrorBoundary>;
}

function Home() {
  const { prof, authenticated } = useAuthState();
  if (prof.isLoading) {
    return <div className="paper flex min-h-[100dvh] items-center justify-center p-6"><Skeleton className="h-72 w-full max-w-3xl rounded-[2rem]" /></div>;
  }
  if (authenticated) return <Shell><RoutedErrorBoundary><SignedInHome /></RoutedErrorBoundary></Shell>;
  return <WelcomePage />;
}

function AppRoutes() {
  return (
    <Switch>
      <Route path="/sign-in" component={PinSignInPage} />
      <Route path="/sign-up" component={RegisterPage} />
      <Route path="/legacy-sign-in/*?">{pinOnly ? <Redirect to="/sign-in" replace /> : <LegacySignInPage />}</Route>
      <Route path="/" component={Home} />
      <Route>
        <Shell>
          <RoutedErrorBoundary>
            <Switch>
              <Route path="/regjistrimi" component={OnboardingPage} />
              <Route path="/vendos-pin" component={SetPinPage} />
              <Route path="/klasat" component={GradesPage} />
              <Route path="/klasa/:grade" component={GradePage} />
              <Route path="/mesim/:grade/:lesson" component={KeyedLesson} />
              <Route path="/gara" component={LeaderboardPage} />
              <Route path="/profili" component={ProfilePage} />
              <Route component={NotFound} />
            </Switch>
          </RoutedErrorBoundary>
        </Shell>
      </Route>
    </Switch>
  );
}

function IdentityKeyedRoutes() {
  const { epoch } = useIdentity();
  return <AppRoutes key={epoch} />;
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();
  const { t } = useT();
  if (pinOnly) return <ApplicationProviders />;
  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/legacy-sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: { start: { title: t('legacy.clerkTitle'), subtitle: t('legacy.clerkSub') } },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <LegacyClerkBridge><ApplicationProviders /></LegacyClerkBridge>
    </ClerkProvider>
  );
}

function ApplicationProviders() {
  return (
    <QueryClientProvider client={queryClient}>
      <IdentityProvider>
        {!pinOnly && <ClerkQueryClientCacheInvalidator />}
        <TooltipProvider>
          <IdentityKeyedRoutes />
          <Toaster />
        </TooltipProvider>
      </IdentityProvider>
    </QueryClientProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <I18nProvider>
        <ClerkProviderWithRoutes />
      </I18nProvider>
    </WouterRouter>
  );
}

export default App;
