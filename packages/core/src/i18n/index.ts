import i18n from 'i18next';

const errorResources = {
  zh_CN: {
    errors: {
      auth: {
        invalid_credentials: '用户名或密码错误',
        login_password_required: '请输入用户名和密码',
        password_too_short: '密码长度不能少于6位',
        user_exists: '该用户名已存在',
        email_exists: '该邮箱已被注册',
        user_id_code_required: '用户ID和验证码为必填项',
        invalid_code: '验证码无效或已过期',
        email_required: '邮箱为必填项',
        user_id_code_password_required: '用户ID、验证码和新密码为必填项',
        invalid_reset_code: '重置码无效或已过期',
        name_login_password_email_required: '姓名、用户名、密码和邮箱为必填项',
      },
      validation: {
        required: '{{field}} 为必填项',
      },
    },
  },
  en_US: {
    errors: {
      auth: {
        invalid_credentials: 'Invalid username or password',
        login_password_required: 'Login and password are required',
        password_too_short: 'Password must be at least 6 characters',
        user_exists: 'A user with this login already exists',
        email_exists: 'A user with this email already exists',
        user_id_code_required: 'User ID and code are required',
        invalid_code: 'Invalid or expired verification code',
        email_required: 'Email is required',
        user_id_code_password_required: 'User ID, code, and new password are required',
        invalid_reset_code: 'Invalid or expired reset code',
        name_login_password_email_required: 'Name, login, password, and email are required',
      },
      validation: {
        required: '{{field}} is required',
      },
    },
  },
};

i18n.init({
  resources: errorResources,
  fallbackLng: 'en_US',
  defaultNS: 'errors',
  interpolation: { escapeValue: false },
});

export function getRequestLocale(langHeader?: string): string {
  if (!langHeader) return 'en_US';

  const locales = langHeader
    .split(',')
    .map((entry) => {
      const [tag, qRaw] = entry.trim().split(';');
      const q = qRaw ? parseFloat(qRaw.split('=')[1] ?? '1') : 1;
      return { tag: tag.trim(), q };
    })
    .sort((a, b) => b.q - a.q);

  for (const { tag } of locales) {
    if (tag === 'zh-CN' || tag === 'zh') return 'zh_CN';
    if (tag.startsWith('zh')) return 'zh_CN';
    if (tag === 'en-US' || tag === 'en') return 'en_US';
    if (tag.startsWith('en')) return 'en_US';
  }

  return 'en_US';
}

export function tError(lang: string, key: string, params?: Record<string, unknown>): string {
  return i18n.getFixedT(lang)(key, params);
}

export default i18n;
