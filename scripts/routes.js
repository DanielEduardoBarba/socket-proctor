import { readMyFile } from "../index.js"

let DB

export async function initializeRoutes($DB) {
    DB = $DB
}

export async function checkAnswer(req,res) {
    const q = await readMyFile("./question.json")
    const examName = req.type
    const answer = req.data
    let isCorrect = false
    console.log(q)
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

