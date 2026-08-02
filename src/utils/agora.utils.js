const { RtcTokenBuilder, RtcRole } = require("agora-token");

console.log("RtcRole:", RtcRole);
console.log("RtcTokenBuilder:", RtcTokenBuilder);

const generateAgoraToken = (channelName, uid, expirySeconds = 3600) => {
  const appId = process.env.AGORA_APP_ID;
  const appCertificate = process.env.AGORA_APP_CERTIFICATE;

  console.log({
    appId,
    appCertificate,
    appIdLength: appId?.length,
    appCertificateLength: appCertificate?.length,
    channelName,
    uid,
    role: RtcRole.PUBLISHER,
  });

  const currentTime = Math.floor(Date.now() / 1000);
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

  console.log("Generated Token:", token);

  return token;
};

module.exports = { generateAgoraToken };
