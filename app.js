const express = require('express')
const request = require('request')
const ls = require('local-storage')
const app = express()
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const Bottleneck = require('bottleneck')
const NodeCache = require("node-cache")
const cache = new NodeCache()

const BASE_URL = "https://codeforces.com/api/"

app.set("view engine", "ejs")
app.use(express.static(__dirname + "/"))
app.use(cookieParser())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

const limiter = new Bottleneck({
  minTime: 500,
  maxConcurrent: 1
})

fetchContests(function (contests) {
  var promises = []
  for (var i = 0; i < contests.length; i++) {
    promises.push(fetchProblemsForContest(contests[i]))
  }

  Promise.all(promises).then(() => {
    console.log("All problems for contests saved successfully!")
  }).catch(err => {
    throw err
  })
})


app.get('/', function (req, res) {
  res.render("home")
})

app.get('/contests', function (req, res) {
  var handle = ls('handle')
  if (ls('contestsList')) {
    res.render('contests', {
      contests: ls('contestsList'),
      handle: handle
    })
  }

  fetchContests(function () {
    fetchProblems(function () {
      fetchSubmissions(handle, function () {
        var contests = ls('contests')
        var contestsMap = {}
        contests.forEach(contest => {
          contestsMap[contest.id] = {
            name: contest.name,
            startTimeSeconds: contest.startTimeSeconds,
            problems: {}
          }
        })
        var submissions = ls('submissions')
        submissions.forEach(submission => {
          var contestId = submission.problem.contestId
          var index = submission.problem.index
          if (contestId in contestsMap) {
            contestsMap[contestId].problems[index] = true
          }
        })
        var problems = ls('problems')
        problems.forEach(problem => {
          var contestId = problem.contestId
          if (contestId in contestsMap) {
            var index = problem.index
            if (!(index in contestsMap[contestId].problems)) {
              contestsMap[contestId].problems[index] = false
            }
          }
        })

        var contestsList = [];
        for (var i in contestsMap) {
          var problemsMap = contestsMap[i].problems
          var problemsList = []
          var keys = Object.keys(problemsMap)
          keys.sort()
          for (var j = 0; j < keys.length; j++) {
            var key = keys[j];
            var value = problemsMap[key];
            problemsList.push([key, value])
          }

          contestData = {
            id: i,
            name: contestsMap[i].name,
            startTimeSeconds: contestsMap[i].startTimeSeconds,
            problems: problemsList
          }
          contestsList.push(contestData);
        }

        res.render('contests', {
          contests: contestsList.sort((a, b) => (a.startTimeSeconds > b.startTimeSeconds) ? -1 : +1),
          handle: handle
        })
      })
    })
  })
})

app.post('/contests', function (req, res) {
  ls('handle', req.body.handle)
  ls('contestsList', null)
  res.redirect('contests')
})

app.listen(process.env.PORT || 1729, process.env.IP, function () {
  console.log("starting server at " + new Date())
})

function fetchContests(callback) {
  request(BASE_URL + 'contest.list', function (api_error, response, body) {
    if (api_error) {
      throw api_error
    }

    contests = JSON.parse(body).result
      .filter(d => d.phase === 'FINISHED')
      .sort((a, b) => (a.startTimeSeconds > b.startTimeSeconds) ? -1 : +1)
    if (ls('contests', contests)) {
      console.log("Success: Successfully saved contests!")
      callback(contests)
    } else {
      console.log("Error: Unable to save contests.")
    }
  })
}

function fetchProblemsForContest(contest) {
  var contestId = contest.id
  limiter.schedule(() =>
    request(BASE_URL + 'contest.standings?&from=1&count=1&contestId=' + contestId, function (api_error, response, body) {
      if (api_error) {
        throw api_error
      }

      var json = JSON.parse(body)
      var status = json.status
      if (status === "FAILED" && json.comment.indexOf("contestId: Contest with id") != -1) {
        console.log("Bug: standings API Bug. contest not found with id " + contestId)
        return
      }
      console.log(json)
      problems = JSON.parse(body).result.problems
      contest.problems = problems
      var success = cache.set(contestId, contest)
      if (success) {
        console.log("Success: Successfully saved problems for contestId " + contestId + "!")
      }
    }))
}

function fetchProblems(callback) {
  request(BASE_URL + 'problemset.problems', function (api_error, response, body) {
    if (api_error) {
      throw api_error
    }

    problems = JSON.parse(body).result.problems
    if (ls('problems', problems)) {
      console.log("Success: Successfully saved problems!")
      callback()
    } else {
      console.log("Error: Unable to save problems.")
    }
  })
}

function fetchSubmissions(handle, callback) {
  if (!handle) {
    ls('submissions', [])
    callback()
    return
  }
  request(BASE_URL + 'user.status?handle=' + handle, function (api_error, response, body) {
    if (api_error) {
      throw api_error
    }

    json = JSON.parse(body)
    if (json.comment && json.comment.indexOf("not found") != -1) {
      console.log("Invalid handle")
      ls('submissions', [])
      callback()
      return
    }
    submissions = json.result
      .filter(d => d.verdict === 'OK')
    if (ls('submissions', submissions)) {
      console.log("Success: Successfully saved submissions for handle " + handle + "!")
      callback()
    } else {
      console.log("Error: Unable to save submissions for handle " + handle + ".")
    }
  })
}