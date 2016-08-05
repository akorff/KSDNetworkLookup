# KSD Network Lookup
A service to assist with identifying and accessing Bonjour/Zeroconf services on a remote network without access to the broadcast packets.

## Local Development and Testing
Create a virtual environment and install the requirements:
```sh
	cd KSDNetworkLookup
	virtualenv venv
	source venv/bin/activate
	pip install -r ./requirements.txt
```

### Running the application
These commands assume the virtualenv is activated.


#### Using Flask
When testing the app, you can run it directly through flask. First, export these environment variables:
```sh
	export FLASK_APP=ksdNetworkLookup.py
	export FLASK_DEBUG=1
```
Then launch the app with `flask run --host=0.0.0.0`.


#### Using Twisted
Run in the foreground with twisted: `twistd -n web --port 9001 --wsgi ksdNetworkLookup.app`

Run in the background with twisted: `twistd web --port 9001 --wsgi ksdNetworkLookup.app`


## Deploying with Twisted on an Ubuntu host (14.04)
```sh
	sudo apt-get install python-pip python-dev wamerican
	sudo pip install --upgrade pip
	sudo pip install virtualenv

	cd KSDNetworkLookup
	virtualenv venv
	source venv/bin/activate
	pip install -r requirements.txt
	chmod +x start.sh
```

Update the `APPDIR` variables in the `start.sh` and `ksdnetworklookup` scripts to point to the `KSDNetworkLookup` directory, and create a `settings.cfg` file to define values for `DEBUG, SECRET_KEY, LIST_OF_NETWORKS, DURATION_CHOICES, SERVICE_TYPES`. See the defaults in `ksdNetworkLookup.py` for examples, and the [Generating the SECRET_KEY](#generating-the-secret_key) section.

Copy `ksdnetworklookup` to `/etc/init.d/ksdnetworklookup`

### Controlling the Service with init.d
Start the service: 
```sh
	sudo /etc/init.d/ksdnetworklookup start
```

The log and pid file will be located in KSDNetworkLookup. If everything is running correctly, set the service to start at boot with: 
```sh
	sudo update-rc.d ksdnetworklookup defaults
```


### Generating the SECRET_KEY
The sessions documentation [suggests creating a secret value](http://flask.pocoo.org/docs/0.11/quickstart/#sessions) in the python REPL:
```py
	import os
	os.urandom(24)
```
Copy and paste the output into the app.config['SECRET_KEY'] variable.


## The ZeroConf Python Library
There are several python zeroconf libraries, forked from one original. The library in Pip is from this github repo: [https://github.com/jstasiak/python-zeroconf](https://github.com/jstasiak/python-zeroconf).

This is different from this fork: [https://github.com/wmcbrine/pyzeroconf](https://github.com/wmcbrine/pyzeroconf)

Fortunately the library in pip also appears to be the better maintained of the two, so installation is straightforward.


## A Reminder About Using a virtualenv

Activate the virtualenv with `source venv/bin/activate`

Leave the virtualenv with `deactivate`
