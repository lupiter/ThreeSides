from app import db

ROLE_USER = 0
ROLE_ADMIN = 2
ROLE_USER_EA = 1


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.UnicodeText, index=True, unique=True)
    role = db.Column(db.SmallInteger, default=ROLE_USER)
    decks = db.relationship('Deck', backref='owner', lazy='dynamic')
    cards = db.relationship('Card', backref='owner', lazy='dynamic')
    last_sync = db.Column(db.DateTime(timezone=True))

    def __repr__(self):
        return '<User %r>' % (self.username)

    def get_id(self):
        return self.id

    def is_authenticated(self):
        return True

    def is_active(self):
        return True

    def is_anonymous(self):
        return False


class Deck(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.UnicodeText, default=u"Deck")
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))

    def jsony(self):
        return {"id": self.id,
                "name": self.name,
                "user_id": self.user_id}

    def __repr__(self):
        return '<Deck %r>' % (self.name)


class Card(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    deckid = db.Column(db.Integer, db.ForeignKey('deck.id'))
    first = db.Column(db.UnicodeText)
    second = db.Column(db.UnicodeText)
    third = db.Column(db.UnicodeText)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))

    def jsony(self):
        return {"id": self.id,
                "deckid": self.deckid,
                "first": self.first,
                "second": self.second,
                "third": self.third,
                "user_id": self.user_id}

    def __repr__(self):
        return '<Card %r, %r, %r>' % (self.first, self.second, self.third)
