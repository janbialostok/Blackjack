var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/blackjack');
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'mongodb connection error: '));

var Table, User;

var Schema = mongoose.Schema;

var tableSchema = new Schema({
	table_code: { type: String, required: true, unique: true },
	name: { type: String, required: true },
	url: { type: String, required: true },
	players: { type: Object, required: true }
});

var userSchema = new Schema({
	name: { type: String, required: true },
	bank: { type: Number, required: true },
	username: { type: String, required: true, unique: true },
	password: { type: String, required: true },
	friends: { type: [String] },
	avatar: { type: String, unique: true }
});

tableSchema.virtual('url_route').get(function(){
	return "/games/" + this.table_code + "/" + this.url;
});

tableSchema.methods.endGame = function(){

}

userSchema.methods.findFriends = function(){

}

// tableSchema.pre('save', function(next){
// 	console.log("_____TEST_____");
// 	this.table_code = this.name.replace(/[\W\s]/g, '_');
// 	this.url = this.name.replace(/[\W\s]/g, '_');
// 	next();
// });


Table = mongoose.model('Table', tableSchema);
User = mongoose.model('User', userSchema);

module.exports = { Table: Table, User: User }
