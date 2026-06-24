'use client';

import { RegisterForm } from '@/components/auth/RegisterForm';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function RegisterPage() {
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session) router.push('/');
  }, [session, router]);

  return (
    <div className="max-w-sm mx-auto px-4 py-16">
      <h1 className="text-2xl font-bold text-center mb-8">注册</h1>
      <RegisterForm />
      <p className="text-center text-sm text-gray-500 mt-6">
        已有账号？{' '}
        <Link href="/login" className="text-blue-600 hover:underline">
          去登录
        </Link>
      </p>
    </div>
  );
}
