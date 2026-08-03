'use client';

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Image from 'next/image';
import logoImg from '../../../public/logo.png';

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
        router.push('/');
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
          maxWidth: '420px',
          padding: '40px 32px',
          textAlign: 'center',
          background: '#ffffff',
          borderRadius: '24px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)',
        }}
      >
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
            <Image
              src={logoImg}
              alt="Logo GEN HD"
              width={72}
              height={72}
              style={{ objectFit: 'contain' }}
              priority
            />
          </div>
          <h1
            style={{
              fontSize: '1.8rem',
              fontWeight: '800',
              color: '#0284c7',
              letterSpacing: '-0.025em',
            }}
          >
            GEN HD
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '4px', fontWeight: '500' }}>
            Hệ thống quản lý phiếu xét nghiệm tế bào
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
            {loading ? 'Đang đăng nhập...' : '🔑 Đăng nhập'}
          </button>
        </form>
      </div>
    </div>
  );
}
