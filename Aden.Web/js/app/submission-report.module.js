$(function () {
    console.log('submission report view ready');

    window.assignmentUpdated = false;

    var uri = "/api/submission";

    var $grid = $('#gridReport').dxDataGrid({
        dataSource: DevExpress.data.AspNet.createStore({
            key: 'id',
            loadUrl: uri,
            updateUrl: uri
        }),
        remoteOperations: true,
        allowColumnResizing: true,
        allowColumnReordering: true,
        showBorders: true,
        wordWrapEnabled: true,
        'export': {
            enabled: true,
            fileName: "Submissions",
            allowExportSelectedData: false,
            icon: 'fa fa-trash'
        },
        stateStoring: {
            enabled: true,
            type: "localStorage",
            storageKey: "gridSubmissionReportFilterStorage"
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
            {
                width: 50,
                type: "buttons",
                buttons: [
                    "edit", "delete", {
                        text: "History",
                        icon: "fa fa-history",
                        hint: "History",
                        onClick: function (e) {
                            // Execute your command here
                            showHistory(e);
                        }
                    }
                ]
            },
            { dataField: 'fileNumber', caption: 'File Number' },
            { dataField: 'fileName', caption: 'File Name' },
            { dataField: 'submissionStateDisplay', caption: 'Status' },
            { dataField: 'currentAssignment', caption: 'Assigned' },
            { dataField: 'lastUpdatedFriendly', caption: 'Last Update' },
            { dataField: 'deadlineDate', caption: 'Submission Deadline', dataType: 'date' },
            { dataField: 'submissionDate', caption: 'Date Submitted', dataType: 'date', visible: false },
            { dataField: 'displayDataYear', caption: 'Data Year' },
            { dataField: 'section', caption: 'Section', visible: true },
            { dataField: 'application', caption: 'Application', visible: true },
            { dataField: 'supportGroup', caption: 'Support Group', visible: true },
            { dataField: 'collection', caption: 'Collection', visible: true },
            {
                dataField: 'isSEA',
                caption: 'SEA',
                dataType: 'boolean',
                visible: false,
                showEditorAlways: false,
                trueText: 'Yes',
                falseText: 'No',
                customizeText: function (cellInfo) {
                    if (cellInfo.value) return 'Yes';

                    return 'No';
                }
            },
            {
                dataField: 'isLEA',
                caption: 'LEA',
                dataType: 'boolean',
                visible: false,
                showEditorAlways: false,
                trueText: 'Yes',
                falseText: 'No',
                customizeText: function (cellInfo) {
                    if (cellInfo.value) return 'Yes';

                    return 'No';
                }
            },
            {
                dataField: 'isSCH',
                caption: 'SCH',
                dataType: 'boolean',
                visible: false,
                showEditorAlways: false,
                trueText: 'Yes',
                falseText: 'No',
                customizeText: function (cellInfo) {
                    if (cellInfo.value) return 'Yes';

                    return 'No';
                }
            },
            {
                dataField: 'generators',
                caption: 'Generators',
                dataType: 'string',
                visible: false,
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
                visible: false,
                cellTemplate: function (container, options) {
                    options.data.approvers.forEach(function (item) {
                        $('<span>' + item + '</span><br />').appendTo(container)
                    });
                },
                allowFiltering: false,
                calculateDisplayValue: function (rowData) {
                    return rowData.approvers.join(", ");
                }
            },
            {
                dataField: 'submitters',
                caption: 'Submitters',
                dataType: 'string',
                visible: false,
                cellTemplate: function (container, options) {
                    options.data.submitters.forEach(function (item) {
                        $('<span>' + item + '</span><br />').appendTo(container)
                    });
                },
                allowFiltering: false,
                calculateDisplayValue: function (rowData) {
                    return rowData.submitters.join(", ");
                }
            },
            {
                width: 200,
                alignment: 'center',
                cellTemplate: function (container, options) {

                    if (options.data.canReview) {
                        $('<a/>').addClass('btn btn-default btn-sm btn-grid')
                            .text('Review File')
                            .attr('aria-label', 'Review submission report file')
                            .attr('href', '/review/' + options.data.dataYear + '/' + options.data.fileNumber)
                            .attr('target', '_blank')
                            .appendTo(container);
                    }

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
                            resetAllButtons();
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
        }
    }).dxDataGrid("instance");

    function showHistory(e) {
        var title = 'Submission History - [' + e.row.data.fileName + ']';
        var url = '/history/' + e.row.data.id;

        BootstrapDialog.show({
            size: window.BootstrapDialog.SIZE_WIDE,
            draggable: true,
            closable: false,
            title: title,
            message: $('<div></div>').load(url,
                function (resp, status, xhr) {
                    if (status === 'error') {
                        toastr.error('Error retrieving history');
                    }
                }),
            buttons: [
                {
                    label: 'Close',
                    action: function (dialogRef) {
                        if (window.assignmentUpdated === true) {
                            $grid.refresh();
                            window.assignmentUpdated = false;
                        }
                        dialogRef.close();
                    }
                }
            ]
        });

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

    function resetAllButtons() {
        $('#btnStatusFilter button').siblings().removeClass('active'); 
        $('#btnGroupDue button').siblings().removeClass('active'); 
        $('#btnSupportGroup button').siblings().removeClass('active'); 
    }

    $('#btnStatusFilter button').on('click',
        function (e) {
            var btn = $(this);
            if (btn.hasClass('active')) {
                btn.removeClass('active');
                applyStatusFilter();
            } else {
                btn.addClass('active').siblings().removeClass('active');
                applyStatusFilter(btn.val());
            }
        });

    $('#btnGroupDue button').on('click',
        function (e) {
            var btn = $(this);
            if (btn.hasClass('active')) {
                btn.removeClass('active');
                applyDueFilter();
            } else {
                btn.addClass('active').siblings().removeClass('active');
                applyDueFilter(btn.val());
            }

        });

    $('#btnSupportGroup button').on('click',
        function (e) {
            var btn = $(this);
            if (btn.hasClass('active')) {
                btn.removeClass('active');
                applyGroupFilter();
            } else {
                btn.addClass('active').siblings().removeClass('active');
                applyGroupFilter(btn.val());
            }
        });

    var combinedFilter = [];
    var statusFilter = [];
    var dueFilter = [];
    var groupFilter = [];

    function applyStatusFilter(status) {
        statusFilter = [];
        if (status === undefined) {
            applyFilters();
            return;
        } 
        var date = moment().add(0, 'days').format();
        if (status === 'Completed') {
            statusFilter.push(["submissionStateDisplay", "=", "Completed"], "or", ["submissionStateDisplay", "=", "Waived"]);
        }
        if (status === 'Overdue') {
            statusFilter.push(['deadlineDate', '<', date], ['submissionStateDisplay', '<>', 'Completed'], ['submissionStateDisplay', '<>', 'Waived']);
        }

        applyFilters();
    }
    
    function applyDueFilter(numDays) {
        dueFilter = [];
        if (numDays === undefined) {
            applyFilters();
            return;
        } 

        var temp = [];
        var currentDate = moment().add(0, 'days').format();
        var date = moment().add(numDays, 'days').format();

        temp.push(["deadlineDate", ">=", currentDate]);
        temp.push('and');
        temp.push(["deadlineDate", "<=", date]);
        temp.push(["submissionStateDisplay", "<>", "Completed"]);
        temp.push(["submissionStateDisplay", "<>", "Waived"]);

        dueFilter.push(temp);
        applyFilters();
    }

    function applyGroupFilter(group) {
        groupFilter = [];
        if (group === undefined) {
            applyFilters();
            return;
        } 
        groupFilter.push(["supportGroup", "=", group]);
        applyFilters();
    }


    function applyFilters() {
        $grid.clearFilter();
        combinedFilter = [];

        if (statusFilter.length > 0) {
            if (combinedFilter.length > 0) combinedFilter.push('and');
            combinedFilter.push(statusFilter);
        }
        if (dueFilter.length > 0) {
            if (combinedFilter.length > 0) combinedFilter.push('and');
            combinedFilter.push(dueFilter);
        }
        if (groupFilter.length > 0) {
            if (combinedFilter.length > 0) combinedFilter.push('and');
            combinedFilter.push(groupFilter);
        }
        $grid.filter(combinedFilter);
    }

});