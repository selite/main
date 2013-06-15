#!/bin/bash
#change dir to where this script is run from:
cd "$( dirname "${BASH_SOURCE[0]}" )"

#change dir, so that in all following sections I can use 'cd ../../xxx/src'
cd selblocks-global/src

# TODO: Make this script accept an optional parameter, which is a name of Firefox profile`
HOME_FOLDER=~
EXTENSION_FOLDER="$HOME_FOLDER/.mozilla/firefox/*.default"
EXTENSION_FOLDER=`echo $EXTENSION_FOLDER`/extensions

if [ ! -e $EXTENSION_FOLDER/bootstrap\@selite.googlecode.com.xpi ]
then
  cd ../../bootstrap/src
  pwd > $EXTENSION_FOLDER/bootstrap@selite.googlecode.com
fi

if [ ! -e $EXTENSION_FOLDER/bootstrap\@selite.googlecode.com.xpi ]
then
  cd ../../settings/src
  pwd > $EXTENSION_FOLDER/settings@selite.googlecode.com
fi

if [ ! -e $EXTENSION_FOLDER/sqlite-connection-manager\@selite.googlecode.com.xpi ]
then
  cd ../../sqlite-connection-manager/src
  pwd > $EXTENSION_FOLDER/sqlite-connection-manager@selite.googlecode.com
fi

if [ ! -e $EXTENSION_FOLDER/testcase-debug-context\@selite.googlecode.com.xpi ]
then
  cd ../../testcase-debug-context/src
  pwd > $EXTENSION_FOLDER/testcase-debug-context@selite.googlecode.com
fi

if [ ! -e $EXTENSION_FOLDER/selblocks-global\@selite.googlecode.com.xpi ]
then
  cd ../../selblocks-global/src
  pwd > $EXTENSION_FOLDER/selblocks-global@selite.googlecode.com
fi

if [ ! -e $EXTENSION_FOLDER/misc\@selite.googlecode.com.xpi ]
then
  cd ../../misc/src
  pwd > $EXTENSION_FOLDER/misc@selite.googlecode.com
fi

if [ ! -e $EXTENSION_FOLDER/db-storage\@selite.googlecode.com.xpi ]
then
  cd ../../db-storage/src
  pwd > $EXTENSION_FOLDER/db-storage@selite.googlecode.com
fi

if [ ! -e $EXTENSION_FOLDER/db-objects\@selite.googlecode.com.xpi ]
then
  cd ../../db-objects/src
  pwd > $EXTENSION_FOLDER/db-objects@selite.googlecode.com
fi

if [ ! -e $EXTENSION_FOLDER/commands\@selite.googlecode.com.xpi ]
then
  cd ../../commands/src
  pwd > $EXTENSION_FOLDER/commands@selite.googlecode.com
fi
