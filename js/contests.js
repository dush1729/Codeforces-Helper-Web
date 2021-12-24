function searchContests() {
    var filterName = document.getElementById('contestInput').value.toUpperCase()
    var filterPartcipation =  document.getElementById('participationTypeInput').value.toUpperCase()

    var contestsTable = document.getElementById('contestsTable')
    var contests = contestsTable.getElementsByTagName('tr')

    for (var i = 0; i < contests.length; i++) {
        var tdName = contests[i].getElementsByTagName("td")[0]
        var tdParticipation = contests[i].getElementsByTagName("td")[1]
        if(tdName && tdParticipation) {
            var nameValue = tdName.textContent || tdName.innerText
            var participationValue = tdParticipation.textContent || tdParticipation.innerText
            if (nameValue.toUpperCase().indexOf(filterName) > -1 && participationValue.toUpperCase().indexOf(filterPartcipation) > -1) {
                contests[i].style.display = ""
            } else {
                contests[i].style.display = "none"
            }
        }
    }
}

function filterContests(name, column) {
    if(column == 0) {
        document.getElementById('contestInput').value = name
    } else {
        document.getElementById('participationTypeInput').value = name
    }
    searchContests()
}