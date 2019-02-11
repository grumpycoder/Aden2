// mail.module.js

(function () {
    console.log('mail viewer ready');

    $('[data-message-id]').tooltip();

    $(document).on('click', '[data-id]', function (e) {
        e.preventDefault();
        var btn = $(this);
        btn.parent().closest('div').parent().remove();

        var id = $(this).data('id');
        var $div = $('[data-message-id="' + id + '"]');

        var url = '/api/mail/delete/' + id;
        $.ajax({
            url: url,
            type: 'POST',
            success: function (data) {
                toastr.success('Deleted message');
                $div.remove();
            },
            error: function (err) {
                toastr.error('Something went wrong: ' + err.responseJSON.message);
            }
        }).always(function () {

        });
    });
})();