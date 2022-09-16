// common.js

let session = {
	account: null,
	blogid: null,
	chainid: null,
	endpoint: 'https://eth.bd.evmos.dev:8545',
	explorer: 'https://evm.evmos.dev',
	network: 'testnet',
};


function $(id){ return document.getElementById(id) }

function setCookie(name, value, days) {
    var expires = '';
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = '; expires=' + date.toUTCString();
    }
	let path = '; path=/';
    //document.cookie = `${name}=${value}${expires}${path}`;
    document.cookie = name + '=' + (value || '') + expires + '; path=/';
}

function getCookie(name) {
    let value = null;
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') { c = c.substring(1, c.length); }
        if (c.indexOf(nameEQ) == 0) { value = c.substring(nameEQ.length, c.length); break; }
    }
    return value;
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(function() {
        console.log('Copying to clipboard was successful!');
    }, function(err) {
        console.error('Could not copy to clipboard:', err);
    });
}

async function connectWallet(enable=true) {
	console.log('Connecting...');
	await Metamask.start(enable);
	//if(enable){ await Metamask.wallet.enable(); }
	let account = await Metamask.getAccount();
	if(!account || !account.address){
		console.log('Account not found');
		return;
	}
	console.log('Account', account);
	session.account = account.address.toLowerCase();
	setCookie('account', session.account);
	let res = await fetch('/api/getblogname/'+session.account);
	let inf = await res.json();
	if(!inf || inf.error){
		console.log('Blog not found');
		session.blogid = null;
		session.username = null;
		setCookie('blogid', '');
		setCookie('username', '');
		showAccount(session.account);
	} else {
		session.blogid = inf.blogid;
		session.username = inf.username;
		setCookie('blogid', inf.blogid);
		setCookie('username', inf.username);
		showBlog(session.blogid, session.username);
	}
}

async function reconnectWallet() {
	console.log('Reconnecting...');
	session.account = window.Metamask.myaccount.toLowerCase();
	setCookie('account', session.account);
	let res = await fetch('/api/getblogname/'+session.account);
	let inf = await res.json();
	if(!inf || inf.error){
		console.log('Blog not found');
		session.blogid = null;
		session.username = null;
		setCookie('blogid', '');
		setCookie('username', '');
		showAccount(session.account);
	} else {
		session.blogid = inf.blogid;
		session.username = inf.username;
		setCookie('blogid', inf.blogid);
		setCookie('username', inf.username);
		showBlog(session.blogid, session.username);
	}
}

function showBlog(blogid, username){
	console.log('Blog:', blogid, username);
	if(username){ text = username; }
	else { text = 'My blog '+blogid.substr(0,10); }
	$('access').innerHTML  = `<a href="/a/${blogid}">${text}</a>`;
	$('connect').innerHTML = 'Connected';
}

function showAccount(address){
	console.log('Account', address);
	let long  = address;
	//let short = address.substr(0,6)+'...'+address.substr(38);
	let short = address.substr(0,8); //+' &raquo;'
	$('access').innerHTML  = `<a href="/u/${long}">Account ${short}</a>`;
	$('connect').innerHTML = 'Connected';
}


function main(){
	console.log('BOKU 1.0');
	let blogid   = getCookie('blogid');
	let username = getCookie('username');
	if(!blogid){
		connectWallet(false);
	} else {
		connectWallet(true);
		showBlog(blogid, username);
	}
	if(window['start']) { start(); }
}

window.onload = main;

// END