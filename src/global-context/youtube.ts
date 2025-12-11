import { google } from "googleapis";
import { isErr, parseError, wrap } from "trynot";
import { $env } from "../env";

export function createYoutubeClient() {
  const auth = new google.auth.OAuth2(
    $env.GOOGLE_CLIENT_ID,
    $env.GOOGLE_CLIENT_SECRET,
    $env.GOOGLE_OAUTH_REDIRECT,
  );

  const client = google.youtube({ version: "v3", auth: auth });

  auth.on("tokens", async (tokens) => {
    console.log(JSON.stringify({ tokens }, null, 2));
    if (tokens.refresh_token) {
      console.log("writing refresh token...");
      try {
        await Bun.write("data/refresh.txt", tokens.refresh_token);
        console.log("writing refresh token... done");
      } catch (error) {
        console.log("failed to write refresh token", parseError(error).message);
        throw error;
      }
    }
  });

  const file = Bun.file("data/refresh.txt");
  console.log("initializing...");
  const initialization = file
    .exists()
    .then((exists) => {
      console.log("exists?", exists);
      if (exists) {
        console.log("reading...");
        return file
          .text()
          .then((refresh_token) => {
            console.log("read", refresh_token);
            auth.setCredentials({ refresh_token });
          })
          .catch((error) => {
            console.log("failed to read:", parseError(error).message);
            throw error;
          });
      }
    })
    .catch((error) => {
      console.log("failed to initialize:", parseError(error).message);
      throw error;
    });

  return {
    client,
    isAuthenticated: async () => {
      console.log("awaiting initialization...");
      await initialization.catch((error) => {
        console.log("initialization failed:", parseError(error).message);
        return undefined;
      });
      console.log("awaiting initialization... done");
      const result = await wrap(auth.getAccessToken());
      if (isErr(result)) {
        console.log("failed to retrieve access token:", result.message);
        return false;
      }
      if (!result.token) {
        console.log("no access token", JSON.stringify({ result }, null, 2));
        return false;
      }
      console.log("all good");
      return true;
    },
    generateAuthUrl: () => {
      return auth.generateAuthUrl({
        access_type: "offline",
        prompt: "consent", // Force re-issue of refresh token
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
