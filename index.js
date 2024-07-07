import { readFile } from "fs"
import { initializeSocket } from "./scripts/socket.js"


const DB={

}

async function initializeServer(){
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
