
import Parse from "parse/node";

export function configurarParse() {
  const applicationId = process.env.BACK4APP_APPLICATION_ID;
  const masterKey = process.env.BACK4APP_MASTER_KEY;
  const serverURL = process.env.BACK4APP_SERVER_URL;

  if (!applicationId || !masterKey || !serverURL) {
    throw new Error("Configuração do Back4App incompleta.");
  }

  Parse.initialize(applicationId, undefined, masterKey);
  Parse.serverURL = serverURL;

  return Parse;
}

export async function usuarioEhAdmin(Parse, userId) {
  const roleQuery = new Parse.Query(Parse.Role);
  roleQuery.equalTo("name", "Admin");

  const role = await roleQuery.first({ useMasterKey: true });

  if (!role) {
    return false;
  }

  const usuariosDaRole = role.getUsers().query();
  usuariosDaRole.equalTo("objectId", userId);

  const usuarioNaRole = await usuariosDaRole.first({
    useMasterKey: true,
  });

  return Boolean(usuarioNaRole);
}
