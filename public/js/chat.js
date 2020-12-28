const socket = io()

// Elements (The $-profix is Andrew's convention for indicate the valuable references a form element)
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $btnLocation = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')  // The message DIV

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationMessageTemplate = document.querySelector('#locationMessage-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

// Options
const {username, room} = Qs.parse(location.search, {ignoreQueryPrefix: true})

const autoscroll = () => {
    // New msg element
    const $newMessage = $messages.lastElementChild

    // Height of the new message, incl it's margin
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // Visible Height
    const visibleHeight = $messages.offsetHeight

    // Height of messages container
    const containerHeight = $messages.scrollHeight

    // How far have I scrolled
    const scrollOffset =  $messages.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }
    console.log(newMessageMargin)


}

socket.on('message', (msg) => {
    console.log(msg)
    const html = Mustache.render(messageTemplate, {
        username: msg.username,
        message: msg.text,
        createdAt: moment(msg.createdAt).format('ddd HH:mm')  // https://momentjs.com/docs/#/displaying/
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('locationMessage', (msg) => {
    console.log(msg)
    const html = Mustache.render(locationMessageTemplate, {
        username: msg.username,
        url: msg.url,
        createdAt: moment(msg.createdAt).format('ddd HH:mm')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('roomData', ({room, users}) => {
    const html = Mustache.render(sidebarTemplate, {
        room, 
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})

$messageForm.addEventListener('submit', (e) => {
    e.preventDefault()   // Prevent a full page refresh when submit is clicked
    // e represents the target of the event, in this case the form

    // Disable the Submit btn until the location is sent. This can take a few seconds.
    $messageFormButton.setAttribute('disabled', 'disabled')

    //const msg = document.querySelector('input').value
    const msg = e.target.elements.message.value
    socket.emit('sendMessage', msg, (errorMsg) => {

        // re-enable the button
        $messageFormButton.removeAttribute('disabled')
        // Clear the prev msg
        $messageFormInput.value = ''
        $messageFormInput.focus()

        if (errorMsg) { 
            return console.log(errorMsg)
        }

        console.log('Message Acknowledged: ')
    }) 
})

$btnLocation.addEventListener('click', () => {
    if(!navigator.geolocation) { 
        return alert('Geolocation is not supported by your browser')
    }

    $btnLocation.setAttribute('disabled', 'disabled')

    navigator.geolocation.getCurrentPosition((position) => {
        const location = {
            latitude: position.coords.latitude,  
            longitude: position.coords.longitude}
        socket.emit('sendLocation', location, () => {
            $btnLocation.removeAttribute('disabled')
            console.log('Location shared!')
        })
    })
})

socket.emit('join', {username, room}, (error)  => {
    if (error) {
        alert(error)
        location.href = '/'
    }
})
