const { getInviteDataFromGmail } = require('../utils/gmail-invite-reader');

async function getLink() {
  const data = await getInviteDataFromGmail('aroradivyansh995+projectmgr49@gmail.com', 30000);
  console.log('LINK: ' + data.link);
  console.log('OTP: ' + data.otp);
}
getLink();
