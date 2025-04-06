interface GoogleAccount {
  id: {
    initialize: (config: {
      client_id: string;
      callback: (response: { credential: string }) => void;
    }) => void;
    renderButton: (
      element: HTMLElement | null,
      options: {
        theme?: string;
        size?: string;
        text?: string;
        width?: string | number;
      }
    ) => void;
  };
}

interface FacebookSDK {
  init: (config: {
    appId: string;
    cookie?: boolean;
    xfbml?: boolean;
    version: string;
  }) => void;
  login: (
    callback: (response: {
      authResponse?: {
        accessToken: string;
      };
    }) => void,
    options?: { scope: string }
  ) => void;
}

declare global {
  interface Window {
    google?: {
      accounts: GoogleAccount;
    };
    FB?: FacebookSDK;
  }
} 