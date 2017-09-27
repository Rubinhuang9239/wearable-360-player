const electron = require("electron"); 
const electronApp = electron.app;

const BrowserWindow = electron.BrowserWindow;

var mainWindow;
electronApp.on('ready',function(){
	mainWindow = new BrowserWindow({
		width: 720,
		height: 640,
	});
	mainWindow.loadURL("http://localhost:3000");
});

var SerialPort = require("serialport");
var app = require('express')();
var express = require('express');
var open = require('open');
var httpServer = require('http').Server(app);

//----------------Route--------------------//

app.use(express.static(__dirname + "/public"));
var httpPort = 3000;

httpServer.listen( httpPort, function(){
  	console.log("");
    console.log("");
    console.log("---------------| Simple Seiral Example |-----------------");
    console.log("");
    console.log("Server is on port 3000");
});

app.get('/', function(req, res){
    res.sendfile('public/index.html');
});


var portNameChoice = ["/dev/cu.usbmodem1411", "/dev/cu.usbmodem1421", "/dev/cu.usbmodem1451", "/dev/cu.usbmodem1441","/dev/cu.usbmodem1461", "/dev/cu.usbmodem14521", "/dev/cu.usbmodem143411"];
var portName = null;
var attempting = false;

function connectSerial(){

	SerialPort.list(function (err, ports) {

	  	ports.forEach(function(port) {

	  		console.log("==>" + port.comName);

		    for(i=0; i < portNameChoice.length ;i++){

		      if(portNameChoice[i] == port.comName){
		        portName = port.comName;
		      }
		    }

		});

		if( portName == null){
		    	console.log( '\x1b[33m%s\x1b[0m',"none port found!");
	  			reconnectSerialAttempt();
	  	}
		else if(portName != null){
			console.log( '\x1b[32m%s\x1b[0m',"[choosed] " + portName);
			attempting = false;

			var port = new SerialPort(portName, {
			  baudRate: 115200,
			  parser: SerialPort.parsers.readline("\n"),
			});

			port.on('open', function() {
				console.log("opened");
				conStatus.serial = true;
				updateConnectionStat();

				setTimeout(function(){
					port.write("0");
					console.log("Handshake say hi");
				},800);	

			});

			var serialData = null;

			port.on( 'data', function(data){

					serialData = parseInt(data.toString());

					process.stdout.clearLine();
				    process.stdout.cursorTo(0);
				    process.stdout.write('\x1b[33m'+"Serial Data>> "+serialData+'\x1b[0m');

					if(unitySocket != undefined){
						
						if( serialData != currentStatus ){
							currentStatus = serialData;
							updatePlayerStat(playerStatus[currentStatus]);
						}

					}

				port.write( "a" );

			});

			port.on("close",function(){
				console.log("\n port " + portName + " closed");
				portName = null;
				conStatus.serial = false;
				updateConnectionStat();

				setTimeout(function(){
					reconnectSerialAttempt();
				},1000);
			})

		}

	});
}

function reconnectSerialAttempt(){

	if(attempting === true){
		return;
	}

	console.log("----------------- serial reconnect attempt");
	attempting = true;
	connectSerial();

	setTimeout(function(){
		if(portName == null){
			attempting = false;
			reconnectSerialAttempt();
		}
	},2500);

}

connectSerial();

//-----------------Socket.io----------------//

var io = require('socket.io')(httpServer);
// ({
// 	transports: ['websocket'],
// });

var unitySocket = null;
var controlSocket = null;


var conStatus = {
	unity : false,
	serial : false
}

var currentStatus = 0; //pause//
//0: pause//1: play//2: reset//
var playerStatus = ["pause","play","reset"];

io.on('connection', function(socket){
	if(socket.handshake.query.role == "control"){
		controlSocket = socket;
		console.log("----control starting----");
		console.log("restore status to front end");
	}
	else{
		console.log("----unity starting----");
		unitySocket = socket;
		conStatus.unity = true;
	}

	updateConnectionStat();

	socket.on('disconnect', function(){

		//console.log(socket);
		if(socket.handshake.query.role != "control"){
			//lost unity
			if(controlSocket){
				conStatus.unity = false;
				unitySocket = false;
			} 
		}

		updateConnectionStat();

	});

	socket.on("play",function(status){
		if(status === true){
			updatePlayerStat("play")	//send a responds to unity
		}
		else{
			updatePlayerStat("pause");	//send a responds to unity
		}
	});

	socket.on("reset", function(){
		updatePlayerStat("reset");	//send a responds to unity
	});

	socket.on("launchUnity",function(){

	});

	//socket.emit("dataToUnity", { cmd : "play" });	//send a responds to unity

	socket.on("dataToNode",function(status){
		sendPlayerFeedback(status);
	});

});

function updateConnectionStat(){
	if(controlSocket){
		controlSocket.emit("status", conStatus);
	}else{
		console.log("no control interface is connected");
	}
}

function updatePlayerStat(status){
	console.log(status);
	if(unitySocket){
		unitySocket.emit("dataToUnity", { cmd : status });
	}else{
		console.log("no unity 360 player is connected");
	}
}

function sendPlayerFeedback(feedback){
	if(controlSocket){
		controlSocket.emit("feedback", feedback);
	}else{
		console.log("no control interface is connected");
	}
}