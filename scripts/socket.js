import { WebSocketServer } from "ws"
import { initializeRoutes, checkAnswer } from "./routes.js"

let DB

export async function initializeSocket($DB) {
    DB = $DB
    startServer()
    initializeRoutes()
}

function getIP(req) {
    return req.socket.remoteAddress
}

function startServer() {

    const server = new WebSocketServer({ port: 5000 })

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
            switch (req.cmd) {
                case "SERVER_SUBMIT_ANSWER":await checkAnswer(req,res)
                    break
                    case "SERVER_IDENTIFY":
                        var profile=req?.data
                        if(profile?.uuid){
                            client.profile={...profile}
                            client.uuid=profile?.uuid
                            res.cmd!=="NO RETURN"
                        }else{
                            res.cmd="CLIENT_NOTIFY"
                            res.type="exit"
                            res.data="Your profile is missing a UUID\n please run command to create profile"
                        }
                        break
                default:
                    console.log("TYPE not recognized!")
                    break
            }
            if(res.cmd!=="NO RETURN")client.send(JSON.stringify(res))

        })

        client.on("close", () => {
            console.log("Client disconnected...")
        })


    })
}


