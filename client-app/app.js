import { exec, spawn } from 'child_process'
import { WebSocket } from 'ws'
import { readFile } from 'fs'
import PROFILEJSON from './rock_profile.json' assert{type: "json"}

const args = process.argv.slice(2)
let profile = PROFILEJSON
const rootProfileDir = "/var/lib/rock-coders-server"
const profileJson = "rock_profile.json"
await runSysCmd(`sudo mkdir ${rootProfileDir}`)
let response = await readMyFile(`${rootProfileDir}/${profileJson}`)
if (response) profile = response

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
    ws = new WebSocket(url)

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



connectToServer(serverUrl)
await runNode(args)