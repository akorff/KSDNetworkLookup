(function(window) {
    // Structure borrowed from: 
    // http://checkman.io/blog/creating-a-javascript-library/
    // This is the "module pattern".
    'use strict';
    function define_library() {
        var Zconf = {};

        // Private variables.
        var servicesListUrl = '';
        var networkListUrl = '';
        var durationListUrl = '';

        var networkList = [];
        var serviceType = '';
        var duration = '';


        function areWeInitialized() {
            if ((serviceType == '') || (duration == '') || (networkList.length == 0)) {

                return false;
            }
            $('#error-panel').addClass('hidden');
            $('#zeroconiferSearchButton').prop('disabled', false);
            return true;
        }

        function setDropDownButtonText(buttonID, text) {
            $('#'+buttonID).text(text + ' ')
            $('#'+buttonID).append('<span class="caret"></span>')
        }


        function createDurationListItem(duration) {
            var listItem = $([
              '<li>',
              '  <a href="#" data-duration="' + duration + '">',
              '    ' + duration + ' secs',
              '  </a>',
              '</li>'
            ].join('\n'));
            return listItem;
        }


        function initializeDurationList() {
            console.log('Retrieving duration choices list...');
            $.getJSON(durationListUrl, function( resp ) {
                $('#zeroconiferDuration').empty();
                for (var i = resp.duration_choices.length - 1; i >= 0; i--) {
                    var durChoice = resp.duration_choices[i]['duration'];
                    var listItem = createDurationListItem(durChoice);
                    if (('default' in resp.duration_choices[i]) && (resp.duration_choices[i]['default'])) {
                        chooseDuration($(listItem).children('a'));
                    }
                    $('#zeroconiferDuration').prepend(listItem);
                }
                $('#zeroconiferDuration > li > a').each(function(index) {
                    $(this).click(function(e) {
                        chooseDuration(this);
                        e.preventDefault();
                    });
                });
                areWeInitialized();
            });
        }


        function chooseDuration(elem) {
            $('#zeroconiferDuration > li').removeClass('active');
            $(elem).parent().addClass('active');
            setDropDownButtonText('zeroconiferDurationButton', $(elem).text());
            duration = $(elem).data('duration');
        }


        function chooseServiceType(elem) {
            $('#zeroconiferServiceListDropdown > li').removeClass('active');
            $(elem).parent().addClass('active');
            setDropDownButtonText('zeroconiferServiceListDropdownButton', $(elem).data('service-type'));
            serviceType = $(elem).data('service-type');
        }


        function createServicesListItem(name) {
            var listItem = $([
              '<li>',
              '  <a href="#" data-service-type="' + name + '">',
              '    ' + name,
              '  </a>',
              '</li>'
            ].join('\n'));
            return listItem;
        }

        function initializeServicesList() {
            console.log('Retrieving services list...');
            // $('#zeroconiferServiceListDropdown').empty();
            $.getJSON(servicesListUrl, function( resp ) {
                $('#zeroconiferServiceListDropdown').empty();
                for (var i = resp.service_types.length - 1; i >= 0; i--) {
                    var svName = resp.service_types[i]['name'];
                    var listItem = createServicesListItem(svName);
                    if (('default' in resp.service_types[i]) && (resp.service_types[i]['default'])) {
                        listItem.addClass('active');
                        setDropDownButtonText('zeroconiferServiceListDropdownButton', svName);
                        serviceType = svName;
                    }
                    $('#zeroconiferServiceListDropdown').prepend(listItem);
                }
                $('#zeroconiferServiceListDropdown > li > a').each(function(index) {
                    $(this).click(function(e) {
                        chooseServiceType(this);
                        e.preventDefault();
                    });
                });
                areWeInitialized();
            });
        }


        function initializeNetworkList() {
            console.log('Retrieving network list...');
            $.getJSON(networkListUrl, function( resp ) {
                for (var i = resp.networks.length - 1; i >= 0; i--) {
                    networkList.push(resp.networks[i])
                }
                areWeInitialized();
            });
        }


        function getHostLists() {
            if (serviceType == '') {
                console.log('Error: No service type selected.');
                return;
            }
            console.log('Processing network list...');
            for (var i = networkList.length - 1; i >= 0; i--) {
                console.log('Retrieving host list from ' + networkList[i].hostListUrl + ' for service ' + serviceType + ' with duration ' + duration + '...');
                $.getJSON(
                    networkList[i].hostListUrl, 
                    {
                        'serviceType': serviceType,
                        'duration': duration
                    }, 
                    processHostList(networkList[i].id)
                );
            }
        }


        function createHostsTable() {
            var hostsTable = $([
                '<table class="zeroconiferResults table table-striped dataTable no-footer" cellspacing="0" width="100%" role="grid" style="width: 100%;">',
                '    <thead>',
                '        <tr role="row">',
                '            <th class="sorting" tabindex="0" rowspan="1" colspan="1" aria-label="Name: activate to sort column ascending">Name</th>',
                '            <th class="sorting" tabindex="0" rowspan="1" colspan="1" aria-label="Address: activate to sort column ascending">Address</th>',
                '            <th class="sorting" tabindex="0" rowspan="1" colspan="1" aria-label="Link: activate to sort column ascending">Link</th>',
                '        </tr>',
                '    </thead>',
                '    <tbody>',
                '    </tbody>',
                '</table>'
            ].join('\n'));

            return hostsTable;
        }


        function createHostsTableRow(name, address, link) {
            var hostRow = $([
                '        <tr role="row" class="">',
                '            <td class="">'+name+'</td>',
                '            <td class="">'+address+'</td>',
                '            <td>'+link+'</td>',
                '        </tr>'
            ].join('\n'));
            return hostRow;
        }


        function processHostList(elemID) {
            console.log("Processing host list...");
            return function(data, textStatus, jqXHR) { // http://stackoverflow.com/a/939206
                $('#' + elemID).empty();
                $('#' + elemID).append(createHostsTable());
                for (var j = data.hosts.length - 1; j >= 0; j--) {
                    var serverLink = '<a href="'+data.hosts[j].link+'">'+data.hosts[j].server+'</a>';
                    $('#' + elemID + ' > table > tbody').append(
                        createHostsTableRow(data.hosts[j].server, data.hosts[j].address, serverLink)
                    );
                }
                $('#' + elemID + ' > table').DataTable({
                    'paging':   false,
                    'searching': false,
                    'info':     false
                });
            };
        }


        function searchForHosts() {
            console.log('Searching for ' + serviceType + ' for ' + duration + ' seconds.');
            $('.hostsTableDiv').empty();
            $('.hostsTableDiv').append('<p class="tablePlaceholder">Searching...</p>');
            getHostLists();
        }


        // TODO: Display errors when unable to retrieve network, services or hosts lists.

        Zconf.initialize = function(servListUrl, netListUrl, durListUrl) {
            console.log('Setting zeroconifer variables.');
            servicesListUrl = servListUrl;
            networkListUrl = netListUrl;
            durationListUrl = durListUrl;

            $('#zeroconiferSearchButton').click(function(e) {
                searchForHosts();
                e.preventDefault();
            });
            $('#zeroconiferSearchButton').prop('disabled', true);

            initializeServicesList();
            initializeNetworkList()
            initializeDurationList();
        }


        // Return this library object.
        return Zconf;
    }

    // Define globally if variable name doesn't already exist.
    if (typeof(Zeroconifer) === 'undefined'){
        window.Zeroconifer = define_library();
    } else {
        console.log("Zeroconifer is already defined.");
    }
})(window);