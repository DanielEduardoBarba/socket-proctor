import { readMyFile } from "../index.js"
import { kickByUUID } from "./socket.js"

let DB

export async function initializeLogic($DB) {
    DB = $DB
}

export async function terminalPromptCmds(stdin) {
    const args = stdin.split(" ")
    const cmd = args[0].trim()
    let val
    if (args[1]) val = args[1].trim()
    switch (cmd) {
        case "quit":
            console.log('Exiting...')
            process.exit(0)
            break
        case "kick":
            const {users}=DB.PLAYERS
            let i=0
            for(let uuid in users){
                i++
                if(val==i)kickByUUID(uuid)
 
            }  
            
        break

    }


}
