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
  }
}

// load on first page load
activate()

// load again after a pjax load
document.addEventListener('pjax:end', () => {
  activate()
});

// 2. check if authenticated with octobox

  // attempt to load current user from octobox.io/users/profile.json
  // if fail, get and store user token

// 3. attempt to load notification for current issue/pr from octobox.io

  // authenticated json request to https://octobox.io/notifications/lookup?url=*issueorpullurl*


// 4. display octobox action bar

  // actions

    // archive/unarchive
    // mute
    // star
    // next/prev
    // delete
