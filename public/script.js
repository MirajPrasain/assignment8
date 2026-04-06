'use strict'

// --- This is helper code that you can ignore ---

const $ = document.querySelector.bind(document);

function showError(err) {
    $('#error').innerText = err;
}

function resetInputs() {
    var inputs = document.getElementsByTagName("input");
    for (var input of inputs) {
        input.value = '';
    }
}

function openHomeScreen(doc) {
    $('#loginScreen').classList.add('hidden');
    $('#registerScreen').classList.add('hidden');
    resetInputs();
    showError('');
    $('#homeScreen').classList.remove('hidden');
    $('#name').innerText = doc.name;
    $('#username').innerText = doc.username;
    $('#updateName').value = doc.name;
    $('#updateEmail').value = doc.email;
    $('#userlist').innerHTML = '';
    showListOfUsers();
}

function openLoginScreen() {
    $('#registerScreen').classList.add('hidden');
    $('#homeScreen').classList.add('hidden');
    resetInputs();
    showError('');
    $('#loginScreen').classList.remove('hidden');
}

function openRegisterScreen() {
    $('#loginScreen').classList.add('hidden');
    $('#homeScreen').classList.add('hidden');
    resetInputs();
    showError('');
    $('#registerScreen').classList.remove('hidden');
}

function showUserInList(doc) {
    var item = document.createElement('li');
    $('#userlist').appendChild(item);
    item.innerText = doc.username;
}

$('#loginLink').addEventListener('click', openLoginScreen);
$('#registerLink').addEventListener('click', openRegisterScreen);

// logout - call server to delete token, clear localStorage, go to login screen
$('#logoutLink').addEventListener('click', () => {
    const token = localStorage.getItem('authToken');
    fetch('/users/logout', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + token }
    })
        .then(r => r.json())
        .then(() => {
            localStorage.removeItem('authToken');
            openLoginScreen();
        })
        .catch(err => showError('ERROR: ' + err));
});

// --- Below is the code you need to edit ---

// Sign In button action
$('#loginBtn').addEventListener('click', () => {
    var data = {
        username: $('#loginUsername').value,
        password: $('#loginPassword').value
    };
    fetch('/users/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
        .then(r => r.json())
        .then(doc => {
            if (doc.error) showError(doc.error);
            else {
                localStorage.setItem('authToken', doc.auth);
                openHomeScreen(doc);
            }
        })
        .catch(err => showError('ERROR: ' + err));
});

// Register button action
$('#registerBtn').addEventListener('click', () => {
    var data = {
        username: $('#registerUsername').value,
        password: $('#registerPassword').value,
        name: $('#registerName').value,
        email: $('#registerEmail').value
    };
    fetch('/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
        .then(r => r.json())
        .then(doc => {
            if (doc.error) showError(doc.error);
            else {
                localStorage.setItem('authToken', doc.auth);
                openHomeScreen(doc);
            }
        })
        .catch(err => showError('ERROR: ' + err));
});

// Update button action
$('#updateBtn').addEventListener('click', () => {
    var data = {
        name: $('#updateName').value,
        email: $('#updateEmail').value
    };
    fetch('/users/' + $('#username').innerText, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + localStorage.getItem('authToken')
        },
        body: JSON.stringify(data)
    })
        .then(r => r.json())
        .then(doc => {
            if (doc.error) showError(doc.error);
            else if (doc.ok) alert('Your name and email have been updated.');
        })
        .catch(err => showError('ERROR: ' + err));
});

// Delete button action
$('#deleteBtn').addEventListener('click', () => {
    if (!confirm("Are you sure you want to delete your profile?"))
        return;
    fetch('/users/' + $('#username').innerText, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('authToken') }
    })
        .then(r => r.json())
        .then(doc => {
            if (doc.error) showError(doc.error);
            else {
                localStorage.removeItem('authToken');
                openLoginScreen();
            }
        })
        .catch(err => showError('ERROR: ' + err));
});

function showListOfUsers() {
    fetch('/users')
        .then(r => r.json())
        .then(docs => docs.forEach(showUserInList))
        .catch(err => showError('Could not get user list: ' + err));
}