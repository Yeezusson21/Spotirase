document.querySelector('#findDupe').addEventListener('click', function () {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        let url = tabs[0].url;
        let index = url.indexOf('playlist/')
        let playListID = url.substring(index + 9, url.length);
        const resultDiv = document.getElementById('result');

        chrome.runtime.sendMessage({ message: "getPlaylistItems", playlistID: playListID }, function (response) {
            console.log('guacamole george floyd')
            console.log(response.duplicates)
            if (response.duplicates.length > 0) {
                resultDiv.innerHTML = `<p>${response.duplicates.length} duplicates found.</p>`;
                for (let i = 0; i < response.duplicates.length; i++) {
                  resultDiv.innerHTML += `<p>${response.duplicates[i]}</p>`;
                }
              } else {
                resultDiv.innerHTML = `<p>No duplicate or similar songs found.</p>`;
              }
        });
    });
});

document.querySelector('#sign-out').addEventListener('click', function () {
    chrome.runtime.sendMessage({ message: 'logout' }, function (response) {
        if (response.message === 'success') window.close();
    });
});