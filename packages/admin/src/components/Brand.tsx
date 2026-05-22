import React from 'react';
import { useTranslation } from 'react-i18next';

export const Brand: React.FC = () => {
  const { t } = useTranslation('common');

  return (
    <div className="erp-login-brand">
      <div className="erp-login-brand-icon">A</div>
      <div>
        <div className="erp-login-brand-name">Agent ERP</div>
        <div className="erp-login-brand-sub">{t('brand.subtitle')}</div>
      </div>
    </div>
  );
};
