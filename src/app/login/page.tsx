'use client';

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Image from 'next/image';
import logoImg from '../../../public/logo.png';
import logoGenetrust from '../../../public/Logo_Genetrust.png';

import { Handshake } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await fetch('/api/seed');

      const res = await signIn('credentials', {
        username,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError('Tài khoản hoặc mật khẩu không đúng!');
        toast.error('Đăng nhập thất bại. Vui lòng kiểm tra lại!');
      } else {
        toast.success('Đăng nhập thành công!');
        router.push('/dashboard');
        router.refresh();
      }
    } catch {
      setError('Lỗi kết nối cơ sở dữ liệu. Hãy kiểm tra kết nối MongoDB!');
      toast.error('Lỗi kết nối cơ sở dữ liệu!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f1f5f9',
        padding: '20px',
      }}
    >
      <div
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: '440px',
          padding: '40px 32px',
          textAlign: 'center',
          background: '#ffffff',
          borderRadius: '24px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)',
        }}
      >
        <div className="mb-6 flex flex-col items-center justify-center">
          <div className="flex items-center justify-center gap-5 mb-2">
            <div className="w-[72px] h-[72px] flex items-center justify-center">
              <Image
                src={logoImg}
                alt="Logo GEN HD"
                width={72}
                height={72}
                style={{ objectFit: 'contain', width: '72px', height: '72px' }}
                priority
              />
            </div>
            <div className="flex items-center justify-center text-amber-600 bg-amber-50 p-2.5 rounded-full border border-amber-200/80 shadow-xs">
              <Handshake className="w-6 h-6 text-amber-600 animate-pulse" />
            </div>
            <div className="w-[72px] h-[72px] flex items-center justify-center">
              <Image
                src={logoGenetrust}
                alt="Logo Genetrust"
                width={72}
                height={72}
                style={{ objectFit: 'contain', width: '72px', height: '72px' }}
                priority
              />
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-semibold text-center">
            Hệ thống Quản lý Kết quả Xét nghiệm
          </p>
        </div>

        {error && (
          <div
            style={{
              padding: '10px 14px',
              background: '#fef2f2',
              border: '1px solid #fca5a5',
              borderRadius: '12px',
              color: '#dc2626',
              fontSize: '0.85rem',
              marginBottom: '20px',
              textAlign: 'center',
            }}
          >
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ textAlign: 'left' }}>
            <label style={{ fontWeight: '600', color: '#334155', fontSize: '0.85rem' }}>Tên đăng nhập</label>
            <input
              type="text"
              className="form-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Nhập tên đăng nhập..."
              required
            />
          </div>

          <div className="form-group" style={{ textAlign: 'left', marginBottom: '24px' }}>
            <label style={{ fontWeight: '600', color: '#334155', fontSize: '0.85rem' }}>Mật khẩu</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', padding: '12px', borderRadius: '12px', fontWeight: '700' }}
          >
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>
      </div>
    </div>
  );
}
