// Callback function for datatables to parse the API response
function onServerCall(sSource, aoData, fnCallback) 
{ // {{{
    $.ajax({
        dataType:'text',
        type:'POST',
        url:sSource,
        data:aoData,
        success:function(resp) {
            try {
            	resp = resp.replace(/[\r\n\s]/g,' ');
            	resp = resp.match(/JSON_DATA\>(.*)\<\/JSON_DATA/)[1];
//            	alert("resp: "+resp);
                json = eval("(" + resp + ")");
//            	alert("json: "+json);
            } catch(e) { alert("error occured during eval: " + e.message); }

            fnCallback(json);
        }
    });
} // }}}

$(document).ready(function() {
    index_page.initialize();
});
