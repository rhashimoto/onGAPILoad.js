/** @preserve Copyright 2016 Roy T. Hashimoto. All Rights Reserved. */
'use strict';

self['onGAPILoad'] = (function() {
  // Get script parameters.
  var script = document.currentScript;
  var GAPI_API_KEY = script.getAttribute('data-api-key');
  var GAPI_CLIENT_ID = script.getAttribute('data-client-id');
  var GAPI_ELEMENT = script.getAttribute('data-login-element') || 'gapi-login';
  var GAPI_SCOPE = script.getAttribute('data-scope');
  var GAPI_SERVICES = script.getAttribute('data-services') || '';
  
  var onGAPILoad;
  var authCallbacks = [];
  var apiReady = new Promise(function(resolve, reject) {
    onGAPILoad = function() {
      gapi.load('client:auth2', resolve);
    };
  }).then(function() {
    // Initialize GoogleAuth.
    // The odd `then(function() {})` call on the gapi.auth2.init()
    // result is a workaround for the fact that although GoogleAuth
    // is "thenable", it seems to recurse indefinitely when wrapped
    // by a real Promise.
    gapi.client.setApiKey(GAPI_API_KEY);
    gapi.auth2.init({
      client_id: GAPI_CLIENT_ID,
      scope: GAPI_SCOPE,
      fetch_basic_profile: !GAPI_SCOPE
    }).then(function() {});
  }).then(function() {
    // Set up Promise resolver for token().
    var auth2 = gapi.auth2.getAuthInstance();
    var handler = function(isSignedIn) {
      if (isSignedIn) {
        // Call all the callbacks once and discard them.
        var token = auth2.currentUser.get().getAuthResponse();
        authCallbacks.forEach(function(callback) {
          callback(token);
        });
        authCallbacks = [];
      }
    };

    // Call the handler just in case any callbacks are already queued,
    // then set up the listener.
    handler(auth2.isSignedIn.get());
    auth2.isSignedIn.listen(handler);

    // Get button container element options. Any data-* attributes will
    // be passed to gapi.signin2.render().
    var element = document.getElementById(GAPI_ELEMENT);
    if (element) {
      var options = {};
      [].forEach.call(element.attributes, function(a) {
        var m = a.name.match(/data-(.*)/);
        if (m)
          options[m[1]] = a.value;
      });

      // Dereference callback names to globals.
      options['onsuccess'] = self[options['onsuccess']];
      options['onfailure'] = self[options['onfailure']];

      // Render the button.
      gapi.signin2.render(element.id, options);
    }
    
    // Load requested service APIs.
    var promises = [];
    Array.prototype.forEach.call(GAPI_SERVICES.split(/\s+/), function(api) {
      if (api) {
        var name, version;
        [name, version] = api.split(/[@/:]/);
        if (!gapi.client[name])
          promises.push(gapi.client.load(name, version));
      }
    });

    return Promise.all(promises);
  });

  onGAPILoad['ready'] = function() {
    return apiReady;
  };

  onGAPILoad['token'] = function() {
    var tokenReady = new Promise(function(resolve, reject) {
      // Check if the user is already signed in.
      var auth2 = self.gapi && gapi.auth2 && gapi.auth2.getAuthInstance();
      if (auth2 && auth2.isSignedIn.get()) {
        // Return the token if current; otherwise, reload it.
        var token = auth2.currentUser.get().getAuthResponse();
        if (Date.now() + 180000 < token.expires_at)
          return resolve(token);
        return resolve(auth2.currentUser.get().reloadAuthResponse());
      }

      // Wait for sign in.
      authCallbacks.push(resolve);
    });

    // For convenience, also ensure that APIs are loaded.
    return apiReady.then(function() {
      return tokenReady;
    });
  };
  
  // Load GAPI by adding a <script> element with JSONP callback.
  var gapiScript = document.createElement('script');
  gapiScript.src = 'https://apis.google.com/js/client:platform.js?onload=onGAPILoad';
  gapiScript.async = true;
  gapiScript.defer = true;
  script.parentNode.appendChild(gapiScript);
  
  return onGAPILoad;
})();

