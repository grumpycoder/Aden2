
var uri = "/api/membership/groups";
var deleteUri = "/api/membership/deletegroup";
var membershipUri = '/api/membership/group/1';

var listGroup = $("#listGroups").dxList({
    dataSource: DevExpress.data.AspNet.createStore({
        key: 'id',
        loadUrl: uri,
        deleteUrl:deleteUri, 
        pageSize: 10,
        paginate: true
    }),
    height: 555,
    allowItemDeleting: true,
    searchEnabled: true,
    searchExpr: "name",
    itemTemplate: function (data) {
        return $("<div>")
            .append($("<span>").text(data.name));
    },
    selectionMode: "single",
    onSelectionChanged: function (data) {
        var item = listGroup.option().selectedItem;
        getUsers(item);
    },
    onItemDeleting: function(e) {
        
        deleteGroup(e.itemData);
        e.cancel = true;
    },
    showSelectionControls: true,
    pageLoadMode: "scrollBottom"
}).dxList("instance");

function deleteGroup(item) {
    console.log('item', item);
    var groupName = item.name; 
    $.ajax({
        url: '/api/membership/deletegroup/' + groupName,
        type: 'POST',
        success: function (data) {
            toastr.success('Deleted group ' + groupName);
            listGroup.reload();
        },
        error: function (err) {
            console.log('err', err);
            //window.$log.error('Something went wrong: ' + err.message);
        }
    }).always(function () {
        
    });

}

function getUsers(item) {
    if (item === undefined) return; 

    var groupId = item.id; 
    membershipUri = '/api/membership/groupmembers/' + groupId;

    var store = new DevExpress.data.CustomStore({
        key: ["identityGuid"],
        load: function(loadOptions) {
            return $.get(membershipUri,
                function(data) {
                    console.log('data', data);
                    return data;
                });
        },
        insert: function(values) {
            // ...
        },
        update: function(key, values) {
            // ...
        },
        remove: function(key, data) {
            console.log('remove', key.identityGuid);
            var deleteUri = '/api/membership/groupmembers/' + groupId + '/' + key.identityGuid; 
            $.ajax({
                url: deleteUri,
                processData: false,
                type: 'DELETE',
                success: function(data) {
                    //play with data
                    console.log('delete', data);
                }
            });
        }
    });

    var listUsers = $("#listUsers").dxList(
        {
            dataSource: store, 
            height: 555,
            allowItemDeleting: true,
            searchEnabled: true,
            searchExpr: ["fullName", "emailAddress"],
            itemTemplate: function (data) {
                return $("<div>")
                    .append($("<span>").text(data.fullName + ' - '))
                    .append($("<span>").text(data.emailAddress));
            },
            selectionMode: "single",
            onSelectionChanged: function (data) {
                console.log('selected User', listUsers.option().selectedItem);
            },
            onItemDeleted: function(data) {
                console.log('delete', data);
            },
            showSelectionControls: true,
            pageLoadMode: "scrollBottom"
        }).dxList("instance");

}
