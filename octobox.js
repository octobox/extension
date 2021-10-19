// content_script

// TODO support github enterprise
// TODO support self-hosted octobox instances

// 1. check if loaded on an individual issue or pull request page

  // *owner*/*name*/issues/*number*
  // *owner*/*name*/pull/*number*

// 2. check if authenticated with octobox

  // attempt to load current user from octobox.io/users/profile.json
  // if fail, get and store user token

// 3. attempt to load notification for current issue/pr from octobox.io

  // TODO need an Octobox endpoint to load notification via subject_url

// 4. display octobox action bar

  // actions

    // archive/unarchive
    // mute
    // star
    // next/prev
    // delete
