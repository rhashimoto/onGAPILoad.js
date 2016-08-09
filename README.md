# onGAPILoad

onGAPILoad.js is a convenience script to simplify Google API
authentication and loading. onGAPILoad.js uses ECMAScript 6 Promises,
so a polyfill should be used for browsers without Promise support.
Configuration is done with `data-*` attributes on the script element,
e.g.:

    <script
      src="onGAPILoad.js"
      data-api-key="YOUR API KEY"
      data-client-id="YOUR CLIENT ID"
      data-scope="https://www.googleapis.com/auth/devstorage.read_write"
      data-services="storage/v1">
    </script>

The Google API Key and Client ID must be created for your project in
the API Manager section of the [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
and copied to the `data-api-key` and `data-client-id` attributes.
You should also enable any Google APIs you intend to use in the API Manager.

Each Google API defines one or more
[scopes](https://developers.google.com/identity/protocols/googlescopes)
for the end user to authorize for use with their account. The
requested scopes should be declared (separated by a space) in the
`data-scope` attribute.

The Google APIs you wish to load should be declared (separated by a
space) int he `data-services` attribute. Each API is specified with a
name and a version separated by a '/', (e.g. `storage/v1`). A list of
all APIs can be found in the [APIs Explorer](https://developers.google.com/apis-explorer/#p/);
click on any API to see its calls.

For example, the API Explorer shows the current Calendar API
version is "v3". Clicking on it shows the [list of Calendar API calls](https://developers.google.com/apis-explorer/#p/calendar/v3/)
All the calls begin with "calendar", so you would configure
access to this API by adding `calendar/v3` to the `data-services`
attribute, and request the user's events by calling
[`gapi.client.calendar.events.list()`](https://developers.google.com/apis-explorer/#p/calendar/v3/calendar.events.list) (after authorization):

    gapi.client.calendar.events.list({
      calendarId: "primary",
      maxResults: 10
    }).then(function(response) {
      ...
    });

The easy way to handle authorization is simply to add a `<div>`
element with an `id="gapi-login"` attribute, e.g.:

    <div id="gapi-login"
         data-width="200",
         data-height="50",
         data-longtitle
         data-theme="dark"
         data-onsuccess="successFn"
         data-onfailure="failureFn"
    </div>

onGAPILoad.js will populate the `<div>` with a [Google Sign-In](https://developers.google.com/identity/sign-in/web/build-button)
button. All attributes other than `id` are optional. The optional
attributes are the same as the options properties for
[`gapi.signin2.render()`](https://developers.google.com/identity/sign-in/web/reference#gapi.signin2.render).

`onGAPILoad.ready()` returns a Promise that resolves when all APIs
have been loaded. This would probably only be used if you want to use
the `gapi.auth2` API to implement sign-in instead of using a `<div>`.

`onGAPILoad.token()` returns a Promise that resolves when all APIs
are loaded *and* the user has been signed in. It is an alternative
to setting the `data-onsuccess` attribute with a global callback
function.