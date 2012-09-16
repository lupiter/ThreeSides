This app is designed for people who are learning a language like Chinese or Japanese, where to learn a word you often have to learn how to write it, how to say it, and what it means, all seperately. This doesn't work so well on traditional flashcards, which only have two sides.

ThreeSides is also helpful if you're learning a third language through a second language. For example, studying German at an American university when your first language is Spanish. Then you can have a single flashcard with the German word, the English word, and the Spanish word.

# Installing

This is a webapp for iPad. Installing it is kind of tricky, but if you're not the Friendly Nerd then they should be able to help you.

ThreeSides needs to run a small webserver on your computer, which the iPad can connect to via WiFi. Once it's on your iPad, you only have to connect to the computer for updates. These install instructions are for a Mac, Linux will be very similar. If you're on Windows, sorry, I can't help you.

## Get Ready: Requirements

Python > 2.5 < 3.0
: If you have a Mac running Snow Leopard or later, you've got this already. Most Linux versions will also have this, otherwise it'll be in your repository.

Flask 0.9
: To install this Python package on Mac, open Terminal (in Applications/Utilities) type the following and press enter:
	
		sudo easy_install pip

	Enter your password as requested. Once it's finished, type

		sudo pip install flask

	Enter your password again, and once it's done Flask is installed.

## Get Set: Download & Startup

Download the zip of this repository, with the button next to "Clone in Mac" on the [github](https://github.com/lupiter/ThreeSides) page. Open the zip file, which will create a folder with a silly name. Rename the folder to ThreeSides, and move it to your Sites folder in your home directory. If you don't have a Sites folder, you can make one or use your Documents folder. Just remember to replace "Sites" in all the rest of these instructions with "Documents".

Open Terminal again (if you closed it). Now type

	cd Sites/ThreeSides
	python server.py

Okay! The server should be running now. You'll see a message like 

	 * Running on http://0.0.0.0:5000/

Double-check that it's working: open Safari (or Firefox, or Chrome) and type in the url field

	localhost:5000

When you hit enter, it should load ThreeSides!

Next, you need to find the IP address of your computer on the network. Linux users: you're on your own for this bit.

On Mac, it's easy! Open System Preferences from the Apple menu. Under Internet & Wireless choose Network. On the left you should see Wi-Fi with a green jewel. On the right it should say "Status: Connected". Beneith that is a little sentence that tells you the name of the WiFi network you're on, and the IP address of your computer. This could be, for example `10.0.1.25` or `192.168.1.5` and you'll need to write that down somewhere.

## Go! Installing on your iPad

Get your iPad, and open Safari. Type in the url field the IP address of your computer, followed by `:5000`. So if the IP address was `10.0.1.25`, type

	10.0.1.25:5000

Press Go. Now ThreeSides will load. Excellent! To save it like an app to your homescreen, tap the action button (box with an arrow coming out), and choose Add to Home Screen. Pick Add, and it will appear on your home screen.

## Done: Finishing Up

Once you've installed ThreeSides on every iPad you like, you can stop the webserver on your computer. Just quit Terminal. It will say it's busy, are you sure? You're sure, you can quit. If you want to update ThreeSides, you can start from *Get Set* above.

# Using

I've tried to make ThreeSides as easy as possible to use. When you open it, you'll see a list of your "decks" of cards. When you add a new deck, you'll have the option of creating a "Learnt" deck. This is so you can easily move words you've learnt into a seperate pile---so you don't delete them, but can save them for exam time!

When you edit a deck, you can add new cards one at a time with the form. Or, you can type CSV in the big text field. This is useful if you have all your words in Excel or Numbers already. Just export to CSV, open the CSV file in TextEdit and copy the contents into an email to yourself. Then open the email on your iPad and copy the text into ThreeSides.

The CSV edit field also lets you copy out your cards so you can back them up, or share them with others.

When you tap a deck button, it will take you to the single card view. One of the three sides will be shown, and the other two masked. Tap them to reveal or hide each one. Press "next" for another random card from your deck. Press "move" to shift this card to your "learnt" deck, or any other deck.

#### Note
Please back up your cards! ThreeSides stores all your cards in Safari. They'll be there if you quit Safari, or restart your iPad. If you have to wipe your iPad, they'll be gone, and if you go into the Settings app and choose Safari and then "Clear Cookies and Data" that will also delete all your cards. Also, if you delete a deck in the app there's no way to get it back.




