var aes = require("crypto-js/aes");
var SHA256 = require("crypto-js/sha256");
var crypto = require("crypto-js");
var node_crypto = require("crypto");
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/blackjack');
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'mongodb connection error: '));

var Table, User;

var Schema = mongoose.Schema;

var tableSchema = new Schema({
	name: { type: String, required: true },
	url: { type: String, required: true },
	players: { type: String, required: true }
});

var userSchema = new Schema({
	UID: { type: String, required: true, unique: true },
	name: { type: String, required: true },
	bank: { type: Number, required: true },
	username: { type: String, required: true, unique: true },
	hashPassword: { type: String, required: true },
	salt: { type: String },
	passphrase: { type: String, required: true },
	friends: { type: [String] },
	avatar: { type: String }
});

tableSchema.virtual('url_route').get(function(){
	return "/games/" + this._id + "/" + this.url;
});


userSchema.methods.encryptPassword = function(password){
	this.password = node_crypto.pbkdf2Sync(password, this.salt, 100, 64).toString('base64');
}

userSchema.methods.validatePassword = function(password){
	var decrypted = node_crypto.pbkdf2Sync(password, this.salt, 100, 64).toString('base64');
	if (decrypted == this.hashPassword){
		console.log(decrypted + " " + this.hashPassword);
		return true;
	}
	else{
		console.log(decrypted + " " + this.hashPassword);
		return false;
	}
}

var JsonFormatter = {
	stringify: function (cipherParams) {
	    // create json object with ciphertext
	    var jsonObj = {
	        ct: cipherParams.ciphertext.toString(crypto.enc.Base64)
	    };

	    // optionally add iv and salt
	    if (cipherParams.iv) {
	        jsonObj.iv = cipherParams.iv.toString();
	    }
	    if (cipherParams.salt) {
	        jsonObj.s = cipherParams.salt.toString();
	    }

	    // stringify json object
	    return JSON.stringify(jsonObj);
	},

	parse: function (jsonStr) {
	    // parse json string
	    var jsonObj = JSON.parse(jsonStr);

	    // extract ciphertext from json object, and create cipher params object
	    var cipherParams = crypto.lib.CipherParams.create({
	        ciphertext: crypto.enc.Base64.parse(jsonObj.ct)
	    });

	    // optionally extract iv and salt
	    if (jsonObj.iv) {
	        cipherParams.iv = crypto.enc.Hex.parse(jsonObj.iv)
	    }
	    if (jsonObj.s) {
	        cipherParams.salt = crypto.enc.Hex.parse(jsonObj.s)
	    }

	    return cipherParams;
	}
}

tableSchema.pre('save', function(next){
	console.log("__SAVED__");
	next();
});


userSchema.pre('save', function(next){
	this.UID = node_crypto.pbkdf2Sync(this.username, '', 100, 64).toString('base64');
	next();
});

userSchema.virtual('password').set(function(password){
	this.salt = node_crypto.randomBytes(16).toString('base64');
	this.hashPassword = node_crypto.pbkdf2Sync(password, this.salt, 100, 64).toString('base64');
});

Table = mongoose.model('Table', tableSchema);
User = mongoose.model('User', userSchema);

module.exports = { Table: Table, User: User }
