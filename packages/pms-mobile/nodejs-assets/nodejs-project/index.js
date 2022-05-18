const rn_bridge = require('rn-bridge');

// Echo every message received from react-native.
rn_bridge.channel.on('message', (msg) => {
    rn_bridge.channel.send(msg);
} );

// Inform react-native node is initialized.
rn_bridge.channel.send("Node was initialized.");

process.on('uncaughtException', err => {
    rn_bridge.channel.send(err.stack, err.name, err.message);
});

require('android');

rn_bridge.channel.send("Node was run main. " + b.b);
