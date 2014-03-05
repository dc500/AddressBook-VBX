var placeholder_support = 'placeholder' in document.createElement('input');
if(!placeholder_support) {
    $('input[placeholder]').each(function() { 
        this.defaultValue = $(this).attr('placeholder'); 
    });
}

function close_upload_iframe() 
{
    $('iframe').remove();
}

function format_phone(str) 
{ // {{{
    var text_phone = '';

    if(str.length == 10) {
        var parsed = str.match(/^([0-9]{3})([0-9]{3})([0-9]{4})$/);
        if(parsed) text_phone  = '(' + parsed[1] + ') ' + parsed[2] + '-' + parsed[3];
        else text_phone = str;
    } else if(str.length == 11) {
        var parsed = str.match(/^1([0-9]{3})([0-9]{3})([0-9]{4})$/);
        if(parsed) text_phone  = '1 (' + parsed[1] + ') ' + parsed[2] + '-' + parsed[3];
        else text_phone = str;
    } else {
        text_phone = str;
    }

    return text_phone;
} // }}}

var search_timer = null;

var addressbook_app = {
    version: 1.1
};

var index_page = {
    browse_contacts_table: null,
    recent_contacts_table: null,
    groups_table: null,
    tags_table: null,

    initialize: function() {
        var that = index_page;

        // Add window resize event
        $(window).resize(function() {
            var width = $('#browse_contacts').width() - 30;
            $('#browse_contacts table.datatable').css('width', width);
        });

        that.browse_contacts_table = $('#browse_contacts table.datatable').tw_table(
            // {{{
            base_url + 'p/addressbook?op=contacts-get',
            { limit:10, onServerData:onServerCall, sort_by:[[1, 'asc']], pagination_type:'full_numbers' },
            {
                bAutoWidth: true,
                aoColumns: [
                    { sName:'profile_img', sWidth:'50px', fnRender:function(oObj) { 
                        var html = '<div class="profile_img">';
                        html = html + '<img src="' + (oObj.aData[0] != '' ? oObj.aData[0] : plugin_url + '/assets/img/profile_img.jpg') + '" />';
                        html = html + '<input class="change_btn edit_inactive" type="button" value="Chng" />';
                        html = html + '</div>'; 
                        return html;
                    }},
                    { sName:'first_name', fnRender:function(oObj) { 
                        return '<input name="name" class="edit_inactive" type="text" value="' + (oObj.aData[1] + ' ' + oObj.aData[4]).trim() + '" readonly="readonly" placeholder="Name" />' +
                        '<input name="title" class="edit_inactive" type="text" value="' + oObj.aData[6] + '" readonly="readonly" placeholder="Title" />' +
                        '<input name="company" class="edit_inactive" type="text" value="' + oObj.aData[7] + '" readonly="readonly" placeholder="Company" />';
                    }},
                    { sName:'phone', fnRender:function(oObj) {
                        var phone = oObj.aData[2];
                        var text_phone = format_phone(phone);

                        var html = '<input name="phone" class="edit_inactive" type="text" value="' + text_phone + '" readonly="readonly" placeholder="Phone" />'; 

                        if(phone.trim() != '') 
                            html = html + '<br />' +
                                '<input class="call_' + phone + '_btn call-button twilio-call" type="button" value="Call" /> ' +
                                '<input class="sms_' + phone + '_btn" type="button" value="SMS" />'; 

                        return html;
                    }},
                    { sName:'email', fnRender:function(oObj) {
                        return '<input name="email" class="edit_inactive" type="text" value="' + oObj.aData[3] + '" readonly="readonly" placeholder="Email" />' +
                        '<div style="text-align:right; margin-top:10px;">' +
                            '<input class="del_btn edit_inactive" type="button" value="Delete" /> ' +
                            '<input class="cancel_btn edit_inactive" type="button" value="Cancel" /> ' +
                            '<input class="save_btn edit_inactive" type="button" value="Save" />' +
                        '</div>' +
                        '<div class="data">' +
                            '<input name="id" value="' + oObj.aData[5] + '" />' +
                        '</div>';
                    }},
                    { sName:'last_name', bVisible:false },
                    { sName:'id', bVisible:false },
                    { sName:'title', bVisible:false },
                    { sName:'company', bVisible:false },
                    { sName:'street', bVisible:false },
                    { sName:'city', bVisible:false },
                    { sName:'state', bVisible:false },
                    { sName:'zip', bVisible:false },
                    { sName:'country', bVisible:false },
                    { sName:'website', bVisible:false },
                    { sName:'bday', bVisible:false },
                    { sName:'notes', bVisible:false },
                    { sName:'private', bVisible:false },
                    { sName:'data', bVisible:false },
                    { sName:'created', bVisible:false },
                    { sName:'updated', bVisible:false },
                    { sName:'user_id', bVisible:false }
                ],
                fnRowCallback: function(nRow, aData, iDisplayIndex) {
                    $(nRow).addClass('contact_' + aData[5]);
                    return nRow;
                },
                fnInitComplete: function() {
                    var search_in = $('#browse_contacts div.dataTables_filter input[type="text"]');
                    search_in.unbind();
                    search_in.bind('keyup', function() {
                        var search_term = this.value;

                        if(search_timer) clearTimeout(search_timer);
                        search_timer = window.setTimeout(function() {
                            that.browse_contacts_table.engine_obj.fnFilter(search_term);
                        }, 500);
                    });
                }
            }
        ); // }}}

        that.recent_contacts_table = $('#recent_contacts table.datatable').tw_table(
            // {{{
            base_url + 'p/addressbook?op=contacts-get',
            { limit:5, onServerData:onServerCall, sort_by:[[0, 'desc']] },
            {
                aoColumns: [
                    { sName:'profile_img', sWidth:'50px', fnRender:function(oObj) { 
                        var html = '<div class="profile_img">';
                        html = html + '<img src="' + (oObj.aData[0] != '' ? oObj.aData[0] : plugin_url + '/assets/img/profile_img.jpg') + '" />';
                        html = html + '</div>'; 
                        return html;
                    }},
                    { sName:'first_name', fnRender:function(oObj) { 
                        return '<span class="name">' + oObj.aData[1] + ' ' + oObj.aData[4] + '</span>' +
                        '<span class="company">' + oObj.aData[7] + '</span>' +
                        '<span class="created">' + oObj.aData[18] + '</span>' +
                        '<div class="data">' +
                            '<span class="id">' + oObj.aData[5] + '</span>' +
                        '</div>';
                    }},
                    { sName:'phone', bVisible:false },
                    { sName:'email', bVisible:false },
                    { sName:'last_name', bVisible:false },
                    { sName:'id', bVisible:false },
                    { sName:'title', bVisible:false },
                    { sName:'company', bVisible:false },
                    { sName:'street', bVisible:false },
                    { sName:'city', bVisible:false },
                    { sName:'state', bVisible:false },
                    { sName:'zip', bVisible:false },
                    { sName:'country', bVisible:false },
                    { sName:'website', bVisible:false },
                    { sName:'bday', bVisible:false },
                    { sName:'notes', bVisible:false },
                    { sName:'private', bVisible:false },
                    { sName:'data', bVisible:false },
                    { sName:'created', bVisible:false },
                    { sName:'updated', bVisible:false },
                    { sName:'user_id', bVisible:false }
                ],
                bFilter: false,
                bLengthChange: false,
                bInfo: false
            }
        ); // }}}

        that.groups_table = $('#list_of_groups table.datatable').tw_table(
            // {{{
            base_url + 'p/addressbook?op=groups-get',
            { onServerData:onServerCall },
            {
                aoColumns: [
                    { sName:'name', fnRender:function(oObj) {
                        return '<input name="name" class="edit_inactive" value="' + oObj.aData[0] + '" readonly="readonly" />' +
                        '<div class="data">' +
                            '<span class="id">' + oObj.aData[1] + '</span>' +
                        '</div>';
                    }},
                    { sName:'id', bVisible:false },
                    { sName:'count', bVisible:false },
                    { sName:'color', bVisible:false },
                    { sName:'created', bVisible:false },
                    { sName:'user_id', bVisible:false }
                ],
                bFilter: false,
                bLengthChange: false,
                bInfo: false
            }
        ); // }}}

        that.tags_table = $('#list_of_tags table.datatable').tw_table(
            // {{{
            base_url + 'p/addressbook?op=tags-get',
            { onServerData:onServerCall  },
            {
                aoColumns: [
                    { sName:'name', fnRender:function(oObj) {
                        return '<input name="name" class="edit_inactive" value="' + oObj.aData[0] + '" readonly="readonly" />' +
                        '<div class="data">' +
                            '<span class="id">' + oObj.aData[1] + '</span>' +
                        '</div>';
                    }},
                    { sName:'id', bVisible:false },
                    { sName:'count', bVisible:false },
                    { sName:'created', bVisible:false },
                    { sName:'user_id', bVisible:false }
                ],
                bFilter: false,
                bLengthChange: false,
                bInfo: false
            }
        ); // }}}

        that.render();
    },

    call_number: function(phone) 
    { // {{{
        var callerid = $("input[name='from']").get(0).value; // $('select[name="from"] option').get(0).value; // $("#caller-id-phone-number option:first-child").get(0).value;

        $.post(
            base_url + '/messages/call', 
            {
                callerid:callerid,
                to:phone,
                target:base_url+'messages/call'
            },
            function(resp, state) { },
            'text'
        );
    }, // }}}

    send_msg: function(phone, msg) 
    { // {{{
        var callerid = $("input[name='from']").get(0).value; // $('select[name="from"] option').get(0).value;

        $.post(
            base_url + '/messages/sms', 
            {
                from:callerid,
                to:phone,
                content:msg
            },
            function(resp) { },
            'text'
        );
    }, // }}}

    submit_delete_contact: function(tr) 
    { // {{{
        var that = index_page;
        var tr = $(tr);
        var id = tr.find('input[name="id"]').val();

        $.post(
            base_url + 'p/addressbook?op=contact-del',
            { 'id':id },
            function(resp) {
                try {
                	resp = resp.replace(/[\r\n\s]/g,' ');
                    resp = resp.match(/JSON_DATA\>(.*)\<\/JSON_DATA/)[1];
                    resp = eval("(" + resp + ")");
                    if(resp.key == 'SUCCESS') {
                        that.browse_contacts_table.engine_obj.fnDraw(false);
                    }
                } catch(e) { alert("error occured during eval: " + e.message); }
            },
            'text'
        );
    }, // }}}

    submit_import_contacts: function(dialog)
    { // {{{
        var form = $('#import_contacts'); 
        var errors = [];

        $('span.err', form).remove();

        var source = form.find('input[name="source"]');
        var password = form.find('input[name="password"]');
        var email = form.find('input[name="email"]');

        function parse_errors(errors) {
            $.each(errors, function(k, v) {
                if(v.name == 'password') $('<span></span>').addClass('err').html(v.msg).insertAfter(password);
                else if(v.name == 'email') $('<span></span>').addClass('err').html(v.msg).insertAfter(email);
                else if(v.name == 'source') $('<span></span>').addClass('err').html(v.msg).insertAfter(source);
            })
        }

        if(source.val() == '') {
            errors.push({
                name:'source',
                msg:'Source is required.'
            });
        } else if(source.val() != 'gmail') {
            errors.push({
                name:'source',
                msg:'At this time,  Address Book can import contacts from Google.'
            });
        }

        if(email.val() == '') {
            errors.push({
                name:'email',
                msg:'Email is required.'
            });
        }

        if(password.val() == '') {
            errors.push({
                name:'password',
                msg:'Password is required.'
            });
        }

        if(errors.length == 0) {
            $.post(
                base_url + 'p/addressbook?op=contacts-import',
                { password:password.val(), email:email.val(), source:source.val() },
                function(resp) {
                	resp = resp.replace(/[\r\n\s]/g,' ');
                    resp = resp.match(/JSON_DATA\>(.*)\<\/JSON_DATA/)[1];
                    resp = eval("(" + resp + ")");
                    if(resp.key == 'SUCCESS') {
                        $(dialog).dialog('close');
                    } else {
                        if(resp.data.errors) {
                            parse_errors(resp.data.errors);
                        }
                    }
                },
                'text'
            );
        } else {
            parse_errors(errors);
        }
    }, // }}}

    submit_new_contact: function() 
    { // {{{
        var that = index_page;
        var new_contact_el = $('#browse_contacts tr.new_contact_form');
        var name = new_contact_el.find('input[name="name"]').val();
        var title = new_contact_el.find('input[name="title"]').val();
        var company = new_contact_el.find('input[name="company"]').val();
        var phone = new_contact_el.find('input[name="phone"]').val();
        var email = new_contact_el.find('input[name="email"]').val();
        var errors = [];

        new_contact_el.find('span.err').remove();

        if(name.trim() == '') {
            errors.push({
                name:'name',
                msg:'Name is required.'
            });
        }

        if(errors.length == 0) {
            $.post(
                base_url + 'p/addressbook?op=contacts-new',
                { name:name, title:title, company:company, phone:phone, email:email },
                function(resp) {
                    try {
                    	resp = resp.replace(/[\r\n\s]/g,' ');
                        resp = resp.match(/JSON_DATA\>(.*)\<\/JSON_DATA/)[1];
                        json = eval("(" + resp + ")");
                        if(json.key == 'SUCCESS') {
                            new_contact_el.remove();
                            that.browse_contacts_table.engine_obj.fnDraw();
                        }
                    } catch(e) { alert("error occured during eval: " + e.message); }
                },
                'text'
            );
        } else {
            $.each(errors, function(k, v) {
                var err_el = $('<span></span>').addClass('err').html(v.msg);
                new_contact_el.find('input[name="' + v.name + '"]').after(err_el);
            });
        }
    }, // }}}

    submit_update_contact: function(tr)
    { // {{{
        var that = index_page;
        var tr = $(tr);
        var form_inputs = $('*[name]', tr);

        that.contact_inactive(tr);

        $.post(
            base_url + 'p/addressbook?op=contact-update',
            form_inputs.serialize(),
            function(resp) {
                try {
                	resp = resp.replace(/[\r\n\s]/g,' ');
                    resp = resp.match(/JSON_DATA\>(.*)\<\/JSON_DATA/)[1];
                    resp = eval("(" + resp + ")");
                    if(resp.key == 'SUCCESS') {
                        that.browse_contacts_table.engine_obj.fnDraw(false);
                    }
                } catch(e) { alert("error occured during eval: " + e.message); }
            },
            'text'
        );
    }, // }}}

    // Make the current contact row active and editable in browse contacts
    contact_active: function(tr) 
    { // {{{
        var tr = $(tr);

        tr.find('input.edit_inactive').removeClass('edit_inactive').addClass('edit_active').removeAttr('readonly');
        tr.find('input.save_btn, input.cancel_btn').addClass('edit_active');
    }, // }}}

    // Make the current contact row inactive and not editable in browse contacts
    contact_inactive: function(tr) 
    { // {{{
        var tr = $(tr);

        tr.find('input.edit_active').removeClass('edit_active').addClass('edit_inactive');
    }, // }}}

    render: function(name) 
    { // {{{
        var that = index_page;

        switch(name) {
            case 'browse_contacts':
                // Contact events
                $('#browse_contacts tbody tr[class!="new_contact_form"]').live('click', function(e) {
                    var target = $(e.target);
//                    var from = $('div#callerid-container select[name="browserphone_caller_id"] option').value;

                    // Save button
                    if(target.hasClass('save_btn')) {
                        that.submit_update_contact(this); 
                    }

                    // Delete button
                    else if(target.hasClass('del_btn')) {
                        that.submit_delete_contact(this);
                    }

                    // Change profile image button
                    else if(target.hasClass('change_btn')) {
                        var id = $('div.data input[name="id"]', this).val();

                        var upload_iframe = $('<iframe></iframe')
                            .attr({ src:plugin_url+'/upload_profile_img.php?contact_id=' + id, frameborder:0 })
                            .css({ top:target.offset().top - 3, left:target.offset().left, position:'absolute' })
                            .addClass('upload_iframe')
                            .appendTo($('div.vbx-content-main'));
                    }

                    // Cancel button
                    else if(target.hasClass('cancel_btn')) {
                        $('input', this).each(function() { this.value = this.defaultValue; });
                        $(this).removeClass('edit_active');
                        that.contact_inactive(this);
                    }

                    // Clicking the call button
                    else if(target.attr('class').match(/call_[0-9+]+_btn/)) {

                    	// do nothing?
                        var phone = target.attr('class').match(/call_([0-9+]+)_btn/)[1];
                    	$("#dial-phone-number", window.parent.document).val(phone);

// MDS: commented out as in OpenVBX 1.2 we need just to add classes "call-button twilio-call" to open call dialog
//                        $('div.send_sms').remove();
//
//                        var calling_el = $('<div></div>')
//                            .html('Ready to call? ' + 
//                                '<input class="cancel_btn" type="button" value="Cancel" /> ' +
//                                '<input class="call_btn" type="button" value="Call" />')
//                            .css({ top:target.offset().top, left:target.offset().left, position:'absolute' })
//                            .addClass('call_phone')
//                            .appendTo($('div.vbx-content-main'));
//
//                        var tr = $(this);
//                        calling_el.find('input.cancel_btn').click(function() { 
//                            calling_el.remove(); 
//                            tr.find('input[class^="call_"], input[class^="sms_"]').css('display', 'inline-block');
//                        });
//                        calling_el.find('input.call_btn').click(function() { 
//                            calling_el.remove(); 
//                            tr.find('input[class^="call_"], input[class^="sms_"]').css('display', 'inline-block');
//                            that.call_number(phone); 
//                        });
//
//                        $(this).find('input[class^="call_"], input[class^="sms_"]').css('display', 'none');
//////////////////////////

                    // Clicking the SMS button
                    } else if(target.attr('class').match(/sms_[0-9]+_btn/)) {
                        var phone = target.attr('class').match(/sms_([0-9+]+)_btn/)[1];

                        var send_sms_el = $('<div></div>')
                            .html('<input name="msg" type="text" /> ' +
                                '<input class="cancel_btn" type="button" value="Cancel" />' +
                                '<input class="send_btn" type="button" value="Send" />')
                            .addClass('send_sms')
                            .css({ top:target.offset().top, left:target.offset().left, position:'absolute' })
                            .appendTo($('div.vbx-content-main'));

                        send_sms_el.find('input.cancel_btn').click(function() { 
                            send_sms_el.remove(); 
                        });

                        send_sms_el.find('input.send_btn').click(function() {
                            var msg = send_sms_el.find('input[name="msg"]').val();
                            that.send_msg(phone, msg);
                            send_sms_el.remove();
                        });

                    // Default should expand and allow edit fields for active row
                    } else {
                        $('#browse_contacts table.datatable tbody tr.new_contact_form').remove();
                        that.contact_inactive($('#browse_contacts tr.edit_active').removeClass('edit_active'));
                        $(this).addClass('edit_active');
                        that.contact_active(this);
                    }

                    return false;
                });

                // Import source
                $('#browse_contacts #import_contacts div.import_source a').click(function() {
                    var target = $(this);
                    var form = $('#import_contacts');

                    $('a.selected', form).removeClass('selected');
                    $('input[name="source"]', form).val(target.attr('class').split(' ')[0]);
                    target.addClass('selected');
                });

                // Import button
                $('#browse_contacts input.import_btn').click(function() {
                    var dialog = $('#import_contacts').dialog({
                        buttons: {
                            'Import': function() {
                                that.submit_import_contacts(this);
                            },
                            'Cancel': function() {
                                $(this).dialog('close');
                            }
                        },
                        width:600
                    });
                    dialog.dialog('open');
                });

                // New contact button
                $('#browse_contacts input.new_contact_btn').click(function() {
                    var new_contact_el = $('#new_contact_form_template tr').clone();
                    var table_el = $('#browse_contacts table.datatable tbody');

                    that.contact_inactive(table_el);

                    table_el.find('tr.new_contact_form').remove();
                    new_contact_el.addClass('new_contact_form').prependTo(table_el);

                    new_contact_el.find('input.cancel_btn').click(function() {
                        new_contact_el.remove();
                    });

                    new_contact_el.find('input.save_btn').click(function() {
                        that.submit_new_contact();
                    });
                });

                // Letter filter on the left of table
                $('#browse_contacts ul.letter_filter li').click(function() {
                    var target = $(this);
                    target.parent('ul').find('li.selected').removeClass('selected');
                    target.addClass('selected');
                    $('#browse_contacts div.dataTables_filter input[type="text"]').val('');
                    that.browse_contacts_table.engine_obj.fnFilter(target.text() == 'All' ? '' : target.text());
                });
                break;

            case 'list_of_groups':
                break;

            case 'list_of_tags':
                break;

            case undefined:
                that.render('browse_contacts');
                break;
        }
    } // }}}
}
