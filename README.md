# Paging

Paging is a webapp meant to enrich the group planning experience. <br>
Paging is live at [paging.spina.me](paging.spina.me) <br>
[![build status](https://gitlab.doc.ic.ac.uk/as12015/paging/badges/master/build.svg)](https://gitlab.doc.ic.ac.uk/as12015/paging/commits/master)

## Front End

`AngularJS` is used for the frontend together with `Bootstrap` (for CSS and JS Components) and `SCSS` <br>
The `googleMaps` API is queried to handle the map. We use the following APIs:
- `Javascript API`: Used to render the map and embed it into our webapp.
- `Places API`: To retrieve data about places near the user's location.
- `Distance Matrix API`: To determine distances between users and places nearby.
- `Directions API`: To obtain directions by means of transport given a destination place.

Routing:
- `/`, `/home`: Webapp entry point with search screen.
- `/app/:room`: Main webapp page, displays the googlemap and allows interaction inbetween users.
- `/login`, `/register`: Basic authentication functionality.

## Database

There is a `mongo` database accessed via the `mongoose` npm wrapper. <br>
Access to the database requires authentication both mongo and bcrypt.

## Back End

The backend runs a `NodeJS` server. <br>
Routing is handled via `ExpressJS` for HTTP requests, and `Socket.io` for socket communication. <br>
The website is currently hosted on a `AWS` Server. <br>
Other npm packages used:
- `bcryptjs`: Used to securely authenticate users storing encrypted passwords.
- `passport`: Used together with bcrypt for authentication.
- `geolib`: Used to perform geo-coordinate mathematical manipulations.
- `mongoose`: Used together with mongoDB.
- `chai`: Used as a testing framework

## Gitlab CI/CD

`CI` is set up to run on a gitlab runner following the `.gitlab-ci.yml` script. <br>
Once `build` and `test` phases pass, `CD` kicks in deploying to the `AWS` VM via `pm2`. <br>
Mater branch is automatically deployed.

## Back End Routing

HTTP/HTTPS:
- `/*`: Returns index.html.
- `/users/roomID`: Returns a new unique roomID hash.
- `/users/login`, `/users/logout`: Handles user authentication.
- `/users/register`: Handles user registration.
- `/users/friends`: Returns a user's friendlist [UNUSED].

Socket.io:
- `join [roomID]`: Joins a designated room's socket.io channel.
- `leave`: Exits the current socket.io room.
- `location [locData]`: Broadcasts an update to the given user's location.
- `options [optData]`: Broadcasts an update to the room's options.
- `search`: Performs googleMaps queries given the current optData. Return is broadcasted to room.
- `deleteUser [username]`: Removes a given user from the room.
- `changeMarkers [mrkData]`: Broadcasts marker update issued by user.
- `changeColour [clrData]`: Broadcasts update to user's color.
- `chatMessage [msgData]`: Handles message communication between server and room's users.
- `calculateTransportTime [trnData]`: Returns to the given user transport information for a given location.
