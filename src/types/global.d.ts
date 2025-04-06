declare global {
  interface Window {
    google?: {
      accounts: {
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
      };
    };
    FB?: {
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
    };
    fbAsyncInit?: () => void;
  }
}

export {}; 