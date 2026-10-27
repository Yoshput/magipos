import { describe, it, expect } from 'vitest';
import { DEFAULT_DATABASE, localDb } from '../src/lib/storage/local-db';
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

  it('guarantees successful login for both kasir_yossika and admin under all conditions', () => {
    const cashierLogin = localDb.login('kasir_yossika', 'kasirsukses2026');
    expect(cashierLogin).not.toBeNull();
    expect(cashierLogin?.user.role).toBe('cashier');

    const adminLogin = localDb.login('admin', 'admin123');
    expect(adminLogin).not.toBeNull();
    expect(adminLogin?.user.role).toBe('admin');

    const fallbackCashier = localDb.login('kasir', 'kasirsukses2026');
    expect(fallbackCashier).not.toBeNull();
    expect(fallbackCashier?.user.role).toBe('cashier');
  });

  it('correctly maps 3-tier WebP images for small, medium, and large tiers', () => {
    const mangoSm = getResponsiveImagePath('/assets/mango-sago-splash-stack.png', 'sm');
    expect(mangoSm).toBe('/assets/mango-sago-splash-stack-sm.webp');

    const dragonLg = getResponsiveImagePath('/assets/dragon-sago-only.png', 'lg');
    expect(dragonLg).toBe('/assets/dragon-sago-only-lg.webp');

    const strawbSm = getResponsiveImagePath('/assets/strawberry-sago-only.png', 'sm');
    expect(strawbSm).toBe('/assets/strawberry-sago-only-sm.webp');

    const nagaMd = getResponsiveImagePath('/assets/naga-sago-splash-promo.png', 'md');
    expect(nagaMd).toBe('/assets/naga-sago-splash-promo-md.webp');

    const strawbLg = getResponsiveImagePath('/assets/strawberry-sago-summer-delight.webp', 'lg');
    expect(strawbLg).toBe('/assets/strawberry-sago-summer-delight-lg.webp');
  });
});
