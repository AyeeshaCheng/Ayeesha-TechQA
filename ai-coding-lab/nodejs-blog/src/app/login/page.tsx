'use client';

import { LoginForm } from '@/components/auth/LoginForm';
import { GitHubLoginButton } from '@/components/auth/GitHubLoginButton';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function LoginPage() {
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session) router.push('/');
  }, [session, router]);

  return (
    <div className="max-w-sm mx-auto px-4 py-16">
      <h1 className="text-2xl font-bold text-center mb-8">登录</h1>
      <LoginForm />
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300 dark:border-gray-700" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-white dark:bg-gray-900 px-2 text-gray-500">或</span>
        </div>
      </div>
      <GitHubLoginButton />
      <p className="text-center text-sm text-gray-500 mt-6">
        还没有账号？{' '}
        <Link href="/register" className="text-blue-600 hover:underline">
          去注册
        </Link>
      </p>
    </div>
  );
}
