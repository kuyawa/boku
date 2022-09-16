// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

// Blog v1.0
contract Blog {

//- LOGS

    event logInit(address indexed account, uint indexed date, string name, string title);
    event logUser(address indexed account, uint indexed date, string name);
    event logTitle(address indexed account, uint indexed date, string title, string tagline);
    event logAvatar(address indexed account, uint indexed date, string avatar);
    event logStyle(address indexed account, uint indexed date, string style);
    event logPost(uint indexed postid, uint indexed date, string title, string refid);
    event logEdit(uint indexed postid, uint indexed date, string oldid, string newid);
    event logDelete(uint indexed postid, uint indexed date, string refid);
    event logPurge(uint indexed postid, uint indexed date);

//- VARS

    address internal owner;

    struct Profile {
        address account;     // Contract id
        uint    created;
        string  username;
        string  title;
        string  tagline;
        string  avatar;      // IPFS id
        string  stylesheet;
    }

    struct Post {
        uint   postid;       // Hex id
        uint   date;
        string title;
        string refid;        // IPFS id that points to post text
    }

    Profile profile;
    uint[]  feed;            // All posts in chronological order
    mapping(uint => Post)     postsbyid;
    mapping(uint => string[]) posthistory;

//- MODS

    bool private mutex; // reentry check

    modifier admin() {
        require(msg.sender==owner, 'ERR_UNAUTHORIZED');
        _;
    }

    modifier lock() {
        require(!mutex, "ERR_INVALIDREENTRY");
        mutex = true;
        _;
        mutex = false;
    }

    modifier vlock() {
        require(!mutex, "ERR_INVALIDREENTRY");
        _;
    }


//- MAIN

    constructor(string memory name, string memory title, string memory tagline, string memory avatar) {
        owner = msg.sender;
        profile.account  = address(this);
        profile.created  = block.timestamp;
        profile.username = name;
        profile.title    = title;
        profile.tagline  = tagline;
        profile.avatar   = avatar;
        emit logInit(address(this), block.timestamp, name, title);
    }

    function editUser(string memory name) external lock admin {
        profile.username = name;
        emit logUser(profile.account, block.timestamp, name);
    }

    function editTitle(string memory title, string memory tagline) external lock admin {
        profile.title   = title;
        profile.tagline = tagline;
        emit logTitle(profile.account, block.timestamp, title, tagline);
    }

    function editAvatar(string memory avatar) external lock admin {
        profile.avatar = avatar;
        emit logAvatar(profile.account, block.timestamp, avatar);
    }

    function editStyle(string memory style) external lock admin {
        profile.stylesheet = style;
        emit logStyle(profile.account, block.timestamp, style);
    }

    function newPost(uint postid, string memory title, string memory refid) external lock admin {
        // add post to feed
        feed.push(postid);
        // add post to postbyid
        postsbyid[postid] = Post(postid, block.timestamp, title, refid);
        // add refid to posthistory for versioning
        posthistory[postid].push(refid);
        emit logPost(postid, block.timestamp, title, refid);
    }

    function getPost(uint postid) public view returns (Post memory) {
        return postsbyid[postid];
    }

    function editPost(uint postid, string memory title, string memory refid) external lock admin {
        // check post exists
        require(postsbyid[postid].date>0, "ERR_NOTFOUND");
        // update post with IPFS id for new content
        bytes memory text = bytes(title);
        if(text.length>0){ postsbyid[postid].title = title; }
        string memory oldid = postsbyid[postid].refid;
        postsbyid[postid].refid = refid;
        // Add IPFS id to versions
        posthistory[postid].push(refid);
        emit logEdit(postid, block.timestamp, oldid, refid);
    }

    function deletePost(uint postid) external lock admin {
        // check post exists
        require(postsbyid[postid].date>0, 'ERR_NOTFOUND');
        // update post with refid = 0
        string memory oldid = postsbyid[postid].refid;
        postsbyid[postid].refid = "";
        emit logDelete(postid, block.timestamp, oldid);
    }

    function purgePost(uint postid) external lock admin {
        // check post exists
        require(postsbyid[postid].date>0, 'ERR_NOTFOUND');
        // erase everything from post
        //string memory oldid = postsbyid[postid].refid;
        postsbyid[postid].date = 0;
        postsbyid[postid].title = "";
        postsbyid[postid].refid = "";
        posthistory[postid] = new string[](0);
        emit logPurge(postid, block.timestamp);
    }

    function listPosts() public view returns (uint[] memory) {
        // TODO: max 100 posts
        return feed;
    }

    function getHistory(uint postid) public view returns (string[] memory) {
        return posthistory[postid];
    }

    function getProfile() public view returns (Profile memory) {
        return profile;
    }

//-- ADMIN

    function getOwner() public view returns (address) {
        return owner;
    }

    function setOwner(address any) external lock admin {
        owner = any;
    }

}

//- END