const express = require('express')
const request = require('request')
const ls = require('local-storage')
const app = express()

const BASE_URL = "https://codeforces.com/api/"

app.set("view engine", "ejs")
app.use(express.static(__dirname + "/"))

var contestsLastUpdated = ls('contests_last_updated')
if (!contestsLastUpdated || Date.now() - contestsLastUpdated > 24 * 60 * 60 * 1000) {
  console.log(contestsLastUpdated)
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

request(BASE_URL + 'problemset.problems', function (api_error, response, body) {
  if (api_error) {
    throw api_error
  }

  problems = JSON.parse(body).result.problems
  ls('problems', problems)
})

app.get('/', function (req, res) {
  res.redirect("contests")
})

app.get('/contests', function (req, res) {
  res.render('contests', { contests: ls('contests') })
})

app.listen(process.env.PORT || 1729, process.env.IP, function () {
  console.log("starting server at " + new Date())
})