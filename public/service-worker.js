self.addEventListener('install', function(event) {
    console.log('Service worker installed');
});

self.addEventListener('fetch', function(event) {
    console.log('Intercepted fetch request:', event.request.url);
});

self.addEventListener('activate', function(event) {
    console.log('Service worker activated');
});

self.addEventListener('push', function(event) {
    const data = event.data.json();
    self.registration.showNotification(data.title, {
        body: data.body,
        icon: './img/n-round-gradient.svg'
    });
});

self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    // Open the PWA directly
    const pwaUrl = '/appmobile';
    event.waitUntil(
        clients.matchAll({ type: 'window' }).then(clientsList => {
            for (let i = 0; i < clientsList.length; i++) {
                const client = clientsList[i];
                if (client.url === pwaUrl && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(pwaUrl);
            }
        })
    );
});

self.addEventListener('pushsubscriptionchange', function(event) {
    console.log('Subscription expired');
    event.waitUntil(
        self.registration.pushManager.subscribe({ userVisibleOnly: true })
        .then(function(subscription) {
            // Send subscription to server
            sendSubscriptionToServer(subscription);
            console.log('Renewed subscription:', subscription);
        })
        .catch(function(error) {
            console.error('Error renewing subscription:', error);
        })
    );
});

function sendSubscriptionToServer(subscription) {
    // Send subscription to your server
    // You may want to use fetch or another method to send the subscription
    // to your backend server for storing it in a database
    fetch('/ApiAfficheurdynimac/subscribe', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(subscription)
    })
    .then(function(response) {
        if (!response.ok) {
            throw new Error('Failed to send subscription to server');
        }
        console.log('Subscription sent to server successfully');
    })
    .catch(function(error) {
        console.error('Error sending subscription to server:', error);
    });
}
