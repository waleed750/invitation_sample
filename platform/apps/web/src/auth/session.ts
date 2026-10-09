import { cookies } from 'next/headers';

export interface AuthSession {
  accessToken: string;
  userId: string;
  email?: string;
  phone?: string;
}

export async function getServerSession(): Promise<AuthSession | null> {
  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.getAll().map(c => `${c.name}=${c.value}`).join('; ');
    if (!cookieHeader) return null;

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/auth/get-session`, {
      headers: {
        cookie: cookieHeader
      },
      cache: 'no-store'
    });

    if (!res.ok) return null;
    const data = await res.json();
    if (!data || !data.session || !data.user) return null;

    return {
      accessToken: data.session.token,
      userId: data.user.id,
      ...(data.user.email ? {email: data.user.email} : {}),
      ...(data.user.phoneNumber ? {phone: data.user.phoneNumber} : {})
    };
  } catch {
    return null;
  }
}
