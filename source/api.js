// api.js

let fs     = require('fs');
let path   = require('path');
let {Blob} = require('buffer');
let fetch  = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
let db     = require('./database.js');

let APITOKEN = process.env.STOREID;
//let W3S    = require('web3.storage');
//let storage  = new W3S.Web3Storage({ token: apitoken })


async function uploadText(text) {
	if(!text){ return; }
	console.warn('Uploading text...');
    try {
		//let file = new Blob([byte], { type: 'image/jpg' })
		let buffer = Buffer.from(text);
		//let file = new File([byte], name, { type: 'image/jpg' })
		let url  = 'https://api.web3.storage/upload'
		let opt  = {
		  method: 'POST',
		  headers: {
		  	Authorization: 'Bearer '+APITOKEN
		  },
		  body: buffer
		}
		let res = await fetch(url, opt);
		let inf = await res.json();
		//console.warn('RES',res);
		console.warn('CID', inf);
		let uri = `https://${inf.cid}.ipfs.dweb.link`;
		console.warn('URI', uri);
		return inf.cid;
   	} catch(ex){
		console.error(ex);
		return {error:ex.message};
	}
}

//async function uploadTextOLD(text, name) {
//	console.warn('Uploading text...');
//    try {
//		let buffer = Buffer.from(text);
//		let files  = [new W3S.File([buffer], name)];
//		let cid    = await storage.put(files);
//		let info   = await storage.status(cid);
//		console.warn('CID', cid);
//		console.warn('Info', info);
//		return cid;
//   	} catch(ex){
//		console.error(ex);
//		return {error:ex.message};
//	}
//}

async function uploadFile(filePath){
	let name = path.basename(filePath)
	let byte = fs.readFileSync(filePath)
	console.warn('File:', name);
	let file = new Blob([byte], { type: 'image/jpg' })
	//let file = new File([byte], name, { type: 'image/jpg' })
	let url  = 'https://api.web3.storage/upload'
	let opt  = {
	  method: 'POST',
	  headers: {
	  	Authorization: 'Bearer '+APITOKEN
	  },
	  body: file
	}
	let res = await fetch(url, opt);
	let txt = await res.text();
	console.warn('RES',res);
	console.warn('TXT',txt);
}

async function firstPost(owner, blogid, postid){
	//let name    = 'firstpost.html';
	let title   = 'Hello world';
	let content = '<p>Welcome to BOKU, this is your first post!</p>'+
                  '<p>Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod '+
                  'tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, '+
                  'quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo '+
                  'consequat.</p>'+
                  '<p>Duis aute irure dolor in reprehenderit in voluptate velit esse '+
                  'cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non '+
                  'proident, sunt in culpa qui officia deserunt mollit anim id est laborum</p>'+
                  '<p><b>You can edit or delete this post</b></p>';

    //let cid = await uploadText(text);
	let refid = 'bafkreig6p6pfyqxs6bcrwh6eeev7dkznwnuse4wu2ze6w7o7dk5vldmesq'; // use the same for all blogs
    //if(!cid || cid.error){ return cid; }
   	let ok = await db.newPost({owner, blogid, postid, title, content, refid});
   	console.warn('DB NEW POST', ok);
	return refid;
}

async function newPost(rec){
    let cid = await uploadText(rec.content);
    console.warn('POST CID', cid);
    if(!cid || cid.error){ return cid; }
    else {
    	rec.refid = cid;
    	let ok = await db.newPost(rec);
    	console.warn('DB NEW POST', ok);
    }
	return cid;
}

async function editPost(rec){
    let cid = await uploadText(rec.content);
    console.warn('POST CID', cid);
    if(!cid || cid.error){ return cid; }
    else {
    	rec.refid = cid;
    	let ok = await db.editPost(rec);
    	console.warn('DB EDIT POST', ok);
    }
	return cid;
}

//async function deletePost(postid){
//    let ok = await db.deletePost(postid);
//}


module.exports = {
	firstPost,
	newPost,
	editPost,
	//deletePost
};

// END