import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    // 1. Verify caller session & role via Server Client
    const supabase = await createServerClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase server configuration is missing.' },
        { status: 500 }
      );
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Tidak terautentikasi.' }, { status: 401 });
    }

    const { data: callerProfile } = await supabase
      .from('profiles')
      .select('role, is_active')
      .eq('id', user.id)
      .single();

    if (!callerProfile || callerProfile.role !== 'admin' || !callerProfile.is_active) {
      return NextResponse.json(
        { error: 'Akses ditolak: Hanya Admin yang berhak membuat pengguna baru.' },
        { status: 403 }
      );
    }

    // 2. Validate input
    const body = await request.json();
    const { email, password, fullName, role } = body;

    if (!email || !password || !fullName || !role) {
      return NextResponse.json({ error: 'Seluruh parameter wajib diisi.' }, { status: 400 });
    }

    if (role !== 'admin' && role !== 'cashier') {
      return NextResponse.json({ error: 'Peran pengguna tidak valid.' }, { status: 400 });
    }

    // 3. Create user using Admin Client (Service Role)
    const adminSupabase = createAdminClient();
    if (!adminSupabase) {
      return NextResponse.json(
        { error: 'SUPABASE_SERVICE_ROLE_KEY belum dikonfigurasi pada server.' },
        { status: 500 }
      );
    }

    const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    if (!authData.user) {
      return NextResponse.json({ error: 'Gagal membuat pengguna di auth.' }, { status: 500 });
    }

    // 4. Upsert Profile
    const { error: profileError } = await adminSupabase.from('profiles').upsert({
      id: authData.user.id,
      email,
      full_name: fullName,
      role,
      is_active: true,
    });

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    return NextResponse.json({
      status: 'success',
      user: {
        id: authData.user.id,
        email,
        full_name: fullName,
        role,
      },
    });
  } catch (err: unknown) {
    console.error('API Invite User error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
