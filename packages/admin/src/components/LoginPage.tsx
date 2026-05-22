import React, { useState } from 'react';
import { Input, Button, Form } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store';
import { Brand } from './Brand';

const LoginPage: React.FC = () => {
  const { t } = useTranslation('auth');
  const login = useStore((s) => s.login);
  const setAuthView = useStore((s) => s.setAuthView);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const [exiting, setExiting] = useState(false);

  const handleSubmit = async (values: { login: string; password: string }) => {
    setError('');
    setLoading(true);
    try {
      await login(values.login, values.password);
      setExiting(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Login failed');
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } finally {
      setLoading(false);
    }
  };

  if (exiting) {
    return (
      <motion.div
        className="erp-login-page"
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      />
    );
  }

  return (
    <div className="erp-login-page">
      {/* Gradient blobs */}
      <div className="erp-login-blob erp-login-blob-1" />
      <div className="erp-login-blob erp-login-blob-2" />
      <div className="erp-login-blob erp-login-blob-3" />

      {/* Top-left brand */}
      <Brand />

      {/* Login card */}
      <motion.div
        className="erp-login-card"
        initial={{ opacity: 0, y: 24 }}
        animate={shake ? { x: [0, -10, 10, -10, 10, 0] } : { opacity: 1, y: 0 }}
        transition={shake
          ? { duration: 0.4 }
          : { duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      >
        <h2 className="erp-login-title">{t('login.title')}</h2>
        <p className="erp-login-subtitle">{t('login.subtitle')}</p>

        <Form onFinish={handleSubmit} layout="vertical" size="large">
          <Form.Item
            name="login"
            rules={[{ required: true, message: t('login.usernameRequired') }]}
          >
            <Input
              prefix={<UserOutlined className="text-[#bfbfbf]" />}
              placeholder={t('login.usernamePlaceholder')}
              autoComplete="username"
              className="erp-login-input"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: t('login.passwordRequired') }]}
          >
            <Input.Password
              prefix={<LockOutlined className="text-[#bfbfbf]" />}
              placeholder={t('login.passwordPlaceholder')}
              autoComplete="current-password"
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
              {t('login.submit')}
            </Button>
          </Form.Item>

          <div className="erp-login-links">
            <button
              type="button"
              className="erp-login-link"
              onClick={() => setAuthView('register')}
            >
              {t('links.createAccount')}
            </button>
            <button
              type="button"
              className="erp-login-link erp-login-link-muted"
              onClick={() => setAuthView('forgot-password')}
            >
              {t('links.forgotPassword')}
            </button>
          </div>
        </Form>
      </motion.div>
    </div>
  );
};

export default LoginPage;
