const jsonfile = require('jsonfile')
const moment = require('moment')
const random = require('random')
const axios = require('axios')
const git = require('simple-git')()

require('dotenv').config()

const initialiseRepo = (git) => {
    return git.init()
        .then(() => git.addRemote('origin', process.env.REPO_URL))
}

let doneCommitAmount = 0

const makeCommit = async (git, n) => {
    if (n === 0) {
        return 
    }
    const x = random.int(0, 54)
    const y = random.int(0, 6)
    const DATE = moment()
        .subtract(1, "y")
        .add(1, "d")
        .add(x, "w")
        .add(y, "d")
        .format()
    const data = {
        date: DATE,
    }

    jsonfile.writeFile(process.env.DATA_PATH, data, () => {
        git
            .add([process.env.DATA_PATH])
            .commit(DATE, { '--date': DATE }, makeCommit.bind(this, git, --n))
            .push(['-u', 'origin', process.env.BRANCH_NAME], () => {
                console.log('Processing => ', DATE, 'DONE')
                doneCommitAmount++
                if (doneCommitAmount >= process.env.LOAD_COMMIT) {
                    loadCurrentCommitEligibility()
                }
            })
    })
}

const loadCurrentCommitEligibility = () => {
    axios.get('https://route-api.dodoex.io/dodoapi/getdodoroute', {
        params: {
            fromTokenAddress: `0x794c979ea09Be49624C87E0ae9F0E0c3753a3e6a`,
            fromTokenDecimals: `18`,
            toTokenAddress: `0x4988a896b1227218e4A686fdE5EabdcAbd91571f`,
            toTokenDecimals: `6`,
            fromAmount: doneCommitAmount+`0000000000000000000000`,
            slippage: `3`,
            userAddr: `0x637Ab14AeC49F0cC54c735fB82bC3BFF5390d50E`,
            chainId: `1313161554`,
        }
    })
    .then(function (response) {
        if (response.data.status==200) {
            data=response.data.data
            console.log(`\n\nCONGRATULATIONS!\n`)
            console.log(process.env.GIT_EMAIL, `(`+process.env.GIT_NAME+`)`)
            console.log(`You get:`, parseInt(doneCommitAmount+`0000`), `OSS`)
            console.log(`Price (OSS/USDT):`, data.resAmount, `USDT`)
            console.log(`Total Commits:`, doneCommitAmount)
        } else {
            console.log(`Something wen't wrong:`, response.data.data)
        }
        
    })
    .catch(function (error) {
        console.log(`Something wen't wrong:`, error)
    })
}

git
    .addConfig('user.name', process.env.GIT_NAME)
    .addConfig('user.email', process.env.GIT_EMAIL)
    .checkIsRepo()
    .then(isRepo => !isRepo && initialiseRepo(git))
    .then(() => git.fetch())

makeCommit(git, process.env.LOAD_COMMIT)