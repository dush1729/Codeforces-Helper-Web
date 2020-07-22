const express = require('express')
const bodyParser = require('body-parser')
const app = express()
var axios = require('axios')

const BASE_URL = "https://codeforces.com/api/"

app.set("view engine", "ejs")
app.use(express.static(__dirname + "/"))
app.use(express.json())
app.use(express.urlencoded())
app.use(bodyParser.urlencoded({ extended: false }))

app.get('/', function (req, res) {
  res.redirect("contests")
})

app.get('/contests', function (req, res) {
  axios.get(BASE_URL + 'contest.list').then(response => {
    var contests = response.data.result
    contests = contests
      .filter(d => d.phase === 'FINISHED')
      .sort((a, b) => (a.startTimeSeconds > b.startTimeSeconds) ? -1 : +1)
    res.render('contests', { contests: contests })
  })
})

app.get('/compete', function (req, res) {
  res.render('compete')
})

app.post('/compete', function (req, res) {
  var user1 = req.body.user1, user2 = req.body.user2;

  var url = BASE_URL + 'user.rating?handle='
  axios.all([
    axios.get(url + user1),
    axios.get(url + user2)
  ]).then(axios.spread((response1, response2) => {
    console.log("Success: Successfully fetched contests for " + user1 + " and " + user2)
    var result1 = response1.data.result
    var result2 = response2.data.result

    var contestIds = new Set()
    var r1 = {}
    var r2 = {}
    var contestName = {}
    result1.forEach(contest => {
      contestIds.add(contest.contestId)
      r1[contest.contestId] = contest.rank
      contestName[contest.contestId] = contest.contestName
    })
    result2.forEach(contest => {
      contestIds.add(contest.contestId)
      r2[contest.contestId] = contest.rank
      contestName[contest.contestId] = contest.contestName
    })


    var finalResult = []
    var won = 0
    var lost = 0
    var draw = 0
    contestIds.forEach(id => {
      var rank1 = parseInt(r1[id])
      var rank2 = parseInt(r2[id])
      var both = true
      if (isNaN(rank1) || isNaN(rank2)) {
        both = false
      }

      if (both) {
        finalResult.push({
          contestName: contestName[id],
          contestId: id,
          rank1: rank1,
          rank2: rank2
        })

        if (rank1 < rank2) {
          won += 1
        } else if (rank1 > rank2) {
          lost += 1
        } else {
          draw += 1
        }
      }
    })

    finalResult.sort(function (contest1, contest2) {
      return contest2.contestId - contest1.contestId
    })

    res.render('compete', { data: finalResult, won: won, lost: lost, draw: draw, user1: user1, user2: user2 })
  })).catch(error => {
    var message = "Something went wrong!"
    if (error.response.data && error.response.data.comment) {
      message = error.response.data.comment
    }
    console.log(message)
    res.render('compete', { error: message })
  });
});

app.listen(process.env.PORT || 1729, process.env.IP, function () {
  console.log("starting server at " + new Date())
})