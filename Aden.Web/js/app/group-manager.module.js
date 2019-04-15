
var uri = "/api/membership/groups";
var deleteUri = "/api/membership/deletegroup";
var membershipUri = '/api/membership/group/1';
var groupId;

var listGroup = $("#listGroups").dxList({
    dataSource: DevExpress.data.AspNet.createStore({
        key: 'id',
        loadUrl: uri,
        deleteUrl: deleteUri,
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
        if (item !== undefined) {
            groupId = item.id;
            $('#groupId').val(groupId);
            $('#btnAddMember').removeAttr('disabled');
            getUsers(item);
        }
    },
    onItemDeleting: function (e) {
        deleteGroup(e.itemData);
        e.cancel = true;
    },
    showSelectionControls: true,
    pageLoadMode: "scrollBottom"
}).dxList("instance");

function deleteGroup(item) {
    var groupName = item.name;
    console.log('delete group', groupName);
    $.ajax({
        url: '/api/membership/deletegroup/' + groupName,
        type: 'POST',
        success: function (data) {
            toastr.warning('Deleted group - ' + groupName);
            getUsers();
            listGroup.reload();
            //$('#btnAddMember').prop("disabled", true);
        },
        error: function (err) {
            console.log('err', err);
            toastr.error('Something went wrong: ' + err.responseJSON.message);
        }
    }).always(function () {
    });

}

function getUsers(item) {
    var groupId = 0;
    if (item !== undefined) {
        groupId = item.id;
    }

    membershipUri = '/api/membership/groupmembers/' + groupId;

    var store = new DevExpress.data.CustomStore({
        key: ["identityGuid"],
        load: function (loadOptions) {
            return $.get(membershipUri,
                function (data) {
                    return data;
                });
        },
        insert: function (values) {
            // ...
        },
        update: function (key, values) {
            // ...
        },
        remove: function (key, data) {

            var deleteUri = '/api/membership/groupmembers/' + groupId + '/' + key.identityGuid;
            $.ajax({
                url: deleteUri,
                processData: false,
                type: 'POST',
                success: function (data) {
                    //play with data

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

            },
            onItemDeleted: function (data) {

            },
            showSelectionControls: true,
            pageLoadMode: "scrollBottom"
        }).dxList("instance");

}
