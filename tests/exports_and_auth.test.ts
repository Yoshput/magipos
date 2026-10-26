import { describe, it, expect } from 'vitest';
import { DEFAULT_DATABASE } from '../src/lib/storage/local-db';
import { getResponsiveImagePath } from '../src/components/ui/ResponsiveProductImage';

describe('Responsive Image & Auth Seed Tests', () => {
  it('has pre-configured accounts with username support for admin and cashier', () => {
    const admin = DEFAULT_DATABASE.profiles.find((p) => p.role === 'admin');
    const cashier = DEFAULT_DATABASE.profiles.find((p) => p.role === 'cashier');

    expect(admin).toBeDefined();
    expect(admin?.username).toBe('admin');
    expect(DEFAULT_DATABASE.credentials['admin']).toBe('admin123');

    expect(cashier).toBeDefined();
    expect(cashier?.username).toBe('kasir_yossika');
    expect(DEFAULT_DATABASE.credentials['kasir_yossika']).toBe('kasirsukses2026');
  });

  it('correctly maps 3-tier WebP images for small, medium, and large tiers', () => {
    const mangoSm = getResponsiveImagePath('/assets/mango-sago-splash-stack.png', 'sm');
    expect(mangoSm).toBe('/assets/mango-sago-splash-stack-sm.webp');

    const nagaMd = getResponsiveImagePath('/assets/naga-sago-splash-promo.png', 'md');
    expect(nagaMd).toBe('/assets/naga-sago-splash-promo-md.webp');

    const strawbLg = getResponsiveImagePath('/assets/strawberry-sago-summer-delight.webp', 'lg');
    expect(strawbLg).toBe('/assets/strawberry-sago-summer-delight-lg.webp');
  });
});
