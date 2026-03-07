# Overview

Spatacular is a package designed to help build single-page webapps.  It focuses on the interactions between server and client, attempting to establish common patterns for handling both page requests (initial requests for the html page) as well as API requests from the client (JSON interactions).

A key component is the design of a contract between client and server.  The contract defines routes, requests, and responses for both of the above cases.  The contract is defined in a DSL (just JSON for now, with helper builder functions), which is processed into an internal model.  That model can then be used to generate code, such as TS type definitions used by client and server code, or can be used to perform runtime argument validation, request routing, maybe even OpenAPI definitions, etc.

The hope is for these tools to provide the minimal "plumbing" needed to get client and server communicating, allowing the SPA and server to concentrate primarily on application code rather than these plumbing internals.
