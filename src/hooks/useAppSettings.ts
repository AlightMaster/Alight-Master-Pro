import { useState, useEffect } from 'react';

export function useAppSettings() {
  const [websiteName, setWebsiteName] = useState(() => localStorage.getItem('alight_website_name') || 'AlightMaster');
  const [appName, setAppName] = useState(() => localStorage.getItem('alight_app_name') || 'Alight Motion Pro');
  const [appPublisher, setAppPublisher] = useState(() => localStorage.getItem('alight_app_publisher') || 'Alight Creative');

  useEffect(() => {
    const handleUpdate = () => {
      setWebsiteName(localStorage.getItem('alight_website_name') || 'AlightMaster');
      setAppName(localStorage.getItem('alight_app_name') || 'Alight Motion Pro');
      setAppPublisher(localStorage.getItem('alight_app_publisher') || 'Alight Creative');
    };

    window.addEventListener('alight_settings_updated', handleUpdate);
    return () => window.removeEventListener('alight_settings_updated', handleUpdate);
  }, []);

  return { websiteName, appName, appPublisher };
}
