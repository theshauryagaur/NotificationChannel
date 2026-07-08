function validateNotificationRequest(body) {
    const { message, channels, targetUsers } = body;

    if (!message || !channels || !targetUsers || targetUsers.length === 0) {
        throw new Error('Invalid request. Please provide message, channels, and target users.');
    }

    if (typeof message !== 'string' || typeof channels !== 'string' || !Array.isArray(targetUsers)) {
        throw new Error('Invalid data types in request.');
    }
}

module.exports = {
    validateNotificationRequest,
};
