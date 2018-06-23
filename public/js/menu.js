function initMenu(callback) {
    var time = new Date();
    var year = time.getFullYear();
    var month = time.getMonth();

    if (year == 2019) {
        $('#menu-button-2019').addClass('active');
        $('#month-choice-2018').hide(0);
    } else {
        $('#menu-button-2018').addClass('active');
        $('#month-choice-2019').hide(0);
    }

    function toggleYear(newyear) {
        var prevyear = 2018;
        if (newyear == 2018) prevyear = 2019;

        $('#month-choice-' + newyear + ' > .menu-button').removeClass('active');
        if (newyear == year) $('#month-choice-' + year + ' .menu-button-' + month).addClass('active');

        if (!$('#month-choice-' + newyear + ' > .active').length)
            $('#month-choice-' + newyear + ' .menu-button:first-child').addClass('active');

        if (window.innerWidth <= 767) {
            $('#month-choice-' + newyear + ' .menu-button:not(.active)').hide(0);
            $('#month-choice-' + newyear + ' .menu-button.active').show(0);
        }

        $('#month-choice-' + prevyear).hide(0);
        $('#month-choice-' + newyear).show(0);

    }

    toggleYear(year);
    $('#page-menu').slideDown(400);

    $('#menu-button-2018').click(() => {
        toggleYear(2018);
    });

    $('#menu-button-2019').click(() => {
        toggleYear(2019);
    });

    $('.menu-button').click(function () {
        if ($(this).hasClass('active')) {
            if (window.innerWidth <= 767 && $(this).parent().hasClass('month-choice')) {
                $('.month-choice .menu-button:not(.active)').toggle(400);
            }
        } else {
            $(this).siblings().removeClass('active');
            $(this).addClass('active');
            if (window.innerWidth <= 767 && $(this).parent().hasClass('month-choice')) {
                $('.month-choice .menu-button:not(.active)').hide(400);
            }
            $('#footer').slideUp();
            $('#page-content').slideUp({
                complete: callback
            });
        }
    });

    $(window).resize(() => {
        if (window.innerWidth > 767) {
            $('.month-choice .menu-button').show(0);
        } else {
            $('.month-choice .menu-button:not(.active)').hide(0);
        }
    })

    callback();
}