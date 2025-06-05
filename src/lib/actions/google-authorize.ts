export const handleConnectGoogleDrive = () => {
  // Mở một popup tới API route phía backend
  const width = 500,
    height = 600;
  const left = (window.innerWidth - width) / 2;
  const top = (window.innerHeight - height) / 2;
  window.open(
    '/api/oauth/google-drive/start',
    'GoogleDriveAuth',
    `width=${width},height=${height},top=${top},left=${left}`
  );
};
