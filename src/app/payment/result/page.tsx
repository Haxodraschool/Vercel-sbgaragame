'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';

function PaymentResultContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'cancel' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [goldAmount, setGoldAmount] = useState<number | null>(null);
  const [countdown, setCountdown] = useState(5);

  const orderCode = searchParams.get('orderCode');
  const paramStatus = searchParams.get('status');

  useEffect(() => {
    if (paramStatus === 'cancel') {
      setStatus('cancel');
      setMessage('Bạn đã hủy thanh toán.');
      return;
    }

    if (!orderCode) {
      setStatus('error');
      setMessage('Không tìm thấy mã đơn hàng.');
      return;
    }

    // Poll for payment status
    const token = localStorage.getItem('sb-token');
    let attempts = 0;
    const maxAttempts = 10;

    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/payment/status?orderCode=${orderCode}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();

        if (res.ok) {
          if (data.status === 'PAID') {
            setStatus('success');
            setGoldAmount(data.goldAmount);
            setMessage(`Nạp thành công ${data.goldAmount?.toLocaleString()} Vàng!`);
            return;
          }
          if (data.status === 'CANCELLED') {
            setStatus('cancel');
            setMessage('Đơn hàng đã bị hủy.');
            return;
          }
          if (data.status === 'EXPIRED') {
            setStatus('error');
            setMessage('Đơn hàng đã hết hạn.');
            return;
          }
        }

        // Still pending, retry
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(checkStatus, 2000);
        } else {
          setStatus('error');
          setMessage('Không thể xác nhận thanh toán. Vui lòng kiểm tra lại số dư.');
        }
      } catch {
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(checkStatus, 2000);
        } else {
          setStatus('error');
          setMessage('Lỗi kết nối server.');
        }
      }
    };

    checkStatus();
  }, [orderCode, paramStatus]);

  // Countdown and redirect
  useEffect(() => {
    if (status === 'loading') return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [status, router]);

  const statusConfig = {
    loading: { color: 'text-blue-400', bg: 'border-blue-500/40', icon: '⏳' },
    success: { color: 'text-emerald-400', bg: 'border-emerald-500/40', icon: '✅' },
    cancel: { color: 'text-yellow-400', bg: 'border-yellow-500/40', icon: '⚠️' },
    error: { color: 'text-red-400', bg: 'border-red-500/40', icon: '❌' },
  };

  const config = statusConfig[status];

  return (
    <div className="min-h-screen bg-[#0a0a12] flex items-center justify-center p-4">
      <div className={`w-full max-w-md bg-[#0a0a12] border-2 ${config.bg} rounded-xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]`}>
        <div className="p-8 text-center space-y-6">
          <div className="text-5xl">{config.icon}</div>

          <h1 className={`text-2xl font-black ${config.color} tracking-wider`}>
            {status === 'loading' && 'ĐANG XỬ LÝ...'}
            {status === 'success' && 'THANH TOÁN THÀNH CÔNG'}
            {status === 'cancel' && 'ĐÃ HỦY'}
            {status === 'error' && 'LỖI THANH TOÁN'}
          </h1>

          <p className="text-slate-300 text-sm">{message}</p>

          {goldAmount && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
              <div className="text-[10px] text-yellow-500/60 uppercase tracking-wider mb-1">Nhận được</div>
              <div className="text-3xl font-black text-yellow-400">
                +{goldAmount.toLocaleString()} Vàng
              </div>
            </div>
          )}

          {status === 'loading' && (
            <div className="flex justify-center">
              <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {status !== 'loading' && (
            <div className="space-y-3">
              <button
                onClick={() => router.push('/')}
                className="w-full py-3 bg-yellow-500 text-black font-bold rounded-lg hover:bg-yellow-400 transition-colors"
              >
                QUAY LẠI GAME
              </button>
              <p className="text-[10px] text-slate-500">
                Tự động quay lại sau {countdown}s
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PaymentResultPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a12] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <PaymentResultContent />
    </Suspense>
  );
}
