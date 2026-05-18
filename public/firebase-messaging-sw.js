importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyCxyDIoNIt7eneyXGmPRPUcNLhr5vdwRII",
  authDomain: "nearmatch-85c0a.firebaseapp.com",
  projectId: "nearmatch-85c0a",
  storageBucket: "nearmatch-85c0a.firebasestorage.app",
  messagingSenderId: "388455535348",
  appId: "1:388455535348:web:b5d80dd949c2619a8d84a1",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body, icon } = payload.notification;
  self.registration.showNotification(title, {
    body,
    icon: icon || "/icon-192.png",
    badge: "/icon-192.png",
    vibrate: [200, 100, 200],
    data: payload.data,
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0) {
        clientList[0].focus();
      } else {
        clients.openWindow("/");
      }
    })
  );
});
