import React, { useState } from 'react';
import { Input, Button, Form } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, IdcardOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store';
import CodeInput from './CodeInput';
import { Brand } from './Brand';

const RegisterPage: React.FC = () => {
  const { t } = useTranslation('auth');
  const register = useStore((s) => s.register);
  const verifyRegistration = useStore((s) => s.verifyRegistration);
  const setAuthView = useStore((s) => s.setAuthView);

  const [step, setStep] = useState<'form' | 'verify'>('form');
  const [userId, setUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);

  const handleRegister = async (values: {
    name: string;
    email: string;
    login: string;
    password: string;
  }) => {
    setError('');
    setLoading(true);
    try {
      const result = await register(values);
      setUserId(result.userId);
      setStep('verify');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Registration failed');
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (code: string) => {
    if (!userId) return;
    setError('');
    setLoading(true);
    try {
      await verifyRegistration(userId, code);
      setAuthView('login');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Verification failed');
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
        {step === 'form' ? (
          <>
            <h2 className="erp-login-title">{t('register.title')}</h2>
            <p className="erp-login-subtitle">{t('register.subtitle')}</p>

            <Form onFinish={handleRegister} layout="vertical" size="large">
              <Form.Item
                name="name"
                rules={[{ required: true, message: t('register.nameRequired') }]}
              >
                <Input
                  prefix={<IdcardOutlined className="text-[#bfbfbf]" />}
                  placeholder={t('register.name')}
                  className="erp-login-input"
                />
              </Form.Item>

              <Form.Item
                name="email"
                rules={[
                  { required: true, message: t('register.emailRequired') },
                  { type: 'email', message: t('register.emailInvalid') },
                ]}
              >
                <Input
                  prefix={<MailOutlined className="text-[#bfbfbf]" />}
                  placeholder={t('register.email')}
                  autoComplete="email"
                  className="erp-login-input"
                />
              </Form.Item>

              <Form.Item
                name="login"
                rules={[{ required: true, message: t('register.usernameRequired') }]}
              >
                <Input
                  prefix={<UserOutlined className="text-[#bfbfbf]" />}
                  placeholder={t('register.username')}
                  autoComplete="username"
                  className="erp-login-input"
                />
              </Form.Item>

              <Form.Item
                name="password"
                rules={[
                  { required: true, message: t('register.passwordRequired') },
                  { min: 6, message: t('register.passwordMinLength') },
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined className="text-[#bfbfbf]" />}
                  placeholder={t('register.password')}
                  autoComplete="new-password"
                  className="erp-login-input"
                />
              </Form.Item>

              <Form.Item
                name="confirm"
                dependencies={['password']}
                rules={[
                  { required: true, message: t('register.confirmRequired') },
                  ({ getFieldValue }) => ({
                    validator(_: unknown, value: string) {
                      if (!value || getFieldValue('password') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error(t('register.confirmPasswordMismatch')));
                    },
                  }),
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined className="text-[#bfbfbf]" />}
                  placeholder={t('register.confirmPassword')}
                  autoComplete="new-password"
                  className="erp-login-input"
                />
              </Form.Item>

              {error && (
                <div className="erp-login-error">{error}</div>
              )}

              <Form.Item style={{ marginBottom: 0 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  className="erp-login-btn"
                  block
                >
                  {t('register.sendCode')}
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
            <h2 className="erp-login-title">{t('register.verifyTitle')}</h2>
            <p className="erp-login-subtitle">{t('register.verifySubtitle')}</p>

            <div style={{ margin: '20px 0' }}>
              <CodeInput onComplete={handleVerify} disabled={loading} />
            </div>

            {error && (
              <div className="erp-login-error">{error}</div>
            )}

            {loading && (
              <div style={{ textAlign: 'center', color: '#8c8c8c', marginTop: 12 }}>
                {t('register.verifying')}
              </div>
            )}

            <div style={{ textAlign: 'center', marginTop: 14 }}>
              <button
                type="button"
                className="erp-login-link"
                onClick={() => { setStep('form'); setError(''); }}
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

export default RegisterPage;
