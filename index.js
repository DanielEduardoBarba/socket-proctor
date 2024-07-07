import { initializeSocket } from "./scripts/socket.js"


const DB={

}

async function initializeServer(){
    await initializeSocket(DB)
}


initializeServer()