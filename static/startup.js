$(function(){

	var shortName = 'ThreeSides';
	var version = 1.0;
	var displayName = "Three Sides flashcards database";
	var maxSize = 65536;
	myDB = openDatabase(shortName, version, displayName, maxSize);
	createTables(myDB);
	listDecks(myDB);
	currentDeckID = 0;
	
	$("#addButton").click(function(){
		$("#addForm").show();
		$("#addButton").hide();
	});
	
	$("#addCancel").click(function() {
		$("#addButton").show();
		$("#addForm").hide();
	});
	
	$("#addSubmit").click(function() {
		var name = $("#name_field").val();
		addDeck(myDB, name);
		if($("#learnt").is(":checked")) addDeck(myDB, name + " learnt");
		listDecks(myDB);
		$("#addButton").show();
		$("#addForm").hide();
	});
	
	$("#submitCard").click(function() {
		var deckID = $('#newCard').parent().attr('id');
		addCard(myDB, $('#card_first').val(), $('#card_second').val(), $('#card_third').val(), deckID);
		refreshCardList(deckID);
	});
	
	$("#toDeckSelect").click(function() {
		$("#deckSelect").show();
		$("#deckContents").hide();
	});
	
	$("#nextCard").click(function() {
		randomCard(myDB, currentDeckID);
	});
	
	$(".view").click(function() {
		$(this).toggleClass("white");
	});
	
	$("#moveCard").click(function() {
		$("#move_popover").fadeIn();
		var thisDeck = $("#move_popover li."+currentDeckID);
		if (!thisDeck.hasClass("currentDeck")) {
			thisDeck.addClass("currentDeck");
		}
		$('#move_popover li').not(thisDeck).removeClass("currentDeck");
	});
	
	$("ul.choices li").click(function() {
		listClick($(this));
	});
});

function refreshCardList(deckID) {
	$.when($('#deckEditDone').trigger('click')).done(function() {
			$('#'+deckID+" .editDeckButton").trigger('click');
			$('#card_first').val("");
			$('#card_second').val("");
			$('#card_third').val("");
		});
}

function listClick(clicked) {
	var newDeckID = clicked.attr('class');
	var cardID = $("#deckContents h1").attr('id');
	moveDeck(myDB, cardID, newDeckID);
	$('#move_popover li').removeClass("currentDeck");
	clicked.addClass("currentDeck");
	$("#move_popover").fadeOut();
	$("#nextCard").trigger('click');
}

function errorHandler(transaction, error) {
	alert('Oops. Error was '+error.message+' (Code '+error.code+')');
	return false;
}

function nullDataHandler(transaction, results) {}

function cardHandler(transaction, results) {
	max = results.rows.length;
	choice = Math.floor(Math.random() * max);
	visible = Math.floor(Math.random() * 3);
	var card = results.rows.item(choice);
	$("#deckContents h1").attr('id', card['id']);
	$("#firstView").text(card['first']);
	$("#secondView").text(card['second']);
	$("#thirdView").text(card['third']);
	views = [$("#firstView"), $("#secondView"), $("#thirdView")];
	for(var i=0; i<3; i++) {
		if(i==visible && views[i].hasClass("white")) {
			views[i].removeClass("white");	
		} else if (i!=visible && !views[i].hasClass("white")) {
			views[i].addClass("white");
		}
	}
	
}

function allCardHandler(transaction, results) {
	if (results.rows.length > 0) {
		var csvText;
		var csvArray = [];
		var cardList = "<table>";
		var deckID = 0;
		for(var i=0; i<results.rows.length; i++) {
			var row = results.rows.item(i);
			deckID = row['deckid'];
			cardList += '<tr><span id="'+row['id']+'"><td>'+row['first']+'</td><td>'+row['second']+'</td><td>'+row['third']
				+'</td><td><button class="cardDelete">Delete</button></td></span></tr>';
			csvArray.push([row['first'], row['second'],row['third']]);
		}
		$('#cardList_'+deckID).empty();
		$("#cardList_"+deckID).append(cardList + "</table>");
		csvText = CSV.arrayToCsv(csvArray);
		$("#csvText").val(csvText);
		$(".cardDelete").click(function() {
			var cardID = $(this).parent().attr('id');
			deleteCard(myDB, cardID);
			$(this).parent().remove();
		});
	} else {
		// alert("No cards in this deck!");
		$("#csvText").val("");
	}
}

function allDeckHandler(transaction, results) {

/* 	var deckListContainer =  */
	var deckList = "";
	var deckChangeList = "";
	for(var i=0; i<results.rows.length; i++) {
/* 		alert(results[i]); */
		var row = results.rows.item(i);
		deckList += '<div id="'+row['id']+'" class="deck"><button id="deck_'+row['id']+'" class="deckButton">'
			+row['name']
			+'</button>&nbsp;<div class="modButtons"><button class="deleteDeckButton">Delete</button><button class="editDeckButton">Edit</button></div><div id="cardList_'
			+row['id']
			+'" class="cardList"></div><br></div>';
		deckChangeList += '<li class="'+row['id']+'">'+row['name']+'</li>';
	}
	
	$("#deckList").empty();
	$("#deckList").prepend(deckList);
	$("#move_popover .choices").empty();
	$("#move_popover .choices").prepend(deckChangeList);
	
	$("ul.choices li").click(function() {
		listClick($(this));
	});
	
	$(".deleteDeckButton").click(function() {
		var deckID = $(this).parent().parent().attr('id');
		$(this).parent().parent().remove();
		deleteDeck(myDB, deckID);
	});
	
	$(".editDeckButton").click(function() {
		var parent = $(this).parent().parent();
		var deckID = parent.attr('id');
		parent.toggleClass("openHeader");
		$(this).hide();
/* 		parent.prepend('<hr>'); */
		parent.append($("#newCard"));
		parent.append($("#csvEditor"));
		parent.children(".modButtons").append('<button id="deckEditDone">Done</button>');
		$('body > div#newCard').remove();
		$('body > div#csvEdtior').remove();
		$("#newCard").show();
		$("#csvEditor").show();
		parent.children(".cardList").show();
		parent.children("hr").show();
/* 		parent.append("<hr>"); */
		$("#deckEditDone").click(function() {
			var parent = $(this).parent().parent();
			parent.children(".cardList").hide();
			parent.children("hr").hide();
			parent.children().children('.editDeckButton').show();
			parent.toggleClass("openHeader");
			$(this).remove();
			$('body').append($("#newCard"));
			$('body').append($("#csvEditor"));
			$("#newCard").hide();
			$("#csvEditor").hide();
			return $(this);
		});
		allCards(myDB, deckID);
		$("#csvSave").click(function() {
			// Import csv
			deleteCardsInDeck(myDB, deckID);
			var cardArray = CSV.csvToArray($('#csvText').val());
			for (var i = cardArray.length - 1; i >= 0; i--) {
				addCard(myDB, cardArray[i][0], cardArray[i][1], cardArray[i][2], deckID);
			};
			// Refresh card list
			refreshCardList(deckID);
		});
	});
	
	$(".deckButton").click(function() {
		currentDeckID = $(this).parent().attr('id');
		var deckName = $(this).text();
		$('#deckContents h1').text(deckName);
		$('#deckContents').show();
		$('#deckSelect').hide();
		randomCard(myDB, currentDeckID);
	});
}

function createTables(db) {
	db.transaction(function(transaction) {
		transaction.executeSql(
			'create table if not exists decks(id integer not null primary key autoincrement, name text not null default "Deck");', [], nullDataHandler, errorHandler);
		transaction.executeSql(
			'create table if not exists cards(id integer not null primary key autoincrement, deckid integer not null, first text, second text, third text, foreign key(deckid) references decks(id));', 
			[], nullDataHandler, errorHandler);
	});
}

function addDeck(db, name) {
	db.transaction(function(transaction) {
		transaction.executeSql('insert into decks(name) values (?);', [name], nullDataHandler, errorHandler);
	});
}

function listDecks(db) {
	db.transaction(function(transaction) {
		transaction.executeSql('select id, name from decks;', [], allDeckHandler, errorHandler);
	});
}

function deleteDeck(db, id) {
	db.transaction(function(transaction) {
		transaction.executeSql('delete from decks where id=?;', [id], nullDataHandler, errorHandler);
	});
}

function deleteCardsInDeck(db, id) {
	db.transaction(function(transaction) {
		transaction.executeSql('delete from cards where deckid=?;', [id], nullDataHandler, errorHandler);
	});
}

function addCard(db, first, second, third, deck) {
	db.transaction(function(transaction) {
		transaction.executeSql('insert into cards(first, second, third, deckid) values (?, ?, ?, ?);', [first, second, third, deck], nullDataHandler, errorHandler);
	});
}

function randomCard(db, deck) {
	db.transaction(function(transaction) {
		transaction.executeSql('select id, first, second, third, deckid from cards where deckid=?', [deck], cardHandler, errorHandler);
	});
}

function allCards(db, deckid) {
	db.transaction(function(transaction) {
		transaction.executeSql('select id, first, second, third, deckid from cards where deckid=?;', [deckid], allCardHandler, errorHandler);
	});
}

function editCard(db, id, first, second, third) {
	db.transaction(function(transaction) {
		transaction.executeSql('update cards set first=?, second=?, third=? where id=?;', [first, second, third, id], nullDataHandler, errorHandler);
	});
}

function deleteCard(db, id) {
	db.transaction(function(transaction) {
		transaction.executeSql('delete from cards where id=?;', [id], nullDataHandler, errorHandler);
	});
}

function moveDeck(db, id, newDeck) {
	db.transaction(function(transaction) {
		transaction.executeSql('update cards set deckid=? where id=?;', [newDeck, id], nullDataHandler, errorHandler);
	});
}