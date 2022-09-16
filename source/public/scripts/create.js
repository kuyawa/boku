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

async function newBlog(uname, title, motto, avatar){
	console.log('Blog:', uname, title, motto, avatar);
	showMessage('Creating blog, it may take a minute...');
	try {
		let ctr = new web3.eth.Contract(contractAbi);
		ctr.defaultAccount = session.account;
	    let arg = [uname, title, motto, avatar];
		let val = { arguments: arg, data: contractBin };
		let gas = { gasPrice: 1500000000, gasLimit: 5000000 };
		//let ctd = await ctr.deploy(val);
		//let gax = await ctd.estimateGas();
		//console.log('GAS', gax)
		let inf = { from: session.account, gasPrice: gas.gasPrice, gas: gas.gasLimit };
		let res = await ctr.deploy(val).send(inf);
		console.log('RES',res);
		let adr = res._address;
		console.log('BLOG ADDRESS', adr);
		if(adr) {
			// Show address to user
			adr = adr.toLowerCase();
			$('address').innerHTML = adr;
			$('gotoblog').href = '/a/'+adr;
			$('results').style.display = 'block';
			return adr;
		} else {
			// error creating blog
			showError('Error creating blog, try again');
		}
	} catch(ex){
		console.error(ex);
		showError('Error creating blog: '+ex.message);
	}
}

async function firstPost(blogid){
	showMessage('Creating first post, wait a moment...');
	try {
		// All new blogs will share same first hello world post
		//let res = await fetch('/api/firstpost/'+blogid);
		//let dat = await res.json();
		//if(dat.error){
		//	showError('Error saving first post: '+dat.error);
		//	return;
		//}
		//let cid = dat.cid;
		let cid = 'bafkreig6p6pfyqxs6bcrwh6eeev7dkznwnuse4wu2ze6w7o7dk5vldmesq'; // use the same for all blogs
		let ctr = new web3.eth.Contract(contractAbi, blogid);
		ctr.defaultAccount = session.account;
    	let postid = '1';
    	let title  = 'Hello world';
		let gas = { gasPrice: 1500000000, gasLimit: 5000000 };
		let gax = await ctr.methods.newPost(postid, title, cid).estimateGas();
		console.log('GAX', gax)
		let inf = { from: session.account, gasPrice: gas.gasPrice, gas: gas.gasLimit };
		let rex = await ctr.methods.newPost(postid, title, cid).send(inf);
		console.log('REX', rex);
		if(rex) {
			showMessage('First post created');
			return true;
		} else {
			showError('Error creating first post');
		}
	} catch(ex){
		console.error(ex);
		showError('Error creating first post: '+ex.message);
	}
}

async function createProfile(blogx, uname, title, motto, avatar) {
	showMessage('Saving profile...');
	console.log(blogx, uname, title, motto, avatar);
	//let paymt = blogx;
	// Upload to server
	var data = new FormData();
	data.append('blogx',  blogx);
	data.append('uname',  uname);
	data.append('title',  title);
	data.append('motto',  motto);
	data.append('avatar', avatar);
	try {
		let res = await fetch('/api/newblog', {method: "POST", body: data});
		let rex = await res.json();
		if(!rex) { showError('Unknown error saving blog'); return null; }
		if(rex.error) { showError('Error saving blog: '+rex.error); return null; }
		if(!rex.id) { showError('Error saving blog, no record generated'); return null; }
		return rex.id;
	} catch(ex){
		console.error('Upload error: ', ex);
		showError('Upload error: '+ex.message);
		return null;
	}
}

async function onCreate() {
	if(!session.account){ 
		showError('Metamask not connected'); 
		return;
	}
	actionButton('Wait', true);
	showMessage('Creating blog, wait a second...'); 
	let uname = $('uname').value;
	let title = $('title').value;
	let motto = $('motto').value;
	let filex = $('filex').files[0];
	let avatr = await uploadAvatar(filex);
	let blogx = await newBlog(uname, title, motto, avatr);  // TODO: get payment $5
	if(blogx){
		//let ok1 = await firstPost(blogx); console.log('OK1', ok1);
		let ok2 = await createProfile(blogx, uname, title, motto, avatr); console.log('OK2', ok2);
		setCookie('blogid', blogx);
		setCookie('username', uname);
		showMessage('Your blog is ready!');
		actionButton('Done', true);
	} else {
		actionButton('Create');
	}
}


// END