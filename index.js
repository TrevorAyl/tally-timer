// Amended to be a server, rather than a client and to append in EDL format to a .txt file

const net = require('net');
const bsplit = require('buffer-split');
const jspack = require('jspack').jspack;
const fs = require('fs');
const keypress = require('keypress');

var tallies = [];
const file_date = new Date();
const month = (file_date.getMonth() + 1).toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping:false}); // JavaScript months are 0-indexed
const day = file_date.getDate().toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping:false});
const year = file_date.getFullYear();
const hours = file_date.getHours().toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping:false});
const minutes = file_date.getMinutes().toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping:false});
const path_pfx = `./${year}-${month}-${day}-${hours}-${minutes}`;
const edlTopLines = "TITLE: This is the EDL title\r\nFCM: NON DROP FRAME\r\n";
const frameRate = 50;


class Index {
	constructor(tally_obj) {
		this.updateControl(tally_obj);
	}

	updateControl(obj) {
		this.rh_tally = obj.control.rh_tally;
		this.lh_tally = obj.control.lh_tally;
		this.text_tally = obj.control.text_tally;
		this.brightness = obj.control.brightness;
		this.text = obj.TEXT;
		this.time = obj.TIME;
		this.index = obj.INDEX[0];
	}	
}
var parse = function(data) {
	if (data.length > 12) {

		tallyobj = {};

		var cursor = 0;

		tallyobj.TIME = timecodeNow();

		//Message Format
		const _PBC = 2 //bytes
		const _VAR = 1
		const _FLAGS = 1
		const _SCREEN = 2
		const _INDEX = 2
		const _CONTROL = 2

		//Display Data
		const _LENGTH = 2

		tallyobj.PBC = jspack.Unpack( "<H", data, cursor);
		cursor += _PBC;

		tallyobj.VAR = jspack.Unpack( "<B", data, cursor);
		cursor += _VAR;

		tallyobj.FLAGS = jspack.Unpack( "<B", data, cursor);
		cursor += _FLAGS;

		tallyobj.SCREEN = jspack.Unpack( "<H", data, cursor);
		cursor += _SCREEN;

		tallyobj.INDEX = jspack.Unpack( "<H", data, cursor);
		cursor += _INDEX;

		tallyobj.CONTROL = jspack.Unpack( "<H", data, cursor);
		cursor += _CONTROL;

		var LENGTH = jspack.Unpack( "<H", data, cursor)
		cursor += _LENGTH;

		tallyobj.TEXT = jspack.Unpack( "s".repeat(LENGTH), data, cursor);


		if (tallyobj.TEXT != undefined) {
			tallyobj.TEXT = tallyobj.TEXT.join("")

			if (tallies.length == 0){
				writeToDisk(edlTopLines);
			}
			else {
				var edlNum = (tallies.length).toLocaleString('en-US', {minimumIntegerDigits: 4, useGrouping:false});
				var last = tallies[tallies.length -1];
				var inPoint = last.TIME;
				var outPoint = tallyobj.TIME;
				var reel = last.TEXT;
				writeToDisk(edlNum + "   " + reel + "   V      C        " + inPoint + "   " + outPoint + "   "+ inPoint + "   " + outPoint + "\r\n");
			} 
			tallies.push(tallyobj);

		};
	}
}

function writeToDisk(edlLine) {
	let path = `${path_pfx}.txt`
  	fs.appendFileSync(path, edlLine)
}

var writeCSVToDisk = function(data) {
	let write_data = data.join("\n")
	let path = `${path_pfx}.csv`
	fs.writeFileSync(path, write_data)
}

function timecodeNow(){
	// get HH:MM:SS:FF
	var today = new Date();
	var hh = today.getHours().toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping:false});
	var mm = today.getMinutes().toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping:false});
	var ss = today.getSeconds().toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping:false});
	var ms = today.getMilliseconds();
	var ff = Math.floor(ms/1000*frameRate).toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping:false});
	var time = hh + ":" + mm + ":" + ss + ":" + ff;
	return time;
}

// Create a TCP server
const server = net.createServer((socket) => {
    console.log('Client connected');

    socket.on('data', (data) => {
        delim = Buffer.from([0xfe, 0x02]);
        var spl_data = bsplit(data, delim);
        spl_data.forEach((dataPiece) => {
            if (dataPiece.length > 0) {
                parse(dataPiece); // Use the same parse function
            }
        });
    });

    socket.on('close', () => {
        console.log('Connection closed');
    });

    socket.on('error', (err) => {
        console.error(`Error: ${err}`);
    });
});

server.listen(9910, '127.0.0.1', () => {
    console.log('Server listening on port 9910');
});

// Key press setup
keypress(process.stdin);
process.stdin.on('keypress', function (ch, key) {
    console.log('got "keypress"', key);
    if (key && key.ctrl && key.name == 'c') {
		// write the last event
		var edlNum = (tallies.length).toLocaleString('en-US', {minimumIntegerDigits: 4, useGrouping:false});
		var last = tallies[tallies.length -1];
		var inPoint = last.TIME;
		var outPoint = timecodeNow();
		var reel = last.TEXT;
		writeToDisk(edlNum + "   " + reel + "   V      C        " + inPoint + "   " + outPoint + "   "+ inPoint + "   " + outPoint + "\r\n");

        process.stdin.pause();
        process.exit();
    }
    if (key && key.ctrl && key.name == "p") {
        // console.log('Writing to disk...');
        // writeToDisk();
    }
});

process.stdin.setRawMode(true);
process.stdin.resume();