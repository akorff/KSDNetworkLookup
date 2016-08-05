#!/bin/bash
APPDIR=/home/serveradm/KSDNetworkLookup
VENVDIR=$APPDIR/venv

source $VENVDIR/bin/activate
cd $APPDIR

export KSDNETWORKLOOKUP_CFG=$APPDIR/settings.cfg

twistd web --port 9001 --wsgi ksdNetworkLookup.app
