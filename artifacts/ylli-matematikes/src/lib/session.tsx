import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useLegacyClerk } from '@/lib/legacy-clerk';
import { useLocation } from 'wouter';
import { getGetProfileQueryKey, useLogoutLearner, continueLegacyLogin, type ProfileState } from '@workspace/api-client-react';
import { useToast } from '@/hooks/use-toast';
import { useT } from '@/lib/i18n';
import { apiErrorKey } from '@/lib/api-error';

interface IdentityCtx { epoch: number; resetIdentity: (next?: ProfileState) => Promise<void> }
const Ctx = createContext<IdentityCtx | null>(null);

/** Clears every cached query and remounts routes whenever the signed-in learner changes. */
export function IdentityProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const [epoch, setEpoch] = useState(0);
  const resetIdentity = useCallback(async (next?: ProfileState) => {
    await qc.cancelQueries();
    qc.clear();
    if (next) qc.setQueryData(getGetProfileQueryKey(), next);
    setEpoch((e) => e + 1);
  }, [qc]);
  return <Ctx.Provider value={{ epoch, resetIdentity }}>{children}</Ctx.Provider>;
}

export function useIdentity() {
  const c = useContext(Ctx);
  if (!c) throw new Error('IdentityProvider missing');
  return c;
}

/** Signs out only after the backend confirms (204). On failure the learner stays signed in and sees an error. */
export function useSignOut() {
  const logout = useLogoutLearner();
  const clerk = useLegacyClerk();
  const { resetIdentity } = useIdentity();
  const { toast } = useToast();
  const { t } = useT();
  const [, setLocation] = useLocation();
  const run = useCallback(async () => {
    try {
      await logout.mutateAsync();
    } catch (err) {
      toast({ title: t('logout.fail'), description: t(apiErrorKey(err)), variant: 'destructive' });
      return;
    }
    try { if (clerk?.user) await clerk.signOut(); } catch { /* backend session already ended; legacy suppression cookie covers Clerk */ }
    await resetIdentity({ authenticated: false, profile: null });
    toast({ title: t('logout.done') });
    setLocation('/');
  }, [logout, clerk, resetIdentity, setLocation, toast, t]);
  return { signOut: run, pending: logout.isPending };
}

/** Clears the backend "signed out" suppression so a legacy email session is honoured again. Only call on explicit user action. */
export function enableLegacySession(): Promise<void> {
  return continueLegacyLogin();
}
