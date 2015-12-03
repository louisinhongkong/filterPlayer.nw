/*************************************************************************************************/
var CreateLibrary = function(){
	this.arr = [];
}
CreateLibrary.prototype.getAllFiles = function(cb){
	var fs = require('fs');
	var p = require('path');
	var path = this.path;
	var allowed_formats = ['.mp3','.m4a','.wav','.mp4','.mpg'];
	var self = this;c


	fs.readdir(path,function(e,f){

		if(typeof self.numOfThingsInTopLevelOfPath == 'undefined'){
			self.numOfThingsInTopLevelOfPath = f.length;
		}

		f.map(function(file,i){



			var stat = fs.statSync(path+file);
			if(stat.isDirectory()){
				self.path = path+file+"/";						
				callback = (i==f.length-1) ? cb : function(){};
				self.getAllFiles(callback);
			}

			if(stat.isFile()){
				var ext = p.extname(path+file);	
				var isInArray = allowed_formats.indexOf(ext.toLowerCase());
				if(isInArray!=-1)self.storeToArr(path,file);

				if(i==f.length-1){
						cb.call();
				}

			}



		})

	})
}
CreateLibrary.prototype.insertIntoDB = function(i){

	if(typeof this.arr[i] == 'undefined'){
		console.log('finished');
		return;
	}

	console.log(i);
	var file = this.arr[i].file;
	var path = this.arr[i].path
	
	var cb = function(){createLibrary.insertIntoDB(i+1)}
	db.insert({path:path,file:file},cb);	
}
CreateLibrary.prototype.storeToArr = function(path,file){
	this.arr.push({path:path,file:file});
}
/*************************************************************************************************/
var Database = function(){}
Database.prototype.setDatabaseFile=function(file){
	this.db = new loki(file);	
	return this;
}
Database.prototype.setCollection=function(name){
	this.collectionName = name;
	this.collection = this.db.addCollection(name);
	return this;
}		
Database.prototype.insert=function(obj,cb){
	this.collection.insert(obj);
	this.db.saveDatabase(cb);
}
Database.prototype.load=function(){
	this.db.loadDatabase({},function(){
		var collection = db.db.getCollection(db.collectionName);
		db.heldCollection = collection;
		songList.expandSongData(collection.data);
	});
}		
Database.prototype.update = function(id,field,value){
	var record = this.get(id);
	record[field] = value;
	this.heldCollection.update(record);
	this.db.saveDatabase();			
}		
Database.prototype.get = function(id){
	return this.heldCollection.get(id);
}
/**********************************************************/
var SongList = function(){
	this.panel = 'allSongs';
}
SongList.prototype.expandSongData = function(data){
	//var data = db.heldCollection.data;
	var songs = this.getSongRows(data);
	$('#songList>ul#allSongs').html(songs);
	uif.songList();
}
SongList.prototype.getSongRows=function(data){
	var songs = '';
	for (var i = 0; i < data.length; i++) {
		var id = data[i].$loki;
		var p = data[i].path;
		var song = data[i].file;
		var artist = p.split("/")[7];
		var album = p.split("/")[8];					
		var plays = 0;

		//Get track numbers and remove from filename.
		var split = song.split(' ');
		var trackNum = split[0];
		var hasTrackNum = (!isNaN(trackNum));
		var track = (hasTrackNum) ? trackNum : ' ';
		if(hasTrackNum){
			split.shift();
		}

		//remove the extension
		song = split.join(' ');
		arr = song.split('.');
		arr.pop();
		song = arr.join('.');


		var row = templates.songRow(artist,song,track,album,id);
		songs += row;
	}

	return songs;
}
SongList.prototype.showFilterResults = function(data){
	this.panel = 'filter';

	$('#allSongs').hide();
	$('#searchResults').hide();		
	$('#filterResults').show();
	var songs = this.getSongRows(data);
	$('#filterResults').html(songs);
	uif.songList();
}
SongList.prototype.showSearchResults = function(data){
	this.panel = 'search';

	$('#allSongs').hide();
	$('#searchResults').show();		
	$('#filterResults').hide();
	var songs = this.getSongRows(data);
	$('#searchResults').html(songs);
	uif.songList();
}
SongList.prototype.showAllSongs=function(){
	this.panel = 'allSongs';

	$('#filterResults').hide();
	$('#searchResults').hide();	
	$('#allSongs').show();
}
SongList.prototype.scrollTo =function(id,elId){
	$('#songList>ul').scrollTo('#songList>ul#'+elId+'>li[lid='+id+']',{duration:150, offsetTop : '150'});	
}
/**********************************************************/
var UIChange = function(){}
UIChange.prototype.scaleUpdate = function(){
}
/**********************************************************/
var UIFunction = function(){}
UIFunction.prototype.songList = function(){
	$('#songList>ul>li').on('click',function(){
		var id = $(this).attr('lid');
		player.play(id);
	});
}
UIFunction.prototype.scales=function(){
	$('#scales>ul>li').off('click').on('click',function(){

		this.assignScaleValue = function(){
			$(this).siblings('.selected').removeClass('selected');
			$(this).addClass('selected');

			var scale = $(this).siblings('h4').text();
			var value = $(this).attr('value');
			var id = player.currentlyPlayingId;

			if(id==0){return;}

			db.update(id,scale,value);
		}

		if(filter.status=='set'){
			var scale = $(this).siblings('h4').text();
			var value = $(this).attr('value');
			filter.addFilter(scale,value);
			filter.apply();
		}else{
			this.assignScaleValue();
		}

	});
}
UIFunction.prototype.search=function(){
	function highlightIt(el){
		var range = document.createRange();
		range.selectNodeContents(el);
		var sel = window.getSelection();
		sel.removeAllRanges();
		sel.addRange(range);
	}
	$('#searchBox').off('focus').on('focus',function(e){
		highlightIt(this);
	});	
	$('#searchBox').off('keydown').on('keydown',function(e){
		if(e.which==13){ 
			e.preventDefault();

			var text = $(this).text().toLowerCase();

			if(text.length==0){
				$(this).html('search');
				highlightIt(this);
				songList.showAllSongs();
				return;
			}

			var res = db.heldCollection.chain().where(function(obj){
				return (obj.path.toLowerCase().indexOf(text) > -1 || obj.file.toLowerCase().indexOf(text) > -1) 
			}).data();

			songList.showSearchResults(res);
		}
	});
};
UIFunction.prototype.playerControls=function(){

	$('#shuffle').off('click').on('click',function(){
		if($(this).hasClass('selected')){
			player.shuffle = 0;
			$(this).removeClass('selected');
		}else{
			player.shuffle = 1;
			$(this).addClass('selected');
		}
	});
	$('#repeat').off('click').on('click',function(){
		if($(this).hasClass('selected')){
			player.repeat = 0;
			$(this).removeClass('selected');
		}else{
			player.repeat = 1;
			$(this).addClass('selected');
		}
	});
	$('#prev').off('click').on('click',function(){
		player.prev();
	});
	$('#pause').off('click').on('click',function(){
		if($(this).hasClass('selected')){
			$(this).removeClass('selected');
			player.unpause();					
		}else{
			$(this).addClass('selected');
			player.pause();					
		}
	});
	$('#next').off('click').on('click',function(){
		$(this).addClass('selected');
		setTimeout(function(el){$(el).removeClass('selected')},100,this);				
		player.next();
	});

	$('#currentlyPlaying').off('click').on('click',function(e){
		var posx = e.pageX - $(this).position().left;
		var percent = posx/($(this).width()/100)				
		var duration = player.player.duration;
		var toTime = percent*(duration/100);
		player.player.currentTime  = toTime;
	});

	$('#filter').off('click').on('click',function(){

		if(filter.status=='off'){
			filter.status='set';
			filter.apply();
			return;
		}
		if(filter.status=='set'){
			filter.status='on';
			filter.apply();			
			return;			
		}
		if(filter.status=='on'){
			filter.status='off';
			filter.apply();			
			return;			
		}
	});

	$('#controls').mousedown(function(){
	    $(window).off('mousemove').on('mousemove',function(e){
	        if(typeof uif.dragStartY == 'undefined'){
	        	uif.dragStartY = e.pageY;
	        }else{
	        	var dist = e.pageY - uif.dragStartY;
	        	var newHeight = $('#songList>ul').height() + dist;
	        	$('#songList>ul').height(newHeight);
	        	uif.dragStartY = e.pageY;
	        }
	    });
	    $(window).off('mouseup').on('mouseup',function(){
	    	uif.dragStartY = undefined;
	    	$(window).off('mousemove');
	    });
	});
}
/**********************************************************/
var Player = function(){
	this.player = new Audio;			
	this.currentlyPlayingId = 0;
	this.shuffle = 0;
	this.repeat = 0;
	this.prevArray = [];
	this.player.addEventListener("ended",function(){player.next()},1);
	this.player.addEventListener("timeupdate",this.timeUpdate,1);
}
Player.prototype.timeUpdate = function(){
	var played = player.player.currentTime;
	var duration = player.player.duration;
	var percent = played/(duration/100);
	$('#songProgressBar').css('width',percent+'%');
}
Player.prototype.play=function(id){

	var id = parseInt(id);
	var file = db.heldCollection.get(id).file;
	var path = db.heldCollection.get(id).path;
	var artist = path.split("/")[7];


	this.player.src = path+file;
	this.player.play();
	this.currentlyPlayingId = id;

	if(this.prevArray[this.prevArray.length-1]!=id)this.prevArray.push(id);
	if(this.prevArray.length>100)this.prevArray.shift();

	$('#songOnPlay').html(artist+'&nbsp;&nbsp;'+file);
	scales.assignCurrentSongValues(id);

	$('#songList>ul>li.playing').removeClass('playing');
	$('#songList>ul>li[lid='+id+']').addClass('playing');
}	
Player.prototype.pause=function(file){
	this.player.pause();
}	
Player.prototype.unpause=function(file){
	this.player.play();
}			
Player.prototype.next=function(){
	var id = this.currentlyPlayingId;

	if(songList.panel=='allSongs'){
		var $songs = $('ul#allSongs');
		var elId = 'allSongs';
	}
	if(songList.panel=='filter'){
		var $songs = $('ul#filterResults');
		var elId = 'filterResults';
	}
	if(songList.panel=='search'){
		var $songs = $('ul#searchResults');
		var elId = 'searchResults';
	}	

	if(player.repeat){
		this.play(id);
		songList.scrollTo(id,elId);				
		return;
	}

	var max = $songs.find('li').length;
	var min = 0;
	if(player.shuffle){
		var rand = Math.floor(Math.random()*(max-min)+min);
		var id = $songs.find('li:eq('+rand+')').attr('lid');
		if((id==this.currentlyPlayingId)&&(max>1)){player.next(); return;}
		this.play(id);	
		songList.scrollTo(id,elId);
		return;		
	}

	var id = $songs.find('li[lid='+id+']').next().attr('lid');
	if(typeof id =='undefined'){
		var id = $songs.find('li:eq(0)').attr('lid');
	}
	this.play(id);	
	songList.scrollTo(id,elId);		
}
Player.prototype.prev=function(){
	if(songList.panel=='allSongs'){
		var $songs = $('ul#allSongs');
		var elId = 'allSongs';
	}
	if(songList.panel=='filter'){
		var $songs = $('ul#filterResults');
		var elId = 'filterResults';
	}
	if(songList.panel=='search'){
		var $songs = $('ul#searchResults');
		var elId = 'searchResults';
	}

	this.prevArray.pop();			
	var id = this.prevArray[this.prevArray.length-1];
	this.play(id);
	songList.scrollTo(id,elId);
}
/**********************************************************/
var Filter = function(){
	this.status = 'off';
	this.filter = new Object();
}
Filter.prototype.addFilter = function(scale,value){
	if(typeof this.filter[scale] == 'undefined'){
		this.filter[scale] = new Object();
	}
	if( (typeof this.filter[scale][value] == 'undefined') || (this.filter[scale][value]  == 0)){
		this.filter[scale][value] = 1;
	}else{
		this.filter[scale][value] = 0;
	}

}
Filter.prototype.apply = function(){
	var $fButton = $('#filter');
	var $scales = $('div#scales>ul>li');
	if(this.status == 'off'){
		$fButton.removeClass('selected').removeClass('setFilter');
		$scales.removeClass('setFilter');	
		$scales.removeClass('filter');
		console.log('shiow');
		songList.showAllSongs();
	}
	if(this.status == 'on'){
		$fButton.addClass('selected').removeClass('setFilter');
		$scales.removeClass('setFilter');							
	}
	if(this.status == 'set'){
		$fButton.addClass('setFilter').removeClass('selected');
		$scales.addClass('setFilter');		

		//toggle scale
		for(var scale in this.filter){
			for(var values in this.filter[scale]){
				var $el = $('#scales>ul>h4[value='+scale+']').siblings('li[value='+values+']');
				if(this.filter[scale][values]==1)
				{
					$el.addClass('filter');
				}else{
					$el.removeClass('filter');
				}				
			}
		}	

		//apply filter to data and show results in song list		
		db.filterRes = db.heldCollection.chain();
		var hasFilter = 0;
		for(var scale in this.filter){
			var setValues = [];
			for(var values in this.filter[scale]){
				if(this.filter[scale][values]==1){
					setValues.push(values);
				}
			}

			if(setValues.length==0)continue;
			hasFilter = 1;	

			db.filterRes = db.filterRes.where(function(obj){
				return (setValues.indexOf(obj[scale])>-1);
			});
			

		}	
		if(hasFilter==0){
			songList.showAllSongs();
		}else{
			songList.showFilterResults(db.filterRes.data());
		}

	}
}
/**********************************************************/
var Templates = function(){}
Templates.prototype.songRow = function(artist,song,plays,path,id){
	var str = '';
	str += '<pre>'+artist+'</pre>';
	str += '<pre>'+song+'</pre>';
	str += '<pre>'+path+'</pre>';
	str += '<pre>'+plays+'</pre>';				
	return str = '<li lid="'+id+'">'+str+'</li>'; 
}
Templates.prototype.scaleRange = function(range,value){
	var str = '';
	str += '<li value="'+range+'">'+value+'</li>';
	return str; 	
}
/**********************************************************/
var Scales = function(){}
Scales.prototype.load = function(scaleFile){
	$.ajax({
	  dataType: "json",
	  url: scaleFile,
	  data: '',
	  success: scales.expandData
	});
}
Scales.prototype.expandData=function(data){
	var getScale = function(data){				
		var str = '';
		for(var scale in data){
			str += '<ul><h4 value='+scale+'>'+scale+'</h4>';
			str += getRange(data[scale]);
			str += '</ul>';
		}
		return str;
	}

	var getRange = function(data){
		var str ='';
		for(var range in data){
			var value = data[range];
			str = templates.scaleRange(range,value) + str;
		}
		return str;
	}

	scales.storedScales = Object.keys(data);
	var width = Math.floor((100/Object.keys(data).length)*100)/100;

	$("#scales").html(getScale(data));
	$('#scales>ul').css('width',width+'%');
	uif.scales();
}
Scales.prototype.assignCurrentSongValues = function(id){
	$('#scales>ul>li').removeClass('selected');			
	var obj = db.get(id);
	for(var key in obj){
		var index = scales.storedScales.indexOf(key);
		if(index!=-1){
			var value = obj[key]; 

			$('#scales>ul:eq('+index+')>li[value='+value+']').addClass('selected');
		}
	}
}

