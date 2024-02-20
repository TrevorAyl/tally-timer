# Tally Timer

I've amended this to act as a server (it wasn't seeing the TCP data as a client) and to write the cuts to disk against current time in an EDL format. Tested importing to Avid.  

## Starting it up
- Clone the repo
- `npm install`
- Change addresses in `index.js`
- `npm start`
- Ask your director why we have 100 cameras when they only use 12

## Controls:
Every time a tally object is updated, it is stored to an array and can be written to an AAF, either peridically or on keyboard command. 

`ctl + o` writes to file from forst to last tally chane time and resets start time to last tally change time.

`ctl + p` does the same but does not update the start time.


To break press `ctl+c` like normal (will use current time as outpoint for last tally cut).
