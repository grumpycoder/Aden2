
var uri = "/api/membership/groups";

//$("#listGroups").dxList({
//    dataSource: DevExpress.data.AspNet.createStore({
//        key: 'id',
//        loadUrl: uri
//    }),
//    grouped: true,
//    collapsibleGroups: true,
//    selectionMode: "multiple",
//    showSelectionControls: true,
//    pageLoadMode: "scrollBottom",
//    height: 600
//});;


var store = DevExpress.data.AspNet.createStore({
    loadUrl: "https://js.devexpress.com/Demos/Mvc/api/ListData/Orders",
});

var listData = new DevExpress.data.DataSource({
    store: store,
    paginate: true,
    pageSize: 1,
    sort: "ProductName",
    group: "Category.CategoryName",
    filter: ['UnitPrice', '>', 15],
});


var store2 = DevExpress.data.AspNet.createStore({
    loadUrl: uri,  
    deleteUrl: "api/membership/groupmembers"
});

var listData2 = new DevExpress.data.DataSource({
    store: store2,
    paginate: true,
    //pageSize: 5,
    //sort: "name",
    //group: "name",
});


var fruitsVegetables = [{
    key: "Fruits",
    items: [
        { name: "Apples", count: 10 },
        { name: "Oranges", count: 12 },
        { name: "Lemons", count: 15 }
    ]
}, {
    key: "Vegetables",
    items: [
        { name: "Potatoes", count: 5 },
        { name: "Tomatoes", count: 9 },
        { name: "Turnips", count: 8 }
    ]
}];

$("#simpleList").dxList({
    dataSource: listData2,
    height: "400",
    grouped: true,
    searchEnabled: true,
    searchExpr: "name",
    //itemsExpr: 'users', 
    collapsibleGroups: true,
    allowItemDeleting: true,
    selectionMode: "single",
    groupTemplate: function (data) {
        return $("<div>" + data.name + "</div>");

    }, 
    itemTemplate: function(data, element) {
        //console.log('data', data);
        return data.name; 
        //return $('<div>' + data.name + '</div>');
    },
    onSelectionChanged: function (data) {
        console.log('selected', data);
    },
    onContentReady: function (e) {
        setTimeout(function () {
            var items = e.component.option("items");
            for (var i = 0; i < items.length; i++)
                e.component.collapseGroup(i);
        }, 50);
    },
    onItemDeleting: function (e) {
        console.log('deleting', e);
        var itemData = e.itemData;
        var itemDomNode = e.itemElement;
        var itemIndex = e.itemIndex;
        // Handler of the "itemDeleting" event
    },
});


//$("#simpleList").dxList({
//    //dataSource: fruitsVegetables,
//    dataSource: listData,
//    searchEnabled: true,
//    searchExpr: "name",
//    dataStructure: 'tree',
//    itemTemplate: function (data, _, element) {
//        console.log('item', data);

//        return $("<div>")
//            .append($("<div>").text(data.CategoryName))
//            .append($("<div>").text(data.ProductName));

//    }, 
//    grouped: true,
//    collapsibleGroups: true,
//    selectionMode: "multiple",
//    showSelectionControls: true,
//    pageLoadMode: "scrollBottom",
//    height: 600
//});

//$("#simpleList2").dxList({
//    //dataSource: fruitsVegetables,
//    dataSource: listData2,
//    searchEnabled: true,
//    searchExpr: "name",
//    dataStructure: 'tree',
//    itemTemplate: function (data, _, element) {
//        console.log('item', data);
//        return $("<div>")
//            .append($("<div>").text(data.name));

//    },
//    grouped: true,
//    collapsibleGroups: true,
//    selectionMode: "multiple",
//    showSelectionControls: true,
//    pageLoadMode: "scrollBottom",
//    height: 600
//});

//$("#simpleList").dxList({
//    dataSource: listData,
//    searchEnabled: true,
//    searchExpr: "name",
//    itemTemplate: function (data) {
//        console.log('data', data);
//        return $("<div>").text(data.users.name);
//    },
//    height: "400",
//    grouped: true,
//    collapsibleGroups: true,
//    //groupTemplate: function (data) {
//    //    return $("<div>" + data.name + "</div>");

//    //}
//});
