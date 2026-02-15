/**
 * Quick test: verify we can extract invite data for all 3 members
 */
const { getInviteDataFromGmail } = require('../utils/gmail-invite-reader');

async function test() {
  const members = [
    'aroradivyansh995+projectmgr47@gmail.com',
    'aroradivyansh995+siteengineer47@gmail.com',
    'aroradivyansh995+safety47@gmail.com',
  ];

  for (const email of members) {
    console.log('\n--- Testing: ' + email + ' ---');
    try {
      const data = await getInviteDataFromGmail(email, 15000);
      console.log('LINK: ' + data.link);
      console.log('OTP:  ' + data.otp);
    } catch (err) {
      console.log('ERROR: ' + err.message);
    }
  }
}
test();
