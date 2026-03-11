"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// このページはデモデータ削除済みの名残です。
// Windowsの権限問題で完全に削除できない事があるため、ダミーとして残しています。
export default function SeedPage() {
  const router = useRouter();
  
  useEffect(() => {
    router.push('/');
  }, [router]);

  return (
    <div className="min-h-screen bg-yui-earth-50 flex flex-col items-center justify-center p-4">
      <p className="text-gray-500">このページは機能しません。ホームページに戻ります...</p>
    </div>
  );
}
