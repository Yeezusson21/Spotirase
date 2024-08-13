const CLIENT_ID = encodeURIComponent('7fad719ea97949d7b514b230f143afe1');
const RESPONSE_TYPE = encodeURIComponent('token');
const REDIRECT_URI = encodeURIComponent('https://hhkgmkbnegfipncepepmbplpkkmcjphb.chromiumapp.org/');
const SCOPE = encodeURIComponent('playlist-read-private playlist-read-private'); //check if this is proper syntax
const SHOW_DIALOG = encodeURIComponent('true');
let STATE = '';
let ACCESS_TOKEN = '';
let user_signed_in = false;
const duplicates = [];
const songNames = new Map();
function create_spotify_endpoint() {
    STATE = encodeURIComponent('meet' + Math.random().toString(36).substring(2, 15));

    let oauth2_url =
        `https://accounts.spotify.com/authorize
?client_id=${CLIENT_ID}
&response_type=${RESPONSE_TYPE}
&redirect_uri=${REDIRECT_URI}
&state=${STATE}
&scope=${SCOPE}
&show_dialog=${SHOW_DIALOG}
`;
    console.log(oauth2_url);
    return oauth2_url;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.message === 'login') {
        if (user_signed_in) {
            console.log("User is already signed in.");
        } else {
            // sign the user in with Spotify
            chrome.identity.launchWebAuthFlow({
                url: create_spotify_endpoint(),
                interactive: true
            }, function (redirect_url) {
                if (chrome.runtime.lastError) {
                    sendResponse({ message: 'fail' });
                } else {
                    if (redirect_url.includes('callback?error=access_denied')) {
                        sendResponse({ message: 'fail' });
                    } else {
                        console.log(redirect_url);
                        ACCESS_TOKEN = redirect_url.substring(redirect_url.indexOf('access_token=') + 13);
                        ACCESS_TOKEN = ACCESS_TOKEN.substring(0, ACCESS_TOKEN.indexOf('&'));
                        let state = redirect_url.substring(redirect_url.indexOf('state=') + 6);
                        console.log(ACCESS_TOKEN)
                        console.log(state)
                        if (state === STATE) {
                            console.log("SUCCESS")
                            user_signed_in = true;
                            setTimeout(() => {
                                ACCESS_TOKEN = '';
                                user_signed_in = false;
                            }, 3600000);
            
                            chrome.action.setPopup({popup: 'popup-signed-in.html'});
                        } else {
                            sendResponse({ message: 'fail' });
                        }
                    }
                }
            });
        }
      return true;
    } else if (request.message === 'logout') {
        user_signed_in = false;
        chrome.action.setPopup({ popup: '/popup.html' }, () => {
            sendResponse({ message: 'success' });
        });

        return true;
    } else if (request.message === 'getPlaylistItems') {
        // Logic goes here
        const playlistID = request.playlistID;
        const _getPlaylistItems = async (ACCESS_TOKEN, playlistID) => {
            const result = await fetch(`https://api.spotify.com/v1/playlists/${playlistID}/tracks`, {
                method: 'GET',
                headers: { 'Authorization' : 'Bearer ' + ACCESS_TOKEN}
            });
            const data = await result.json();
            const playListItems = [];
            data.items.forEach(item => {
                const track = item.track.name;
                playListItems.push(track);
              });
            console.log(playListItems)
            for (let i = 0; i < playListItems.length; i++) {
                if (songNames.has(playListItems[i])) {
                duplicates.push(playListItems[i]);
                } 
                else {
                songNames.set(playListItems[i], i);
                }
            }
        }
        
        _getPlaylistItems(ACCESS_TOKEN, playlistID)
        console.log(duplicates);
        sendResponse({duplicates});
        songNames.clear()
        duplicates.length = 0;
    }
});