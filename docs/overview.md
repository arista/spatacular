# Overview

Spatacular is a package designed to help build single-page webapps.  It focuses on the interactions between server and client, attempting to establish common patterns for handling both page requests (initial requests for the html page) as well as API requests from the client (JSON interactions).

A key component is the design of a contract between client and server.  The contract defines routes, requests, and responses for both of the above cases.  The contract is defined in a DSL (just JSON for now, with helper builder functions), which is processed into an internal model.  That model can then be used to generate code, such as TS type definitions used by client and server code, or can be used to perform runtime argument validation, request routing, maybe even OpenAPI definitions, etc.

The hope is for these tools to provide the minimal "plumbing" needed to get client and server communicating, allowing the SPA and server to concentrate primarily on application code rather than these plumbing internals.

## Requests and Responses

There are 3 types of requests/reponses involved:

* Initial page loads - browser requests that expect to receive an HTML page
* SPA changing the URL - the SPA changes the URL, and sort of expects the app to act as if it had just requested that page, but less disruptively than a full page load
* JSON API calls - AJAX/Fetch requests, that we normally think of as "API"

The hope is to be able to combine the first two types of requests so that they don't need to be handled differently by the client or the server.  The plan to do this looks like this:

* Both are modeled as the same "command" with the same strongly-typed payload
* The "command" and its payload are both passed to the app, which can handle the command as it sees fit.
    * Most likely, the app will have some kind of internal navigational state (built on chchchchanges), which would be modified by the command
    * The view layer (built on brint, reacting to the chchchchanges model) will automatically update based on that state change
* For an initial page load, the server converts the incoming path/query/cookies/etc. into a Request object, which includes the Request type.  The contract defines these mappings
    * The Request object is then directed to the server app, which handles the request based on the request type
    * The server app returns a response object, which contains the payload that the client expects for the corresponding Command
    * The server-side framework then generates an HTML page that contains:
        * references to the fingerprinted app bundle
        * references to the fingerprinted supporting library bundle
        * some Javascript that contains
            * some basic environmental settings (base url, api endpoint, asset base)
            * the Command and associated payload
        * an initial JS call to start the app, passing in the command and payload
    * On the client side, the html page will load, the app will start and will act as if it received the command and payload, which should cause it to set up its internal state well enough to build an HTML view using brint.
* On the other hand, for a URL change:
    * The client will immediately send the corresponding Command to the app.  However, the payload will be a Promise.  The client app can decide to immediately start showing the new page and wait on the data to fill in the appropriate parts, or it can wait for the Promise to fulfill before showing any change to the user.
    * The client will send a request to the server.  It will use the new URL, but will accompany it with a signal indicating that the server doesn't need to generate a new page.  Perhaps by changing the "accepts" header, or by simply appending the URL with ".json" or something along those lines
    * The server-side framework will receive that URL and see that it's just requesting that payload instead of a full page
    * The framework will construct a Request, which it will send to the server app.  This is the exact same request that would be sent for an initial page load - the server app doesn't know the difference
    * The app will process the Request and return its response.  The server-side framework will receive the response, and rather than packaging it in an HTML page, it will simply send the JSON back to the client
    
So the goal is for all 3 types of requests to be gathered into a single Request structure, and the server app just receives a Request and returns an appropriate Response.  The framework and contract serve serve to hide the details of how this works from the app.
