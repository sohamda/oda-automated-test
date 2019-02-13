const express = require('express');
const service = require('./service');
const pkg = require('./package.json');

io = require('socket.io');

const logger = console;
const app = express();


const server = app.listen(process.env.PORT || 3000, () => {
  logger.info(`${pkg.name} service online\n`);
});

io = io.listen(server);

io.sockets.on('connection', function (socket) {
    console.log('client connect');
});

service(app, io);


module.exports = server;
