import { google } from "googleapis";
import { $env } from "../env";

export function createYoutubeClient() {
  const auth = new google.auth.OAuth2(
    $env.GOOGLE_CLIENT_ID,
    $env.GOOGLE_CLIENT_SECRET,
    $env.GOOGLE_OAUTH_REDIRECT,
  );

  const client = google.youtube({
    version: "v3",
    auth: auth,
  });

  auth.on("tokens", async (tokens) => {
    console.log("new tokens", tokens);
    if (tokens.refresh_token) {
      await Bun.write("refresh.txt", tokens.refresh_token);
    }
  });

  const file = Bun.file("refresh.txt");
  const initialization = file.exists().then((exists) => {
    if (exists) {
      return file.text().then((refresh_token) => {
        auth.setCredentials({
          refresh_token,
        });
      });
    }
  });

  return {
    client,
    isAuthenticated: async () => {
      await initialization;
      return (
        !!auth.credentials.refresh_token || !!auth.credentials.access_token
      );
    },
    generateAuthUrl: () => {
      return auth.generateAuthUrl({
        access_type: "offline",
        scope: ["https://www.googleapis.com/auth/youtube"],
      });
    },
    authenticate: async (input: { code: string }) => {
      try {
        const { tokens } = await auth.getToken(input.code);
        auth.setCredentials(tokens);
      } catch (error) {
        console.log("error", error);
      }
    },
  };
}
