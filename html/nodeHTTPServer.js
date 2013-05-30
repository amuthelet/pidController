var express = require('express');
var app = express();
app.use(express.bodyParser());

var joystickLeftX = 0.0;
var joystickLeftY = 0.0;
var joystickRightX = 0.0;
var joystickRightY = 0.0;

app.get('/get_joystick_value', function(req, res) {
	var body = joystickLeftX.toString()+','+joystickLeftY.toString()+','+joystickRightX.toString()+','+joystickRightY.toString();
	res.send(body);
});

app.post('/set_joystick_value', function(req, res) {
	joystickLeftX = req.body.deltaLeftX;
	joystickLeftY = req.body.deltaLeftY;
	joystickRightX = req.body.deltaRightX;
	joystickRightY = req.body.deltaRightY;
	res.send(200);
});

app.use(express.static(__dirname));

app.listen(3000);
console.log("Server listening on port 3000");

var net = require('net');
function getNetworkIP(callback) {
  var socket = net.createConnection(80, 'www.google.com');
  socket.on('connect', function() {
    callback(undefined, socket.address().address);
    socket.end();
  });
  socket.on('error', function(e) {
    callback(e, 'error');
  });
}

getNetworkIP(function (error, ip) {
    console.log("Pour lancer le simu, aller ici: "+ip+":3000/index.html");
    console.log("Pour lancer l'interface de controle multi-touch, aller ici: "+ip+":3000/index_vj.html");
    if (error) {
        console.log('error:', error);
    }
});