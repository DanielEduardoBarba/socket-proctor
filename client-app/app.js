import { exec, spawn } from 'child_process'
import { WebSocket } from 'ws'
import { readFile, writeFile } from 'fs'
import PROFILEJSON from './rock_profile.json' assert{type: "json"}
import readline from 'readline'
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
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})

const prompt = (question) => new Promise((resolve) => {
    rl.question(question, (answer) => {
        resolve(answer.trim())
    })
})

async function createSaveProfile() {
    console.log(CC.BrightCyan, CC.Underline, "SETUP MODE", CC.Reset)
    const name = await prompt(`${CC.Cyan}Enter name:${CC.Magenta} `)
    const uuid = await prompt(`${CC.Cyan}Enter a UUID(can be random, phone number, etc..):${CC.Magenta} `)
    console.log(CC.Reset)
    profile.name = name
    profile.uuid = uuid
    await writeMyFile(profileFile, profile)
    console.log(CC.BrightGreen, "Your Profile has been created/saved!", CC.Reset)
    process.exit(0)
}
async function changeServer() {
    console.log(CC.BrightCyan, CC.Underline, "SETUP MODE", CC.Reset)
    const serverName = await prompt(`${CC.Cyan}Enter server name:${CC.Magenta} `)
    console.log(CC.Reset)
    profile.serverName = serverName 
    await writeMyFile(profileFile, profile)
    console.log(CC.BrightGreen, "Server name saved!", CC.Reset)
    process.exit(0)
}
async function confirmPromptDelete() {
    console.log(CC.BrightCyan, CC.Underline, "DELETE PROFILE", CC.Reset)
    const ans = await prompt(`${CC.Red}Confirm deletion with Y:${CC.Yellow} `)
    if (String(ans).toUpperCase() === "Y") {
        console.log(CC.Blue, "Deleting profile...", CC.Reset)
        runSysCmd(`sudo rm ${profileFile}`)
        console.log(CC.BrightGreen, "Deleted!", CC.Reset)
    }

    process.exit(0)
}

function parseFlags(args) {
    const flags = {}
    let currentFlag = null

    for (let i = 2; i < args.length; i++) {
        const arg = args[i]

        if (arg.startsWith('-')) {
            // Remove leading dashes
            currentFlag = arg.slice(1)
            flags[currentFlag] = true // Initialize flag with true
        } else if (currentFlag) {
            // Add value to current flag
            flags[currentFlag] = arg
            currentFlag = null // Reset current flag
        }
    }

    console.log("FLAGS:", flags)
    return flags
}

// Parse command-line arguments
const flags = parseFlags(process.argv)
const args = process.argv.slice(2)
const rootProfileDir = "/var/lib/rock-coders-server"
const profileJson = "rock_profile.json"
const profileFile = `${rootProfileDir}/${profileJson}`
let profile = PROFILEJSON

await runSysCmd(`sudo mkdir ${rootProfileDir}`)
let response = await readMyFile(profileFile)
if (response) profile = response

if (flags?.setup) await createSaveProfile()
else if (flags?.delete) await confirmPromptDelete() 
else if (flags?.server) await changeServer()
    
console.log("profile:", profile)



const serverUrl = await getServer()
console.log("FOUND SERVER AT: ", serverUrl)
//function-----------------------------

async function getServer() {
    let serverName = "rock-coders-server.local"
    let avahiUrl = await avahiResolve(serverName)
    let digUrl
    if (!avahiUrl) digUrl = await digResolve(serverName)
    if (avahiUrl) {
        console.log("UBUNTU SYSTEM DETECTED")
        // console.log("avahiUrl: ", avahiUrl)
    } else if (digUrl) {

        console.log("MACBOOK SYSTEM DETECTED")
        // console.log("digUrl: ", digUrl)
    } else {
        console.log("UNKOWN SYSTEM/COULD NOT FIND SERVER...exiting...")
        process.exit(0)
    }

    const ip = avahiUrl
        ? avahiUrl
        : digUrl
            ? digUrl
            : null
    return ip ? `ws://${ip}:${profile?.port}` : null

}

async function digResolve(name) {

    let ip = null
    try {
        const response = await runSysCmd(`dig @224.0.0.251 -p 5353 ${name} +short`)
        ip = response.trim()
    } catch (err) { }
    return ip ? ip : null

}
async function avahiResolve(name) {
    let ip = null
    try {
        const response = await runSysCmd(`avahi-resolve -n ${name}`)
        ip = response.trim().split("\t")[1]
    } catch (err) { }
    return ip ? ip : null

}
let ws
function connectToServer(url) {
    try {
        ws = new WebSocket(url)

    } catch (err) {
        setTimeout(() => {
            connectToServer(serverUrl)
        }, 1000)
        return
    }

    ws.on("close", () => {
        ws = null
        console.log("Attempting reconnection...")
        setTimeout(() => {
            connectToServer(serverUrl)
        }, 1000)
    })
    ws.on("open", () => {
        console.log("Connection succesful!")
        sendWS({ cmd: "SERVER_IDENTIFY", data: profile })
    })
    ws.on("error", () => {
        console.log("Error connecting...")
    })

    ws.on("message", (data) => {
        let req
        try {
            const str = data.toString('utf8')
            // console.log("raw data: ", str)
            req = JSON.parse(str)

        } catch (err) {
            console.log("Inbound packet error: ", err.message)
            return
        }
        console.log("SERVER: ", req)
        switch (req.cmd) {
            case "CLIENT_READ_RESULT":
                if (req.data == true) {
                    console.log("--------------ANSWER CORRECT!-----------")
                    process.exit(0)
                }
                break
            case "CLIENT_NOTIFY":
                console.log("SERVER MESSAGE:\n", req?.data)
                if (req.type == "exit") process.exit(0)

                break
            default:
                console.log("TYPE not recognized!")
                break
        }
    })

}

function sendWS(msg) {
    if (ws) {
        ws.send(JSON.stringify(msg))
    } else {
        console.log("CANT SEND TO WS SERVER: ", msg)
    }
}

async function runNode(args) {
    if (!args.length) return
    const nodeProcess = spawn('node', [...args])
    nodeProcess.stdout.on('data', (data) => {
        const msg = data.toString().trim()
        // console.log(`Child process emitted: ${msg}`)
        sendWS({ cmd: "SERVER_SUBMIT_ANSWER", type: args[0], data: msg })
    })

    // Capture stderr data (in case of errors)
    nodeProcess.stderr.on('data', (data) => {
        console.error(`Child process error: ${data}`)
    })

    // Capture the close event when the child process exits
    nodeProcess.on('close', (code) => {
        console.log(`Child process exited with code ${code}`)
    })
}

export async function runSysCmd(cmd, isShow) {
    return new Promise((resolve, reject) => {

        exec(cmd, (error, stdout, stderr) => {
            if (error && isShow) {
                console.log(error)
            }
            if (stdout) resolve(stdout)
            if (stderr) {
                if (isShow) console.log(stderr)
                resolve(stderr)
            }
        })
    })
}

export function readMyFile(file, type = "json") {
    return new Promise((resolve, reject) => {

        readFile(file, (err, data) => {
            if (err) resolve(null)
            if (type == "json") {
                try {

                    resolve(JSON.parse(data.toString()))
                } catch (err) {
                    resolve(null)
                }
            }

        })
    })
}
export function writeMyFile(file, data, type = "json") {
    return new Promise((resolve, reject) => {

        if (type == "json") {
            const jsonData = JSON.stringify(data)
            writeFile(file, jsonData, 'utf8', (err) => {
                if (err) {
                    console.error('Error writing file:', err)
                }
                // console.log(`Data has been written to ${file}`)
                resolve()
            })

        }
    })
}




connectToServer(serverUrl)
await runNode(args)