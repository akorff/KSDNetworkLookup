import socket, time
from zeroconf import ServiceBrowser, Zeroconf, BadTypeInNameException

from flask import Flask, request, session, g, redirect, url_for, abort, \
    render_template, flash, jsonify

app = Flask(__name__)
app.config.from_object(__name__)

# Some default configuration values.
app.config.update(dict(
    DEBUG = True,
    SECRET_KEY = 'development key',
    LIST_OF_NETWORKS = [
        {
            "name": "Sample",
            "id": "sample",
            "hostListUrl": "http://localhost:9001/host_list_sample"
        }
    ],
    DURATION_CHOICES = [
        {
            "duration": 2
        },
        {
            "duration": 4,
            "default": True
        },
        {
            "duration": 6
        }
    ],
    SERVICE_TYPES = [
        {
            "name": "_rfb._tcp.local.", 
            "protocol": "vnc://",
            "default": True
        },
        {
            "name": "_smb._tcp.local.", 
            "protocol": "smb://"
        },
        {
            "name": "_http._tcp.local.", 
            "protocol": "http://"
        }
    ]
))
# Load real configuration values from file defined in KSDNETWORKLOOKUP_CFG environment variable.
app.config.from_envvar('KSDNETWORKLOOKUP_CFG')


# Allow cross origin requests to all endpoints (only needed for get_hosts).
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE')
    return response


# Convert service_types into simple dict mapping services to protocols.
proto_dict = {item['name']:item['protocol'] for item in app.config['SERVICE_TYPES']}


# =======================================================
import random
words = open("/usr/share/dict/words").read().splitlines()

def generate_sample_data(quantity, service_type):
    sample_data = []
    for d in range(0, quantity):
        random_name = random.choice(words)
        ip = "192.168.%s.%s:5900" % (random.choice(range(1, 80)), random.choice(range(1, 254)))
        link = "%s%s" % (proto_dict.get(service_type, proto_dict['_http._tcp.local.']), ip)
        record = {
            "name": "%s.%s" % (random_name, service_type),
            "service_type": service_type,
            "address": ip,
            "link": link,
            "server": "%s.local." % random_name
        }
        sample_data.append(record)
    return sample_data
# =======================================================


class ServiceListener(object):
    def __init__(self):
        # Is this necessary, when zeroconf is being passed into add_service?
        self.zconf = Zeroconf()
        self.services = []

    def remove_service(self, zeroconf, service_type, name):
        print "Not implemented."
        return True

    def add_service(self, zeroconf, service_type, name):
        this_service = {}
        this_service['name'] = name
        this_service['service_type'] = service_type
        this_service['address'] = ''
        this_service['server'] = ''
        info = self.zconf.get_service_info(service_type, name)
        if info:
            this_service['address'] = "%s:%d" % (socket.inet_ntoa(info.address), info.port)
            # Construct the link by finding service type in service_types object; or use http if not found in list.
            this_service['link'] = "%s%s" % (proto_dict.get(service_type, proto_dict['_http._tcp.local.']), this_service['address'])
            this_service['server'] = info.server
            # prop = info.getProperties()
            # if prop:
            #     print "  Properties are"
            #     for key, value in prop.items():
            #         print "    %s: %s" % (key, value)
        self.services.append(this_service)


@app.route('/')
def show_hosts():
    return render_template('show_hosts.html', networks=app.config['LIST_OF_NETWORKS'])


@app.route('/host_list_sample')
def host_list_sample():
    try:
        service_type = request.args['serviceType']
    except KeyError:
        print "No service_type"
        raise
    # service_type = "_rfb._tcp.local."
    hosts = generate_sample_data(10, service_type)    
    return jsonify(hosts=hosts)


@app.route('/host_list')
def host_list():
    try:
        service_type = request.args['serviceType']
        duration = request.args['duration']
    except KeyError:
        print "No service_type or duration in request"
        raise

    zconf = Zeroconf()
    listener = ServiceListener()
    try:
        browser = ServiceBrowser(zconf, service_type, listener=listener)
        time.sleep(float(duration))
        hosts = listener.services
        try:
            zconf.close()
        except  Exception, e:
            pass
        
        return jsonify(hosts=hosts)
    except BadTypeInNameException:
        print "Unable to process this service type: %s" % service_type
        abort(400)


@app.route('/network_list')
def network_list():
    return jsonify(networks=app.config['LIST_OF_NETWORKS'])


@app.route('/service_type_list')
def service_type_list():
    return jsonify(service_types=app.config['SERVICE_TYPES'])


@app.route('/duration_choice_list')
def duration_choice_list():
    return jsonify(duration_choices=app.config['DURATION_CHOICES'])


# app.run(debug=True,host='0.0.0.0',port=5000)
