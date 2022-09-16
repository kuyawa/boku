// DATABASE

const postgres = require('pg');
const dbconn   = process.env.DATABASE;
if(!dbconn){ console.error('DATASERVER NOT AVAILABLE'); }
const dbp = new postgres.Pool({ connectionString: dbconn });


class DataServer {
    async connect() {}
    async disconnect() {}

    async insert(sql, params, key) {
        var dbc, res, recid, data = null;
        try {
            dbc = await dbp.connect();
            res = await dbc.query(sql, params);
            if(res.rowCount>0) { 
                recid = key?res.rows[0][key]:0;
                data  = { status:'OK', id: recid }; 
            }
        } catch(ex) {
            console.error('DB error on new record:', ex.message);
            data = { error: ex.message };
        } finally {
            if (dbc) { dbc.release(); }
        }
        return data;
    }

    async update(sql, params) {
        var dbc, res, data = null;
        try {
            dbc = await dbp.connect();
            res = await dbc.query(sql, params);
            if(res.rowCount>0) {
                data = res.rowCount;
            } else { 
                data = 0;
            }
        } catch(ex) {
            console.error('DB error updating records:', ex.message);
            data = { error: ex.message };
        } finally {
            if (dbc) { dbc.release(); }
        }
        return data;
    }

    async delete(sql, params) {
        var dbc, res, data = null;
        try {
            dbc = await dbp.connect();
            res = await dbc.query(sql, params);
            if(res.rowCount>0) {
                data = res.rowCount;
            } else { 
                data = 0;
            }
        } catch(ex) {
            console.error('DB error deleting records:', ex.message);
            data = { error: ex.message };
        } finally {
            if (dbc) { dbc.release(); }
        }
        return data;
    }

    async query(sql, params) {
        var dbc, res, data = null;
        try {
            dbc = await dbp.connect();
            res = await dbc.query(sql, params);
            if(res.rows.length>0) { 
                data = res.rows;
            } else {
                data = [];
            }
        } catch(ex) {
            console.error('DB error in query:', ex.message);
            data = { error: ex.message };
        } finally {
            if (dbc) { dbc.release(); }
        }
        return data;
    }

    async queryObject(sql, params) {
        var dbc, res, data = null;
        try {
            dbc = await dbp.connect();
            res = await dbc.query(sql, params);
            if(res.rows.length>0) { 
                data = res.rows[0];
            }
        } catch(ex) {
            console.error('DB error getting data object:', ex.message);
            data = { error: ex.message };
        } finally {
            if (dbc) { dbc.release(); }
        }
        return data;
    }

    async queryValue(sql, params) {
        var dbc, res, data = null;
        try {
            dbc = await dbp.connect();
            res = await dbc.query(sql, params);
            if(res.rows.length>0) { 
                data = res.rows[0].value; // Select should have field as value
            }
        } catch(ex) {
            console.error('DB error getting data value:', ex.message);
            data = { error: ex.message };
        } finally {
            if (dbc) { dbc.release(); }
        }
        return data;
    }
}


const DS = new DataServer();

async function newBlog(rec) {
	let sql = 'insert into blogs(blogid, owner, username, title, tagline, avatar) values($1, $2, $3, $4, $5, $6) returning recid';
    let par = [rec.blogid, rec.owner, rec.username, rec.title, rec.tagline, rec.avatar];
    let dat = await DS.insert(sql, par, 'recid');
    return dat;
}

async function updateAccount(rec) {
    let sql = 'update blogs set username=$1, title=$2, tagline=$3, avatar=$4 where blogid = $5';
    let par = [rec.username, rec.title, rec.tagline, rec.avatar, rec.blogid];
    let dat = await DS.update(sql, par);
    return dat;
}

async function getBlogById(blogid, num=20) {
    let sql1 = 'select * from blogs where blogid=$1';
    let sql2 = 'select * from posts where blogid=$1 order by created desc limit $2';
    let par1 = [blogid];
    let par2 = [blogid, num];
    let data = await DS.queryObject(sql1, par1);
    if(data && !data.error){
        let list = await DS.query(sql2, par2);
        data.posts = list;
    }
    return data;
}

async function getBlogsByOwner(owner, num=10) {
	let sql  = 'select * from blogs where owner=$1 order by created desc limit $2';
    let pars = [owner, num];
    let data = await DS.query(sql, pars);
    return data;
}

async function getBlogsByName(name, num=10) {
    let sql  = 'select * from blogs where lower(username)=lower($1) order by created desc limit $2';
    let pars = [name, num];
    let data = await DS.query(sql, pars);
    return data;
}

async function getLatestBlogs(num=10) {
    let sql  = 'select * from blogs order by created desc limit $1';
    let pars = [num];
    let data = await DS.query(sql, pars);
    return data;
}

async function newPost(rec) {
    let sql = 'insert into posts(owner, blogid, postid, title, content, refid) values($1, $2, $3, $4, $5, $6) returning recid';
    let par = [rec.owner, rec.blogid, rec.postid, rec.title, rec.content, rec.refid];
    let dat = await DS.insert(sql, par, 'recid');
    return dat;
}

async function editPost(rec) {
    let sql = 'update posts set title=$1, content=$2, refid=$3, updated=now() where postid = $4';
    let par = [rec.title, rec.content, rec.refid, rec.postid];
    let dat = await DS.update(sql, par);
    return dat;
}

async function deletePost(blogid, postid) {
    let sql = 'delete from posts where blogid = $1 and postid = $2';
    let par = [blogid, postid];
    let dat = await DS.delete(sql, par);
    return dat;
}

async function getPosts(blogid, num=20) {
    let sql  = 'select * from posts where blogid=$1 order by created desc limit $2';
    let pars = [blogid, num];
    let data = await DS.query(sql, pars);
    return data;
}

async function getLatestPosts(num=10) {
    let sql  = 'select p.*, b.username' +
               '  from posts p' +
               '  left outer join blogs b on b.owner = p.owner' +
               '  order by created desc limit $1';
    let pars = [num];
    let data = await DS.query(sql, pars);
    return data;
}

async function getPostById(postid) {
    let sql  = 'select * from posts where postid=$1';
    let pars = [postid];
    let data = await DS.queryObject(sql, pars);
    return data;
}

async function getBlogName(owner) {
    let sql  = 'select * from blogs where owner=$1 order by created desc limit 1';
    let pars = [owner];
    let data = await DS.queryObject(sql, pars);
    if(!data || data.error){ return data; }
    return {blogid:data.blogid, username:data.username};
}

async function newImage(rec) {
    let sql = 'insert into images(owner, imgid, refid) values($1, $2, $3) returning recid';
    let par = [rec.owner, rec.imgid, rec.refid];
    let dat = await DS.insert(sql, par, 'recid');
    return dat;
}



module.exports = {
	newBlog,
	getBlogById,
    getBlogsByOwner,
    getBlogsByName,
    getLatestBlogs,
    getLatestPosts,
    updateAccount,
    newPost,
    editPost,
    getPosts,
    getPostById,
    getBlogName,
    newImage
}

// END