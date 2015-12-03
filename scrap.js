var fs = require('fs');

/*
fs.readFile('./package.json', 'utf-8', function (error, contents) {
	document.write(contents);
});
*/


function File() {
	function open(path, document) {
		fs.readFile(path, 'utf-8', function (error, contents) {
			document.getElementById('editor').value = contents;
		});
	}
	
	function save(path, document) {
		var text = document.getElementById('editor').value;
		fs.writeFile(path, text);
	}
	
	this.open = open;
	this.save = save;
}

module.exports = new File;


function clickInput(id) {
	var event = document.createEvent('MouseEvents');
	event.initMouseEvent('click');
	document.getElementById(id).dispatchEvent(event);
}

document.addEventListener('keyup', function (e) {
	if (e.keyCode == 'O'.charCodeAt(0) && e.ctrlKey) {
		clickInput('open');
	} else if (e.keyCode == 'S'.charCodeAt(0) && e.ctrlKey) {
		clickInput('save');
	}
});


document.getElementById('open').addEventListener('change', function (e) {
	file.open(this.value, document);
});

document.getElementById('save').addEventListener('change', function (e) {
	file.save(this.value, document);
});







--------------------------------------------------------------

		var db = new loki('loki.json');
		
		var children = db.addCollection('children');

		children.insert({name:'Sleipnir', legs: 8})
		children.insert({name:'Jormungandr', legs: 0})
		children.insert({name:'Hel', legs: 2})

		-------------------------------------------------------------------


	  db = new loki('test.json'),
	  db2 = new loki('test.json');
	 
	var users = db.addCollection('users');
	users.insert({
	  name: 'joe'
	});
	users.insert({
	  name: 'john'
	});
	users.insert({
	  name: 'jack'
	});
	console.log(users.data);
	db.saveDatabase();
	 
	db2.loadDatabase({}, function () {
	  var users2 = db2.getCollection('users')
	  console.log(users2.data);
	});