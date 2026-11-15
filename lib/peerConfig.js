/**
 * Configuração compartilhada do PeerJS.
 * Usada pela central (context/CallCenterContext.js) e pelo
 * dispositivo do elevador (app/dispositivo/[peerId]/page.js).
 */

// ID fixo da central. O elevador só aceita ligações vindas deste ID.
export const CENTRAL_PEER_ID = "unicap-central-atendimento";

/**
 * Monta as opções do Peer.
 *
 * STUN sozinho funciona em muitas redes, mas redes de universidade
 * costumam bloquear a conexão direta. Para garantir o áudio, configure
 * um servidor TURN nas variáveis de ambiente (Vercel e .env.local):
 *
 *   NEXT_PUBLIC_TURN_URL=turn:SEU_SERVIDOR:3478
 *   NEXT_PUBLIC_TURN_USERNAME=usuario
 *   NEXT_PUBLIC_TURN_CREDENTIAL=senha
 *
 * (Pode listar mais de uma URL separando por vírgula.)
 */
export function criarOpcoesPeer() {
  const iceServers = [{ urls: "stun:stun.l.google.com:19302" }];

  const turnUrl = process.env.NEXT_PUBLIC_TURN_URL;
  const turnUser = process.env.NEXT_PUBLIC_TURN_USERNAME;
  const turnCredential = process.env.NEXT_PUBLIC_TURN_CREDENTIAL;

  if (turnUrl && turnUser && turnCredential) {
    iceServers.push({
      urls: turnUrl.split(",").map((url) => url.trim()),
      username: turnUser,
      credential: turnCredential,
    });
  }

  return {
    debug: 3,
    config: { iceServers },
  };
}