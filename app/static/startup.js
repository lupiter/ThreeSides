function upgradeDB(transaction) {
	console.log("upgrading");
	transaction.executeSql('alter table decks add column offline integer default 1;', [], nullDataHandler, errorHandler);
	// alert("a");
	// console.log("a");
	transaction.executeSql('alter table decks add column to_delete integer default 0;', [], nullDataHandler, errorHandler);
	// alert("b");
	// console.log("b");
	transaction.executeSql('alter table cards add column offline integer default 1;', [], nullDataHandler, errorHandler);
	// alert("c");
	// console.log("c");
	transaction.executeSql('alter table cards add column to_delete integer default 0;', [], nullDataHandler, errorHandler);
	// alert("d");
	// console.log("d");
}

function doFailAjax(jqXHR, textStatus, errorThrown) {
	console.log(textStatus);
	console.log(errorThrown);
}

function onUpdateReady() {
	window.applicationCache.swapCache();
}

$(function(){

	$(".loginButton").click(function(){
		window.location.href = $(this).attr("href");
		return false;
	});

	$.getJSON("/status", function(data){
		$(".username").text(data.user);
		if (!data.online) {
			$(".loginButton").hide();
			$(".logoutButton").hide();
		} else {
			$(".offlineButton").hide();
			if (data.user) {
				$(".logoutButton").show();
				$(".isEA").toggle(data.is_EA);
				$(".loginButton").hide();
			} else {
				$(".loginButton").show();
				$(".logoutButton").hide();
			}
		}
	});

	window.applicationCache.addEventListener('updateready', onUpdateReady);
	if(window.applicationCache.status === window.applicationCache.UPDATEREADY) {
		onUpdateReady();
	}

	var shortName = 'ThreeSides';
	var version = 3;
	var displayName = "Three Sides flashcards database";
	var maxSize = 65536;
	myDB = openDatabase(shortName, "", displayName, maxSize);
	if (myDB.version != version) {
		// console.log("upgrade time");
		myDB.changeVersion(myDB.version, "3", upgradeDB, function(){alert("Failed to upgrade database, app won't sync.");}, nullDataHandler);
	}
	// console.log(myDB.version);
	// console.log(version);
	createTables(myDB);
	// console.log("listing...");
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

	$(".aboutButton").click(function() {
		$("#about").show();
		$(".aboutClose").click(function() {
			$("#about").hide();
		});
		return false;
	});
});

function syncNow(data, type) {
	if (data.rows.length > 0) {
		sendData = [];
		for(var i=0; i<data.rows.length; i++) {
			var row = data.rows.item(i);
			if (row) sendData.push(row);
		}
		// console.log(sendData);
		var content = JSON.stringify(sendData);
		// console.log(content);
		$.ajax({
			url: "sync/" + type,
			type: 'POST',
			data: content,
			processData: false,
			contentType: "application/json; charset=UTF-8"
		}).done(function(){
			ids = [];
			for(var i=0; i<data.rows.length; i++) {
				var row = data.rows.item(i);
				if (row) ids.push(row["id"]);
			}
			// console.log("syncing " + type);
			myDB.transaction(function(transaction) {
				// console.log("syncing " + ids);
				query = "update " + type + "s set offline = 0 where id in (" + ids.join(",") + ");";
				transaction.executeSql(query, [], function(){
					// console.log(query + " yo " + type);
				}, errorHandler);
			});
		}).fail(doFailAjax);
	}
}

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
	console.log('Oops. Error was '+error.message+' (Code '+error.code+') ');
	// console.log(transaction);
	return false;
}

function nullDataHandler(transaction, results) {
}

function cardHandler(transaction, results) {
	var max = results.rows.length;
	if (max > 0) {
		var choice = Math.floor(Math.random() * max);
		var visible = Math.floor(Math.random() * 3);
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
			cardList += '<tr><span id="'+row['id']+'"><td>'
				+ row['first']
				+ '</td><td>' + row['second']+'</td><td>' + row['third']
				+ '</td><td><button class="cardDelete">Delete</button></td></span></tr>';
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

	var deckList = "";
	var deckChangeList = "";
	for(var i=0; i<results.rows.length; i++) {
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
/*		parent.prepend('<hr>'); */
		parent.append($("#newCard"));
		parent.append($("#csvEditor"));
		parent.children(".modButtons").append('<button id="deckEditDone">Done</button>');
		$('body > div#newCard').remove();
		$('body > div#csvEdtior').remove();
		$("#newCard").show();
		$("#csvEditor").show();
		parent.children(".cardList").show();
		parent.children("hr").show();
/*		parent.append("<hr>"); */
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
			}
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
			'create table if not exists decks(id integer not null primary key autoincrement, name text not null default "Deck", offline integer default 1, to_delete integer default 0);', [], nullDataHandler, errorHandler);
		transaction.executeSql(
			'create table if not exists cards(id integer not null primary key autoincrement, deckid integer not null, first text, second text, third text, offline integer default 1, to_delete integer default 0, foreign key(deckid) references decks(id));',
			[], nullDataHandler, errorHandler);
	});
}

function addDeck(db, name) {
	db.transaction(function(transaction) {
		transaction.executeSql('insert into decks(name) values (?);', [name], function(trans, results) {
			forwardDeck(myDB, results.insertId);
		}, errorHandler);
	});
}

function addDeckID(db, name, id) {
	db.transaction(function(transaction) {
		transaction.executeSql('insert into decks(name, id) values (?, ?);', [name, id], function(trans, results) {
			forwardDeck(myDB, results.insertId);
		}, errorHandler);
	});
}

function listDecks(db) {
	// syncNow();
	// console.log("list decks");
	db.transaction(function(transaction) {
		transaction.executeSql('select * from decks where offline = 1;', [], function(trans, results){
			syncNow(results, 'deck');
			// console.log('sync deck offline ' + results.rows.length);
			transaction.executeSql('select * from cards where offline = 1;', [], function(trans, results){
				syncNow(results, 'card');
				// console.log('sync card offline ' + results.rows.length);
				transaction.executeSql('select * from decks where to_delete = 1;', [], function(trans, results){
					sendDelete(results, 'deck');
					// console.log('delete deck offline ' + results.rows.length);
					transaction.executeSql('select * from cards where to_delete = 1;', [], function(trans, results){
						sendDelete(results, 'card');
						// console.log('delete card offline ' + results.rows.length);
						console.log("send updates");
						db.transaction(function(transaction) {
							transaction.executeSql('select id from decks where offline = 1 union select id from cards where offline = 1 union select id from decks where to_delete = 1 union select id from cards where to_delete = 1;', [], function(trans, results){
								if(results.rows.length > 0) {
									// bail
									console.log("bail");
								} else {
									// Drop and download
									console.log("going to drop all");
									trans.executeSql('delete from cards;', [], function(trans, results){
										trans.executeSql('delete from decks;', [], function(trans, results){
											$.getJSON('sync/deck', function(data){
												console.log(data);
												if (data.decks) {
													for (var j = data.decks.length - 1; j>= 0; j--) {
														var deck = data.decks[j];
														addDeckID(db, deck.name, deck.id);
													}
													printListDecks(db);
												}
											}).done(function(){
												$.getJSON('sync/card', function(data){
													console.log(data);
													if (data.decks) {
														for (var i = data.cards.length - 1; i >= 0; i--) {
															var card = data.cards[i];
															addCardID(db, card.first, card.second, card.third, card.deckid, card.id);
														}
														printListDecks(db);
													}
												});
											});
										}, errorHandler);
									}, errorHandler);
								}
								printListDecks(db);
							}, errorHandler);
						});
					}, errorHandler);
				}, errorHandler);
			}, errorHandler);
		}, errorHandler);
	});
}

function printListDecks(db) {
	db.transaction(function(transaction) {
		transaction.executeSql('select id, name from decks;', [], allDeckHandler, errorHandler);
	});
}

function sendDelete(data, type) {
	if (data.rows.length > 0) {
		var ids = [];
		for(var i=0; i<data.rows.length; i++) {
			var row = data.rows.item(i);
			if (row) ids.push(row["id"]);
		}
		// console.log("will delete ...");
		// console.log(ids);
		$.ajax({
			url: "sync/" + type + "?id=" + ids.join(),
			type: 'DELETE'
		}).done(function(){
			// console.log("delete");
			myDB.transaction(function(transaction) {
				// console.log(ids);
				query = 'delete from ' + type + 's where id in (' + ids.join(',') + ");";
				transaction.executeSql(query, [], function(){
					// console.log(query);
				}, errorHandler);
			});
		}).fail(doFailAjax);
	}
}

function deleteDeck(db, id) {
	$.ajax({
		url: "sync/deck?id=" + id,
		type: 'DELETE'
	}).done(function() {
		db.transaction(function(transaction) {
			// console.log("online delete " + id);
			transaction.executeSql('delete from decks where id=?;', [id], nullDataHandler, errorHandler);
		});
	}).fail(function() {
		db.transaction(function(transaction) {
			// console.log("offline delete "+ id);
			transaction.executeSql('update decks set to_delete = 1 where id=?;', [id], nullDataHandler, errorHandler);
		});
	});
}

function deleteCardsInDeck(db, id) {
	$.ajax({
		url: "sync/allcard?id=" + id,
		type: 'DELETE'
	}).done(function(){
		db.transaction(function(transaction) {
			// console.log("online delete " + id);
			transaction.executeSql('delete from cards where deckid=?;', [id], nullDataHandler, errorHandler);
		});
	}).fail(function(){
		db.transaction(function(transaction) {
			// console.log("offline delete "+ id);
			transaction.executeSql('update cards set to_delete = 1 where deckid=?;', [id], nullDataHandler, errorHandler);
		});
	});
}

function addCard(db, first, second, third, deck) {
	db.transaction(function(transaction) {
		transaction.executeSql('insert into cards(first, second, third, deckid) values (?, ?, ?, ?);', [first, second, third, deck], function(trans, results) {
			forwardCard(db, results.insertId);
		}, errorHandler);
	});
}

function addCardID(db, first, second, third, deck, id) {
	db.transaction(function(transaction) {
		transaction.executeSql('insert into cards(first, second, third, deckid, id) values (?, ?, ?, ?, ?);', [first, second, third, deck, id], function(trans, results) {
			forwardCard(db, results.insertId);
		}, errorHandler);
	});
}

function randomCard(db, deck) {
	db.transaction(function(transaction) {
		transaction.executeSql('select id, first, second, third, deckid from cards where deckid=?;', [deck], cardHandler, errorHandler);
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
	forwardCard(db, id);
}

function deleteCard(db, id) {
	$.ajax({
		url: "sync/card?id=" + id,
		type: 'DELETE'
	}).done(function(){
		db.transaction(function(transaction) {
			transaction.executeSql('delete from cards where id=?;', [id], nullDataHandler, errorHandler);
		});
	}).fail(function(){
		db.transaction(function(transaction) {
			transaction.executeSql('update cards set to_delete = 1 where id=?;', [id], nullDataHandler, errorHandler);
		});
	});
}

function moveDeck(db, id, newDeck) {
	db.transaction(function(transaction) {
		transaction.executeSql('update cards set deckid=? where id=?;', [newDeck, id], nullDataHandler, errorHandler);
	});
	forwardCard(db, id);
}

function forwardCard(db, id) {
	db.transaction(function(transaction) {
		transaction.executeSql('select * from cards where id=?;', [id], function(transaction, results){syncNow(results, 'card');}, errorHandler);
	});
}

function forwardDeck(db, id) {
	db.transaction(function(transaction) {
		transaction.executeSql('select * from decks where id=?;', [id], function(transaction, results){syncNow(results, 'deck');}, errorHandler);
	});
}