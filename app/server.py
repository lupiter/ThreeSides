from flask import render_template, send_from_directory, g, session, flash, redirect, url_for, request, jsonify
from flask_oauth import OAuth
from flask_login import login_required, login_user, logout_user, current_user
from datetime import datetime
from sqlalchemy import func
import os
import sqlalchemy.exc
from app import app, models, db, login_manager

oauth = OAuth()
twitter = oauth.remote_app('twitter',
                           base_url='https://api.twitter.com/1.1/',
                           request_token_url='https://api.twitter.com/oauth/request_token',
                           access_token_url='https://api.twitter.com/oauth/access_token',
                           authorize_url='https://api.twitter.com/oauth/authenticate',
                           consumer_key='QCuggngxLMYrnTTMTmpVw',
                           consumer_secret='38CeTcFdJ9PYn6gMk10KK1NvxqdYAmzlcZXqQjvGYzk'
                           )


@app.route('/login')
def login():
    if current_user.is_authenticated():
        return redirect('/')
    return twitter.authorize(callback=url_for('twitter_authorized',
                             next=request.args.get('next') or request.referrer or None))


@login_manager.user_loader
def load_user(userid):
    return models.User.query.get(userid)


@app.route("/status")
def status():
    user, is_EA = None, False
    if current_user.is_authenticated():
        user = current_user.username
        is_EA = current_user.role == models.ROLE_USER_EA
    return jsonify(user=user, is_EA=is_EA, online=True)


@app.route("/offline")
def offline():
    user, is_EA = None, False
    if current_user.is_authenticated():
        user = current_user.username
        is_EA = current_user.role == models.ROLE_USER_EA
    return jsonify(user=user, is_EA=is_EA, online=False)


@app.route('/oauth_authorized')
@twitter.authorized_handler
def twitter_authorized(resp):
    next_url = request.args.get('next') or url_for('home')
    if resp is None:
        flash(u'You denied the request to sign in.')
        return redirect(next_url)
    user = models.User.query.filter_by(twitter_id=resp['user_id']).first()
    if not user:
        rows = session.query(func.count(models.User.id)).scalar()
        role = models.ROLE_USER_EA
        if rows < 10:
            role = models.ROLE_USER_EA
        user = models.User(username=resp['screen_name'], twitter_id=resp['user_id'], role=role)
        db.session.add(user),
        db.session.commit()
    login_user(user)
    session['user_id'] = user.id
    return redirect(next_url)


@app.route('/logout')
def logout():
    # print session
    # if 'twitter_user' in session:
    #     session.pop('twitter_user')
    # if 'twitter_token' in session:
    #     session.pop('twitter_token')
    logout_user()
    return redirect(request.args.get('next') or url_for('home'))


@twitter.tokengetter
def get_twitter_oauth_token():
    return session.get('oauth_token')


@app.before_request
def before_request():
    g.user = None
    if 'user_id' in session:
        g.user = models.User.query.get(session['user_id'])


@app.after_request
def after_request(response):
    # db_session.remove()
    return response


@app.route("/")
def home():
    user, is_EA = None, False
    if current_user.is_authenticated():
        user = current_user.username
        is_EA = current_user.role == models.ROLE_USER_EA
    return render_template("index.html", user=user, is_EA=is_EA)


@app.route("/empty.json")
def empty():
    return jsonify(ok=True)


@app.route("/sync/<types>", methods=['GET', 'POST', 'PUT', 'DELETE'])
@login_required
def sync(types="card"):
    returns = "OK"
    current_user.last_sync = datetime.utcnow()
    if request.method == 'GET':
        if types == "card":
            cards = models.Card.query.filter_by(user_id=g.user.id).all()
            returns = jsonify(cards=[d.jsony() for d in cards])
        else:
            decks = models.Deck.query.filter_by(user_id=g.user.id).all()
            decks = [d.jsony() for d in decks]
            # print decks
            returns = jsonify(decks=decks)
    if request.method == 'POST':
        for obj in request.json:
            if types == "card":
                    c = models.Card.query.get(obj['id'])
                    if c:
                        c.first = obj['first']
                        c.second = obj['second']
                        c.third = obj['third']
                        c.deckid = obj['deckid']
                    else:
                        c = models.Card(first=obj['first'],
                                        second=obj['second'],
                                        third=obj['third'],
                                        id=obj['id'],
                                        deckid=obj['deckid'],
                                        user_id=g.user.id)
                        db.session.add(c)
                    print c
            else:
                d = models.Deck.query.get(obj['id'])
                if d:
                    d.name = obj['name']
                else:
                    d = models.Deck(id=obj['id'],
                                    name=obj['name'],
                                    user_id=g.user.id)
                    db.session.add(d)
    if request.method == 'DELETE':
        rowIDs = request.args['id'].split(",")
        for rowID in rowIDs:
            if types == 'card':
                    c = models.Card.query.get(rowID)
                    if c:
                        db.session.delete(c)
            else:
                cards = models.Card.query.filter_by(deckid=rowID).all()
                for c in cards:
                    db.session.delete(c)
                if types == 'deck':
                    d = models.Deck.query.get(rowID)
                    if d:
                        db.session.delete(d)
    try:
        db.session.commit()
    except sqlalchemy.exc.InterfaceError as e:
        print e
    return returns


@app.route("/apple-touch-icon.png")
def icon():
    return send_from_directory(os.path.join(app.root_path, 'static'), 'apple-touch-icon.png')


if __name__ == "__main__":
    app.run(host='0.0.0.0', port=8080)
