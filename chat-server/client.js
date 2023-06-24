/*** client.js ***/
const io = require("socket.io-client");
const socket = io("http://localhost:4000");

var nickname = null;
console.log("Connecting to the server...");

socket.on("connect", () => {
    nickname = process.argv[2];
    console.log("[INFO]: Welcome %s", nickname);
});
socket.on("disconnect", (reason) => {
    console.log("[INFO]: Client disconnected, reason: %s", reason);
});

