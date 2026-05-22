import React, { useState } from 'react';
import { Input, Button, Form } from 'antd';
import { LockOutlined, MailOutlined, UserOutlined, SafetyOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store';
import CodeInput from './CodeInput';
import { Brand } from './Brand';

const ForgotPasswordPage: React.FC = () => {
  const { t } = useTranslation('auth');
  const forgotPassword = useStore((s) => s.forgotPassword);
  const resetPassword = useStore((s) => s.resetPassword);
  const setAuthView = useStore((s) => s.setAuthView);

  const [step, setStep] = useState<'email' | 'reset'>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const [message, setMessage] = useState('');
  const [userIdInput, setUserIdInput] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleEmailSubmit = async (values: { email: string }) => {
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const result = await forgotPassword(values.email);
      setMessage(result.message);
      setStep('reset');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Request failed');
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    const uid = parseInt(userIdInput, 10);
    if (!uid) {
      setError(t('forgot.userIdRequired'));
      return;
    }
    if (!code || code.length < 6) {
      setError(t('forgot.codeRequired'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t('forgot.confirmPasswordMismatch'));
      return;
    }
    if (newPassword.length < 6) {
      setError(t('forgot.passwordMinLength'));
      return;
    }
    setError('');
    setLoading(true);
    try {
      await resetPassword(uid, code, newPassword);
      setAuthView('login');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Reset failed');
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="erp-login-page">
      <div className="erp-login-blob erp-login-blob-1" />
      <div className="erp-login-blob erp-login-blob-2" />
      <div className="erp-login-blob erp-login-blob-3" />

      <Brand />

      <motion.div
        className="erp-login-card"
        initial={{ opacity: 0, y: 24 }}
        animate={shake ? { x: [0, -10, 10, -10, 10, 0] } : { opacity: 1, y: 0 }}
        transition={shake
          ? { duration: 0.4 }
          : { duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      >
        {step === 'email' ? (
          <>
            <h2 className="erp-login-title">{t('forgot.title')}</h2>
            <p className="erp-login-subtitle">{t('forgot.subtitle')}</p>

            <Form onFinish={handleEmailSubmit} layout="vertical" size="large">
              <Form.Item
                name="email"
                rules={[
                  { required: true, message: t('forgot.emailRequired') },
                  { type: 'email', message: t('forgot.emailInvalid') },
                ]}
              >
                <Input
                  prefix={<MailOutlined className="text-[#bfbfbf]" />}
                  placeholder={t('forgot.email')}
                  autoComplete="email"
                  className="erp-login-input"
                />
              </Form.Item>

              {error && <div className="erp-login-error">{error}</div>}
              {message && (
                <div style={{ color: '#52c41a', fontSize: 13, marginBottom: 12 }}>{message}</div>
              )}

              <Form.Item style={{ marginBottom: 0 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  className="erp-login-btn"
                  block
                >
                  {t('forgot.sendCode')}
                </Button>
              </Form.Item>
            </Form>

            <div style={{ textAlign: 'center', marginTop: 14 }}>
              <button
                type="button"
                className="erp-login-link"
                onClick={() => setAuthView('login')}
              >
                {t('links.backToLogin')}
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="erp-login-title">{t('forgot.resetTitle')}</h2>
            <p className="erp-login-subtitle">{t('forgot.resetSubtitle')}</p>

            <form onSubmit={handleReset}>
              <div style={{ marginBottom: 16 }}>
                <Input
                  prefix={<UserOutlined className="text-[#bfbfbf]" />}
                  placeholder={t('forgot.userIdPlaceholder')}
                  value={userIdInput}
                  onChange={(e) => setUserIdInput(e.target.value)}
                  className="erp-login-input"
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <SafetyOutlined className="text-[#bfbfbf]" />
                  <span style={{ fontSize: 13, color: '#8c8c8c' }}>{t('forgot.resetCodeLabel')}</span>
                </div>
                <CodeInput onComplete={(c) => setCode(c)} disabled={loading} />
              </div>

              <div style={{ marginBottom: 12 }}>
                <Input.Password
                  prefix={<LockOutlined className="text-[#bfbfbf]" />}
                  placeholder={t('forgot.newPasswordPlaceholder')}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="erp-login-input"
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <Input.Password
                  prefix={<LockOutlined className="text-[#bfbfbf]" />}
                  placeholder={t('forgot.confirmPasswordPlaceholder')}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="erp-login-input"
                  style={{ width: '100%' }}
                />
              </div>

              {error && <div className="erp-login-error">{error}</div>}

              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                className="erp-login-btn"
                block
              >
                {t('forgot.resetButton')}
              </Button>
            </form>

            <div style={{ textAlign: 'center', marginTop: 14 }}>
              <button
                type="button"
                className="erp-login-link"
                onClick={() => { setStep('email'); setError(''); }}
              >
                {t('links.back')}
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default ForgotPasswordPage;
