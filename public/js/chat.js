const socket=io()

//Elements
const $mssgForm=document.querySelector('#mssg-form')
const $mssgFormInput=$mssgForm.querySelector('input')
const $mssgFormButton=$mssgForm.querySelector('button')
const $sendlocation=document.querySelector('#send-location')
const $messages=document.querySelector('#messages')

// Templates
const messageTemplate=document.querySelector('#message-template').innerHTML
const locationTemplate=document.querySelector('#location-template').innerHTML
const sidebarTemplate=document.querySelector('#sidebar-template').innerHTML

//Options
const {username,room}=Qs.parse(location.search,{ignoreQueryPrefix:true})

const autoScroll = ()=>{
    //new message element
    const $newMessage=$messages.lastElementChild

    //height of new message element
    const newMessageStyles=getComputedStyle($newMessage)
    const newMessageMargin=parseInt(newMessageStyles.marginBottom)
    const newMessageHeight=$newMessage.offsetHeight + newMessageMargin

    //Visible height
    const visibleHeight=$messages.offsetHeight

    //Height of messages container
    const containerHeight=$messages.scrollHeight

    //How far have i scrolled
    const scrollOffset=$messages.scrollTop + visibleHeight

    if(containerHeight - newMessageHeight <= scrollOffset)
    {
        $messages.scrollTop=$messages.scrollHeight
    }

}



socket.on('message',(message)=>{
    console.log(message)

    const html=Mustache.render(messageTemplate,{
        username:message.username,
        message:message.text,
        createdAt:moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend',html)
    autoScroll()
})


socket.on('LocationMessage',(message)=>{


    const html=Mustache.render(locationTemplate,{
        username:message.username,
        url:message.url,
        createdAt:moment(message.createdAt).format('h:mm a')
    })

    $messages.insertAdjacentHTML('beforeend',html)

})

socket.on('roomData',({room,users})=>{
    
    const html=Mustache.render(sidebarTemplate,{
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML=html
})


$mssgForm.addEventListener('submit',(e)=>{
  
    e.preventDefault()

    $mssgFormButton.setAttribute('disabled','disabled')

    const message=e.target.elements.message.value

    socket.emit('sendMssg',message,(error)=>{

        $mssgFormButton.removeAttribute('disabled')
        $mssgFormInput.value=''
        $mssgFormInput.focus()

        if(error)
        return console.log(error)

        console.log('The message was delivered!' )
    })
})

$sendlocation.addEventListener('click',()=>{

    if(!navigator.geolocation)
    return alert('GeoLocation not supported by your browser  ')

    $sendlocation.setAttribute('disabled','disabled')


    navigator.geolocation.getCurrentPosition((position)=>{
        
     socket.emit('sendLocation',{
         'lat':position.coords.latitude,
         'long':position.coords.longitude
     },()=>{
         $sendlocation.removeAttribute('disabled')
         console.log('Location  shared!')
     })

    })
})

socket.emit('join',{username,room},(error)=>{

    if(error)
    {
        alert(error)
        location.href='/'
    }
})