import { spawn } from 'child_process'
import { WebSocket } from 'ws'

const args = process.argv.slice(2)

const serverUrl = "ws://localhost:5000"
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