import { readMyFile } from "../index.js"

let DB

export async function initializeRoutes($DB) {
    DB = $DB
}

export async function checkAnswer(req, res, client, save) {
    const q = await readMyFile("./question.json")
    const examName = req.type
    const answer = req.data
    let isCorrect = false
    // console.log(q)
    q.exams.forEach((e, i) => {
        if (e?.name === examName && e?.answer == answer) {
            isCorrect = true
        }
    })
    console.log("Answer: ", answer, "for exam: ", examName, " is correct?: ", isCorrect)
    console.log("answer submitted: ", answer)

    res.cmd = "CLIENT_READ_RESULT"
    res.data = isCorrect

}


export async function identifyPlayer(req, res, client, save) {
    var profile = req?.data
    if (profile?.uuid) {
        client.profile = { ...profile }
        client.uuid = profile?.uuid 
        DB.PLAYERS.users[profile?.uuid] = {...profile}
        DB.PLAYERS.users[profile?.uuid].isActive = true
        res.cmd = "NO RETURN"
        save.players=true
    } else {
        res.cmd = "CLIENT_NOTIFY"
        res.type = "exit"
        res.data = "Your profile is missing a UUID\n please run command to create profile"
    }
}