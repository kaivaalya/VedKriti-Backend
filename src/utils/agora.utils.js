const { RtcTokenBuilder, RtcRole } = require('agora-token');


const generateAgoraToken = (channelName, uid, expirySeconds = 3600) => {
  const appId          = process.env.AGORA_APP_ID;
  const appCertificate = process.env.AGORA_APP_CERTIFICATE;

  if (!appId || !appCertificate) {
    throw new Error('AGORA_APP_ID and AGORA_APP_CERTIFICATE must be set in environment variables.');
  }

  const currentTime  = Math.floor(Date.now() / 1000);
  const privilegeExpireTime = currentTime + expirySeconds;

  const token = RtcTokenBuilder.buildTokenWithUid(
    appId,
    appCertificate,
    channelName,
    uid,
    RtcRole.PUBLISHER,
    privilegeExpireTime,
    privilegeExpireTime
  );

  return token;
};

module.exports = { generateAgoraToken };
