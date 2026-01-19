export {}

declare global {
  interface Window {
    google?: typeof google
  }

  namespace google {
    namespace accounts {
      namespace oauth2 {
        interface TokenResponse {
          access_token?: string
          expires_in?: number
          scope?: string
          token_type?: string
          error?: string
          error_description?: string
        }

        interface TokenClient {
          callback: (response: TokenResponse) => void
          requestAccessToken: (options?: { prompt?: string }) => void
        }

        function initTokenClient(options: {
          client_id: string
          scope: string
          callback: (response: TokenResponse) => void
        }): TokenClient

        function revoke(token: string, done: () => void): void
      }

      namespace id {
        function initialize(options: {
          client_id: string
          callback: (response: { credential?: string }) => void
          auto_select?: boolean
        }): void

        function prompt(momentListener?: (notification: any) => void): void
      }
    }
  }
}
