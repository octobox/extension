// TODO support github enterprise
// TODO support self-hosted octobox instances

function isActionablePage() {
  // check if loaded on an individual issue or pull request page
  //   *owner*/*name*/issues/*number*
  //   *owner*/*name*/pull/*number*

  var parts = window.location.pathname.split('/');
  return parts.length > 4 && ['issues', 'pull'].includes(parts[3])
}

function activate() {
  if(isActionablePage()){
    console.log('Octobox: Activate!!!')
    authenticate()
    lookup()
  }
}

function authenticate() {
  // TODO handle failure properly
  fetch('https://octobox.io/users/profile.json')
   .then(resp => resp.json())
   .then( json => console.log('Octobox:',json))
   .catch( error => console.error(error))
}

function markAsRead(notification) {
  if(!notification.unread){ return }
  fetch('https://octobox.io/notifications/mark_read_selected.json?id='+notification.id, {
    method: "POST",
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Octobox-API': 'true'
      }
    })
    .then( resp => console.log('markAsRead', resp))
    .catch( error => console.error(error))
}

function lookup() {
  fetch('https://octobox.io/notifications/lookup?url='+window.location)
   .then(resp => resp.json())
   .then(async json => {
     render(json)
   })
   .catch( error => console.error(error))
}

async function loadNext(notification) {
  // TODO also load previous
  var params = {}

  if(notification){
    if(notification.archived){
      // TODO is it starred, if so render next in stars
      // archived, render first in inbox
      params = { per_page: 1 }
    } else {
      // TODO find next in inbox after current notification
      params = { per_page: 100 }
    }
  } else {
    // unknown, render first in inbox
    params = { per_page: 1 }
  }

  var response = await fetch('https://octobox.io/notifications.json?'+ new URLSearchParams(params))
  var json = await response.json()

  if(params.per_page == 100){
    if(json.notifications.length > 1){
      // find current notification index and return index+1

      var urls = json.notifications.map(n => { return n.url })
      var index = urls.indexOf(notification.url)
      console.log(index)
      var nxtNotification = json.notifications[index+1]
    } else {
      // only found itself
      var nxtNotification = null
    }
  } else {
    var nxtNotification =  json.notifications[0]
  }

  return nxtNotification
}

function toggleStar(notification) {
  // TODO allow starring even if notification is null
  console.log('star!')

  fetch('https://octobox.io/notifications/'+notification.id+'/star', {
    method: "POST",
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Octobox-API': 'true'
      }
    })
    .then( resp => {
      notification.starred = !notification.starred;
      render(notification)
    })
    .catch( error => console.error('star error', error))
}

function archive(notification) {
  console.log('archive!')
  fetch('https://octobox.io/notifications/archive_selected.json?id='+notification.id, {
    method: "POST",
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Octobox-API': 'true'
      }
    })
    .then( resp => {
      notification.archived = !notification.archived;
      var nextButton = document.getElementById('octobox-next');
      if(nextButton){
        nextButton.click()
      } else {
        render(notification)
      }
    })
    .catch( error => console.error(error))
}

function unarchive(notification) {
  fetch('https://octobox.io/notifications/archive_selected.json?value=false&id='+notification.id, {
    method: "POST",
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Octobox-API': 'true'
      }
    })
    .then( resp => {
      notification.archived = !notification.archived;
      render(notification)
    })
    .catch( error => console.error(error))
}

function mute(notification) {
  // TODO octobox.io doesn't currently know if you're muted or not
  fetch('https://octobox.io/notifications/mute_selected.json?id='+notification.id, {
    method: "POST",
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Octobox-API': 'true'
      }
    })
    .then( resp => {
      var nextButton = document.getElementById('octobox-next');
      if(nextButton){
        nextButton.click()
      } else {
        render(notification)
      }
    })
    .catch( error => console.error(error))
}

function subscribe(notification) {
  // TODO octobox.io doesn't know how to subscribe to something it's not seen yet
}

function deleteNotification(notification) {
  console.log('delete!')
  fetch('https://octobox.io/notifications/delete_selected.json?id='+notification.id, {
    method: "POST",
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Octobox-API': 'true'
      }
    })
    .then( resp => {
      var nextButton = document.getElementById('octobox-next');
      if(nextButton){
        nextButton.click()
      } else {
        render({})
      }
    })
    .catch( error => console.error(error))
}

async function render(notification) {
  var nextNotification = await loadNext(notification)

  var octoboxRoot = document.getElementById('octobox-root');

  if(octoboxRoot){
    // empty it
    octoboxRoot.innerHTML = ''
  } else {
    // create it
    document.body.style.margin = "0 0 30px 0";
    var octoboxRoot = document.createElement("div");
    octoboxRoot.setAttribute("id", "octobox-root");
    document.body.appendChild(octoboxRoot);
    octoboxRoot.classList.add("octobox")
  }

  var logo = document.createElement("a")
  logo.classList.add("mr-6")
  logo.setAttribute("id", "octobox-logo");
  logo.setAttribute("href", "https://octobox.io");
  octoboxRoot.appendChild(logo)

  var prevBtn = document.createElement("a")
  prevBtn.innerText = 'Previous'
  prevBtn.classList.add("btn")
  prevBtn.classList.add("mr-6")
  prevBtn.setAttribute("id", "octobox-prev");
  prevBtn.classList.add("disable")
  // TODO enable this after next button implemented
  octoboxRoot.appendChild(prevBtn)

  var starBtn = document.createElement("div")
  if(notification.starred){
    starBtn.innerText = 'Unstar'
    starBtn.setAttribute("id", "octobox-unstar");
  } else {
    starBtn.innerText = 'Star'
    starBtn.setAttribute("id", "octobox-star");
  }
  starBtn.classList.add("btn")
  starBtn.classList.add("mx-1")
  starBtn.classList.add("ml-6")

  starBtn.onclick = function(){ toggleStar(notification) }
  octoboxRoot.appendChild(starBtn)

  var archiveBtn = document.createElement("div")

  archiveBtn.classList.add("btn")
  archiveBtn.classList.add("mx-1")
  archiveBtn.setAttribute("id", "octobox-archive");
  archiveBtn.innerText = 'Archive'
  if(notification.id){
    if(notification.archived){
      archiveBtn.innerText = 'Unarchive'
      archiveBtn.setAttribute("id", "octobox-unarchive");
      archiveBtn.onclick = function(){ unarchive(notification) }
    } else {
      archiveBtn.onclick = function(){ archive(notification) }
    }
  } else {
    archiveBtn.classList.add("disable")
  }
  octoboxRoot.appendChild(archiveBtn)

  var muteBtn = document.createElement("div")
  muteBtn.classList.add("btn")
  muteBtn.classList.add("mx-1")
  if(notification.id){
    muteBtn.setAttribute("id", "octobox-mute");
    muteBtn.innerText = 'Mute'
    muteBtn.onclick = function(){ mute(notification) }
  } else {
    muteBtn.innerText = 'Subscribe'
    muteBtn.setAttribute("id", "octobox-subscribe");
    muteBtn.onclick = function(){ subscribe(notification) }
  }
  octoboxRoot.appendChild(muteBtn)

  var deleteBtn = document.createElement("div")
  deleteBtn.innerText = 'Delete'
  deleteBtn.classList.add("btn")
  deleteBtn.classList.add("mx-1")
  deleteBtn.classList.add("mr-6")
  deleteBtn.setAttribute("id", "octobox-delete");
  if(notification.id){
    deleteBtn.onclick = function(){ deleteNotification(notification) }
  } else {
    deleteBtn.classList.add("disable")
  }
  octoboxRoot.appendChild(deleteBtn)

  var nextBtn = document.createElement("a")
  nextBtn.innerText = 'Next'
  nextBtn.classList.add("btn")
  nextBtn.classList.add("ml-6")
  nextBtn.setAttribute("id", "octobox-next");
  if(nextNotification){
    nextBtn.classList.add('tooltipped')
    nextBtn.classList.add('tooltipped-n')
    nextBtn.setAttribute('aria-label', nextNotification.subject.title)
    // TODO can this link by pjaxed to make it faster
    nextBtn.setAttribute('rel', "preconnect")
    nextBtn.setAttribute('href', nextNotification.web_url)
    // TODO onclick that pushes current notification to a history stack
  } else {
    nextBtn.classList.add("disable")
  }
  octoboxRoot.appendChild(nextBtn)

  if(notification.id){
    octoboxRoot.setAttribute('data-id', notification.id);

    markAsRead(notification)
  }
}

// load on first page load
activate()

// load again after a pjax load
document.addEventListener('pjax:end', () => {
  activate()
});
