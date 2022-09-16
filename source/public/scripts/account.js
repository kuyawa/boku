// create.js

function actionButton(title, disable){
	$('create').innerHTML = title;
	$('create').disabled  = disable;
}

function showMessage(msg){
	console.log(msg);
	$('message').innerHTML = msg;
	$('message').style.backgroundColor = '#ffffff11';
}

function showError(msg){
	console.error(msg);
	$('message').innerHTML = msg;
	$('message').style.backgroundColor = '#ff000022';
}

function onPreviewFile(input) {
    //var file = document.getElementById('file').files[0];
    var file = input.files[0];
    var reader = new FileReader();
    reader.onload = function(e) {
        $('file-img').src = e.target.result;
        $('file-name').innerHTML = file.name;
		console.log('File:', file.name, file);
		//console.log($('token-file').value);
    }
    reader.readAsDataURL(file);
}

function avatarHash(){
	let len = 10;
    let ret = '';
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < len; ++i) {
        ret += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return ret+'.jpg';
}

async function uploadAvatar(file){
	showMessage('Uploading avatar, wait a moment...');
	try {
		console.log('File', file);
		var data = new FormData();
		data.append('file', file);
		let res = await fetch('/api/upload/avatar', {method: "POST", body: data});
		let inf = await res.json();
		console.log('Avatar', inf);
		if(!inf){ showError('Avatar could not be uploaded'); return null; }
		if(inf.error){ showError('Avatar could not be uploaded: '+inf.error); return null; }
		return inf.refid;
	} catch(ex) {
		console.error(ex);
		showError('Error uploading avatar: '+ex.message);
	}
}

async function updateUsername(oldName, newName){
	console.log('Update:', oldName, newName);
	showMessage('Updating user name, it may take a minute...');
	try {
		let ctr = new web3.eth.Contract(contractAbi, blog.blogid);
		ctr.defaultAccount = session.account;
		let gas = { gasPrice: 1500000000, gasLimit: 5000000 };
		let inf = { from: session.account, gasPrice: gas.gasPrice, gas: gas.gasLimit };
		let res = await ctr.methods.editUser(newName).send(inf);
		console.log('RES',res);
		let ok = res.status;
		if(!ok) {
			showError('Error updating account, try again');
		}
	} catch(ex){
		console.error(ex);
		showError('Error updating account: '+ex.message);
	}
}

async function updateUsername(newName){
	console.log('Update name:', newName);
	showMessage('Updating user name, it may take a minute...');
	try {
		let ctr = new web3.eth.Contract(contractAbi, blog.blogid);
		ctr.defaultAccount = session.account;
		let gas = { gasPrice: 1500000000, gasLimit: 5000000 };
		let inf = { from: session.account, gasPrice: gas.gasPrice, gas: gas.gasLimit };
		let res = await ctr.methods.editUser(newName).send(inf);
		console.log('RES',res);
		let ok = res.status;
		if(!ok) {
			showError('Error updating account, try again');
			return false;
		}
		return true;
	} catch(ex){
		console.error(ex);
		showError('Error updating account: '+ex.message);
		return false;
	}
}

async function updateTitle(newTitle, newMotto){
	console.log('Update title:', newTitle);
	console.log('Update motto:', newMotto);
	showMessage('Updating account, it may take a minute...');
	try {
		let ctr = new web3.eth.Contract(contractAbi, blog.blogid);
		ctr.defaultAccount = session.account;
		let gas = { gasPrice: 1500000000, gasLimit: 5000000 };
		let inf = { from: session.account, gasPrice: gas.gasPrice, gas: gas.gasLimit };
		let res = await ctr.methods.editTitle(newTitle, newMotto).send(inf);
		console.log('RES',res);
		let ok = res.status;
		if(!ok) {
			showError('Error updating account, try again');
			return false;
		}
		return true;
	} catch(ex){
		console.error(ex);
		showError('Error updating account: '+ex.message);
		return false;
	}
}

async function updateAvatar(newAvatar){
	console.log('Update avatar:', newAvatar);
	showMessage('Updating avatar, it may take a minute...');
	try {
		let ctr = new web3.eth.Contract(contractAbi, blog.blogid);
		ctr.defaultAccount = session.account;
		let gas = { gasPrice: 1500000000, gasLimit: 5000000 };
		let inf = { from: session.account, gasPrice: gas.gasPrice, gas: gas.gasLimit };
		let res = await ctr.methods.editAvatar(newAvatar).send(inf);
		console.log('RES',res);
		let ok = res.status;
		if(!ok) {
			showError('Error updating avatar, try again');
			return false;
		}
		return true;
	} catch(ex){
		console.error(ex);
		showError('Error updating avatar: '+ex.message);
		return false;
	}
}

async function updateProfile(blogid, username, title, tagline, avatar) {
	showMessage('Updating profile...');
	console.log(blogid, username, title, tagline, avatar);
	// Upload to server
	var data = new FormData();
	data.append('blogid',   blogid);
	data.append('username', username);
	data.append('title',    title);
	data.append('tagline',  tagline);
	data.append('avatar',   avatar);
	try {
		let res = await fetch('/api/account', {method: "POST", body: data});
		let rex = await res.json();
		if(!rex) { showError('Unknown error updating account'); return null; }
		if(rex.error) { showError('Error updating account: '+rex.error); return null; }
	} catch(ex){
		console.error('Update account error: ', ex);
		showError('Update account error: '+ex.message);
	}
}

async function onUpdate() {
	if(!session.account){ 
		showError('Metamask not connected'); 
		return;
	}
	actionButton('Wait', true);
	showMessage('Updating account, wait a second...');
	//let blogid = getCookie('blogid');
	//let blogid = session.blogid;
	//let blogid = Metamask.wallet.selectedAddress;
	let username= $('uname').value;
	let title   = $('title').value;
	let motto   = $('motto').value;
	let filex   = $('filex').files[0];
	let avatar  = blog.avatar; // use old avatar if no new image
	console.log('Filex', filex);
	if(filex){
		avatar  = await uploadAvatar(filex);
	}
	let newData = {username, title, motto, avatar};
	let oldData = {
		username: blog.username,
		title:    blog.title,
		motto:    blog.tagline,
		avatar:   blog.avatar
	};
	console.log('Update:', oldData, newData);
	showMessage('Updating account, it may take a minute...');
	let updated = false;
	let ok1 = false;
	if(oldData.username!=newData.username){
		ok1 = await updateUsername(newData.username)
		setCookie('username', username);
		updated = true;
	}
	if(oldData.title!=newData.title || oldData.motto!=newData.motto){
		ok1 = await updateTitle(newData.title, newData.motto);
		updated = true;
	}
	if(oldData.avatar!=newData.avatar){
		ok1 = await updateAvatar(newData.avatar)
		updated = true;
	}
	if(!updated){
		showMessage('Nothing to update!');
		actionButton('Update');
		return;
	} else {
		if(ok1){
			let ok2 = await updateProfile(blog.blogid, username, title, motto, avatar);
			showMessage('Your account has been updated!');
			actionButton('Done', true);
		} else {
			showMessage('Error updating account!');
			actionButton('Update');
		}
	}
}


// END