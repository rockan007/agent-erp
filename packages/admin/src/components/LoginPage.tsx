import React, { useState } from 'react';
import { Input, Button, Form } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import { useStore } from '../store';

const LoginPage: React.FC = () => {
  const login = useStore((s) => s.login);
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
      <div className="erp-login-brand">
        <div className="erp-login-brand-icon">A</div>
        <div>
          <div className="erp-login-brand-name">Agent ERP</div>
          <div className="erp-login-brand-sub">智能企业管理平台</div>
        </div>
      </div>

      {/* Login card */}
      <motion.div
        className="erp-login-card"
        initial={{ opacity: 0, y: 24 }}
        animate={shake ? { x: [0, -10, 10, -10, 10, 0] } : { opacity: 1, y: 0 }}
        transition={shake
          ? { duration: 0.4 }
          : { duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      >
        <h2 className="erp-login-title">欢迎登录</h2>
        <p className="erp-login-subtitle">请输入您的账号信息</p>

        <Form onFinish={handleSubmit} layout="vertical" size="large">
          <Form.Item
            name="login"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input
              prefix={<UserOutlined className="text-[#bfbfbf]" />}
              placeholder="用户名"
              autoComplete="username"
              className="erp-login-input"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined className="text-[#bfbfbf]" />}
              placeholder="密码"
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
              登 录
            </Button>
          </Form.Item>
        </Form>
      </motion.div>
    </div>
  );
};

export default LoginPage;
