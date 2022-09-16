// newpost.js

let editor;

async function start() {
	try{
		let content = $('editor').value;
		editor = await ClassicEditor.create($('editor'));
		editor.setData(content);
		preview();
	} catch(ex) {
		console.error('Editor error:', ex)
	}
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
	$('preview').innerHTML = editor.getData();
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
	let postid = await editPost(blog.blogid, post.postid, title, content);
	if(postid){
		showMessage('Your post was updated!');
		actionButton('Done', true);
		// Redirect to blog?
	} else {
		actionButton('Create');
	}
}

async function editPost(blogid, postid, title, content){
	showMessage('Updating post, wait for confirmation...');
	try {
		var data = new FormData();
		data.append('blogid',  blogid);
		data.append('postid',  postid);
		data.append('title',   title);
		data.append('content', content);
		let opt = {
			method: 'POST',
			body: data
		}
		//console.log('DATA', data);
		let res = await fetch('/api/editpost', opt);
		let dat = await res.json();
		console.log('DATA', dat);
		if(dat.error){
			showError('Error saving post: '+dat.error);
			return;
		}
		//let pid = dat.postid;
		let cid = dat.cid;
		let ctr = new web3.eth.Contract(contractAbi, blogid);
		ctr.defaultAccount = session.account;
		let gas = { gasPrice: 1500000000, gasLimit: 5000000 };
		//let gax = await ctr.methods.editPost(pid, title, cid).estimateGas();
		//console.log('GAX', gax)
		let inf = { from: session.account, gasPrice: gas.gasPrice, gas: gas.gasLimit };
		let rex = await ctr.methods.editPost(postid, title, cid).send(inf);
		console.log('REX', rex);
		if(rex) {
			showMessage('Post updated');
			return true;
		} else {
			showError('Error updating post');
		}
	} catch(ex){
		console.error(ex);
		showError('Error updating post: '+ex.message);
	}
}

