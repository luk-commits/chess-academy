import type { ReactNode } from 'react';
import { BrandedPage } from '../layout/BrandedPage';
import { GlassPaper } from '../layout/GlassPaper';
import { BrandHeader } from '../BrandHeader';

interface AuthLayoutProps {
  children: ReactNode;
  topAlert?: ReactNode;
}

export function AuthLayout({ children, topAlert }: AuthLayoutProps) {
  return (
    <BrandedPage maxWidth="xs" centered>
      <GlassPaper padding={{ xs: 3, sm: 4.5 }}>
        <BrandHeader />
        {topAlert}
        {children}
      </GlassPaper>
    </BrandedPage>
  );
}
