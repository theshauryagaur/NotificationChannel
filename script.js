// Notification Channel Frontend Script
// Handles push subscription, form submission, and UI feedback
console.log('📢 script.js has loaded successfully!');

// ----- Permission & Service Worker -----
const checkPermission = () => {
    console.log('🔍 Checking permissions...');
    if (!('serviceWorker' in navigator)) {
        throw new Error('No support for service worker!');
    }
    if (!('Notification' in window)) {
        throw new Error('No support for notification API');
    }
    if (!('PushManager' in window)) {
        throw new Error('No support for Push API');
    }
};

const registerSW = async () => {
    const registration = await navigator.serviceWorker.register('sw.js');
    return registration;
};

const requestNotificationPermission = async () => {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
        throw new Error('Notification permission not granted');
    }
};

const urlBase64ToUint8Array = base64String => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
}

// ----- Push Subscription -----
const subscribePush = async () => {
    console.log('按钮/Button clicked: subscribePush invoked!');
    try {
        console.log('Step 1: Checking browser support...');
        checkPermission();
        
        console.log('Step 2: Requesting notification permission...');
        await requestNotificationPermission();
        
        console.log('Step 3: Registering Service Worker...');
        const registration = await registerSW();
        console.log('Service Worker registered:', registration);

        console.log('Step 4: Checking existing subscription...');
        let subscription = await registration.pushManager.getSubscription();
        if (subscription) {
            console.log('Existing subscription found, unsubscribing...');
            await subscription.unsubscribe();
            console.log('Unsubscribed from old push subscription.');
        }

        console.log('Step 5: Fetching VAPID public key from backend...');
        const keyResponse = await fetch('http://localhost:3000/vapid-public-key');
        const { publicKey } = await keyResponse.json();
        console.log('VAPID Public Key fetched:', publicKey);
        
        console.log('Step 6: Subscribing to push manager...');
        subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(publicKey)
        });
        console.log('Push subscription created successfully:', subscription);

        console.log('Step 7: Saving subscription to the backend database...');
        const saveResponse = await fetch('http://localhost:3000/save-subscription', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(subscription)
        });
        const saveResult = await saveResponse.json();
        console.log('Backend response:', saveResult);

        setStatus('Push subscription enabled and registered', 'success');
        console.log('🎉 Step 8: Done! Ready to receive notifications.');
    } catch (err) {
        console.error('❌ Error in subscribePush:', err);
        setStatus(err.message, 'error');
    }
};

// ----- Form Submission -----
const sendNotification = async (e) => {
    e.preventDefault();
    const message = document.getElementById('message').value.trim();
    if (!message) {
        setStatus('Message cannot be empty', 'error');
        return;
    }
    // Channels (checkboxes)
    const channelEls = Array.from(document.querySelectorAll('input[name="channels"]:checked'));
    if (channelEls.length === 0) {
        setStatus('Select at least one channel', 'error');
        return;
    }
    const channels = channelEls.map(el => el.value);
    // Determine channel string for backend (expects a single string)
    let channelStr = channels.includes('all') ? 'all' : channels[0];

    // Parse target users
    const phonesRaw = document.getElementById('phones').value.trim();
    const emailsRaw = document.getElementById('emails').value.trim();
    const phones = phonesRaw ? phonesRaw.split(',').map(p => p.trim()).filter(p => p) : [];
    const emails = emailsRaw ? emailsRaw.split(',').map(e => e.trim()).filter(e => e) : [];
    const targetUsers = [];
    phones.forEach(p => targetUsers.push({ phoneNumber: p }));
    emails.forEach(em => targetUsers.push({ email: em }));

    // If no target users are specified (e.g. push-only notification),
    // add an empty object so the backend validation doesn't reject the request
    if (targetUsers.length === 0) {
        targetUsers.push({});
    }

    const payload = {
        message,
        channels: channelStr,
        targetUsers,
    };

    try {
        const response = await fetch('http://localhost:3000/notify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        const data = await response.json();
        if (data.success) {
            setStatus('Notification sent successfully', 'success');
            e.target.reset();
        } else {
            setStatus(data.error || 'Failed to send notification', 'error');
        }
    } catch (err) {
        console.error(err);
        setStatus('Network error: ' + err.message, 'error');
    }
};

// ----- UI Helpers -----
const setStatus = (msg, type) => {
    const statusDiv = document.getElementById('status');
    statusDiv.textContent = msg;
    statusDiv.className = 'status ' + (type === 'success' ? 'success' : 'error');
};

// ----- Initialization / Event Listeners -----
const init = () => {
    console.log('⚡ Initializing event listeners...');
    const subscribeBtn = document.getElementById('subscribeBtn');
    if (subscribeBtn) {
        console.log('✅ Found subscribeBtn in DOM, adding click listener.');
        subscribeBtn.addEventListener('click', subscribePush);
    } else {
        console.warn('⚠️ Could not find subscribeBtn in DOM!');
    }
    
    const form = document.getElementById('notifyForm');
    if (form) {
        console.log('✅ Found notifyForm in DOM, adding submit listener.');
        form.addEventListener('submit', sendNotification);
    } else {
        console.warn('⚠️ Could not find notifyForm in DOM!');
    }
};

if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', init);
} else {
    init();
}