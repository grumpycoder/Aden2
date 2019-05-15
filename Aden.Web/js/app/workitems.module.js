$(function () {
    console.log('work items view ready');

    var uri = "/api/workitem/all";

    var $grid = $('#grid').dxDataGrid({
        dataSource: DevExpress.data.AspNet.createStore({
            key: 'id',
            loadUrl: uri
        }),
        remoteOperations: true,
        allowColumnResizing: true,
        allowColumnReordering: true,
        showBorders: true,
        wordWrapEnabled: true,
        'export': {
            enabled: true,
            fileName: "FileSpecifications",
            allowExportSelectedData: false,
            icon: 'fa fa-trash'
        },
        stateStoring: {
            enabled: true,
            type: "localStorage",
            storageKey: "gridFileSpecificationFilterStorage"
        },
        filterRow: { visible: true },
        headerFilter: { visible: true },
        groupPanel: { visible: true },
        scrolling: { mode: "virtual", rowRenderingMode: "virtual" },
        paging: { pageSize: 20 },
        height: 650,
        columnChooser: { enabled: true },
        columnResizingMode: "nextColumn",
        columnMinWidth: 50,
        columnAutoWidth: true,
        columns: [
            {
                alignment: 'center',
                width: 100,
                cellTemplate: function (container, options) {
                    $('<a/>').addClass('btn btn-default btn-sm btn-sm-grid')
                        .text('Delete')
                        .attr('aria-label', 'delete work item ' + options.data.id)
                        .on('dxclick',
                            function (e) {
                                deleteWorkItem(options.data, container);
                            })
                        .appendTo(container);
                }
            },
            { dataField: 'id', caption: 'WorkItemId', dataType: 'number' },
            { dataField: 'fileNumber', caption: 'File Number', dataType: 'string' },
            { dataField: 'displayFileName', caption: 'File Name' },
            { dataField: 'assignedUser', caption: 'Assigned' },
            { dataField: 'actionName', caption: 'Action' },
            { dataField: 'workItemStateDisplay', caption: 'Work State' },
            { dataField: 'dataYear', caption: 'Data Year', width: 75 },
            { dataField: 'assignedDate', caption: 'Assigned', dataType: 'datetime', width: 150 },
            { dataField: 'dueDate', caption: 'Due', dataType: 'datetime', width: 150 },
        ],
        onToolbarPreparing: function (e) {
            var dataGrid = e.component;

            e.toolbarOptions.items.unshift(
                {
                    location: "after",
                    widget: "dxButton",
                    options: {
                        text: "Collapse All",
                        width: 136,
                        onClick: function (e) {
                            var expanding = e.component.option("text") === "Expand All";
                            dataGrid.option("grouping.autoExpandAll", expanding);
                            e.component.option("text", expanding ? "Collapse All" : "Expand All");
                        }
                    }
                },
                {
                    location: "after",
                    widget: "dxButton",

                    options: {
                        icon: "refresh",
                        hint: 'Refresh',
                        onClick: function () {
                            dataGrid.refresh();
                        }
                    }
                },
                {
                    location: "after",
                    widget: "dxButton",
                    options: {
                        icon: "clearformat",
                        hint: 'Clear filters',
                        onClick: function () {
                            dataGrid.clearFilter();
                        }
                    }
                },
                {
                    location: "after",
                    widget: "dxButton",
                    options: {
                        icon: "clearsquare",
                        hint: 'Reset grid to default',
                        onClick: function () {
                            dataGrid.state({});
                        }
                    }
                }

            );
        },
        onContentReady: function () {
            gridContentReady();
        }
    }).dxDataGrid("instance");

    function gridContentReady() {
        $('#panel-message').hide();
        if ($grid.getCombinedFilter() !== undefined) {
            $('#panel-message').show();
        }
        $(".dx-datagrid-table").addClass("table");
        $('.dx-button').attr('data-toggle', 'tooltip');
        $('[data-toggle="tooltip"]').tooltip();
    }

    function deleteWorkItem(item, container) {
        $toggleWorkingButton(container);
        $.ajax({
            url: '/api/workitem/delete/' + item.id,
            type: 'POST',
            success: function (data) {
                toastr.success('Deleted work item ' + item.actionName + ' for ' + item.assignedUser);
                $grid.refresh();
            },
            error: function (error) {
                toastr.error('Error deleting work item: ' + error.responseJSON.message);
            },
            complete: function (status) {

                $toggleWorkingButton(container);
            }
        });

    }
})