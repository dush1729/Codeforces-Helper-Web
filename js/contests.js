function searchContests(name) {
    var filter = name
    if (name !== null) {
        filter = document.getElementById('contestInput').value.toUpperCase()
    }
    var contestsUL = document.getElementById("contestsUL")
    var contests = document.getElementsByTagName('tr')

    for (var i = 0; i < contests.length; i++) {
        var a = contests[i].getElementsByTagName("td")[0]
        if (a) {
            var textValue = a.textContent || a.innerText
            console.log(textValue)
            if (textValue.toUpperCase().indexOf(filter) > -1) {
                contests[i].style.display = ""
            } else {
                contests[i].style.display = "none"
            }
        }
    }
}

function filterContests(name) {
    document.getElementById('contestInput').value = name
    searchContests(name)
}