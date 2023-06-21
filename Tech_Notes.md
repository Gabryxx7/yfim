# Technical notes

## Stack
* `Node.js`
* `Express.js`
* `CouchDB`
* `Socket.io` (`chat.io` + `control.io` + `project.io`)
## Entry point
The command:
```bash
$ npm start
```
Will start the serer implemented in `server.js`.

## Initalization
1. The first thing `server.js` is the `nano.db` which is actually a `CouchDB` instance (so you should have this installed on your machine)
2. The server app is actually an `express.js` app
3. The socket communication is handled by `socket.io` (`chat.io` + `control.io` + `project.io`)

## Flow
1. The main function is `processStart(room, start_time, cfg)`.
    * This function gets called by `socket.on(SOCKET_CMDS.PROCESS_READY.cmd)` so whenever the socket receives the command `process-ready`
    

## Messages Flow
