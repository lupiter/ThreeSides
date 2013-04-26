from sqlalchemy import *
from migrate import *


from migrate.changeset import schema
pre_meta = MetaData()
post_meta = MetaData()
card = Table('card', post_meta,
    Column('id', Integer, primary_key=True, nullable=False),
    Column('deckid', Integer),
    Column('first', UnicodeText),
    Column('second', UnicodeText),
    Column('third', UnicodeText),
)

deck = Table('deck', post_meta,
    Column('id', Integer, primary_key=True, nullable=False),
    Column('name', UnicodeText, default=ColumnDefault('Deck')),
    Column('owner', UnicodeText),
)


def upgrade(migrate_engine):
    # Upgrade operations go here. Don't create your own engine; bind
    # migrate_engine to your metadata
    pre_meta.bind = migrate_engine
    post_meta.bind = migrate_engine
    post_meta.tables['card'].create()
    post_meta.tables['deck'].create()


def downgrade(migrate_engine):
    # Operations to reverse the above upgrade go here.
    pre_meta.bind = migrate_engine
    post_meta.bind = migrate_engine
    post_meta.tables['card'].drop()
    post_meta.tables['deck'].drop()
