import {  WebSocketServer } from "ws"
import { initializeRoutes, checkAnswer } from "./routes.js"

let DB

export async function initializeSocket($DB) {
    DB = $DB
    startServer()
    initializeRoutes()
}


function getIP(req){
return req.socket.remoteAddress
}
function startServer() {

    const server = new WebSocketServer({ port: 5000 })

    server.on("connection", (client,req) => {
        const client_ip=getIP(req)
        console.log(`Client ${client_ip} connected...`)



        client.on("message", (data) => {
            let req
            try{
                const str=data.toString('utf8')
                console.log("raw data: ", str)
             req=JSON.parse(str)

            }catch(err){
                console.log("Inbound packet error: ", err.message)
                return
            }

            switch(req.type){
                case "SUBMIT_ANSWER":
                    const isCorrect=checkAnswer(req.data)
                    break
                    default:
                        console.log("TYPE not recognized!")
                        break
            }

        }) 
        
        client.on("close", ()=>{
            console.log("Client disconnected...")
        })


    })
}


