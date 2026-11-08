import { Link } from 'wouter';
import { Mascot } from '@/lib/theme';
import { useT } from '@/lib/i18n';

export default function NotFound() {
  const { t } = useT();
  return (
    <div className="flex flex-col items-center py-16 text-center">
      <Mascot size={120} className="twinkle" />
      <h1 className="mt-4 font-display text-5xl font-semibold">404</h1>
      <p className="mt-2 text-muted-foreground">{t('notfound.text')}</p>
      <Link href="/" className="chunky mt-6 rounded-full bg-[#ffc533] px-6 py-3 font-bold text-[#1f2a5c]" data-testid="link-home-404">{t('notfound.home')}</Link>
    </div>
  );
}
