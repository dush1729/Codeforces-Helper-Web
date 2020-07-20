const express = require('express')
const request = require('request')
const ls = require('local-storage')
const bodyParser = require('body-parser')
const app = express()
var axios = require('axios')
const e = require('express')

const BASE_URL = "https://codeforces.com/api/"

app.set("view engine", "ejs")
app.use(express.static(__dirname + "/"))
app.use(express.json())
app.use(express.urlencoded())
app.use(bodyParser.urlencoded({ extended: false }))

var contestsLastUpdated = ls('contestsLastUpdated')
if (!contestsLastUpdated || Date.now() - contestsLastUpdated > 24 * 60 * 60 * 1000) {
  request(BASE_URL + 'contest.list', function (api_error, response, body) {
    if (api_error) {
      throw api_error
    }

    contests = JSON.parse(body).result
      .filter(d => d.phase === 'FINISHED')
      .sort((a, b) => (a.startTimeSeconds > b.startTimeSeconds) ? -1 : +1)
    if (ls('contests', contests)) {
      console.log("Success: Successfully saved contests!")
      ls('contestsLastUpdated', Date.now())
    } else {
      console.log("Error: Unable to save contests.")
    }
  })
}

var problemsLastUpdated = ls('problemsLastUpdated')
if (!problemsLastUpdated || Date.now() - problemsLastUpdated > 24 * 60 * 60 * 1000) {
  request(BASE_URL + 'problemset.problems', function (api_error, response, body) {
    if (api_error) {
      throw api_error
    }

    problems = JSON.parse(body).result.problems
    if (ls('problems', contests)) {
      console.log("Success: Successfully saved problems!")
      ls('problemsLastUpdated', Date.now())
    } else {
      console.log("Error: Unable to save problems.")
    }
  })
}

app.get('/', function (req, res) {
  res.redirect("contests")
})

app.get('/contests', function (req, res) {
  res.render('contests', { contests: ls('contests') })
})

app.get('/compete', function (req, res) {
  res.render('compete', { contests: ls('contests') })
})

app.post('/compete', function (req, res) {
  var user1 = req.body.user1, user2 = req.body.user2;

  var url = BASE_URL + 'user.rating?handle='
  axios.all([
    axios.get(url + user1),
    axios.get(url + user2)
  ]).then(axios.spread((response1, response2) => {
    var result1 = response1.data.result
    var result2 = response2.data.result

    var contestIds = new Set()
    var rank1 = {}
    var rank2 = {}
    var contestName = {}
    result1.forEach(contest => {
      contestIds.add(contest.contestId)
      rank1[contest.contestId] = contest.rank
      contestName[contest.contestId] = contest.contestName
    })
    result2.forEach(contest => {
      contestIds.add(contest.contestId)
      rank2[contest.contestId] = contest.rank
      contestName[contest.contestId] = contest.contestName
    })

    
    var finalResult = []
    var won = 0
    var lost = 0
    var draw = 0
    contestIds.forEach( id => {
      finalResult.push({
        contestName: contestName[id],
        contestId: id,
        rank1: parseInt(rank1[id]),
        rank2: parseInt(rank2[id])
      })
      if(parseInt(rank1[id]) < parseInt(rank2[id])) {
        won += 1
      } else if(parseInt(rank1[id]) > parseInt(rank2[id])) {
        lost += 1
      } else if(parseInt(rank1[id]) == parseInt(rank2[id])) {
        draw += 1
      }
    })

    res.render('compete', {data: finalResult, won: won, lost: lost, draw: draw})
  })).catch(error => {
    console.log(error);
  });
});

app.listen(process.env.PORT || 1729, process.env.IP, function () {
  console.log("starting server at " + new Date())
})