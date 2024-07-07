import { exec, spawn } from 'child_process'
import { WebSocket } from 'ws'

const args = process.argv.slice(2)

let serverName = "rock-coders-server.local"
let avahiUrl = await avahiResolve(serverName)
console.log("avahiUrl: ", avahiUrl)
let digUrl = await digResolve(serverName)
console.log("digUrl: ", digUrl)
const serverUrl=avahiUrl
    ?avahiUrl
    :digUrl
        ?digUrl
        :null
if(avahiUrl){
    console.log("UBUNTU SYSTEM DETECTED")
}else if(digUrl){

    console.log("MACBOOK SYSTEM DETECTED")
}else{
    console.log("UNKOWN SYSTEM...")
}
console.log("FOUND SERVER AT: ", serverUrl)
async function digResolve(name) {

    let ip=null
    try {
        const response = await runSysCmd(`dig @224.0.0.251 -p 5353 ${name} +short`)
        ip = response.trim()
    } catch (err) {}
    return ip?`ws://${ip}:5000`:null

}
async function avahiResolve(name) {
    let ip=null
    try {
        const response = await runSysCmd(`avahi-resolve -n ${name}`)
        ip = response.trim().split("\t")[0]
    } catch (err) { }
    return ip?`ws://${ip}:5000`:null

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
            if (error && isShow) {
                console.log(error)
            }
            if (stdout) resolve(stdout)
            if (stderr) {
                if(isShow)console.log(stderr)
                reject(stderr)
            }
        })
    })
} 