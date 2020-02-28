function searchContests(name) {
    var filter = name
    if (name !== null) {
        filter = document.getElementById('contestInput').value.toUpperCase()
    }
    var contestsUL = document.getElementById("contestsUL")
    var contests = contestsUL.getElementsByTagName('li')

    for (var i = 0; i < contests.length; i++) {
        var a = contests[i].getElementsByTagName("a")[0]
        var textValue = a.textContent || a.innerText
        if (textValue.toUpperCase().indexOf(filter) > -1) {
            contests[i].style.display = ""
        } else {
            contests[i].style.display = "none"
        }
    }
}

function filterContests(name) {
    document.getElementById('contestInput').value = name
    searchContests(name)
}