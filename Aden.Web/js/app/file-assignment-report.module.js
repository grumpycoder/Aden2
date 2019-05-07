$(function () {
    console.log('file assignment report view ready');


    var uri = "/api/submission";

    var $grid = $('#gridReport').dxDataGrid({
        dataSource: DevExpress.data.AspNet.createStore({
            key: 'id',
            loadUrl: uri,
            updateUrl: uri
        }),
        remoteOperations: { paging: true, filtering: true, sorting: true, grouping: true, summary: true, groupPaging: true },
        searchPanel: {
            visible: true,
            highlightCaseSensitive: true
        },
        allowColumnResizing: true,
        allowColumnReordering: true,
        showBorders: true,
        wordWrapEnabled: true,
        'export': {
            enabled: true,
            fileName: "Assignments",
            allowExportSelectedData: false,
            icon: 'fa fa-trash'
        },
        filterRow: { visible: true },
        headerFilter: { visible: true },
        groupPanel: { visible: false },
        scrolling: { mode: "virtual", rowRenderingMode: "virtual" },
        paging: { pageSize: 20 },
        height: 650,
        columnResizingMode: "nextColumn",
        columnMinWidth: 50,
        columnAutoWidth: true,
        columnChooser: { enabled: true },
        columns: [
            { dataField: 'fileNumber', caption: 'File Number', visibleIndex: 1 },
            { dataField: 'fileName', caption: 'File Name', visibleIndex: 2 },
            { dataField: 'section', caption: 'Section', visibleIndex: 8 },
            { dataField: 'submissionStateDisplay', caption: 'Status', visibleIndex: 9 },
            { dataField: 'dataYear', caption: 'Data Year', visibleIndex: 7 },
            {
                dataField: 'generators',
                caption: 'Generators',
                dataType: 'string',
                visible: true,
                visibleIndex: 11,
                cellTemplate: function (container, options) {
                    options.data.generators.forEach(function (item) {
                        $('<span>' + item + '</span><br />').appendTo(container)
                    });
                },
                allowFiltering: false,
                calculateDisplayValue: function (rowData) {
                    return rowData.generators.join(", ");
                }
            },
            {
                dataField: 'approvers',
                caption: 'Approvers',
                dataType: 'string',
                visible: true,
                visibleIndex: 12,
                cellTemplate: function (container, options) {
                    options.data.approvers.forEach(function (item) {
                        $('<span>' + item + '</span><br />').appendTo(container)
                    });
                },
                allowFiltering: false,
                calculateDisplayValue: function (rowData) {
                    return rowData.approvers.join(", ");
                }
            }
        ],
        sortByGroupSummaryInfo: [{ summaryItem: "count" }],
        summary: {
            totalItems: [
                {
                    column: "fileNumber",
                    displayFormat: '{0} Submissions',
                    summaryType: 'count',
                    showInGroupFooter: true,
                    showInColumn: 'FileNumber'
                }
            ],
            groupItems: [
                {
                    summaryType: "count",
                    displayFormat: '{0} Submissions'
                }
            ]
        },
        onRowPrepared: function (row) {
            if (row.rowType === 'data') {
                addRowClass(row.rowElement, row.data);
            }
        },
        onContentReady: function () {
            $(".dx-datagrid-table").addClass("table");
            gridContentReady();
        },
        onToolbarPreparing: function (e) {
            var dataGrid = e.component;

            e.toolbarOptions.items.unshift(
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
                }
            );
        }
    }).dxDataGrid("instance");

    function gridContentReady() {
        $('#panel-message').hide();
        if ($grid.getCombinedFilter() !== undefined) {
            $('#panel-message').show();
        }
    }

    function addRowClass(rowElement, data) {
        var classes = ['active', 'success', 'info', 'warning', 'danger'];
        var $moment = window.moment();

        if (data.submissionStateDisplay === 'Completed' || data.submissionStateDisplay === 'Waived') {
            rowElement.addClass(classes[1]);
            return;
        }

        if (data.submissionStateDisplay === 'CompleteWithErrors') {
            //console.log('complete with errors');
            rowElement.addClass(classes[2]);
            return;
        }

        if (data.submissionStateDisplay !== 'Completed' && $moment.isSameOrAfter(data.dueDate)) {
            rowElement.addClass(classes[4]);
            return;
        }

        if (data.submissionStateDisplay !== 'Completed' && $moment.add(14, 'days').isSameOrAfter(data.dueDate)) {
            rowElement.addClass(classes[3]);
            return;
        }
    }

});