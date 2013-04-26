from sqlalchemy import *
from migrate import *


from migrate.changeset import schema
pre_meta = MetaData()
post_meta = MetaData()
user = Table('user', post_meta,
    Column('id', Integer, primary_key=True, nullable=False),
    Column('username', UnicodeText),
    Column('role', SmallInteger, default=ColumnDefault(0)),
    Column('last_sync', DateTime(timezone=True)),
)

deck = Table('deck', pre_meta,
    Column('id', Integer, primary_key=True, nullable=False),
    Column('name', Text),
    Column('owner', Text),
)

deck = Table('deck', post_meta,
    Column('id', Integer, primary_key=True, nullable=False),
    Column('name', UnicodeText, default=ColumnDefault(u'Deck')),
    Column('user_id', UnicodeText),
)


def upgrade(migrate_engine):
    # Upgrade operations go here. Don't create your own engine; bind
    # migrate_engine to your metadata
    pre_meta.bind = migrate_engine
    post_meta.bind = migrate_engine
    post_meta.tables['user'].columns['last_sync'].create()
    pre_meta.tables['deck'].columns['owner'].drop()
    post_meta.tables['deck'].columns['user_id'].create()


def downgrade(migrate_engine):
    # Operations to reverse the above upgrade go here.
    pre_meta.bind = migrate_engine
    post_meta.bind = migrate_engine
    post_meta.tables['user'].columns['last_sync'].drop()
    pre_meta.tables['deck'].columns['owner'].create()
    post_meta.tables['deck'].columns['user_id'].drop()
