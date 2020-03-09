const MongoClient = require('mongodb').MongoClient
const CronJob = require('cron').CronJob
const express = require('express')
const request = require('request')
const app = express()

const BASE_URL = "https://codeforces.com/api/"

app.set("view engine", "ejs")
app.use(express.static(__dirname + "/"))

var url = 'mongodb://localhost:27017'
if (process.env.MONGODB_PASSWORD) {
  url = "mongodb+srv://" + process.env.MONGODB_USERNAME + ":" + process.env.MONGODB_PASSWORD + process.env.MONGODB_CLUSTER
}

MongoClient.connect(url, { useNewUrlParser: true, useUnifiedTopology: true }, function (db_err, database) {
  if (db_err) {
    throw db_err
  }

  console.log("successfully connected to database at " + new Date())
  var db = database.db("codeforceshelper")
  var contestcollection = db.collection("contest")
  var problemcollection = db.collection("problem")
  var problemsincontestcollection = db.collection("problems_in_contest")

  fetchContests()
  fetchProblems()
  new CronJob('0 */6 * * *', function () {
    fetchContests()
    fetchProblems()
  }, null, true)
  new CronJob('0 */1 * * *', function () {
    mergeProblemsWithContests()
  }, null, true)

  app.get('/', function (req, res) {
    res.redirect("contests")
  })

  app.get('/contests', function (req, res) {
    contestcollection.find().toArray((err, contests) => {
      if (err) {
        throw err
      }

      for (var i in contests) {
        contests[i].startTime = new Date(contests[i].startTimeSeconds * 1000)
      }
      res.render("contests", { contests: contests })
    })
  })

  app.listen(process.env.PORT || 1729, process.env.IP, function () {
    console.log("starting server at " + new Date())
  })

  function fetchContests() {
    request(BASE_URL + 'contest.list', function (api_error, response, body) {
      if (api_error) {
        throw api_error
      }

      contests = JSON.parse(body).result
        .filter(d => d.phase === 'FINISHED')
        .sort((a, b) => (a.startTimeSeconds > b.startTimeSeconds) ? -1 : +1)
      contestcollection.deleteMany({}).then(function () {
        contestcollection.insertMany(contests, function (db_insert_err, result) {
          if (db_insert_err) {
            throw db_insert_err
          } else {
            console.log("contests saved successfully at " + new Date())
          }
        })
      })
    })
  }

  function fetchProblems() {
    request(BASE_URL + 'problemset.problems', function (api_error, response, body) {
      if (api_error) {
        throw api_error
      }

      problems = JSON.parse(body).result.problems
      problemcollection.deleteMany({}).then(function () {
        problemcollection.insertMany(problems, function (db_insert_err, result) {
          if (db_insert_err) {
            throw db_insert_err
          } else {
            console.log("problems saved successfully at " + new Date())
          }
        })
      })
    })
  }

  function mergeProblemsWithContests() {
    problemcollection.aggregate([{
      $lookup: {
        from: "contest",
        localField: "contestId",
        foreignField: "id",
        as: "problems_with_contest_details"
      }
    }]).toArray(function (err, res) {
      if (err) {
        throw err
      }

      problemsincontestcollection.deleteMany({}).then(function () {
        problemsincontestcollection.insertMany(res, function (db_insert_err, result) {
          if (db_insert_err) {
            throw db_insert_err
          } else {
            console.log("problems with contest details saved successfully at " + new Date())
          }
        })
      })
    })
  }
})