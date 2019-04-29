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
            { dataField: 'fileNumber', caption: 'File Number', visibleIndex: 1 },
            { dataField: 'fileName', caption: 'File Name', visibleIndex: 2 },
            { dataField: 'deadlineDate', caption: 'Submission Deadline', dataType: 'date', visibleIndex: 6 },
            { dataField: 'displayDataYear', caption: 'Data Year', visibleIndex: 7 },
            { dataField: 'submissionStateDisplay', caption: 'Status', visibleIndex: 9 },
            { dataField: 'currentAssignment', caption: 'Assigned', visibleIndex: 10 },
            { dataField: 'application', caption: 'Application', visibleIndex: 14 },
            { dataField: 'section', caption: 'Section', visibleIndex: 8 },
            { dataField: 'supportGroup', caption: 'Support Group', visibleIndex: 15 },
            { dataField: 'collection', caption: 'Collection', visibleIndex: 16 },

            { dataField: 'submissionDate', caption: 'Date Submitted', dataType: 'date', visible: false },
            { dataField: 'lastUpdatedFriendly', caption: 'Last Update', visible: false },
            {
                dataField: 'isSEA',
                caption: 'SEA',
                dataType: 'boolean',
                visible: true,
                visibleIndex: 3,
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
                visible: true,
                visibleIndex: 4,
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
                visible: true,
                visibleIndex: 5,
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

    function resetButton(name) {
        $('#' + name + ' button').siblings().removeClass('active');
    }

    $('#btnStatusFilter button').on('click',
        function (e) {
            var btn = $(this);
            resetButton('btnGroupDue');
            resetButton('btnSupportGroup');
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
            resetButton('btnStatusFilter');
            resetButton('btnSupportGroup');
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
            resetButton('btnStatusFilter');
            resetButton('btnGroupDue');
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
        $grid.deleteColumn('lastUpdatedFriendly');
        $grid.deleteColumn('submissionDate');

        if (status === undefined) {
            combinedFilter = statusFilter;
            applyFilters();
            return;
        }
        var date = moment().add(0, 'days').format();
        if (status === 'Completed') {
            $grid.addColumn({ dataField: 'submissionDate', caption: 'Date Submitted', visibleIndex: 17 });
            statusFilter.push(["submissionStateDisplay", "=", "Completed"], "or", ["submissionStateDisplay", "=", "Waived"]);
        }
        if (status === 'Overdue') {
            $grid.addColumn({ dataField: 'lastUpdatedFriendly', caption: 'Last Update', visibleIndex: 17 });
            statusFilter.push(['deadlineDate', '<', date], ['submissionStateDisplay', '<>', 'Completed'], ['submissionStateDisplay', '<>', 'Waived']);
        }
        combinedFilter = statusFilter;
        applyFilters();
    }

    function applyDueFilter(numDays) {
        dueFilter = [];
        if (numDays === undefined) {
            combinedFilter = dueFilter;
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

        combinedFilter = dueFilter;
        applyFilters();
    }

    function applyGroupFilter(group) {
        groupFilter = [];
        if (group === undefined) {
            combinedFilter = groupFilter;
            applyFilters();
            return;
        }
        groupFilter.push(["supportGroup", "=", group]);

        combinedFilter = groupFilter;
        applyFilters();
    }


    function applyFilters() {
        $grid.clearFilter();
        //combinedFilter = [];

        //if (statusFilter.length > 0) {
        //    if (combinedFilter.length > 0) combinedFilter.push('and');
        //    combinedFilter.push(statusFilter);
        //}
        //if (dueFilter.length > 0) {
        //    if (combinedFilter.length > 0) combinedFilter.push('and');
        //    combinedFilter.push(dueFilter);
        //}
        //if (groupFilter.length > 0) {
        //    if (combinedFilter.length > 0) combinedFilter.push('and');
        //    combinedFilter.push(groupFilter);
        //}
        $grid.filter(combinedFilter);
    }

});