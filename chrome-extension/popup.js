@@ .. @@
     <button class="nav-btn" data-page="focus">
       <i class="fas fa-clock"></i> Focus Session
     </button>
@@ .. @@
   // Focus Page Event Listeners
   document.getElementById('startFocusBtn').addEventListener('click', function() {
-    const duration = parseInt(document.getElementById('focusDuration').value) || 25;
-    const breakDuration = parseInt(document.getElementById('breakDuration').value) || 5;
-    
-    // Start focus session with enhanced blocking
-    const additionalSites = [
-      'youtube.com', 'facebook.com', 'instagram.com', 'twitter.com', 'x.com',
-      'reddit.com', 'tiktok.com', 'netflix.com', 'twitch.tv'
-    ];
-    
-    chrome.runtime.sendMessage({
-      type: 'START_FOCUS_SESSION',
-      duration: duration,
-      breakDuration: breakDuration,
-      additionalSites: additionalSites
-    }, (response) => {
-      if (response && response.status === 'focus session started') {
-        startFocusTimer(duration);
-        document.getElementById('startFocusBtn').style.display = 'none';
-        document.getElementById('stopFocusBtn').style.display = 'inline-block';
-      }
-    });
+    // Open focus session in new tab
+    chrome.tabs.create({ url: chrome.runtime.getURL('focus.html') });
   });
   
   document.getElementById('stopFocusBtn').addEventListener('click', function() {