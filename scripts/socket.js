import { WebSocketServer } from "ws"
import { initializeRoutes, checkAnswer, identifyPlayer } from "./routes.js"
import { CC, writeMyFile } from "../index.js"

let DB

export async function initializeSocket($DB) {
    DB = $DB
    startServer()
    initializeRoutes($DB)
}

function getIP(req) {
    return req.socket.remoteAddress
}
 let server
function startServer() {

     server = new WebSocketServer({ port: 5000 })

    server.on("connection", (client, req) => {
        const client_ip = getIP(req)
        console.log(`Client ${client_ip} connected...`)



        client.on("message", async (data) => {
            let req
            try {
                const str = data.toString('utf8')
                // console.log("raw data: ", str)
                req = JSON.parse(str)

            } catch (err) {
                console.log("Inbound packet error: ", err.message)
                return
            }
            let res = { ...req }
            const save = { players: false }
            switch (req.cmd) {
                case "SERVER_SUBMIT_ANSWER": await checkAnswer(req, res, client, save)
                    break
                case "SERVER_IDENTIFY": await identifyPlayer(req, res, client, save)

                    break
                default:
                    console.log(CC.BgBlue, "TYPE not recognized!", CC.Reset)
                    break
            }
            if (res.cmd !== "NO RETURN") client.send(JSON.stringify(res))
            saveJSONS(save)
        })

        client.on("close", () => {
            console.log("Client disconnected...")
        })


    })
}

export function kickByUUID(uuid){
    if(server){
        server.clients.forEach((client,i)=>{
            if(client?.uuid==uuid){
                client.close()
                DB.PLAYERS.users[uuid].isActive = false
                saveJSONS({players:true})
            }
        })
    }
}

function saveJSONS(save) {
    console.log(save)
    if (save?.players) writeMyFile("./players.json", DB.PLAYERS)
}


