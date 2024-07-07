import { readFile, writeFile } from "fs"
import { initializeSocket } from "./scripts/socket.js"
import PLAYERSJSON from "./players.json" assert{type: "json"}

export const CC = {
    // Reset
    Reset: "\x1b[0m",

    // Text styles
    Bright: "\x1b[1m",
    Dim: "\x1b[2m",
    Underline: "\x1b[4m",
    Blink: "\x1b[5m",
    Reverse: "\x1b[7m",
    Hidden: "\x1b[8m",

    // Foreground colors
    Black: "\x1b[30m",
    Red: "\x1b[31m",
    Green: "\x1b[32m",
    Yellow: "\x1b[33m",
    Blue: "\x1b[34m",
    Magenta: "\x1b[35m",
    Cyan: "\x1b[36m",
    White: "\x1b[37m",
    BrightBlack: "\x1b[90m",
    BrightRed: "\x1b[91m",
    BrightGreen: "\x1b[92m",
    BrightYellow: "\x1b[93m",
    BrightBlue: "\x1b[94m",
    BrightMagenta: "\x1b[95m",
    BrightCyan: "\x1b[96m",
    BrightWhite: "\x1b[97m",

    // Background colors
    BgBlack: "\x1b[40m",
    BgRed: "\x1b[41m",
    BgGreen: "\x1b[42m",
    BgYellow: "\x1b[43m",
    BgBlue: "\x1b[44m",
    BgMagenta: "\x1b[45m",
    BgCyan: "\x1b[46m",
    BgWhite: "\x1b[47m",
    BgBrightBlack: "\x1b[100m",
    BgBrightRed: "\x1b[101m",
    BgBrightGreen: "\x1b[102m",
    BgBrightYellow: "\x1b[103m",
    BgBrightBlue: "\x1b[104m",
    BgBrightMagenta: "\x1b[105m",
    BgBrightCyan: "\x1b[106m",
    BgBrightWhite: "\x1b[107m"
}

const DB = {
    PLAYERS:PLAYERSJSON
}

async function initializeServer() {

    const response = await readMyFile("./players.json")
    if(response)DB.PLAYERS=response

    await initializeSocket(DB)
}


initializeServer()


export async function runSysCmd(cmd, isShow) {
    return new Promise((resolve, reject) => {

        exec(cmd, (error, stdout, stderr) => {
            if (error && isShow) {
                console.log(error)
            }
            if (stdout) resolve(stdout)
            if (stderr) {
                if (isShow) console.log(stderr)
                reject(stderr)
            }
        })
    })
}

export function readMyFile(file, type = "json") {
    return new Promise((resolve, reject) => {

        readFile(file, (err, data) => {
            if (err) reject(stdout)
            if (type == "json") {
                resolve(JSON.parse(data.toString()))
            }

        })
    })
}

export function writeMyFile(file, data, type = "json") {
    return new Promise((resolve, reject) => {
        console.log("saving:",file)
        if (type == "json") {
            const jsonData = JSON.stringify(data)
            writeFile(file, jsonData, 'utf8', (err) => {
                if (err) {
                    console.error('Error writing file:', err)
                }
                console.log(`Data has been written to ${file}`)
                resolve()
            })

        }
    })
}


function clearTerminal() {
    // ANSI escape sequence to clear the screen
    process.stdout.write('\u001b[2J\u001b[0;0H');
}

let counter = 0;

function updateTerminal() {
    counter++;

    // Move cursor to the top left corner (0,0) and clear the screen
    clearTerminal();
    const {users}=DB.PLAYERS
    let playerLine=""
    let i=0
    for(let uuid in users){
        i++
        const {name}=users[uuid]
        const firstName =name.split(" ")[0]
        playerLine+=`${CC.Cyan}${i}: ${CC.Magenta}${firstName}${CC.Reset}\t`
    } 
    const ts=Date.now()
    // Print new content or update information
    console.log(`${CC.Blue}${Date(ts)}${CC.Reset}`)
    console.log(`\t\t\t${CC.BrightYellow+CC.Underline}Players${CC.Reset}`);
    console.log(playerLine)
}

// Initial update
updateTerminal();

// Set interval to update the terminal every 2 seconds
setInterval(updateTerminal, 500);
