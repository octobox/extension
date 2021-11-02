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
    authenticate()
    lookup()
  }
}

function authenticate() {
  // TODO handle failure properly
  fetch('https://octobox.io/users/profile.json')
   .then(resp => resp.json())
   .then( json => console.log('Octobox login:',json))
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
    .then( resp => console.log('notification marked as read', resp))
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

  var res = {
    next: null,
    previous: null,
    index: null,
    count: json.pagination.total_notifications
  }

  if(params.per_page == 100){
    if(json.notifications.length > 1){
      // find current notification index and return index+1

      var urls = json.notifications.map(n => { return n.url })
      var index = urls.indexOf(notification.url)
      res.next = json.notifications[index+1]
      res.index = index
      res.previous = json.notifications[index-1]
    } else {
      // only found itself
      var nxtNotification = null
    }
  } else {
    res.next =  json.notifications[0]
  }

  return res
}

function toggleStar(notification) {
  // TODO allow starring even if notification is null
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
  // TODO octobox.io doesn't know how to subscribe to something yet
}

async function render(notification) {
  var nextNotification = await loadNext(notification)

  const htmlRoot = document.documentElement
  var theme = htmlRoot.getAttribute('data-color-mode')

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

  octoboxRoot.classList.add(theme)

  var logo = document.createElement("a")
  logo.classList.add("mr-6")
  logo.setAttribute("id", "octobox-logo");
  logo.setAttribute("href", "https://octobox.io");
  octoboxRoot.appendChild(logo)

  var prevBtn = document.createElement("a")
  prevBtn.innerText = 'Previous'
  var icon = document.createElement("i")
  icon.classList.add("icon")
  prevBtn.prepend(icon)
  prevBtn.classList.add("btn")
  prevBtn.classList.add("mr-6")
  prevBtn.setAttribute("id", "octobox-prev");

  if(nextNotification.previous){
    prevBtn.classList.add('tooltipped')
    prevBtn.classList.add('tooltipped-n')
    prevBtn.setAttribute('aria-label', `${nextNotification.previous.repo.name}: ${nextNotification.previous.subject.title}`)
    // TODO can this link by pjaxed to make it faster
    prevBtn.setAttribute('rel', "preconnect")
    prevBtn.setAttribute('href', nextNotification.previous.web_url)
  } else {
    prevBtn.classList.add("disable")
  }

  octoboxRoot.appendChild(prevBtn)

  var starBtn = document.createElement("div")
  if(notification.starred){
    starBtn.innerText = 'Unstar'
    starBtn.setAttribute("id", "octobox-unstar");
  } else {
    starBtn.innerText = 'Star'
    starBtn.setAttribute("id", "octobox-star");
  }
  var icon = document.createElement("i")
  icon.classList.add("icon")
  starBtn.prepend(icon)
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
  var icon = document.createElement("i")
  icon.classList.add("icon")
  archiveBtn.prepend(icon)
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
    if(notification.muted_at){
      muteBtn.innerText = 'Subscribe'
      muteBtn.classList.add('tooltipped')
      muteBtn.classList.add('tooltipped-n')
      var muted_at = new Date(notification.muted_at)
      muteBtn.setAttribute('aria-label', 'Muted: ' + muted_at.toISOString().slice(0, 10))
      muteBtn.setAttribute("id", "octobox-subscribe");
      muteBtn.onclick = function(){ subscribe(notification) }
    } else {
      muteBtn.setAttribute("id", "octobox-mute");
      muteBtn.innerText = 'Mute'
      muteBtn.onclick = function(){ mute(notification) }
    }
  } else {
    muteBtn.innerText = 'Subscribe'
    muteBtn.setAttribute("id", "octobox-subscribe");
    muteBtn.onclick = function(){ subscribe(notification) }
  }
  var icon = document.createElement("i")
  icon.classList.add("icon")
  muteBtn.prepend(icon)
  octoboxRoot.appendChild(muteBtn)

  var nextBtn = document.createElement("a")
  nextBtn.innerText = 'Next'
  var icon = document.createElement("i")
  icon.classList.add("icon")
  nextBtn.append(icon)
  nextBtn.classList.add("btn")
  nextBtn.classList.add("ml-6")
  nextBtn.setAttribute("id", "octobox-next");
  if(nextNotification.next){
    nextBtn.classList.add('tooltipped')
    nextBtn.classList.add('tooltipped-n')
    nextBtn.setAttribute('aria-label', `${nextNotification.next.repo.name}: ${nextNotification.next.subject.title}`)
    // TODO can this link by pjaxed to make it faster
    nextBtn.setAttribute('rel', "preconnect")
    nextBtn.setAttribute('href', nextNotification.next.web_url)
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
