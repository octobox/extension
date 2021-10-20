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
    document.body.style.margin = "0 0 60px 0";
    var div = document.createElement("div");
    div.setAttribute("id", "octobox-root");
    document.body.appendChild(div);
    div.classList.add("octobox")
    div.innerText = "I'M THE OCTOBOX!!!!";
  }

  // mark notification as read
  markAsRead(notification)

  // TODO archive/unarchive
  // TODO mark as unread
  // TODO mute
  // TODO star
  // TODO next/prev
  // TODO delete
}

// load on first page load
activate()

// load again after a pjax load
document.addEventListener('pjax:end', () => {
  activate()
});
