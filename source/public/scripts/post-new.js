// newpost.js

let editor;

async function start() {
	try{
		//editor = await ClassicEditor.create($('editor'), {image:{ toolbar: [ 'toggleImageCaption', 'imageTextAlternative' ] }})
		editor = await ClassicEditor.create($('editor'), {
			cloudServices: {
            	tokenUrl: '/api/user/token',
            	uploadUrl: '/api/upload/image'
        	}
    	})
    	//console.log(editor);
	} catch(ex) {
		console.error('Editor error:', ex)
	}
	load();
}

function actionButton(title, disable){
	$('action-save').innerHTML = title;
	$('action-save').disabled  = disable;
}

function showMessage(msg){
	console.log(msg);
	$('message-save').innerHTML = msg;
	$('message-save').style.backgroundColor = 'transparent';
}

function showError(msg){
	console.error(msg);
	$('message-save').innerHTML = msg;
	$('message-save').style.backgroundColor = '#ff000022';
}

function preview() {
	console.log(editor.getData())
	$('preview').innerHTML = editor.getData();
}

function load() {
	//let data = '<p>Hello world</p>\n\n<p>This is <strong>bold </strong>and this is <i>italic </i>and nothing else</p>\n\n<p>Now comes a link to <a href="https://google.com">google.com</a> later on</p>\n\n<p>And now an image here</p>\n\n<p>And here</p>';
	let data = '<p>Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>'+
	           '<p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>';
	if(editor){
		editor.setData(data);
	} else {
		$('editor').value = data;
	}
	preview();
}

async function save() {
	if(!session.account){ 
		showError('Metamask not connected'); 
		return;
	}
	actionButton('Wait', true);
	let title   = $('title').value;
	let content = editor.getData();
	console.log('Content:', content);
	let postid = await newPost(blog.blogid, title, content);
	if(postid){
		showMessage('Your post is ready!');
		actionButton('Done', true);
		// Redirect to blog?
	} else {
		actionButton('Create');
	}
}

async function newPost(blogid, title, content){
	showMessage('Creating post, wait a moment...');
	try {
		var data = new FormData();
		data.append('blogid', blogid);
		data.append('title', title);
		data.append('content', content);
		let opt = {
			method: 'POST',
			body: data
		}
		//console.log('DATA', data);
		let res = await fetch('/api/newpost', opt);
		let dat = await res.json();
		console.log('DATA', dat);
		if(dat.error){
			showError('Error saving post: '+dat.error);
			return;
		}
		let pid = dat.postid;
		let cid = dat.cid;
		let ctr = new web3.eth.Contract(contractAbi, blogid);
		ctr.defaultAccount = session.account;
		let gas = { gasPrice: 1500000000, gasLimit: 5000000 };
		//let gax = await ctr.methods.newPost(pid, title, cid).estimateGas();
		//console.log('GAX', gax)
		let inf = { from: session.account, gasPrice: gas.gasPrice, gas: gas.gasLimit };
		let rex = await ctr.methods.newPost(pid, title, cid).send(inf);
		console.log('REX', rex);
		if(rex) {
			showMessage('New post created');
			return true;
		} else {
			showError('Error creating post');
		}
	} catch(ex){
		console.error(ex);
		showError('Error creating post: '+ex.message);
	}
}


// END