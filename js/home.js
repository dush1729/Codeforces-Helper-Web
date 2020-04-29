function keyPressed(event) {
    event = event || window.event
    if (event.keyCode == 13) {
        document.getElementById('button').click()
        return false
    }
    return true
}

function clicked() {
    const handle = document.getElementById('input').value
    if (handle == "") {
        alert('please enter your handle')
    } else {
        Cookies.set('handle', handle)
        window.location = '/contests'
    }
}