import React, { useState } from 'react';
import { Input, Button, Form } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, IdcardOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import { useStore } from '../store';
import CodeInput from './CodeInput';
import { Brand } from './Brand';

const RegisterPage: React.FC = () => {
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
            <h2 className="erp-login-title">Create Account</h2>
            <p className="erp-login-subtitle">Fill in your details to register</p>

            <Form onFinish={handleRegister} layout="vertical" size="large">
              <Form.Item
                name="name"
                rules={[{ required: true, message: 'Please enter your name' }]}
              >
                <Input
                  prefix={<IdcardOutlined className="text-[#bfbfbf]" />}
                  placeholder="Name"
                  className="erp-login-input"
                />
              </Form.Item>

              <Form.Item
                name="email"
                rules={[
                  { required: true, message: 'Please enter your email' },
                  { type: 'email', message: 'Please enter a valid email' },
                ]}
              >
                <Input
                  prefix={<MailOutlined className="text-[#bfbfbf]" />}
                  placeholder="Email"
                  autoComplete="email"
                  className="erp-login-input"
                />
              </Form.Item>

              <Form.Item
                name="login"
                rules={[{ required: true, message: 'Please enter a username' }]}
              >
                <Input
                  prefix={<UserOutlined className="text-[#bfbfbf]" />}
                  placeholder="Username"
                  autoComplete="username"
                  className="erp-login-input"
                />
              </Form.Item>

              <Form.Item
                name="password"
                rules={[
                  { required: true, message: 'Please enter a password' },
                  { min: 6, message: 'Password must be at least 6 characters' },
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined className="text-[#bfbfbf]" />}
                  placeholder="Password"
                  autoComplete="new-password"
                  className="erp-login-input"
                />
              </Form.Item>

              <Form.Item
                name="confirm"
                dependencies={['password']}
                rules={[
                  { required: true, message: 'Please confirm your password' },
                  ({ getFieldValue }) => ({
                    validator(_: unknown, value: string) {
                      if (!value || getFieldValue('password') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('Passwords do not match'));
                    },
                  }),
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined className="text-[#bfbfbf]" />}
                  placeholder="Confirm password"
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
                  Send Verification Code
                </Button>
              </Form.Item>
            </Form>

            <div style={{ textAlign: 'center', marginTop: 14 }}>
              <button
                type="button"
                className="erp-login-link"
                onClick={() => setAuthView('login')}
              >
                &larr; Back to login
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="erp-login-title">Verify Email</h2>
            <p className="erp-login-subtitle">
              A 6-digit code was sent to your email (check server console)
            </p>

            <div style={{ margin: '20px 0' }}>
              <CodeInput onComplete={handleVerify} disabled={loading} />
            </div>

            {error && (
              <div className="erp-login-error">{error}</div>
            )}

            {loading && (
              <div style={{ textAlign: 'center', color: '#8c8c8c', marginTop: 12 }}>
                Verifying...
              </div>
            )}

            <div style={{ textAlign: 'center', marginTop: 14 }}>
              <button
                type="button"
                className="erp-login-link"
                onClick={() => { setStep('form'); setError(''); }}
              >
                &larr; Back
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default RegisterPage;
