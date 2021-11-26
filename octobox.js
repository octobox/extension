var api_token

function isActionablePage() {
  // check if loaded on an individual issue or pull request page
  //   *owner*/*name*/issues/*number*
  //   *owner*/*name*/pull/*number*

  var parts = window.location.pathname.split('/');
  return parts.length > 4 && ['issues', 'pull'].includes(parts[3])
}

function isloginPage() {
  // is current page octobox.io/extension
  return window.location.host == 'octobox.io' && window.location.pathname == '/extension'
}

async function activate() {
  if(isActionablePage()){
    authenticate(function(loggedin) {
      if(loggedin){
        var octoboxlogin = document.getElementById('octobox-login');

        if(octoboxlogin){
          octoboxlogin.remove()
        }
        lookup()
      } else {
        renderLoginBtn()
      }
    })
  } else {
    var octoboxRoot = document.getElementById('octobox-root');

    if(octoboxRoot){
      octoboxRoot.remove()
    }

    if(isloginPage()){
      authenticate(function(loggedin) {
        var installbox = document.getElementById('install-extension');
        installbox.classList.add('d-none')
        if(loggedin){
          var installedbox = document.getElementById('installed-extension');
          installedbox.classList.remove('d-none')
        } else {
          var loginbox = document.getElementById('login-extension');
          loginbox.classList.remove('d-none')
        }
      })
    }
  }
}

async function authenticate(cb) {
  chrome.storage.local.get('apiToken', async function(data) {
   api_token = data.apiToken
   if(api_token == null){
     cb(false)
   } else {
     try{
       var resp = await fetch('https://octobox.io/api/users/profile.json', {
         headers:{
           'Authorization': `Bearer ${api_token}`
         }
       })
       var json = await resp.json()
       if (json.error){
         chrome.storage.local.remove('apiToken', function() {
           cb(false)
         })
       } else {
         cb(true)
       }
     } catch {
       cb(false)
     }
   }
 })
}

function markAsRead(notification) {
  if(!notification.unread){ return }
  fetch('https://octobox.io/api/notifications/mark_read_selected.json?id='+notification.id, {
    method: "POST",
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Octobox-API': 'true',
        'Authorization': `Bearer ${api_token}`
      }
    })
    .then( resp => console.log('notification marked as read', resp))
    .catch( error => console.error(error))
}

function lookup() {
  fetch('https://octobox.io/api/notifications/lookup?url='+window.location, {
    headers:{
      'Authorization': `Bearer ${api_token}`
    }})
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

  var response = await fetch('https://octobox.io/api/notifications.json?'+ new URLSearchParams(params), {
    headers:{
      'Authorization': `Bearer ${api_token}`
    }})
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
  fetch('https://octobox.io/api/notifications/'+notification.id+'/star', {
    method: "POST",
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Octobox-API': 'true',
        'Authorization': `Bearer ${api_token}`
      }
    })
    .then( resp => {
      notification.starred = !notification.starred;
      render(notification)
    })
    .catch( error => console.error('star error', error))
}

function archive(notification) {
  fetch('https://octobox.io/api/notifications/archive_selected.json?id='+notification.id, {
    method: "POST",
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Octobox-API': 'true',
        'Authorization': `Bearer ${api_token}`
      }
    })
    .then( resp => {
      notification.archived = true;
      var nextButton = document.getElementById('octobox-next');
      if(nextButton.classList.contains('disable')){
        render(notification)
      } else {
        nextButton.click()
      }
    })
    .catch( error => console.error(error))
}

function unarchive(notification) {
  fetch('https://octobox.io/api/notifications/archive_selected.json?value=false&id='+notification.id, {
    method: "POST",
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Octobox-API': 'true',
        'Authorization': `Bearer ${api_token}`
      }
    })
    .then( resp => {
      notification.archived = false;
      render(notification)
    })
    .catch( error => console.error(error))
}

function mute(notification) {
  fetch('https://octobox.io/api/notifications/mute_selected.json?id='+notification.id, {
    method: "POST",
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Octobox-API': 'true',
        'Authorization': `Bearer ${api_token}`
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

function renderLoginBtn() {
  var octoboxlogin = document.getElementById('octobox-login');
  if(octoboxlogin){
    // already there
    // TODO update link return_to param with current page
  } else {
    var octoboxlogin = document.createElement("div");
    octoboxlogin.setAttribute("id", "octobox-login");
    const htmlRoot = document.documentElement
    var theme = htmlRoot.getAttribute('data-color-mode')
    octoboxlogin.classList.add(theme)
    document.body.appendChild(octoboxlogin);

    var link = document.createElement("a")
    link.innerText = 'Log into Octobox'
    var image = document.createElement("img")
    image.src = chrome.extension.getURL("icons/infinitacle.svg");
    link.prepend(image)
    link.setAttribute("href", `https://octobox.io/extension?return_to=${window.location}`);

    octoboxlogin.append(link)
  }
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

  const htmlRoot = document.documentElement
  var theme = htmlRoot.getAttribute('data-color-mode')
  octoboxRoot.classList.add(theme)

  var logo = document.createElement("a")
  logo.classList.add("mr-6")
  logo.setAttribute("id", "octobox-logo");
  logo.setAttribute("href", "https://octobox.io");
  var image = document.createElement("img")
  image.src = chrome.extension.getURL("icons/infinitacle.svg");
  logo.appendChild(image)
  octoboxRoot.appendChild(logo)

  var prevBtn = document.createElement("a")
  prevBtn.innerText = 'Previous'
  var image = document.createElement("img")
  image.src = chrome.extension.getURL("icons/arrow-left-16.svg");
  prevBtn.prepend(image)
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
  var image = document.createElement("img")
  if(notification.starred){
    starBtn.innerText = 'Unstar'
    image.src = chrome.extension.getURL("icons/star-fill-16.svg");
  } else {
    starBtn.innerText = 'Star'
    image.src = chrome.extension.getURL("icons/star-16.svg");
  }
  starBtn.prepend(image)
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
  var image = document.createElement("img")
  image.src = chrome.extension.getURL("icons/archive-16.svg");
  if(notification.id){
    if(notification.archived){
      archiveBtn.innerText = 'Unarchive'
      archiveBtn.setAttribute("id", "octobox-unarchive");
      image.src = chrome.extension.getURL("icons/inbox-16.svg");
      archiveBtn.onclick = function(){ unarchive(notification) }
    } else {
      archiveBtn.onclick = function(){ archive(notification) }
    }
  } else {
    archiveBtn.classList.add("disable")
  }
  archiveBtn.prepend(image)
  octoboxRoot.appendChild(archiveBtn)

  var muteBtn = document.createElement("div")
  muteBtn.classList.add("btn")
  muteBtn.classList.add("mx-1")
  var image = document.createElement("img")
  image.src = chrome.extension.getURL("icons/eye-16.svg");
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
      image.src = chrome.extension.getURL("icons/mute-16.svg");
      muteBtn.onclick = function(){ mute(notification) }
    }
  } else {
    muteBtn.innerText = 'Subscribe'
    muteBtn.setAttribute("id", "octobox-subscribe");
    muteBtn.onclick = function(){ subscribe(notification) }
  }
  muteBtn.prepend(image)
  octoboxRoot.appendChild(muteBtn)

  var nextBtn = document.createElement("a")
  nextBtn.innerText = 'Next'
  nextBtn.classList.add("btn")
  nextBtn.classList.add("ml-6")
  nextBtn.setAttribute("id", "octobox-next");
  var image = document.createElement("img")
  image.src = chrome.extension.getURL("icons/arrow-right-16.svg");
  nextBtn.append(image)
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

document.addEventListener('pjax:popstate', () => {
  activate()
});

document.addEventListener('octobox:enable', (event) => {
  chrome.storage.local.set({
     apiToken: event.detail.api_token
   }, function() {
     window.location.replace(event.detail.return_to)
   })
});
