import Parse from "parse/node";

export function configurarParse() {
  const applicationId = process.env.BACK4APP_APPLICATION_ID;
  const masterKey = process.env.BACK4APP_MASTER_KEY;
  const serverURL = process.env.BACK4APP_SERVER_URL;

  if (!applicationId || !masterKey || !serverURL) {
    throw new Error(
      "Configuração do Back4App incompleta. Confira o arquivo .env.local."
    );
  }

  Parse.initialize(applicationId, undefined, masterKey);
  Parse.serverURL = serverURL;

  return Parse;
}