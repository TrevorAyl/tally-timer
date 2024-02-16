// Amended to be a server, rather than a client 
// Writes array of events as {time, label}
// Calls a python script periodically or by keypress to write the data as an AAF

const net = require('net');
const bsplit = require('buffer-split');
const jspack = require('jspack').jspack;
const fs = require('fs');
const keypress = require('keypress');

// Change these as necessary
const listenPort = 9910;
const listenIP = '127.0.0.1';

// These are passed to writeTallyAAF.py
const frameRate = 50;
const sequenceName = 'sequence name here';
const pgmTapeName = 'enterPGMtapeNameHere';
const colorLUT = {}; // TODO - Clip Colour Look Up Table against Source Label
const tapeNameLUT = {}; // TODO - Tape Name Look Up Table against Source Label

let timeToOutputId = null; // This variable will keep track of the timeout


var tallyLog ={'start' : 0, 'end' : 0, 'clips' : []}; // This is where events are stored to pass to AAF
tallyLog.start = msSinceMidnight();

// all from original tally-timer code
class Index {
	constructor(tally_obj) {
		this.updateControl(tally_obj);
	}

	updateControl(obj) {
		// unused properties bypassed

		// this.rh_tally = obj.control.rh_tally;
		// this.lh_tally = obj.control.lh_tally;
		// this.text_tally = obj.control.text_tally;
		// this.brightness = obj.control.brightness;
		this.text = obj.TEXT;
		this.time = obj.TIME;
		// this.index = obj.INDEX[0];
	}	
}
// parse function from tally timer
// unused data commented out but kept here in case it is useful in future
var parse = function(data) {
	if (data.length > 12) {
		tallyobj = {};
		var cursor = 0;
		tallyobj.TIME = msSinceMidnight();
		//Message Format
		const _PBC = 2 //bytes
		const _VAR = 1
		const _FLAGS = 1
		const _SCREEN = 2
		const _INDEX = 2
		const _CONTROL = 2
		//Display Data
		const _LENGTH = 2

		// skipping the unneeded tally entries
		// tallyobj.PBC = jspack.Unpack( "<H", data, cursor);
		cursor += _PBC;
		// tallyobj.VAR = jspack.Unpack( "<B", data, cursor);
		cursor += _VAR;
		// tallyobj.FLAGS = jspack.Unpack( "<B", data, cursor);
		cursor += _FLAGS;
		// tallyobj.SCREEN = jspack.Unpack( "<H", data, cursor);
		cursor += _SCREEN;
		// tallyobj.INDEX = jspack.Unpack( "<H", data, cursor);
		cursor += _INDEX;
		// tallyobj.CONTROL = jspack.Unpack( "<H", data, cursor);
		cursor += _CONTROL;

		var LENGTH = jspack.Unpack( "<H", data, cursor)
		cursor += _LENGTH;

		tallyobj.TEXT = jspack.Unpack( "s".repeat(LENGTH), data, cursor);

		if (tallyobj.TEXT != undefined) {
			tallyobj.TEXT = tallyobj.TEXT.join("")
			tallyLog['clips'].push(tallyobj)
			console.log(tallyobj)
			// console.log(tallyLog)
		};
	}
}
function setTimer() {
	const timeAmount = 30 * 60 * 1000; // x minutes in milliseconds
	
	// Clear any existing timer
	if (timeToOutputId) {
	  clearTimeout(timeToOutputId);
	}
  
	// Set a new timer
	timeToOutputId = setTimeout(function() {
		timedOutput(true);
	}, timeAmount);
  }

function resetTimer() {
	setTimer(); // Resets the timer
  }

// Initially set the timer
setTimer();

function uniqueLabelsToColors(data){
	const array = data['clips'];
	const start = data['start'];
	const end = data['end'];
	const key = 'TEXT';
	const uniqueLabels = [...new Set(array.map(item => item.TEXT))].sort();
// colors stored as RGB for simplicity and multiplied when used for AAF 
	const colorsRGB = {
		violet: [120,28,129],
		indigo: [64,67,153],
		blue: [72,139,194],
		green: [107,178,140],
		olive: [159,190,87],
		yellow: [210,179,63],
		orange: [231,126,49],
		red: [217,33,32],
		light_pink: [255, 182, 193],
		khaki: [240, 230, 140],
		dark_khaki: [189, 183, 107],
		plum: [221, 160, 221],
		medium_purple: [147, 112, 219],
		purple: [128, 0, 128],
		medium_slate_blue: [123, 104, 238],
		pale_green: [152, 251, 152],
		yellow_green: [154, 205, 50],
		teal: [0, 128, 128],
		aquamarine: [127, 255, 212],
		steel_blue: [70, 130, 180],
		tan: [210, 180, 140],
		brown: [165, 42, 42],
		silver: [192, 192, 192],
		black: [0, 0, 0]
	  }
	let j = 0;
	const result = {};
	for (let i = 0; i < uniqueLabels.length; i++) {
		if (j < Object.keys(colorsRGB).length) {			
			result[uniqueLabels[i]] = Object.values(colorsRGB)[j];
			j++;
		}
		else{
			j=0;
		}
	}
	// result is JSON sources against colours
	// console.log(result)
	return result;
}


function writeToAAF(data)	{
	// Sample data
	// data = {"start":35987908,"end":38000321,"clips":[{"TIME":37988482,"TEXT":"i-25"},{"TIME":37991431,"TEXT":"i-30"},{"TIME":37994578,"TEXT":"NBC-01"},{"TIME":37997617,"TEXT":"NBC-02"}]}

	const spawn = require("child_process").spawn;
	const file_path = "/Users/trevoraylward/Documents/GitHub/pyaaf2/tests/AAF testing/writeTallyAAF.py"
	const pythonProcess = spawn('python3',[file_path, JSON.stringify(data), JSON.stringify(uniqueLabelsToColors(data)), JSON.stringify(pgmTapeName)]);
}

function msSinceMidnight(){
	// calculate the number of milliseconds since midnight
	var d = new Date()
	var msResult = ""
	// code left here in case date is of use
	// const mo = (d.getMonth() + 1).toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping:false}); // JavaScript months are 0-indexed
	// const dd = d.getDate().toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping:false});
	// const yyyy = d.getFullYear();
	// const hh = d.getHours().toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping:false});
	// const mm = d.getMinutes().toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping:false});
	// const ss = d.getSeconds().toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping:false});
	// const msc = d.getMilliseconds().toLocaleString('en-US', {minimumIntegerDigits: 3, useGrouping:false});
	
	return (d.getTime() - d.setHours(0,0,0,0))
}


function timedOutput(reset = false){
	// this is for AAF write at current point and reset
	// last cut is end of sequence
	let lastElement = tallyLog['clips'].pop();
	tallyLog.end = lastElement['TIME'];
	writeToAAF(tallyLog);
	if (reset){
		// Reset tallylog
		tallyLog.start = tallyLog.end;
		tallyLog.end = 0;
		tallyLog['clips']=[];
		tallyLog['clips'].push(lastElement);
	}
	// Reset the timer after running the task
	resetTimer();
}

// Create a TCP server - was a client in original code
// May be more efficient to use UDP in practice?
const server = net.createServer((socket) => {
    // console.log('Client connected');
    socket.on('data', (data) => {
        delim = Buffer.from([0xfe, 0x02]);
        var spl_data = bsplit(data, delim);
        spl_data.forEach((dataPiece) => {
            if (dataPiece.length > 0) {
                parse(dataPiece); // Use the tally-timer parse function
            }
        });
    });

    socket.on('close', () => {
        // console.log('Connection closed');
    });

    socket.on('error', (err) => {
        console.error(`Error: ${err}`);
    });
});

server.listen(listenPort, listenIP, () => {
    console.log('Server listening on - ' + listenIP + ' : ' + listenPort);
    console.log('from - ' + (new Date().toLocaleString()));
    // console.log('Press control+p to output AAF (e.g. between rotations)\ncontrol+c to output AAF and exit script (e.g. at end of night)')
});

// Key press setup
keypress(process.stdin);
process.stdin.on('keypress', function (ch, key) {
    console.log('INFO: got "keypress"', key);
    if (key && key.ctrl && key.name == 'c') {
		// last time for end of sequence
		tallyLog.end = msSinceMidnight();
		// console.log(tallyLog)        
        writeToAAF(tallyLog)
 // exit as control-c       
        process.stdin.pause();
        process.exit();
    }
    if (key && key.ctrl && key.name == "p") {
    console.log('INFO: writing AAF file and resetting tallyLog')
		// this is for AAF write at current point and reset
		let lastElement = timedOutput(reset = true);
    }
    if (key && key.ctrl && key.name == "o") {
		console.log('INFO: writing AAF file WITHOUT resetting tallyLog')
		timedOutput(reset = false);
	}
	

});

process.stdin.setRawMode(true);
process.stdin.resume();