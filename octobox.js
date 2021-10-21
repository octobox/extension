// content_script

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
  // TODO store token somewhere
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
  // TODO store current
  fetch('https://octobox.io/notifications/lookup?url='+window.location)
   .then(resp => resp.json())
   .then( json => render(json))
   .catch( error => console.error(error))
}

function render(notification) {
  console.log('Rendering notification', notification)

  var octoboxRoot = document.getElementById('octobox-root');

  if(!octoboxRoot){
    // create it
    document.body.style.margin = "0 0 30px 0";
    var octoboxRoot = document.createElement("div");
    octoboxRoot.setAttribute("id", "octobox-root");
    document.body.appendChild(octoboxRoot);
    octoboxRoot.classList.add("octobox")

    var prevBtn = document.createElement("div")
    prevBtn.innerText = 'Previous'
    prevBtn.classList.add("btn")
    prevBtn.classList.add("mr-6")
    prevBtn.setAttribute("id", "octobox-prev");
    octoboxRoot.appendChild(prevBtn)

    var starBtn = document.createElement("div")
    starBtn.innerText = 'Star'
    starBtn.classList.add("btn")
    starBtn.classList.add("mx-1")
    starBtn.classList.add("ml-6")
    starBtn.setAttribute("id", "octobox-star");
    octoboxRoot.appendChild(starBtn)

    var archiveBtn = document.createElement("div")
    archiveBtn.innerText = 'Archive'
    archiveBtn.classList.add("btn")
    archiveBtn.classList.add("mx-1")
    archiveBtn.setAttribute("id", "octobox-archive");
    archiveBtn.setAttribute("aria-disabled", "true");
    octoboxRoot.appendChild(archiveBtn)

    var unreadBtn = document.createElement("div")
    unreadBtn.innerText = 'Mark as Unread'
    unreadBtn.classList.add("btn")
    unreadBtn.classList.add("mx-1")
    unreadBtn.setAttribute("id", "octobox-unread");
    unreadBtn.setAttribute("aria-disabled", "true");
    octoboxRoot.appendChild(unreadBtn)

    var muteBtn = document.createElement("div")
    muteBtn.innerText = 'Mute'
    muteBtn.classList.add("btn")
    muteBtn.classList.add("mx-1")
    muteBtn.setAttribute("id", "octobox-mute");
    muteBtn.setAttribute("aria-disabled", "true");
    octoboxRoot.appendChild(muteBtn)

    var deleteBtn = document.createElement("div")
    deleteBtn.innerText = 'Delete'
    deleteBtn.classList.add("btn")
    deleteBtn.classList.add("mx-1")
    deleteBtn.classList.add("mr-6")
    deleteBtn.setAttribute("id", "octobox-delete");
    deleteBtn.setAttribute("aria-disabled", "true");
    octoboxRoot.appendChild(deleteBtn)

    var nextBtn = document.createElement("div")
    nextBtn.innerText = 'Next'
    nextBtn.classList.add("btn")
    nextBtn.classList.add("ml-6")
    nextBtn.setAttribute("id", "octobox-next");
    octoboxRoot.appendChild(nextBtn)
  }

  if(notification.id){
    octoboxRoot.setAttribute('data-id', notification.id);

    // enable buttons
    document.getElementById('octobox-delete').setAttribute("aria-disabled", "false");
    document.getElementById('octobox-mute').setAttribute("aria-disabled", "false");
    document.getElementById('octobox-unread').setAttribute("aria-disabled", "false");
    document.getElementById('octobox-archive').setAttribute("aria-disabled", "false");

    if(notification.starred){
      document.getElementById('octobox-star').innerText = 'Unstar'
    }

    if(notification.archived){
      document.getElementById('octobox-archive').innerText = 'Unarchive'
    }

    markAsRead(notification)
  }
}

// load on first page load
activate()

// load again after a pjax load
document.addEventListener('pjax:end', () => {
  activate()
});
