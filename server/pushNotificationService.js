const webpush = require('web-push');
const subDatabase = [];

const apiKeys = {
    publicKey: process.env.PUBLIC_KEY,
    privateKey: process.env.PRIVATE_KEY
}

webpush.setVapidDetails(
    'mailto:test@example.com',
    apiKeys.publicKey,
    apiKeys.privateKey
)

// Configure web push notifications
webpush.setVapidDetails('mailto:test@test.com', process.env.PUBLIC_KEY, process.env.PRIVATE_KEY);

const sendPush = async (message, targetUsers) => {
    // In case of database and different users
    let pushSubscriptions = targetUsers.map(user => getUserPushSubscription(user));

    // pushing to all clients right now
    pushSubscriptions = [...subDatabase];

    const sendPromises = pushSubscriptions.map(async (subscription) => {
        try {
            await webpush.sendNotification(subscription, message);
        } catch (error) {
            console.warn('⚠️ WebPush error for subscription:', error.endpoint, error.message);
            // If subscription has expired or is unsubscribed (410 or 404), remove it from database
            if (error.statusCode === 410 || error.statusCode === 404) {
                const index = subDatabase.findIndex(sub => sub.endpoint === subscription.endpoint);
                if (index !== -1) {
                    subDatabase.splice(index, 1);
                    console.log('🧹 Cleaned up expired subscription:', subscription.endpoint);
                }
            }
        }
    });

    await Promise.all(sendPromises);
}

const insertPushSubscription = subscription => subDatabase.push(subscription);

module.exports = {
    sendPush, insertPushSubscription
};

function getUserPushSubscription(user) {
    // Retrieve user's push subscription details, for example from a database
    return {
        endpoint: user.endpoint,
        keys: {
            auth: user.authKey,
            p256dh: user.p256dhKey,
        },
    };
}
