# Tally Timer

I've amended this to act as a server (it wasn't seeing the TCP data as a client) and to write the cuts to disk against current time in an EDL format. Tested importing to Avid.  

## Starting it up
- Clone the repo
- `npm install`
- Change addresses in `index.js`
- `npm start`
- Ask your director why we have 100 cameras when they only use 12

## Controls:
Every time a tally object is updated, it is stored to an array and the previous tallies object label is appended to disk as an EDL line using current time as the outPoint. 

To break press `ctl+c` like normal (will use current time as outpoint for last tally cut).
