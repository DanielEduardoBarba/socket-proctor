import { exec, spawn } from 'child_process'
import { WebSocket } from 'ws'

const args = process.argv.slice(2)

let serverName = "rock-coders-server.local"
let serverUrl = await resolveAndFindServer(serverName)
console.log("FOUND SERVER AT: ", serverUrl)

async function resolveAndFindServer(name) {

    let ip
    try {
        const response = await runSysCmd(`avahi-resolve -n ${name}`)
        ip = response.trim().split("\t")[0]
    } catch (err) {

    }
    return `ws://${ip ? ip : name}:5000`

}
let ws
function connectToServer(url) {
    ws = new WebSocket(url)

    ws.on("close", () => {
        ws = null
        console.log("Attempting reconnection...")
        setTimeout(() => {
            connectToServer(serverIp)
        }, 1000)
    })
    ws.on("open", () => {
        console.log("Connection succesful!")
    })
    ws.on("error", () => {
        console.log("Error connecting...")
    })

}

function sendWS(msg) {
    if (ws) {
        ws.send(JSON.stringify(msg))
    }
}

async function runNode(args) {
    if (!args.length) return
    const nodeProcess = spawn('node', [...args])
    nodeProcess.stdout.on('data', (data) => {
        const msg = data.toString().trim()
        console.log(`Child process emitted: ${msg}`)
        sendWS({ type: "SUBMIT_ANSWER", data: msg })
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


connectToServer(serverUrl)
await runNode(args)



export async function runSysCmd(cmd, isShow) {
    return new Promise((resolve, reject) => {

        exec(cmd, (error, stdout, stderr) => {
            if (error) {
                console.log(error)
            }
            if (stdout) resolve(stdout)
            if (stderr) {
                console.log(stderr)
                reject(stderr)
            }
        })
    })
} 